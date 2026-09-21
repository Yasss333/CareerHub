# Resume Builder Module Agent Instructions

## Module Purpose
The Resume Builder allows users to create, edit, and manage professional resumes with AI assistance. It includes template selection, skills management, experience tracking, and automatic content generation.

## Current Architecture

### Backend
- **Framework**: Express.js with JWT authentication
- **Database**: PostgreSQL via Prisma ORM
- **Image Upload**: ImageKit integration (pending implementation)
- **Authentication**: Shared CareerHub JWT system

### Frontend
- **Framework**: React 18 + TypeScript
- **State Management**: Component state + future Zustand integration
- **Styling**: Tailwind CSS
- **Routing**: React Router v7

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Server**: Express.js
- **Database**: PostgreSQL (Prisma)
- **Authentication**: JWT + bcrypt
- **Image Storage**: ImageKit (planned)

### Frontend
- **UI Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## File Paths

### Backend Files
- `apps/api/src/routes/resume.routes.js` - Resume CRUD API endpoints
- `apps/api/prisma/schema.prisma` - Resume data model
- `apps/api/src/middleware/auth.middleware.js` - JWT authentication middleware

### Frontend Files
- `apps/web/src/pages/ResumeBuilder.tsx` - Main resume builder page
- `apps/web/src/components/Layout.tsx` - Shared layout component
- `apps/web/src/components/ProtectedRoute.tsx` - Route protection wrapper

### Database Model
- `Resume` model in `apps/api/prisma/schema.prisma`

## Database Models

### Resume Model
```prisma
model Resume {
  id              String   @id @default(uuid())
  userId          String
  title           String
  public          Boolean  @default(false)
  template        String   @default("modern")
  accentColor     String   @default("#3b82f6")
  professionSummary String? @map("profession_summary")
  skills          String[]
  personalInfo     Json?
  experience      Json?
  projects        Json?
  education       Json?
  profile         Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## API Routes

### Resume CRUD Operations
- `GET /api/resumes` - Get all resumes for authenticated user
- `GET /api/resumes/:id` - Get specific resume by ID
- `POST /api/resumes` - Create new resume
- `PUT /api/resumes/:id` - Update existing resume
- `DELETE /api/resumes/:id` - Delete resume

### Request/Response Formats
All routes require JWT authentication via `Authorization: Bearer <token>` header.

### Error Handling
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User doesn't own the resume
- `404 Not Found` - Resume doesn't exist
- `500 Internal Server Error` - Database or server error

## Frontend Routes
- `/resume-builder` - Main resume builder page
- Protected route requiring authentication

## External Integrations

### ImageKit (Planned)
- **Purpose**: Resume profile image and document uploads
- **Status**: Identified but not yet implemented
- **Requirements**: API keys in environment variables
- **Legacy Integration**: Present in `legacy/Resume_Builder`

## Constraints

### Do Not Change Without Approval
- Resume data model structure (fields, types, relations)
- Authentication middleware behavior
- API endpoint contracts and response formats
- JWT token validation logic
- User-resume ownership checks

### Safe Changes
- UI improvements and styling
- Form validation enhancements
- Component refactoring
- Adding new optional fields to resume model
- Frontend state management improvements

## Testing Requirements

### Before Marking TODO as Complete
- Test create resume with all fields
- Test update resume with partial data
- Test delete resume operation
- Test user ownership validation (cannot access other users' resumes)
- Test authentication requirement on all endpoints
- Test empty state handling in UI

### Integration Testing
- Test resume data persists correctly in database
- Test JWT token is properly validated
- Test error handling for invalid data
- Test concurrent resume operations

## Dependencies

### Backend Dependencies
- `express` - Web framework
- `prisma` - Database ORM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation/validation
- `cors` - CORS middleware

### Frontend Dependencies
- `react` - UI framework
- `react-router-dom` - Client-side routing
- `lucide-react` - Icon library
- `@tailwindcss/vite` - Tailwind CSS integration

## Current Implementation Status

### Completed
- Basic resume CRUD API operations
- Prisma data model for resumes
- JWT authentication integration
- Basic React frontend page
- Protected route wrapper

### In Progress
- ImageKit integration for image uploads
- Advanced resume templates
- AI content generation

### Not Started
- Resume export functionality (PDF, Word)
- Advanced template customization
- AI-powered content suggestions
- Resume sharing and public links

## Known Issues

### ImageKit Integration
- Integration identified but not implemented
- Environment variables not configured
- Upload endpoint not created

### Frontend UI
- Basic page structure exists but needs refinement
- Form validation needs enhancement
- Loading states and error handling need improvement

## Development Guidelines

### Adding New Resume Fields
1. Update Prisma schema in `apps/api/prisma/schema.prisma`
2. Generate and run migration: `npx prisma migrate dev`
3. Update API routes to handle new fields
4. Update frontend forms to include new fields
5. Update validation logic
6. Test all CRUD operations with new fields

### Adding New Resume Templates
1. Add template configuration to backend or frontend
2. Update template selection UI
3. Ensure data structure supports template-specific fields
4. Test resume rendering with new template

### Modifying Authentication
1. **Requires approval** before making changes
2. Test with different user roles
3. Verify token expiration handling
4. Ensure backward compatibility with existing tokens

## Integration Points

### Shared Authentication
- Uses `packages/shared/src/auth/jwt.js` for token operations
- Uses `apps/api/src/middleware/auth.middleware.js` for route protection
- Follows shared User model and role system

### Dashboard Integration
- Resume statistics should appear in user dashboard
- Recent resumes should be accessible from dashboard
- Resume creation should be accessible from dashboard

## Performance Considerations

### Database Optimization
- Add indexes on frequently queried fields (userId, title)
- Consider pagination for users with many resumes
- Optimize JSON field queries (personalInfo, experience, etc.)

### Frontend Optimization
- Lazy load resume templates
- Debounce auto-save functionality
- Optimize image uploads with compression

## Security Considerations

### Data Validation
- Validate all input data on both client and server
- Sanitize resume content to prevent XSS
- Validate file uploads for images
- Limit file sizes for uploads

### Access Control
- Ensure users can only access their own resumes
- Validate JWT tokens on every request
- Implement rate limiting for resume operations

## Migration Notes

### From Legacy Resume Builder
- **Original**: MongoDB/Mongoose with different field structure
- **Target**: PostgreSQL/Prisma with updated schema
- **Key Changes**:
  - Document structure → relational model
  - Different field naming conventions
  - Removed some legacy fields
  - Added JWT authentication integration

### Pending Legacy Features
- ImageKit integration (needs environment setup)
- AI content generation (needs backend integration)
- Advanced template system (needs implementation)

## Feature-Specific TODO Reference
See `docs/progress/resume-builder-todo.md` for detailed implementation tasks.

## Common Pitfalls

### JSON Field Handling
- Prisma JSON fields need careful serialization/deserialization
- TypeScript types for JSON fields need proper definition
- Validation of nested JSON objects is complex

### User Ownership
- Always verify userId matches authenticated user
- Test with multiple users to ensure isolation
- Handle cases where user is deleted (cascade delete)

### Image Uploads
- File size limits must be enforced
- File type validation is essential
- ImageKit authentication requires proper key management