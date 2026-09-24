import axios from 'axios';

// Piston code execution engine client.
// Contract preserved from legacy `legacy/AlgoRank/backend/src/libs/pistonlibs.js`
// (language map, request body shape, result parsing) with explicit timeout handling.

const PISTON_API_URL = (() => {
  const base = process.env.PISTON_API_URL || 'http://localhost:2000/api/v2/execute';
  return base.endsWith('/api/v2/execute') ? base : `${base.replace(/\/+$/, '')}/api/v2/execute`;
})();

const PISTON_TIMEOUT = parseInt(process.env.PISTON_TIMEOUT || '30000', 10);

const languageMap = {
  PYTHON: { language: 'python', version: '3.12.0' },
  JAVASCRIPT: { language: 'javascript', version: '20.11.1' },
  CPP: { language: 'cpp', version: '10.2.0' },
  JAVA: { language: 'java', version: '15.0.2' }
};

export const SUPPORTED_LANGUAGES = Object.keys(languageMap);

export const getLanguageConfig = (key) => languageMap[String(key || '').toUpperCase()] || null;

export const runCodeWithPiston = async ({ language, sourceCode, stdin }) => {
  const config = getLanguageConfig(language);
  if (!config) throw new Error('Unsupported language');

  const { data } = await axios.post(
    PISTON_API_URL,
    {
      language: config.language,
      version: config.version,
      files: [{ content: sourceCode }],
      stdin: stdin || ''
    },
    { timeout: PISTON_TIMEOUT }
  );

  return {
    stdout: data.run.stdout,
    stderr: data.run.stderr,
    exitCode: data.run.code,
    memory: data.run.memory,
    cpuTime: data.run.cpu_time,
    wallTime: data.run.wall_time
  };
};

export const safeRunCodeWithPiston = async (opts) => {
  try {
    return await runCodeWithPiston(opts);
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      const e = new Error(`Piston API timed out after ${PISTON_TIMEOUT}ms`);
      e.status = 504;
      throw e;
    }
    if (err.code === 'ECONNREFUSED') {
      const e = new Error(`Piston service is not running at ${PISTON_API_URL}`);
      e.status = 502;
      throw e;
    }
    if (err.response) {
      const status = err.response.status;
      const body = err.response.data || err.response.statusText;
      const e = new Error(`Piston API responded ${status}: ${JSON.stringify(body)}`);
      e.status = status;
      throw e;
    }
    throw err;
  }
};

// Builds an executable wrapper around a user's solution so that the code can be
// graded against stdin/expected-output test cases. LeetCode-style problems give
// the user a function-only or class-based snippet that never reads stdin or
// prints anything. This harness appends a runner that:
//   1. reads all of stdin,
//   2. parses each line as a JSON argument (LeetCode convention: one arg per line),
//   3. calls the solution function or instantiates the class and calls the method,
//   4. writes JSON.stringify of the result to stdout.
const jsFnRegexes = [
  /(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\b/,
  /function\s+([A-Za-z_$][\w$]*)\s*\(/,
  /(?:async\s+)?([A-Za-z_$][\w$]*)\s*=\s*\((?:[^)]*)\)\s*=>/
];

const pyFnRegex = /^\s*def\s+([A-Za-z_][\w]*)\s*\(/m;

const jsClassRegex = /class\s+([A-Za-z_$][\w$]*)\s*\{/;
const jsMethodRegex = /\b([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/;
const pyClassRegex = /^\s*class\s+([A-Za-z_][\w]*)\s*[:\(]/m;
const pyMethodRegex = /^\s*def\s+([A-Za-z_][\w]*)\s*\(/m;

const extractFunctionName = (sourceCode) => {
  for (const re of jsFnRegexes) {
    const m = sourceCode.match(re);
    if (m && m[1]) return m[1];
  }
  const m = sourceCode.match(pyFnRegex);
  if (m && m[1]) return m[1];
  return null;
};

const detectClassSolution = (language, sourceCode) => {
  const lang = String(language || '').toUpperCase();
  if (lang === 'JAVASCRIPT') {
    const cm = sourceCode.match(jsClassRegex);
    if (!cm) return null;
    const mm = sourceCode.substring(cm.index).match(jsMethodRegex);
    return mm ? { className: cm[1], methodName: mm[1] } : null;
  }
  if (lang === 'PYTHON') {
    const cm = sourceCode.match(pyClassRegex);
    const mm = sourceCode.match(pyMethodRegex);
    if (cm && mm) return { className: cm[1], methodName: mm[1] };
  }
  return null;
};

export const buildRunnable = ({ language, sourceCode }) => {
  const lang = String(language || '').toUpperCase();
  const cls = detectClassSolution(lang, sourceCode);

  switch (lang) {
    case 'JAVASCRIPT': {
      let callExpr;
      if (cls) {
        callExpr = `new ${cls.className}().${cls.methodName}(...__args)`;
      } else {
        const fn = extractFunctionName(sourceCode);
        if (!fn) return { ok: false, reason: 'Could not detect your solution function or class name.' };
        callExpr = `${fn}(...__args)`;
      }
      const harness = `
// ---- auto-generated runner ----
process.stdin.resume();
process.stdin.setEncoding('utf8');
let __buf = '';
process.stdin.on('data', (c) => { __buf += c; });
process.stdin.on('end', () => {
  try {
    const __lines = __buf.trim().split('\\n').filter((l) => l.trim() !== '');
    const __args = __lines.map((l) => { try { return JSON.parse(l); } catch (e) { return l; } });
    const __result = ${callExpr};
    process.stdout.write(JSON.stringify(__result));
  } catch (e) {
    process.stdout.write('HARNESS_ERROR: ' + (e && e.message ? e.message : e));
    process.exit(1);
  }
});
`;
      return { ok: true, source: sourceCode + harness };
    }

    case 'PYTHON': {
      let callExpr;
      if (cls) {
        callExpr = `${cls.className}().${cls.methodName}(*__args)`;
      } else {
        const fn = extractFunctionName(sourceCode);
        if (!fn) return { ok: false, reason: 'Could not detect your solution function or class name.' };
        callExpr = `${fn}(*__args)`;
      }
      const harness = `
import sys, json as __json

def __main():
    try:
        __lines = [l for l in sys.stdin.read().strip().split('\\n') if l.strip() != '']
        __args = []
        for l in __lines:
            try:
                __args.append(__json.loads(l))
            except Exception:
                __args.append(l)
        __result = ${callExpr}
        sys.stdout.write(__json.dumps(__result))
    except Exception as e:
        sys.stdout.write('HARNESS_ERROR: ' + str(e))
        sys.exit(1)

if __name__ == '__main__':
    __main()
`;
      return { ok: true, source: sourceCode + '\n' + harness };
    }

    default:
      // CPP/JAVA and others: no automatic harness. Run the raw code as-is so
      // solutions that explicitly read stdin and print still work.
      return { ok: true, source: sourceCode };
  }
};