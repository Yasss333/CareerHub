# CareerHub Dashboard Progress

## Follow-up: cross-module activity streak
- [x] Count meaningful resume, roadmap, interview, mentorship, and accepted problem-solving activity toward the user's daily streak
- [x] Keep streak updates idempotent within a day and preserve the longest streak

Implementation note: A shared UTC-day service updates the existing streak fields without a schema migration. Same-day idempotency and consecutive-day increment are verified with a mocked Prisma client; database-backed flow checks remain pending.

## Follow-up: verified, database-derived PRI
- [ ] Remove sample scores/history and show zero until actual source data is available
- [ ] Disable student-entered scores and derive daily snapshots from verified database data

Implementation note: removed client score entry and generated trend values; dashboard and mentor summaries now calculate from user-specific records and use zero for missing data. The API rejects client-supplied components and the dashboard requests a server-derived daily upsert. Web build and API syntax checks pass; database-backed ownership, calculation, legacy snapshot, and daily-idempotency checks remain pending.

## Dashboard overview
- [x] Use the supplied welcome, KPI cards, and chart layout with CareerHub's purple theme
- [x] Show the selected student KPIs: problems solved, resumes, mentorship, and current streak
- [x] Add a PRI history chart and component score summary
- [x] Clearly mark sample PRI values and use saved history when present
- [x] Persist one authenticated PRI snapshot per user per day and calculate its weighted score on the server
- [x] Integrate real AI Mock Interview results directly into Placement Readiness Index (45% weight) with live session count and score breakdown
- [x] Allow users to enter today's assessment scores while module score integrations are unavailable
- [x] Retain API-backed progress charts, recent activity, quick actions, and widget preferences
- [x] Verify TypeScript, Prisma schema, API syntax, and production web build

## Account settings and navigation
- [x] Add a collapsible desktop sidebar with a persistent preference and a Settings link at its bottom
- [x] Add a responsive Settings page for name, email, and profile photo
- [x] Add authenticated profile update and ImageKit photo upload endpoints
- [x] Keep sidebar and account settings consistent for USER, ADMIN, and MENTOR roles
