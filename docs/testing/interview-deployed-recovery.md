# Deployed interview recovery — 1 November 2026

Reproduced in the Codex in-app browser using an isolated QA account and two synthetic interviews. Production frontend assets contained the previous controls, but the report PDF endpoint returned HTTP 503. A resumed interview played without fullscreen; manual fullscreen worked. The previous download implementation required a server Chromium executable and native libraries.

Changes:
- PDFKit 0.20.2 generates private reports directly in Node, with no Chromium process, HTML evaluation, image download or external resource access. Existing ownership, completed-session and no-store rules stay in place.
- A resumed/direct session requires a click on Enter fullscreen & start. The request occurs inside the click gesture. Setup and history resume request fullscreen as part of starting. Browser refusal is shown, and continuation pauses after fullscreen exits. Draft initialization remains keyed only to the question so joining/resuming does not reset answers.
- The live warning panel stays pinned while typing. A private bounded polling endpoint refreshes server-recorded events every ten seconds and on window focus, independently of answer state. Warning labels are readable, and existing incident coalescing remains in place.
- The report page always exposes its PDF control, disabled with an explanatory title until evaluation is complete.

Validation:
- 21 API/report checks passed, including missing Chromium, literal untrusted text, private event reads and download ownership.
- Three recovery browser cases passed: direct fullscreen entry, visible refusal/retry, and server-warning refresh without draft loss.
- All eight existing browser cases passed across the combined run and focused reruns after updating the test setup to use the real fullscreen join control after reload.
- A seven-page synthetic report was parsed/rendered: zero score, final answer, monitoring and every page footer retained.
- TypeScript and changed-interface lint passed.

The dependency audit found no findings in the added PDFKit chain. Existing baseline advisories (2 critical, 11 high, 2 moderate, 1 low) are not remediated in this interview fix; review separately by 8 November 2026. No schema migration, ML deployment or code-execution testing is part of this change.

## Production verification

Verified commit 791ce79 on the deployed site in the Codex in-app browser:
- Direct/resumed interview shows the fullscreen gate and disables Finish until entry. Clicking the gate activates native fullscreen.
- One synthetic server warning appears in the pinned live panel without opening the report, and the unsaved typed answer remains intact.
- Download report (PDF) saves a real file to Downloads. Its two pages were parsed and the saved answer/75% score verified. The endpoint returns HTTP 200 application/pdf instead of the reproduced 503.
- The private live-event endpoint returns HTTP 200. The full 17-case interview/browser flow also passes with the native PDF renderer.
- The disposable QA account, interviews and their warning were deleted after testing. No real candidate report or biometric image was used.

Screenshots and the downloaded sample are in the workspace outputs folder. The face-verifier service remains the separately managed ML deployment.
