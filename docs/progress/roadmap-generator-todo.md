# Roadmap Generator Progress TODO

## Overview
Track the implementation progress of the Roadmap Generator feature - a hybrid AI-powered learning path system similar to roadmap.sh.

## Phase 8: Expanded engineering paths and custom AI roadmaps
- [x] Add electronics and robotics career templates
- [x] Add authenticated custom roadmap generation using the configured OpenRouter key
- [x] Add custom roadmap setup to the builder and document the API
- [x] Update the changelog

## Phase 7: Interactive roadmap experience
- [x] Create a roadmap.sh-inspired visual learning map with connected, selectable stages and clear progress
- [x] Add curated free resource links to generated milestones so useful links are available immediately
- [x] Improve roadmap discovery and setup with a polished responsive template explorer
- [x] Verify roadmap resources, milestone progress, authenticated API flows, and frontend production build
- [x] Verify the builder submits a valid roadmap generation payload

## Phase 1: Database & Backend Foundation

### Database Schema
- [x] Add Roadmap model to Prisma schema
- [x] Add RoadmapMilestone model to Prisma schema
- [x] Add User relation to Roadmap
- [x] Add indexes for userId and roleType
- [x] Generate and run Prisma migration (migration applied successfully)

### Backend API
- [x] Create roadmap.routes.js with CRUD endpoints
- [x] Implement GET /api/roadmaps (list user's roadmaps)
- [x] Implement GET /api/roadmaps/:id (get specific roadmap)
- [x] Implement POST /api/roadmaps (create roadmap)
- [x] Implement PUT /api/roadmaps/:id (update roadmap)
- [x] Implement DELETE /api/roadmaps/:id (delete roadmap)
- [x] Implement milestone management endpoints
- [x] Implement milestone completion toggle
- [x] Add progress calculation helper function
- [x] Register roadmap routes in index.js

### Templates
- [x] Create roadmap-templates.js with career roles
- [x] Add Frontend Developer template (8 milestones)
- [x] Add Backend Developer template (7 milestones)
- [x] Add Full Stack Developer template (8 milestones)
- [x] Add DevOps Engineer template (7 milestones)
- [x] Add Data Scientist template (7 milestones)
- [x] Implement GET /api/roadmaps/templates endpoint
- [x] Implement GET /api/roadmaps/templates/:roleType endpoint

## Phase 2: AI Integration

### AI Personalization
- [x] Create roadmap-ai.js library
- [x] Implement generatePersonalizedRoadmap function
- [x] Implement generateResources function
- [x] Implement customizeRoadmap function
- [x] Add fallback to base templates when AI unavailable
- [x] Add default curated resources for topics
- [x] Implement POST /api/roadmaps/generate endpoint
- [x] Implement POST /api/roadmaps/:id/resources endpoint
- [x] Implement POST /api/roadmaps/:id/customize endpoint
- [x] Use OpenRouter API (same as Resume Builder)
- [x] Use the shared, verified OpenRouter model ID for roadmap generation and resources

## Phase 3: Frontend Implementation

### Pages
- [x] Create RoadmapList.tsx (roadmap overview)
- [x] Create RoadmapBuilder.tsx (create from template)
- [x] Create RoadmapDetail.tsx (view and manage)
- [x] Add roadmap routes to App.tsx
- [x] Add roadmap navigation to Layout.tsx
- [x] Test frontend TypeScript compilation

### Components
- [x] Create ResourceCard.tsx (display learning resources)
- [x] Add resource type icons (article, video, practice, course)
- [x] Implement milestone tracking in RoadmapDetail
- [x] Add expandable milestone cards
- [x] Add progress bar visualization
- [x] Add milestone completion checkboxes

### UI Features
- [x] Template selection with skill level
- [x] User goals input for AI personalization
- [x] Roadmap card grid display
- [x] Progress percentage calculation
- [x] Status badges (draft, in_progress, completed)
- [x] Dark mode support
- [x] Loading states for AI generation
- [x] Error handling and display

## Phase 4: Testing & Verification

### Build Verification
- [x] Run TypeScript compilation
- [x] Run Vite production build
- [x] Verify no build errors
- [x] Check bundle size warning (expected >500KB)

### End-to-End Testing
- [x] Run authenticated end-to-end regression checks across core user flows
- [ ] Test roadmap creation from template
- [ ] Test AI personalization with different skill levels
- [ ] Test resource generation
- [ ] Test milestone completion and progress update
- [ ] Test roadmap deletion
- [ ] Test authentication on all endpoints
- [ ] Test with and without OpenRouter API key
- [ ] Test frontend user flows
- [ ] Verify error handling

### Database Testing
- [ ] Run Prisma migration successfully
- [ ] Verify Roadmap table created
- [ ] Verify RoadmapMilestone table created
- [ ] Test foreign key constraints
- [ ] Test cascade delete on user deletion

## Phase 5: Documentation

### Agent Documentation
- [x] Create docs/agents/roadmap-generator.md
- [x] Document architecture and structure
- [x] Document API endpoints
- [x] Document AI integration
- [x] Document templates structure
- [x] Document implementation guidelines
- [x] Document testing requirements
- [x] Document troubleshooting

### Progress Tracking
- [x] Create docs/progress/roadmap-generator-todo.md
- [x] Mark completed items
- [x] Track pending items

### Changelog
- [ ] Update CHANGELOG.md with roadmap feature
- [ ] Add to "Added" section
- [ ] Document all new features

## Phase 6: Integration

### Navigation
- [x] Add Roadmaps to sidebar navigation
- [x] Use Map icon from lucide-react
- [x] Test navigation flow

### Cross-Module (Future)
- [ ] Link AlgoRank problems to roadmap milestones
- [ ] Suggest resume skills based on roadmap
- [ ] Recommend Senior Connect mentors based on goals
- [ ] Add roadmap stats to Dashboard

## Known Issues & Limitations

### Current Limitations
- AI resources quality varies based on model
- No roadmap sharing between users
- No export to PDF/image
- No collaborative editing
- No time tracking per milestone

### To Be Addressed
- Run Prisma migration when database is available
- Consider caching AI responses
- Add resource quality validation
- Implement roadmap sharing
- Add export functionality

## Future Enhancements

### Priority 1 (High Value)
- Roadmap sharing and collaboration
- Export to PDF/image
- Gamification (badges for completion)
- Better AI resource quality control

### Priority 2 (Nice to Have)
- Time tracking per milestone
- AI tutor chat within roadmap
- Community roadmaps marketplace
- Progress synchronization with other modules

### Priority 3 (Advanced)
- Roadmap recommendations based on user profile
- Skill gap analysis
- Learning analytics dashboard
- Integration with external learning platforms

## Completion Criteria

A roadmap generator is considered complete when:
- [x] Database schema is defined
- [ ] Database migration is run successfully
- [x] All API endpoints are implemented and tested
- [x] All frontend pages are implemented
- [x] AI integration works with fallback
- [x] Build passes without errors
- [x] Documentation is complete
- [ ] End-to-end testing passes
- [ ] CHANGELOG.md is updated

## Notes

- AI integration uses same OpenRouter API as Resume Builder
- Falls back gracefully when API key not configured
- Templates are curated and structured for quality
- Progress calculation is automatic based on milestones
- Frontend uses existing API utility and authentication
- Dark mode support inherited from Layout component

## Follow-up: Flexible levels and free video resources
- [x] Make generated paths adapt explicitly to beginner, intermediate, and advanced starting levels
- [x] Always include a free YouTube video search link when curated videos are missing
- [x] Mention free videos in roadmap setup and resource guidance
- [x] Verify resource fallback and frontend/API builds
- [x] Use the verified shared OpenRouter model instead of the unavailable hard-coded model
- [x] Add retryable template and roadmap loading feedback with screen-reader announcements
- [x] Warn before leaving an unsaved roadmap setup
