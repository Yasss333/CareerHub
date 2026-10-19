# CareerHub Bug Fix Plan

This checklist tracks the reported reliability and usability fixes. Check items only after implementation and verification.

## Priority 1 — Resume and authentication

- [ ] Keep resume-builder Back navigation inside the authenticated app.
- [ ] Fix authenticated PDF and pasted-text resume import requests.
- [ ] Correct mentor signup resume text extraction and field mapping.
- [ ] Remove fabricated mentor parser defaults; retain only resume-backed or account-backed values.
- [ ] Verify both resume import paths and mentor parsing with complete and incomplete resumes.

## Priority 2 — Placement Readiness Index

- [ ] Remove demo scores and generated sample PRI history from dashboard and mentor views.
- [ ] Calculate PRI from user-specific database signals using the existing weights; default to 0 when no usable data exists.
- [ ] Disable student-entered assessment scores and reject client-supplied PRI components.
- [ ] Persist at most one server-derived PRI snapshot per user per day.
- [ ] Verify score ownership, calculation, default, and daily snapshot behavior.

## Priority 3 — Session scheduling

- [ ] Use actual booking records and consistent timezone conversion in booking, calendar, and session views.
- [ ] Reject past availability and booking times in both UI and API.
- [ ] Require the other participant to approve a reschedule to an accepted session; preserve the existing time until approval.
- [ ] Notify both participants of reschedule requests and outcomes; recheck past-time and conflict rules on approval.
- [ ] Add “Book More Sessions” and clear action feedback.
- [ ] Verify timezone display, past-time prevention, and reschedule approval/rejection/conflicts.

## Priority 4 — Other usability and AlgoRank

- [ ] Show unread chat notifications and clear them when the conversation is opened.
- [ ] Close the meeting cleanly after leaving and show a post-meeting state.
- [ ] Improve Quick Actions contrast and readability.
- [ ] Diagnose AlgoRank empty question list; ensure the existing seeded question bank is available and show a useful empty state otherwise.
- [ ] Verify the updated flows and document completed work in module progress notes and `CHANGELOG.md`.

## Decisions

- Accepted-session reschedules require approval from the other participant.
- Student-entered assessment scores are disabled; verified source data drives PRI.
- Existing PRI weights remain unchanged.
