# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with monorepo structure using npm workspaces
- PostgreSQL database with Docker container
- Unified JWT authentication system with bcrypt password hashing
- Resume Builder module with full CRUD operations and advanced features
- Senior Connect module with mentorship features and Jitsi integration
- Shared design system with Tailwind CSS
- React 18 + TypeScript frontend with Vite
- Comprehensive documentation system with agent instructions
- Feature-specific agent files for all modules (Resume Builder, Senior Connect, AlgoRank, AI Interview)
- Progress tracking TODO files for each module
- Architecture documentation including API design and database schema
- Root AGENTS.md with project-level AI agent control guidelines
- Keep a Changelog format for project change tracking
- Advanced Resume Builder form components (ExperienceForm, EducationForm, ProjectForm, SkillsForm)
- Professional summary form with AI enhancement
- ATS analysis modal with scoring and keyword matching
- Cover letter generation modal with PDF export
- Mock interview practice modal with question generation and answer evaluation
- All 4 resume templates (Modern, Classic, Minimal, MinimalImage) in TypeScript
- ImageKit integration for profile image uploads
- AI content generation for professional summaries and job descriptions
- PDF export functionality with print-to-PDF
- Senior Connect Phase 2: comprehensive mentor profile editing interface
- Senior Connect mentor expertise/achievements tag management
- Senior Connect availability slot management UI with conflict detection
- Senior Connect session booking with availability slot selection and conflict detection (junior + senior)
- Senior Connect session status workflow (pending → accepted/rejected/cancelled → started → completed)
- Senior Connect feedback collection with star rating, comment, and tags
- Senior Connect mentor search/filtering (search, domain, expertise)
- Senior Connect availabilitySlotId linking (slot marked booked on booking, freed on cancel/reject)

### Changed
- Extend Senior Connect SessionBooking model with optional availabilitySlotId (Prisma migration required)
- Enhanced Senior Connect booking to accept either User id or SeniorProfile id

### Changed
- Migrated Resume Builder from MongoDB to PostgreSQL + Prisma (backend and frontend complete with all advanced features)
- Migrated Senior Connect from MongoDB to PostgreSQL + Prisma (backend API complete, frontend basic)
- Updated all frontends to React 18 + TypeScript
- Replaced legacy authentication systems with custom JWT authentication
- Unified user model with role-based access control (ADMIN/USER + isAlumniMentor)
- Implemented ImageKit integration for resume image uploads
- Added comprehensive AI features to Resume Builder (ATS analysis, cover letter generation, interview prep)

### Deprecated
- Legacy Supabase authentication (replaced with custom JWT)
- Legacy MongoDB databases (replaced with PostgreSQL)

### Removed
- Legacy MongoDB database files
- Legacy Supabase Auth dependencies

### Fixed
- Database connection issues with PostgreSQL Docker setup
- JWT token validation middleware
- Auth middleware token expiration handling
- Prisma SQLite to PostgreSQL migration
- Senior Connect booking passed SeniorProfile id where User id was expected (resolved via profile lookup)
- Senior Connect feedback endpoint now rejects duplicate feedback and recomputes senior rating from all reviews

### Security
- Added JWT secret management with environment variables
- Implemented role-based access control (ADMIN/USER + isAlumniMentor)
- Added password hashing with bcrypt (10 salt rounds)
- Implemented protected routes for sensitive operations

### Documentation
- Created comprehensive documentation system for AI agent control
- Added root AGENTS.md with project-level instructions and decision framework
- Created feature-specific agent files for Resume Builder, Senior Connect, AlgoRank, and AI Interview
- Added progress tracking TODO files for each module with implementation phases
- Created architecture documentation including API design and database schema
- Established documentation conventions to prevent autonomous architectural decisions
- Added module boundaries and integration points documentation

## [0.1.0] - 2024-09-15

### Added
- Initial CareerHub platform foundation
- Resume Builder module with basic CRUD operations (backend complete, frontend basic)
- Senior Connect module with Jitsi video integration (backend complete, frontend basic)
- PostgreSQL database with Docker
- Unified authentication system with JWT
- Shared app shell and navigation

### Known Limitations
- Resume Builder ImageKit integration requires API keys in environment variables
- Resume Builder AI features require OpenRouter API key in environment variables
- Senior Connect availability system is basic (advanced system available in legacy)
- AlgoRank module assessment complete but not implemented (complete functional code available in legacy)
- AI Interview module assessment complete but not implemented (deferred to end - most complex)
- Database switched from SQLite to PostgreSQL during development
- Dashboard not yet implemented (highest priority)

### Legacy Code Availability
- Resume Builder: Complete functional code with ImageKit, AI generation, PDF export, templates
- Senior Connect: Complete functional code with advanced availability, calendar, notifications
- AlgoRank: Complete functional code with Piston integration, code editor, problem set
- AI Interview: Functional code but requires complex migration (Supabase → CareerHub)

### Implementation Priorities
1. ~~Resume Builder~~ (COMPLETED - all advanced features migrated from legacy)
2. Senior Connect (copy + adapt from legacy)
3. AlgoRank (copy + adapt from legacy)
4. Landing Page (integration when provided)
5. Dashboard (second-last priority - requires all other modules)
6. AI Interview (deferred to end - most complex)