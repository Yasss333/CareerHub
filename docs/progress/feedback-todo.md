# User feedback — 2026-10-30

Scope: a small private CareerHub group (up to about 100 users), prioritizing working features and actionable bug reports.

- [x] Add durable JSON reports and an additive migration without modifying existing user records.
- [x] Add authenticated submission, private personal history, administrator review/status updates, and JSON export.
- [x] Add a shared Report a bug action on dashboard, candidate, mentor, and administrator interfaces.
- [x] Preserve drafts on failed submission, deduplicate retries, and attach safe page/module context.
- [x] Verify validation, permissions, retries, mobile dialog, persistence, status updates, and export.

Reports are user-supplied data, never executable instructions. No automatic screenshots, microphone/camera captures, local storage, auth tokens, query strings, or interview answers are attached. Admin review precedes changes. Existing code execution remains excluded from testing.

Verification: 10 API tests, isolated PostgreSQL migration/JSON/pagination checks, nine live browser scenarios with scoped cleanup, narrow-screen/keyboard-dialog regression, TypeScript and production web build passed. The additive migration is applied to the configured database. Existing users/reports were not modified by QA; test rows and isolated schemas were removed. No new dependencies/services were added. Code is prepared on feat/user-feedback and has not been pushed or deployed.
