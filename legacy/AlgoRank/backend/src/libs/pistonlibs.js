import axios from "axios";

const PISTON_URL = (() => {
  const base =
    process.env.PISTON_API_URL ||
    "http://localhost:2000/api/v2/execute";
  return base.endsWith("/api/v2/execute") ? base : `${base.replace(/\/+$/, "")}/api/v2/execute`;
})();

const languageMap = {
  PYTHON: { language: "python", version: "3.12.0" },
  JAVASCRIPT: { language: "javascript", version: "20.11.1" },
  CPP: { language: "cpp", version: "10.2.0" },
  JAVA: { language: "java", version: "15.0.2" }
};

export const runCodeWithPiston = async ({
  language, 
  sourceCode,
  stdin
}) => {
  const config = languageMap[language.toUpperCase()];
  if (!config) throw new Error("Unsupported language");

  const { data } = await axios.post(PISTON_URL, {
    language: config.language,
    version: config.version,
    files: [{ content: sourceCode }],
    stdin
  });

  return {
    stdout: data.run.stdout,
    stderr: data.run.stderr,
    exitCode: data.run.code,
    memory: data.run.memory,
    cpuTime: data.run.cpu_time,
    wallTime: data.run.wall_time
  };
};

// Improved error handling: surface upstream errors clearly
export const safeRunCodeWithPiston = async (opts) => {
  try {
    return await runCodeWithPiston(opts);
  } catch (err) {
    if (err.response) {
      // Axios error with response from Piston
      const status = err.response.status;
      const body = err.response.data || err.response.statusText;
      const msg = `Piston API responded ${status}: ${JSON.stringify(body)}`;
      const e = new Error(msg);
      e.status = status;
      throw e;
    }

    throw err;
  }
};


// FOR JUDGE0 NEEDED
// export function getLangaugeName(langauge_id){
//   const LANGUAGE_NAME={
//       74:"TypeScript",
//       63:"JavaScript",
//       71:"Python",
//       62:"Java"
//   }
//   return LANGUAGE_NAME[langauge_id]|| "Langauge Not supported Yet   "
// }