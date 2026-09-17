# AlgoRank — Changes Log

This document records the changes made to get **local code execution working**
via a **self-hosted Piston** instance, and the environment actions taken.

---

## Summary

Code execution (`POST /api/v1/execute-route/`) previously pointed at the broken
**Judge0** server (cgroup v1 issue) and a dead public Piston API
(`emkc.org`, whitelist-only). It now runs against a **self-hosted Piston**
container on port `2000`, and was verified working for Python, C++, JavaScript,
and Java.

---

## 1. `docker-compose.yml`

**File:** `docker-compose.yml`

Added the `piston` service definition:

```yaml
piston:
  image: ghcr.io/engineer-man/piston
  container_name: algo-piston
  privileged: true
  ports:
    - "2000:2000"
  environment:
    PISTON_RUN_TIMEOUT: "10000"
    PISTON_RUN_CPU_TIME: "10000"
    PISTON_COMPILE_TIMEOUT: "20000"
    PISTON_COMPILE_CPU_TIME: "20000"
  volumes:
    - pistondata:/piston
  restart: unless-stopped
```

and the `pistondata` volume entry.

**Why:** the `PISTON_RUN_TIMEOUT` / `PISTON_RUN_CPU_TIME` values raise the global
default run timeout from 3000 ms. Without this, **Java** (JVM startup) was killed
with `SIGKILL` / `Time limit exceeded` before the program could run.

**Note:** installed runtimes live in the `pistondata:/piston` volume, so they
persist across container restarts/recreates.

---

## 2. `backend/src/libs/pistonlibs.js`

**File:** `backend/src/libs/pistonlibs.js`

- Changed `PISTON_URL` from the dead hosted endpoint to the local self-hosted
  instance:
  ```js
  // was:
  const PISTON_URL = "https://emkc.org/api/v2/piston/execute";
  // now:
  const PISTON_URL = "http://localhost:2000/api/v2/execute";
  ```
- Updated the `languageMap` versions to match the installed runtimes:
  ```js
  PYTHON:     { language: "python",     version: "3.12.0"  } // was 3.10.0
  JAVASCRIPT: { language: "javascript", version: "20.11.1" } // was 18.15.0
  CPP:        { language: "cpp",        version: "10.2.0"  } // unchanged
  JAVA:       { language: "java",       version: "15.0.2"  } // unchanged
  ```

---

## 3. `backend/src/Controller/execute_code.js`

**File:** `backend/src/Controller/execute_code.js`

Rewired the **`executionRouter`** (the "run code" dry-run path) to use Piston
instead of Judge0:

- Imports `safeRunCodeWithPiston` from `pistonlibs.js`.
- Runs the submitted code through Piston:
  ```js
  const result = await safeRunCodeWithPiston({
    language: languageKey,
    sourceCode,
    stdin: stdin || ""
  });
  ```
- Returns a **Judge0-shaped response** so the frontend
  (`frontend/src/store/useExecutionStore.js`) works without changes:
  ```js
  result: {
    stdout,
    stderr,
    exitCode,
    status: { id: success ? 3 : 11, description: success ? "Accepted" : "Runtime Error" },
    memory: null,
    time: null
  }
  ```
  - `id: 3` = Accepted (exit code 0).
  - `id: 11` = Runtime Error (non-zero exit code).

> **Not changed in this pass:** `submitCodeHandler` (the `/submit` path) still
> uses Judge0 batch submission and is not yet functional. See the
> `JUDGE0_ISSUE_DOCUMENTATION.md` "Known remaining work" section.

---

## 4. `backend/src/libs/judge0.libs.js`

**File:** `backend/src/libs/judge0.libs.js`

Removed a duplicate block at the end of the file that declared `sleep`,
`submitBatch`, and `pollBatchResults` a **second time**. This duplicate caused a
module-load failure when starting the backend:

```
SyntaxError: Identifier 'sleep' has already been declared
SyntaxError: Identifier 'submitBatch' has already been declared
```

Kept the config-driven implementations (`getJudge0Config`) and removed the older
duplicate copies.

---

## 5. Environment / runtime actions (not file edits)

Performed to stand up and verify the solution:

- **Started the Piston container:**
  ```
  docker compose up -d piston
  docker ps --filter "name=algo-piston"   # -> "Up", port 2000
  curl http://localhost:2000/             # -> { "message": "Piston v3.1.1" }
  ```

- **Installed the required language runtimes** (using the Piston CLI):
  ```
  node index.js ppman install python   # -> 3.12.0
  node index.js ppman install node     # -> javascript 20.11.1
  node index.js ppman install gcc      # -> c / c++ 10.2.0
  node index.js ppman install java     # -> 15.0.2
  ```

- **Restarted the backend** on port `8080`:
  ```
  node src/index.js    # (working dir: backend) -> "Server started on 8080"
  ```

- **Started the frontend** Vite dev server on port `5173`:
  ```
  npm run dev          # (working dir: frontend)
  ```

---

## 6. Verification results

Direct Piston API (`http://localhost:2000/api/v2/execute`):

| Language     | Input (stdin) | Output | Result |
|--------------|---------------|--------|--------|
| python 3.12.0 | `21` | `42` | ✅ |
| c++ 10.2.0    | `21` | `42` | ✅ |
| javascript 20.11.1 | `7` | `21` | ✅ |
| java 15.0.2   | –             | `15` | ✅ (after timeout fix) |

End-to-end through the backend (`POST /api/v1/execute-route/`, with a valid JWT):

| LanguageKey | HTTP | body.result.status |
|-------------|------|--------------------|
| PYTHON      | 200  | Accepted (id 3)    |
| CPP         | 200  | Accepted (id 3)    |
| JAVASCRIPT  | 200  | Accepted (id 3)    |
| JAVA        | 200  | Accepted (id 3)    |

---

## 7. Files touched in this session

- `docker-compose.yml` — added piston service + timeouts, `pistondata` volume.
- `backend/src/libs/pistonlibs.js` — local Piston URL + fixed versions.
- `backend/src/Controller/execute_code.js` — Piston-backed executionRouter.
- `backend/src/libs/judge0.libs.js` — removed duplicate declarations.

*This log complements `JUDGE0_ISSUE_DOCUMENTATION.md`, which explains the
underlying Judge0/cgroup problem and our choice of self-hosted Piston.*
