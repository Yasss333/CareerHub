# JUDGE0 Issue Documentation

This document fully documents the **Judge0** integration problem in the **AlgoRank**
project, why it could not be fixed on the current local machine, and how we worked
around it.

---

## 1. Background

AlgoRank's code-execution layer originally relied on **Judge0 CE** (Community
Edition) to run user-submitted solutions against test cases. Judge0 was deployed
locally via Docker Compose.

The planned flow was:

1. Frontend sends source code + language + stdin.
2. Backend maps the language to a Judge0 language ID.
3. Backend submits to Judge0 and polls for the verdict.
4. Backend grades output against expected outputs and saves the submission.

---

## 2. The Core Problem: **cgroup version mismatch**

The blocker is a low-level Linux sandboxing incompatibility:

| Runner | Requirement | Local environment |
|--------|-------------|-------------------|
| **Judge0 CE 1.13.1** (isolate sandbox) | **cgroup v1** | WSL2 kernel = **cgroup v2** ✗ |
| **Piston** (isolate sandbox) | **cgroup v2** | WSL2 kernel = **cgroup v2** ✓ |

- The Docker Desktop backend is **WSL2**.
- WSL2 exposes a kernel with **cgroup v2** by default
  (`6.6.87.2-microsoft-standard-WSL2`).
- **Judge0's isolateslibrary requires cgroup v1**, which is simply not available
  under the default WSL2 configuration.
- **Piston requires cgroup v2**, which WSL2 has natively — making Piston the only
  viable local option.

### Attempted fixes that failed

1. **Enabling cgroup v1 in Docker Desktop settings**
   - Added a `DeprecatedCgroupv1` key to the Docker Desktop settings store
     (`settings-store.json`).
   - **Result:** The WSL2 backend ignores this flag; it is ineffective for WSL2.
   - The settings file was restored from a backup (`settings-store.json.bak`).

2. **Running Judge0 anyway** (via the pre-existing `docker-compose`)
   - The Judge0 **server** boots, but the **worker** cannot execute anything.
   - Worker error observed:
     ```
     No such file or directory @ rb_sysopen - /box/script.py
     ```
   - Cause: `isolate` could not set up the sandbox **box** because it requires
     cgroup v1. This makes Judge0 completely unusable for actual code execution.

---

## 3. Judge0-specific symptoms observed

### 3.1 Worker cannot execute code

- Judge0 server accepts submissions and returns tokens.
- The worker fails to run anything due to the cgroup/paths issue, so submissions
  never progress to a verdict.

### 3.2 Duplicate identifiers broke the backend module

While preparing the backend for execution, `backend/src/libs/judge0.libs.js`
contained **duplicate declarations** of:

- `sleep`
- `submitBatch`
- `pollBatchResults`

This produced a module load error on server start:

```
SyntaxError: Identifier 'sleep' has already been declared
SyntaxError: Identifier 'submitBatch' has already been declared
```

**Fix applied:** removed the duplicate block at the end of
`backend/src/libs/judge0.libs.js`, keeping the config-driven implementations
(`getJudge0Config`) and removing the older duplicate `submitBatch` /
`pollBatchResults` / extra `sleep`.

---

## 4. Why we switched to Piston

Given the cgroup v1 blocker, the cleanest path to working code execution was to
adopt **Piston**, which is compatible with the cgroup v2 environment.

### 4.1 Public Piston API is not usable

- The hosted Piston endpoint (`https://emkc.org/api/v2/piston/execute`) became
  **whitelist-only as of 2026-02-15**.
- Unauthenticated requests return **401**, so we could not rely on it.
- These request the archive/`emkc.org` public API is effectively dead for new
  users.

### 4.2 Self-hosted Piston (chosen solution)

- Self-hosted Piston in Docker (`ghcr.io/engineer-man/piston`).
- Exposed on host port `2000`.
- Language runtimes installed: **Python 3.12.0, JavaScript 20.11.1,
  C++/C 10.2.0 (gcc), Java 15.0.2**.

---

## 5. Current status

- **Dry-run / "Run code"** (`POST /api/v1/execute-route/`) is fully rewired to
  use the self-hosted Piston API and **works** for Python, C++, JavaScript, and
  Java.
- **Submission / grading** (`POST /api/v1/execute-route/submit`, i.e.
  `submitCodeHandler`) **still uses Judge0 batch submission**. This path is NOT
  yet functional because Judge0 cannot run code under cgroup v2.

> **Known remaining work:** rewire `submitCodeHandler` to run each test case
> through Piston (instead of Judge0 batch) so problem submission and
> database-backed grading also work end-to-end.

---

## 6. Command cheat-sheet (local Piston setup)

```powershell
# Start the piston container
docker compose up -d piston

# Check it is up / version
curl http://localhost:2000/

# List installed runtimes
curl http://localhost:2000/api/v2/runtimes

# Install/update a runtime (from the cloned Piston CLI)
cd <temp>/piston-cli/cli
node index.js ppman install python
node index.js ppman install node
node index.js ppman install gcc
node index.js ppman install java
```

---

*Documented for the AlgoRank code-execution issue. Reason for current behavior:
Judge0 requires cgroup v1; the local WSL2/Docker environment provides cgroup v2.
Piston (cgroup v2) was adopted for the run-code path.*
