# Senior Connect Module Agent Instructions

## Module Purpose
Senior Connect is a mentorship platform connecting junior developers with alumni mentors. It includes mentor profiles, availability management, session booking, video conferencing via Jitsi, and feedback collection.

## Current Architecture

### Backend
- **Framework**: Express.js with JWT authentication
- **Database**: PostgreSQL via Prisma ORM
- **Video Conferencing**: Jitsi Meet (public URLs, no API key)
- **Authentication**: Shared CareerHub JWT system with alumni mentor capability

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
- **Video**: Jitsi Meet (public integration)

### Frontend
- **UI Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## File Paths

### Backend Files
- `apps/api/src/routes/connect.routes.js` - Senior Connect API endpoints
- `apps/api/prisma/schema.prisma` - Senior Connect data models
- `apps/api/src/middleware/auth.middleware.js` - JWT authentication middleware

### Frontend Files
- `apps/web/src/pages/SeniorConnect.tsx` - Main Senior Connect page
- `apps/web/src/pages/SeniorConnectBooking.tsx` - Session booking page
- `apps/web/src/pages/SeniorConnectSessions.tsx` - User sessions page
- `apps/web/src/components/Layout.tsx` - Shared layout component
- `apps/web/src/components/ProtectedRoute.tsx` - Route protection wrapper

### Database Models
- `SeniorProfile` model in `apps/api/prisma/schema.prisma`
- `AvailabilitySlot` model in `apps/api/prisma/schema.prisma`
- `SessionBooking` model in `apps/api/prisma/schema.prisma`
- `SessionFeedback` model in `apps/api/prisma/schema.prisma`

## Database Models

### SeniorProfile Model
```prisma
model SeniorProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  bio             String?
  expertise       String[]
  linkedinUrl     String?  @map("linkedin_url")
  githubUrl       String?  @map("github_url")
  hourlyRate      Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user         User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  availability  AvailabilitySlot[]
  sessions     SessionBooking[]
  feedback     SessionFeedback[]
}
```

### AvailabilitySlot Model
```prisma
model AvailabilitySlot {
  id          String   @id @default(uuid())
  seniorId    String
  dayOfWeek   Int
  startTime   String
  endTime     String
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  senior SeniorProfile @relation(fields: [seniorId], references: [id], onDelete: Cascade)
}
```

### SessionBooking Model
```prisma
model SessionBooking {
  id          String   @id @default(uuid())
  seniorId    String
  juniorId    String
  startTime   DateTime
  endTime     DateTime
  status      String   @default("scheduled")
  jitsiUrl    String?  @map("jitsi_url")
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  senior  SeniorProfile  @relation(fields: [seniorId], references: [id], onDelete: Cascade)
  junior  User           @relation(fields: [juniorId], references: [id], onDelete: Cascade)
  feedback SessionFeedback[]
}
```

### SessionFeedback Model
```prisma
model SessionFeedback {
  id          String   @id @default(uuid())
  bookingId   String
  rating      Int
  comment     String?
  createdAt   DateTime @default(now())

  booking SessionBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
}
```

## API Routes

### Profile Management
- `GET /api/connect/seniors` - Get all available senior profiles
- `GET /api/connect/seniors/:id` - Get specific senior profile
- `POST /api/connect/profile` - Create/update senior profile
- `PUT /api/connect/profile` - Update senior profile

### Availability Management
- `GET /api/connect/availability/:seniorId` - Get senior's availability slots
- `POST /api/connect/availability` - Create availability slot
- `PUT /api/connect/availability/:id` - Update availability slot
- `DELETE /api/connect/availability/:id` - Delete availability slot

### Session Management
- `GET /api/connect/sessions` - Get user's sessions (as junior or senior)
- `POST /apiconnect/sessions` - Book a new session
- `PUT /api/connect/sessions/:id` - Update session details
- `DELETE /api/connect/sessions/:id` - Cancel session

### Feedback Management
- `POST /api/connect/feedback` - Submit session feedback
- `GET /api/connect/feedback/:seniorId` - Get senior's feedback ratings

### Request/Response Formats
All routes require JWT authentication via `Authorization: Bearer <token>` header.

### Error Handling
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User doesn't have permission for the operation
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Time slot already booked
- `500 Internal Server Error` - Database or server error

## Frontend Routes
- `/senior-connect` - Main Senior Connect page (mentor discovery)
- `/senior-connect/booking/:seniorId` - Session booking page
- `/senior-connect/sessions` - User's session management page
- All routes are protected and require authentication

## External Integrations

### Jitsi Meet
- **Purpose**: Video conferencing for mentorship sessions
- **Integration**: Public Jitsi URLs without API key
- **URL Format**: `https://meet.jit.si/seniorconnect-session-{bookingId}`
- **Status**: Implemented and functional
- **Limitations**: No customization, no recording features

## Constraints

### Do Not Change Without Approval
- Senior profile data model structure
- Session booking business logic
- Jitsi URL generation format
- Role-based access control (mentor vs mentee)
- User ownership validation for sessions
- Database model relationships

### Safe Changes
- UI improvements and styling
- Profile field additions (optional fields)
- Availability slot UI enhancements
- Feedback form improvements
- Session list filtering and sorting

## Testing Requirements

### Before Marking TODO as Complete
- Test senior profile creation and updates
- Test availability slot CRUD operations
- Test session booking with conflict detection
- Test Jitsi URL generation and access
- Test user ownership validation
- Test feedback submission and retrieval
- Test session cancellation logic

### Integration Testing
- Test mentorship flow from discovery to session completion
- Test authentication across all endpoints
- Test concurrent session booking (no double-booking)
- Test feedback submission by junior users only
- Test senior profile visibility to junior users

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
- Basic Senior Connect API routes
- Prisma data models for profiles, availability, sessions, feedback
- JWT authentication integration
- React frontend pages for mentor discovery, booking, and sessions
- Jitsi URL generation for video sessions
- User ownership validation

### In Progress
- Profile editing enhancements
- Availability management UI improvements
- Session history and analytics

### Not Started
- Session recording integration
- Advanced scheduling features
- Mentorship program management
- Payment integration for paid sessions

## Known Issues

### Jitsi Integration
- Using public Jitsi without authentication
- No session recording capability
- Limited customization options
- No analytics from Jitsi calls

### Availability System
- Basic day-of-week slots only
- No date-specific availability
- No timezone handling
- Limited conflict detection

## Development Guidelines

### Adding New Profile Fields
1. Update Prisma schema in `apps/api/prisma/schema.prisma`
2. Generate and run migration: `npx prisma migrate dev`
3. Update API routes to handle new fields
4. Update frontend forms to include new fields
5. Update validation logic
6. Test profile CRUD operations with new fields

### Modifying Session Booking Logic
1. **Requires approval** for business logic changes
2. Test conflict detection thoroughly
3. Ensure time slot availability is updated correctly
4. Verify Jitsi URL generation for new sessions
5. Test cancellation and rescheduling flows

### Enhancing Availability System
1. Consider timezone support if adding date-specific slots
2. Update conflict detection logic for new slot types
3. Ensure frontend UI handles new slot formats
4. Test edge cases (overlapping slots, etc.)

## Integration Points

### Shared Authentication
- Uses `packages/shared/src/auth/jwt.js` for token operations
- Uses `apps/api/src/middleware/auth.middleware.js` for route protection
- Follows shared User model with `isAlumniMentor` capability
- Distinguishes between mentors (seniors) and mentees (juniors)

### Dashboard Integration
- Senior mentorship statistics should appear in dashboard
- Upcoming sessions should be accessible from dashboard
- Mentor profile management should be accessible from dashboard

### User Model
- Senior profiles are linked to User model via `userId`
- `isAlumniMentor` field in User model determines mentor status
- Session bookings reference both senior and junior users

## Performance Considerations

### Database Optimization
- Add indexes on frequently queried fields (seniorId, juniorId, status)
- Consider pagination for senior profile listings
- Optimize date range queries for availability
- Add composite indexes for session queries

### Frontend Optimization
- Lazy load senior profile cards
- Debounce availability slot updates
- Optimize session list rendering with virtualization
- Cache senior profile data where appropriate

## Security Considerations

### Access Control
- Mentors can only manage their own profiles and availability
- Juniors can only book sessions, not modify them
- Users can only access their own session history
- Feedback can only be submitted by session participants

### Data Validation
- Validate session times (start < end, no overlaps)
- Validate feedback ratings (1-5 range)
- Sanitize profile bio and notes to prevent XSS
- Validate external URLs (LinkedIn, GitHub)

### Privacy Considerations
- Senior contact information should be protected
- Session notes and feedback are private
- Jitsi URLs should be unique and hard to guess

## Migration Notes

### From Legacy Senior Connect
- **Original**: MongoDB/Mongoose with junior/senior role enum
- **Target**: PostgreSQL/Prisma with User model + isAlumniMentor
- **Key Changes**:
  - Role enum → User model with alumni mentor capability
  - Document structure → relational model with proper relations
  - Different field naming conventions
  - Jitsi integration preserved but refactored

### Preserved Legacy Features
- Jitsi Meet video conferencing
- Mentor profile and expertise tracking
- Session booking and management
- Feedback collection system

### Modified Legacy Features
- Role system unified with CareerHub authentication
- Database structure changed from MongoDB to PostgreSQL
- API routes refactored to Express.js

## Feature-Specific TODO Reference
See `docs/progress/senior-connect-todo.md` for detailed implementation tasks.

## Common Pitfalls

### Session Booking Conflicts
- Always check for existing bookings before creating new ones
- Handle timezone differences properly
- Test edge cases (back-to-back sessions, overlapping sessions)
- Ensure availability slots are marked unavailable after booking

### User Role Confusion
- Distinguish between senior profiles and regular users
- Ensure mentors can't book sessions with themselves
- Validate that only mentors can create availability slots
- Test role-based access controls thoroughly

### Jitsi URL Generation
- Ensure booking IDs are unique and unguessable
- Test URL accessibility before user session
- Handle Jitsi service failures gracefully
- Consider backup video conferencing options

### Data Consistency
- Cascade deletes for users should clean up profiles and sessions
- Session cancellation should update availability slots
- Profile updates should reflect in existing sessions
- Feedback should be linked to valid sessions only