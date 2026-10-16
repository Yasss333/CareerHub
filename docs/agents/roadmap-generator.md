# Roadmap Generator Agent Instructions

## Overview
The Roadmap Generator is a hybrid AI-powered learning path system that creates personalized career roadmaps. It combines predefined career role templates with AI personalization to generate structured learning paths with free resources (GFG, YouTube, etc.).

## Architecture

### Backend Structure
- **Database Models**: `Roadmap` and `RoadmapMilestone` in Prisma schema
- **API Routes**: `apps/api/src/routes/roadmap.routes.js`
- **Templates**: `apps/api/src/templates/roadmap-templates.js`
- **AI Integration**: `apps/api/src/libs/roadmap-ai.js`

### Frontend Structure
- **Pages**:
  - `RoadmapList.tsx` - User's roadmaps overview
  - `RoadmapBuilder.tsx` - Create new roadmap from template
  - `RoadmapDetail.tsx` - View and manage specific roadmap
- **Components**:
  - `ResourceCard.tsx` - Display learning resources
  - Milestone tracking built into RoadmapDetail

### Technology Stack
- **Backend**: Express.js + Prisma ORM
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **AI**: OpenRouter API (same as Resume Builder)
- **Authentication**: Shared CareerHub JWT

## Database Schema

### Roadmap Model
```prisma
model Roadmap {
  id          String   @id @default(uuid())
  userId      String
  title       String
  description String
  roleType    String   // Frontend, Backend, Full Stack, DevOps, Data Science
  skillLevel  String   @default("beginner") // beginner, intermediate, advanced
  status      String   @default("draft") // draft, in_progress, completed
  topics      Json     // Structured roadmap topics/milestones
  resources   Json     // AI-generated free resources
  progress    Float    @default(0) // Overall progress percentage
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  milestones  RoadmapMilestone[]
}
```

### RoadmapMilestone Model
```prisma
model RoadmapMilestone {
  id          String   @id @default(uuid())
  roadmapId   String
  title       String
  description String
  order       Int
  isCompleted Boolean  @default(false)
  topics      Json     // Array of sub-topics
  resources   Json     // Specific resources for this milestone
  dueDate     DateTime?
  completedAt DateTime?

  roadmap     Roadmap @relation(fields: [roadmapId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### Roadmap CRUD
- `GET /api/roadmaps` - Get user's roadmaps (authenticated)
- `GET /api/roadmaps/:id` - Get specific roadmap with milestones
- `POST /api/roadmaps` - Create new roadmap
- `PUT /api/roadmaps/:id` - Update roadmap details
- `DELETE /api/roadmaps/:id` - Delete roadmap

### Milestone Management
- `POST /api/roadmaps/:id/milestones` - Add milestone
- `PUT /api/roadmaps/:id/milestones/:milestoneId` - Update milestone
- `DELETE /api/roadmaps/:id/milestones/:milestoneId` - Delete milestone
- `PUT /api/roadmaps/:id/milestones/:milestoneId/complete` - Toggle milestone completion

### AI Generation
- `POST /api/roadmaps/generate` - Generate roadmap from template with AI personalization
- `POST /api/roadmaps/:id/resources` - Generate AI-suggested free resources for a topic
- `POST /api/roadmaps/:id/customize` - AI-customize existing roadmap

### Templates
- `GET /api/roadmaps/templates` - Get available career role templates
- `GET /api/roadmaps/templates/:roleType` - Get specific template structure

## AI Integration

### Hybrid Approach
1. **Base Templates**: Predefined career role roadmaps in `roadmap-templates.js`
2. **AI Personalization**: OpenRouter API enhances templates based on user goals and skill level
3. **Resource Generation**: AI suggests free learning resources (GFG, YouTube, blogs, documentation)

### AI Functions
- `generatePersonalizedRoadmap(template, skillLevel, userGoals)` - Personalize template
- `generateResources(topic, skillLevel)` - Generate free learning resources
- `customizeRoadmap(roadmap, userGoals)` - Customize existing roadmap

### AI Configuration
- Uses OpenRouter API with model: `meta-llama/llama-3-8b-instruct:free`
- Falls back to base templates if API key not configured
- Returns curated default resources if AI generation fails

## Career Role Templates

### Available Templates
- **Frontend Developer**: HTML, CSS, JavaScript, React, TypeScript, State Management, Testing, Build Tools
- **Backend Developer**: Server-side programming, Databases, API Security, Architecture, Caching, Message Queues, CI/CD
- **Full Stack Developer**: Combined frontend and backend fundamentals
- **DevOps Engineer**: Linux, Git, Docker, Kubernetes, CI/CD, Cloud Platforms, IaC, Monitoring
- **Data Scientist**: Python, Statistics, Visualization, SQL, Machine Learning, Deep Learning, Big Data

### Template Structure
```javascript
{
  title: "Role Name",
  description: "Brief description",
  milestones: [
    {
      title: "Milestone Name",
      order: 1,
      description: "Description",
      topics: ["Topic 1", "Topic 2", ...]
    }
  ]
}
```

## Frontend Components

### RoadmapList
- Displays all user's roadmaps in card grid
- Shows progress percentage and milestone count
- Quick actions: View, Delete
- Create new roadmap button

### RoadmapBuilder
- Step 1: Select career role template
- Step 2: Choose skill level (beginner/intermediate/advanced)
- Step 3: Add user goals for AI personalization
- Generates roadmap with AI enhancement

### RoadmapDetail
- Overall progress bar
- Expandable milestone cards
- Checkbox to mark milestones complete
- Topic lists per milestone
- AI resource generation per milestone
- Resource cards (articles, videos, practice, courses)

### ResourceCard
- Displays learning resources with external links
- Categorized by type (article, video, practice, course)
- Shows source, duration, platform
- External link indicator

## Key Features

### Core Features
- ✅ Create roadmaps from predefined career templates
- ✅ AI personalization based on skill level and goals
- ✅ AI-generated free learning resources (GFG, YouTube, blogs)
- ✅ Save and manage multiple roadmaps
- ✅ Track milestone progress with completion status
- ✅ Overall progress calculation
- ✅ Beautiful card-based UI with dark mode support
- ✅ Public/private sharing toggle

### AI Features
- Roadmap personalization based on user goals
- Difficulty adjustment per skill level
- Timeline estimation for milestones
- Resource suggestion (articles, videos, practice, courses)
- Critical milestone highlighting

## Implementation Guidelines

### When Making Changes

#### Level 1: Autonomous (No approval needed)
- UI fixes and styling improvements
- Bug fixes in existing components
- Adding new career role templates
- Updating resource curation defaults

#### Level 2: Consult (Ask before proceeding)
- Adding new AI generation features
- Changing the AI model or prompts
- Modifying the template structure
- Adding new roadmap customization options

#### Level 3: Require Approval (Must get explicit OK)
- Changing the database schema
- Modifying the AI integration approach
- Changing authentication/authorization
- Removing existing features

### Adding New Career Templates
1. Add template to `apps/api/src/templates/roadmap-templates.js`
2. Follow existing structure with milestones and topics
3. Include 6-8 milestones with 4-8 topics each
4. Test template selection in RoadmapBuilder
5. Verify AI personalization works with new template

### Modifying AI Prompts
1. Update prompts in `apps/api/src/libs/roadmap-ai.js`
2. Test with various user goals and skill levels
3. Verify JSON response structure is consistent
4. Ensure fallback mechanisms work
5. Document any prompt changes

### Adding New Resource Types
1. Update `generateResources` function to include new category
2. Add corresponding icon in `ResourceCard.tsx`
3. Update TypeScript interfaces
4. Test resource generation and display

## Testing

### Required Tests
- Create roadmap from each available template
- Test AI personalization with different skill levels
- Test resource generation quality
- Verify milestone completion updates progress
- Test roadmap deletion
- Verify authentication on all endpoints
- Test with and without OpenRouter API key

### Common Issues
- **AI generation fails**: Falls back to base template, check API key
- **Resources not displaying**: Verify JSON structure from AI
- **Progress not updating**: Check milestone completion toggle
- **Migration pending**: Database needs to be running for Prisma migrations

## Integration Points

### Navigation
- Roadmaps accessible from sidebar navigation
- Linked from Dashboard (future enhancement)
- Breadcrumbs for easy navigation

### Cross-Module Features (Future)
- Link AlgoRank problems to roadmap milestones
- Suggest resume skills based on roadmap
- Recommend Senior Connect mentors based on roadmap goals
- Track overall learning progress across modules

## Dependencies

### Required
- OpenRouter API key in `apps/api/.env` (for AI features)
- PostgreSQL database running on localhost:5432
- Existing CareerHub authentication system

### Optional
- Database must run migration: `npx prisma migrate dev --name add_roadmap_models`

## Performance Considerations

### AI Calls
- AI generation may take 5-10 seconds
- Implement loading states in UI
- Consider caching AI responses in future
- Batch resource generation for efficiency

### Database Queries
- Roadmap fetch includes milestones (eager loading)
- Progress calculation updates on milestone changes
- Index on userId and roleType for queries

## Security Considerations

### Authentication
- All roadmap endpoints require JWT authentication
- Users can only access their own roadmaps
- Public roadmaps can be viewed by others (read-only)

### Data Validation
- Validate template keys before use
- Sanitize user goals before sending to AI
- Validate milestone order numbers
- Ensure progress stays between 0-100

## Known Limitations

### Current Limitations
- Database migration requires manual execution
- AI resources may vary in quality
- No roadmap sharing between users
- No export to PDF/image
- No collaborative editing
- No time tracking per milestone

### Future Enhancements
- Roadmap sharing and collaboration
- Community roadmaps marketplace
- Export to PDF/image
- Gamification (badges for completion)
- Integration with AlgoRank (link problems)
- Time tracking per milestone
- AI tutor chat within roadmap
- Progress synchronization with other modules

## Troubleshooting

### Database Migration Fails
```
Error: P1001: Can't reach database server
```
- Ensure PostgreSQL is running on localhost:5432
- Check DATABASE_URL in apps/api/.env
- Verify Docker container is running

### AI Generation Returns No Results
- Check OPENROUTER_API_KEY in apps/api/.env
- Verify API key has credits
- Check network connectivity
- Falls back to base template if AI fails

### Frontend Build Errors
- Check TypeScript types in components
- Verify all imports exist
- Ensure api.ts lib is available
- Check for missing icons from lucide-react

## File Reference

### Backend Files
- `apps/api/prisma/schema.prisma` - Database models
- `apps/api/src/routes/roadmap.routes.js` - API endpoints
- `apps/api/src/templates/roadmap-templates.js` - Career templates
- `apps/api/src/libs/roadmap-ai.js` - AI integration
- `apps/api/src/index.js` - Route registration

### Frontend Files
- `apps/web/src/pages/RoadmapList.tsx` - Roadmap list page
- `apps/web/src/pages/RoadmapBuilder.tsx` - Create roadmap page
- `apps/web/src/pages/RoadmapDetail.tsx` - Roadmap detail page
- `apps/web/src/components/ResourceCard.tsx` - Resource display component
- `apps/web/src/App.tsx` - Route definitions
- `apps/web/src/components/Layout.tsx` - Navigation

### Documentation Files
- `docs/agents/roadmap-generator.md` - This file
- `docs/progress/roadmap-generator-todo.md` - Progress tracking
- `CHANGELOG.md` - Project changelog
