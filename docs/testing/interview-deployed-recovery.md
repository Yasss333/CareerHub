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

Production verification is recorded separately after deployment. The face-verifier service remains the separately managed ML deployment.
