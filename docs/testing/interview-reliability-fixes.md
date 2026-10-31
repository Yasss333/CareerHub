# Interview and mentoring reliability — 31 October 2026

## Acceptance checks

- Start requests native fullscreen synchronously from the user gesture, before network calls. Browser refusal/unsupported API offers a visible recovery control. Escape remains available. Fullscreen is exited when leaving the active interview, including React StrictMode cleanup handling.
- Live monitoring shows saved warning incidents and their times. Browser focus loss must last two seconds; focus/camera duplicates have a ten-second cooldown. ML status transitions remain visible; repeated warnings and rapid classifier flips do not inflate incident counts. Client-supplied events cannot establish biometric identity.
- Camera capture starts identity registration independently of emotion inference. One analysis cycle is in flight, with the next scheduled fifteen seconds after completion. A failed initial detection explains lighting/single-face recovery. Service failures retry without inventing a match.
- A completed interview has an authenticated, owner-only PDF download with score, feedback, introduction, saved answers, coaching signals and monitoring timeline. Private output is no-store, escaped, JavaScript-disabled, and cannot load external resources. PDF workers are bounded to two simultaneous jobs per API instance.
- Booking commits mentor request and candidate confirmation together. Cancellation, mentor status decisions and chat messages commit their notifications in the same transaction. The bell polls unread count; an open inbox refreshes every ten seconds. Session/chat links respect mentor navigation. Failed mark-read requests leave unread state intact.
- No email delivery is added: the user requested in-app notifications for now. No schema or authentication changes are required.

## Commands

```powershell
npm.cmd run test:interview
node --test apps/api/src/services/session-notifications.test.js apps/api/src/services/interview-report.test.js
node scripts/interview-reliability-browser-qa.mjs
node scripts/mentoring-notifications-live-qa.mjs
```

The interview browser script intercepts API traffic and uses generated camera/screen video plus synthetic microphone input. PDF rendering and native fullscreen/download APIs are real. Model responses are fixtures, including slow/failed/no-face/repeated-warning cases. The mentoring script uses the real local frontend/API and the configured database, creates two disposable QA accounts, exercises only their booking/messages/notices, and deletes those records in finally. Do not run that script against an unreviewed API destination.

Production identity verification remains unavailable until the session-isolated ML service is deployed and verified. See [Cloud Run rollout](../deployment/interview-ml-cloud-run.md). Browser/model fixtures do not prove physical device quality, biometric accuracy, or deployed behavior.

## Recorded results

- 90 automated API, report, analysis, admin, feedback and validation checks passed.
- 8 existing browser regressions passed, including device denial/consent, answer preservation and report evidence.
- 17 isolated-browser interview, report, notification and admin workflow checks passed, with no runtime exceptions. Native fullscreen and a real two-page PDF download were verified.
- Production frontend build and TypeScript passed. The existing large mentorship-bundle warning remains.
- 7 real local API/database/browser mentoring workflow checks passed; QA records removed.
- 3 isolated-browser notification error, mobile layout and chat-link checks passed.
- Updated interface lint passed; the existing session-management page retains its eight pre-existing lint warnings (no lint errors).
- Physical devices, biometric model accuracy, Cloud Run deployment and production PDF availability require a separate deployed pass. No AlgoRank execution was tested.
