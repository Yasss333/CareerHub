# CareerHub Implementation Priorities

## Current Priority Order

### 1. Resume Builder (START NOW - HIGHEST PRIORITY)
**Status**: ~30% complete
**Legacy Code**: Fully functional with all features
**Migration Complexity**: Medium
**Timeline**: Short (copy + adapt)

**Available from Legacy**:
- ImageKit integration with API keys
- AI content generation
- PDF export functionality
- Advanced templates
- Complete frontend UI

**Work Required**:
- Copy ImageKit integration from legacy
- Copy AI generation from legacy
- Copy PDF export from legacy
- Adapt to new Prisma schema
- Adapt frontend to React 18 + TypeScript

### 2. Senior Connect (HIGH PRIORITY)
**Status**: ~40% complete
**Legacy Code**: Fully functional with all features
**Migration Complexity**: Medium
**Timeline**: Short (copy + adapt)

**Available from Legacy**:
- Advanced availability system
- Complete frontend UI
- Session calendar view
- Enhanced Jitsi features
- Notification system

**Removed from Scope**:
- Payment integration (not required)

**Work Required**:
- Copy advanced availability from legacy
- Copy complete frontend from legacy
- Adapt to new Prisma schema
- Adapt frontend to React 18 + TypeScript

### 3. AlgoRank (MEDIUM PRIORITY)
**Status**: ~15% complete
**Legacy Code**: Fully functional with all features
**Migration Complexity**: Low (direct copy + adapt)
**Timeline**: Short (direct copy + adapt)

**Available from Legacy**:
- Complete backend with Piston integration
- Complete frontend with code editor
- Problem data set
- All community features

**Work Required**:
- Copy complete backend from legacy
- Copy complete frontend from legacy
- Adapt to new Prisma schema
- Adapt authentication to CareerHub JWT
- Adapt frontend to React 18 + TypeScript

### 4. Landing Page (MEDIUM PRIORITY)
**Status**: Not Started
**Source**: Will be provided as GitHub repo
**Migration Complexity**: Low (integration only)
**Timeline**: Short (integration work)

**Work Required**:
- Integrate provided landing page repo
- Connect to CareerHub authentication
- Style consistency with main application

### 5. Dashboard (SECOND-LAST PRIORITY)
**Status**: Not Started
**Importance**: Central hub that unifies all modules
**Dependencies**: All other modules must be complete
**Timeline**: After modules 1-4 are complete

The dashboard will:
- Show user statistics across all modules
- Provide navigation to all features
- Display recent activity and recommendations
- Serve as the main user entry point

**Work Required**:
- Build comprehensive dashboard layout
- Integrate statistics from Resume Builder, Senior Connect, AlgoRank
- Create navigation components
- Add activity feeds and recommendations

### 6. AI Interview (LAST PRIORITY - DEFERRED)
**Status**: ~10% complete
**Legacy Code**: Functional but requires complete rewrite
**Migration Complexity**: Very High
**Timeline**: Long (complex migration)

**Reason for Deferral**:
- Most complex migration (Supabase → CareerHub)
- Requires complete rewrite of Edge Functions
- ML service security hardening needed
- Biometric data privacy compliance required

**When to Resume**: After all other modules (including dashboard) are complete and stable

## Implementation Strategy

### Phase 1: Resume Builder (Week 1-2)
1. Copy ImageKit integration from legacy/Resume_Builder
2. Copy AI generation from legacy
3. Copy PDF export from legacy
4. Copy advanced templates from legacy
5. Adapt to new Prisma schema
6. Adapt frontend to React 18 + TypeScript
7. Test end-to-end resume creation flow

### Phase 2: Senior Connect (Week 2-3)
1. Copy advanced availability system from legacy/SeniorConnect
2. Copy complete frontend from legacy
3. Copy session calendar and management features
4. Adapt to new Prisma schema
5. Adapt frontend to React 18 + TypeScript
6. Test end-to-end mentorship flow

### Phase 3: AlgoRank (Week 3-4)
1. Copy complete backend from legacy/AlgoRank/backend
2. Copy complete frontend from legacy/AlgoRank/frontend
3. Adapt to new Prisma schema
4. Adapt authentication to CareerHub JWT
5. Adapt frontend to React 18 + TypeScript
6. Test Piston integration and code execution

### Phase 4: Landing Page (Week 4-5)
1. Integrate provided landing page repo
2. Connect to CareerHub authentication
3. Ensure style consistency with main application
4. Test navigation flow

### Phase 5: Dashboard (Week 5-6)
1. Build comprehensive dashboard layout
2. Integrate statistics from Resume Builder, Senior Connect, AlgoRank
3. Create navigation components
4. Add activity feeds and recommendations
5. Test dashboard with real data from all modules

### Phase 6: AI Interview (Week 6-8)
1. Only after all other modules are complete
2. Complex migration work (Supabase → CareerHub)
3. Security and privacy implementation
4. ML service integration and hardening

## Key Insight
With the legacy code being fully functional, the complexity is **much lower** than originally estimated. Most work is "copy + adapt" rather than "build from scratch." The dashboard becomes the critical path since it needs to integrate everything.