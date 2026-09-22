# CareerHub Agent Instructions

## Overview
This document provides instructions for AI agents working on the CareerHub project. Agents should always read the relevant feature-specific agent file before making changes to ensure consistency and prevent autonomous decisions.

## Core Principles

### 1. Read Before Acting
- **Always** read the relevant feature-specific `docs/agents/{module}.md` file before making changes
- Never make architectural decisions without consulting documentation
- Cross-reference with `CHANGELOG.md` to understand recent changes

### 2. No Assumptions
- Never assume file locations or import paths - always verify with documentation
- Don't guess about existing code patterns - read the actual files first
- When unsure, ask clarifying questions rather than making assumptions

### 3. Progress Tracking
- Update the relevant `docs/progress/{module}-todo.md` file before starting work
- Mark items as complete immediately after finishing
- Never mark TODO items as complete without actual implementation

### 4. Change Documentation
- Update `CHANGELOG.md` for any notable changes following the Keep a Changelog format
- Update relevant `docs/agents/{module}.md` if architecture changes
- Remove outdated TODO items when features are completed

### 5. Ask Questions
- If requirements are unclear, ask rather than guess
- When multiple approaches are possible, present options to the user
- Flag any potential breaking changes before implementing

## Agent Workflow

### Standard Workflow
1. Read main `AGENTS.md` (this file)
2. Read feature-specific `docs/agents/{module}.md` for the module you're working on
3. Read corresponding `docs/progress/{module}-todo.md` file
4. Implement changes according to specifications
5. Update progress TODO file (mark completed items)
6. Update `CHANGELOG.md` if applicable
7. Test the changes thoroughly

### Decision Framework

#### Level 1: Autonomous (No approval needed)
- Bug fixes with clear, obvious cause
- Typos and documentation updates
- Simple refactoring within the same file
- TODO item completion following documented specifications
- Adding comments to clarify code

#### Level 2: Consult (Ask before proceeding)
- Architecture changes that affect multiple modules
- New dependencies or library updates
- Database schema changes (even additions)
- Breaking changes to API endpoints
- Changes to shared components or utilities
- Changes to authentication or authorization logic

#### Level 3: Require Approval (Must get explicit OK)
- Changes to core authentication system (JWT, middleware)
- Database migrations that could affect existing data
- Major refactoring across multiple modules
- Security-related changes (auth, permissions, data access)
- Changes to agent instruction files themselves
- Removal of existing features or modules
- Changes to the database provider or connection

## Module Reference

### Core Modules
- [AlgoRank](docs/agents/algorank.md) - DSA problem solving and code execution
- [Resume Builder](docs/agents/resume-builder.md) - AI-assisted resume creation
- [AI Interview](docs/agents/ai-interview.md) - AI mock interviews with emotion analysis
- [Senior Connect](docs/agents/senior-connect.md) - Junior-alumni mentorship platform

### Shared Infrastructure
- [Authentication](docs/architecture/auth-system.md) - JWT authentication and authorization
- [Database](docs/architecture/database-schema.md) - Prisma schema and migrations
- [Frontend](docs/architecture/frontend-architecture.md) - React 18 + TypeScript structure

## Project Structure

```
CareerHub/
├── apps/
│   ├── api/              # Express + Prisma backend
│   └── web/              # React 18 + TypeScript frontend
├── packages/
│   └── shared/           # Shared utilities and types
├── services/
│   └── proctoring/        # Python ML service for interview proctoring
├── docs/
│   ├── agents/           # Feature-specific agent instructions
│   ├── progress/          # Progress tracking TODO files
│   └── architecture/      # Architecture documentation
├── legacy/                # Original codebases for reference
├── CHANGELOG.md           # Project changelog
└── AGENTS.md              # This file
```

## Technology Stack

### Backend
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom JWT + bcrypt
- **ML Service**: Python FastAPI (separate microservice)

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v7

### DevOps
- **Containerization**: Docker for PostgreSQL
- **Package Management**: npm workspaces (monorepo)
- **Version Control**: Git with conventional commits

## Conventions

### Code Style
- **JavaScript/TypeScript**: ES6+ syntax, no semicolons (follow existing patterns)
- **React**: Functional components with hooks
- **Database**: Prisma schema with proper relations and indexes
- **API**: RESTful endpoints with proper HTTP methods and status codes

### Commit Messages
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Reference issues: `fixes #123`
- Be descriptive but concise: `feat: add resume CRUD operations`

### File Naming
- **Components**: PascalCase (e.g., `ResumeBuilder.tsx`)
- **Utilities**: camelCase (e.g., `jwtAuth.js`)
- **Routes**: kebab-case (e.g., `resume.routes.js`)
- **Models**: PascalCase (e.g., `Resume.ts` in Prisma)

### Error Handling
- Always include try-catch blocks for async operations
- Return proper HTTP status codes
- Log errors with context for debugging
- Never expose sensitive information in error messages

## Dependencies

### Required Services
- **PostgreSQL**: Must be running on localhost:5432 (Docker container)
- **ML Service**: Must be running on localhost:8000 for interview features
- **ImageKit**: API keys configured for resume image uploads

### Required Environment Variables
See `apps/api/.env.example` for the complete list of required environment variables.

## Testing Guidelines

### Before Marking TODO as Complete
- Test all API endpoints with proper authentication
- Test frontend user flows end-to-end
- Verify database operations complete successfully
- Test error handling and edge cases
- Ensure changes don't break existing functionality

### After Completing Features
- Run the full application to verify integration
- Test cross-module navigation and data flow
- Verify dashboard statistics are accurate
- Check for console errors or warnings

## Common Pitfalls

### Database Changes
- Never modify the Prisma schema without considering migrations
- Always test migrations on development database first
- Preserve data integrity when adding/removing fields
- Consider foreign key constraints when modifying relations

### Authentication Changes
- Test with both USER and ADMIN roles
- Verify token expiration handling
- Ensure protected routes are actually protected
- Test session management (login/logout flows)

### Frontend Changes
- Ensure TypeScript types are properly defined
- Test responsive design on different screen sizes
- Verify proper error handling in UI
- Check for console errors and warnings

## Getting Help

### When Stuck
1. Re-read the relevant agent documentation
2. Check the PRD for original requirements
3. Review similar code patterns in existing modules
4. Ask specific questions about the blocker

### When Requirements Are Unclear
1. Present the issue clearly with context
2. Suggest multiple approaches if possible
3. Explain the trade-offs of each approach
4. Wait for user guidance before proceeding

## Security Considerations

### Never Do
- Expose API keys or secrets in code
- Commit sensitive data (passwords, tokens)
- Disable authentication or authorization without approval
- Make database queries without proper user context
- Log sensitive user information

### Always Do
- Use environment variables for secrets
- Validate user input on both client and server
- Implement proper role-based access control
- Use parameterized queries to prevent SQL injection
- Keep dependencies updated for security patches

## Performance Considerations

### Database Optimization
- Use indexes on frequently queried fields
- Avoid N+1 queries with proper eager loading
- Use connection pooling for database operations
- Consider pagination for large datasets

### Frontend Optimization
- Lazy load components where appropriate
- Optimize bundle size by tree-shaking
- Use React.memo for expensive components
- Implement proper loading states and error boundaries

## Deployment Notes

### Current State
- Development environment runs on localhost
- PostgreSQL runs in Docker container
- ML service runs as separate Python process
- No production deployment currently configured

### Future Deployment
- Production deployment strategy to be determined after localhost version is stable
- Environment-specific configurations will be needed
- CI/CD pipeline to be established
- Monitoring and logging to be implemented

## Version History

- **v0.1.0** (2024-09-15): Initial platform foundation with Resume Builder and Senior Connect
- **Unreleased**: Continued development with AI Interview integration planned