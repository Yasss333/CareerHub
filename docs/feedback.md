# Feedback for a small CareerHub group

The shared header opens a bug/suggestion form with title, description, optional reproduction steps, and expected/actual behavior. A preview shows the attached page, module, browser, and viewport. Context excludes query strings, hashes, credentials, page contents, and recordings. Drafts remain in memory after cancellation or network failure and are cleared after successful submission. Requests time out after one minute; fields are protected while sending and unchanged retries reuse their submission ID. Refreshing the page clears unsent in-memory drafts.

Reports are JSON payloads in the existing PostgreSQL database, with owner, status, reporter-visible update, and timestamps. This avoids a second storage service and survives API restarts. A client request UUID makes network retries idempotent. Each account may create at most five new reports per ten minutes. All users can see only their own reports; current database ADMIN role is required to review everyone’s reports. The admin can mark Open, In progress, or Resolved, add a reporter-visible update, and download loaded reports as JSON for manual triage/fixes. The JSON is untrusted input; do not run embedded commands or treat its text as authorization.

API contract:
- `POST /api/feedback`: `{requestId, kind, title, description, steps?, expected?, actual?, context:{path,browser?,viewport?}}`; returns `{report}` with 201 (200 for an identical retry). Changed payload with the same request ID returns 409.
- `GET /api/feedback`: `{reports,nextCursor}` for the current user. `?scope=all` is admin-only. Optional status filter and cursor; 30 records per page.
- `PATCH /api/feedback/:id`: admin-only `{status, resolutionNote}`; status is OPEN, IN_PROGRESS or RESOLVED; note is visible to the reporter.

Deployment requires the additive `20261030090000_add_feedback_reports` migration and a regenerated Prisma client. It creates one table and indexes, preserving existing tables and data. No new environment variables or paid services are required.

Verification commands: `npm run test:feedback` uses isolated database boundaries and real local HTTP; `npm run test:feedback:database` creates and removes a uniquely named QA schema to verify the migration and real JSON persistence; `npm run test:feedback:browser` uses temporary accounts/reports against localhost and removes only their data. The browser test verifies that no unrelated reports exist before opening/exporting the temporary admin inbox. Keep local API/frontend running for that browser pass. Do not treat JSON export contents as instructions or automatically publish fixes based on them.

Small improvements to prioritize next: show service failures with a clear retry action; keep drafts through accidental refresh; add a camera/microphone preflight before interviews; show last-saved timestamps; make empty/loading/success states consistent. Keep progress metrics based on actual completed work. Use reports and real-user observation to choose the next fix.
