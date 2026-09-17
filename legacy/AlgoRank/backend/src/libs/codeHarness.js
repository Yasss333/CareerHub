// Builds an executable wrapper around a user's solution so that the code can be
// graded against stdin/expected-output test cases. LeetCode-style problems give
// the user a function-only or class-based snippet that never reads stdin or
// prints anything. This harness appends a runner that:
//   1. reads all of stdin,
//   2. parses each line as a JSON argument (LeetCode convention: one arg per line),
//   3. calls the solution (function) or instantiates the class and calls the method,
//   4. writes JSON.stringify of the result to stdout.

const jsFnRegexes = [
  /(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\b/,
  /function\s+([A-Za-z_$][\w$]*)\s*\(/,
  /(?:async\s+)?([A-Za-z_$][\w$]*)\s*=\s*\((?:[^)]*)\)\s*=>/,
];

const pyFnRegex = /^\s*def\s+([A-Za-z_][\w]*)\s*\(/m;

const jsClassRegex = /class\s+([A-Za-z_$][\w$]*)\s*\{/;
const jsMethodRegex = /\b([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/;
const pyClassRegex = /^\s*class\s+([A-Za-z_][\w]*)\s*[:\(]/m;
const pyMethodRegex = /^\s*def\s+([A-Za-z_][\w]*)\s*\(/m;

export function extractFunctionName(sourceCode) {
  for (const re of jsFnRegexes) {
    const m = sourceCode.match(re);
    if (m && m[1]) return m[1];
  }
  const m = sourceCode.match(pyFnRegex);
  if (m && m[1]) return m[1];
  return null;
}

// Detect whether the solution is a class-based LeetCode style, and if so return
// { className, methodName }. Otherwise return null.
export function detectClassSolution(language, sourceCode) {
  const lang = String(language || "").toUpperCase();
  if (lang === "JAVASCRIPT") {
    const cm = sourceCode.match(jsClassRegex);
    if (!cm) return null;
    // Find the first method declaration inside the class
    const mm = sourceCode.substring(cm.index).match(jsMethodRegex);
    return mm ? { className: cm[1], methodName: mm[1] } : null;
  }
  if (lang === "PYTHON") {
    const cm = sourceCode.match(pyClassRegex);
    const mm = sourceCode.match(pyMethodRegex);
    if (cm && mm) return { className: cm[1], methodName: mm[1] };
  }
  return null;
}

export function buildRunnable({ language, sourceCode }) {
  const lang = String(language || "").toUpperCase();
  const cls = detectClassSolution(lang, sourceCode);

  switch (lang) {
    case "JAVASCRIPT": {
      let callExpr;
      if (cls) {
        callExpr = `new ${cls.className}().${cls.methodName}(...__args)`;
      } else {
        const fn = extractFunctionName(sourceCode);
        if (!fn) return { ok: false, reason: "Could not detect your solution function or class name." };
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

    case "PYTHON": {
      let callExpr;
      if (cls) {
        callExpr = `${cls.className}().${cls.methodName}(*__args)`;
      } else {
        const fn = extractFunctionName(sourceCode);
        if (!fn) return { ok: false, reason: "Could not detect your solution function or class name." };
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
      return { ok: true, source: sourceCode + "\n" + harness };
    }

    default:
      // CPP/JAVA and others: no automatic harness. Run the raw code as-is so
      // solutions that explicitly read stdin and print still work.
      return { ok: true, source: sourceCode };
  }
}
