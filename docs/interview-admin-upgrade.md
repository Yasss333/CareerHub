# Interview MVP and admin workspace — 2026-10-30

User scope: device preflight, full-monitor sharing/proctoring, interviewer welcome and candidate introduction, visual report analytics, a separate role-protected admin panel, existing roadmap/milestone progress, mentor removal, requested admin provisioning, and smoke tests including deployed feedback.

| Capability | Contract | Acceptance |
| --- | --- | --- |
| media-preflight | Explicit camera/mic tests and level meter. Proctored mode selects an entire monitor through the browser chooser. Practice mode remains clearly labelled. | Cancel/deny/retry, no capture before consent, device cleanup, reject tab/window capture. |
| screen-monitoring | Retain monitor stream and hand off tested camera/microphone streams across setup→session in memory. No screen pixels uploaded or stored. Require active monitor sharing to advance proctored sessions. Record bounded client-source start/stop/heartbeat/focus events; never assert they are tamper-proof identity checks. | Stop sharing pauses continuation, reshare works, no false stop event on normal completion, streams stop on exit. |
| interview-opening | Female-voice preference where installed; interviewer introduces herself and asks for a concise introduction. Save introduction separately from scored technical answers. | Intro persists across reload, transitions to questions, repeat/mute/typed fallback work. |
| report-analytics | Actual answer-score ring, question score chart, emotion distribution, completion/duration and monitoring event timeline. | No fabricated scores or inferred identity, zero retained, mobile layout. |
| admin-workspace | Current database ADMIN role on every admin endpoint; distinct /admin navigation and normal email/password login. Overview, users, mentors, interview oversight, roadmap/milestone progress, feedback, existing problem controls, audit trail. | User/mentor/forged-role tokens denied; destructive actions confirmed and scoped in tests. |
| mentor-removal | Remove mentor listing/profile and unbooked availability, revoke mentor privileges, cancel future active bookings; preserve account/history. Audit the action. | Only admin can remove; existing completed records remain. |
| admin-provisioning | Trusted script reads requested email/password from ephemeral environment, bcrypt hashes; no hard-coded/default credential or public admin signup. Do not silently replace an existing different password. | Requested account can log in; role controls routing. |
| deployed-feedback | Temporary accounts/reports only; verify submission, admin update, reporter view and JSON export on deployed URLs. | Remove scoped test data; no reading/exporting unrelated reports. |

Build order: admin API/oversight and additive schema → media preflight/screen monitoring → interview opening → visual report → browser/live smoke/provisioning.

Limits: browser screen sharing requires a user gesture and explicit chooser selection; the browser can report events but cannot prove absence of cheating or detect another physical device. ML face identity remains unavailable until the deployed service guarantees session isolation. Never substitute invented matches. No raw screen/webcam/audio retention. Tested device handles transfer into the session without reopening hardware, then release on exit. Code execution remains excluded.


## Operator and API notes

- Apply migrations with `prisma migrate deploy` and generate the Prisma client before starting the new API. The migration is additive; old sessions remain practice sessions without a required introduction.
- Provision the requested admin with `node scripts/provision-admin.mjs` and explicit ephemeral `CAREERHUB_ADMIN_EMAIL` / `CAREERHUB_ADMIN_PASSWORD`. The command refuses an existing account with a different password or ordinary role. No default administrator password is built into the application.
- Normal login routes the returned ADMIN role to `/admin`; the existing explicit role options also remain usable. Public registration cannot select ADMIN.
- Admin oversight: `GET /api/admin/overview`, `/users`, `/mentors`, `/progress`, `/interviews`, `/audit`; lists take a bounded `page` and optional `q`. `DELETE /api/admin/mentors/:id` requires matching `confirmation` and a bounded reason. Mentor removal is serializable and records an audit entry; ongoing calls and completed bookings are preserved.
- Interview creation accepts `monitoringMode: practice|proctored` and `introductionRequired`. Proctored creation requires all three explicit consent flags. `PUT /api/interview/sessions/:id/introduction` saves 1–4000 characters separately from scored questions. Screen events establish a 60-second browser-reported continuation lease, refreshed every 20 seconds. UI gates camera/mic availability too. Ending an interview remains available when sharing fails; this allows safe exit without trapping a candidate.
- Browser events are server-allowlisted with server-defined severities, source=client, a total event bound and duplicate throttling. They never establish an ML identity match.
- The problem library now reloads the current database role for authorization. The seed endpoint no longer accepts a known default, query parameter or JWT secret as its seed key. Operators can use ADMIN authorization or a separate explicitly configured `SEED_SECRET` of at least 32 characters in `X-Seed-Key`. Code execution and seed were not invoked during QA.
- Screen-capture browser behavior: [MDN getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia). The browser chooses the surface; the app verifies the returned displaySurface is monitor and rejects tabs/windows. Screen frames are never sent to the API.

## Verification commands

- `npm run test:admin`, `npm run test:interview`, `npm run test:feedback`, `npm run test:regressions`
- `npm run test:interview:browser` and `npm run test:interview-admin:browser` (run Chrome device tests sequentially)
- `node scripts/interview-admin-migration-qa.mjs` (isolated schema)
- `RUN_PROVIDER_SMOKE=true node scripts/interview-admin-live-qa.mjs` with environment syntax appropriate to the shell (scoped disposable accounts; synthetic answer only)
- `node scripts/feedback-deployed-qa.mjs` (one QA-owned account/report only; admin inbox restricted to scope=mine before request dispatch; no cross-user listing/export)
- `node scripts/admin-login-smoke.mjs` with explicit admin credentials in ephemeral environment
- TypeScript application check and `npm run build:web`.

Verification artifacts live in the workspace outputs folder, outside the repository. The database migration and requested admin account are provisioned; this feature branch is local until published/deployed. Local automated media tests use synthetic streams and do not establish physical device quality or native picker acceptance. Deployed identity verification remains unavailable until the ML service guarantees session isolation. No raw camera/audio/screen data was retained by these features.
