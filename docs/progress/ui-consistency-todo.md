# Platform UI Consistency Progress

## Theme and shared shell
- [x] Use shared semantic theme tokens for global backgrounds, surfaces, borders, and navigation
- [x] Use one purple primary brand palette across active modules while preserving status colors
- [x] Keep responsive navigation and keyboard focus states clear

## Resume Builder
- [x] Improve editor step navigation and mobile preview controls
- [x] Improve resume list empty, error, and loading states
- [x] Keep user-selectable resume document accent colors

## Scope
- AI Interview is intentionally excluded and will be added by the project owner later.

## Follow-up: quality and consistency
- [x] Add a runnable ESLint flat configuration for the installed ESLint 10 toolchain
- [x] Split page routes into on-demand chunks to reduce the initial JavaScript bundle
- [x] Extend the shared purple theme to legacy brand utilities and dark-mode neutral utilities
- [x] Replace Resume Builder save alerts with inline saved/error state
- [x] Verify lint, TypeScript, and production build

## Follow-up: day-to-day UX
- [x] Standardize page headings and content widths across core AlgoRank and Senior Connect screens
- [x] Clarify loading, empty, and recoverable error states across AlgoRank, Roadmaps, and Senior Connect
- [x] Improve form status feedback and accessible status announcements in core workflows
- [x] Add accessible names and keyboard focus behavior to updated interactive controls
- [x] Warn users before losing unsaved edits in resume, roadmap, mentor profile, and coding workflows
- [x] Keep small-screen navigation polish out of scope per user direction
