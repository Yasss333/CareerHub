# AlgoRank Module Agent Instructions

## Module Purpose
AlgoRank is a coding practice platform that allows users to solve DSA problems, submit code solutions, track progress, and compete with others. It includes problem sets, code execution via Piston, and community features like comments and likes.

## Current Architecture

### Backend
- **Framework**: Express.js with JWT authentication
- **Database**: PostgreSQL via Prisma ORM
- **Code Execution**: Piston API integration
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
- **Code Execution**: Piston API (external service)

### Frontend
- **UI Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Code Editor**: Monaco Editor or similar (to be integrated)

## File Paths

### Backend Files
- `apps/api/src/routes/algorank.routes.js` - AlgoRank API endpoints (to be created)
- `apps/api/prisma/schema.prisma` - AlgoRank data models
- `apps/api/src/middleware/auth.middleware.js` - JWT authentication middleware
- `apps/api/src/libs/piston.js` - Piston integration library (to be created)

### Frontend Files
- `apps/web/src/pages/AlgoRank.tsx` - Main AlgoRank page (to be created)
- `apps/web/src/pages/ProblemDetail.tsx` - Individual problem page (to be created)
- `apps/web/src/pages/ProblemEditor.tsx` - Code editor page (to be created)
- `apps/web/src/components/Layout.tsx` - Shared layout component
- `apps/web/src/components/ProtectedRoute.tsx` - Route protection wrapper

### Legacy Reference
- `legacy/AlgoRank/backend/src/libs/pistonlibs.js` - Piston integration reference
- `legacy/AlgoRank/backend/src/models/` - Legacy model definitions

### Database Models
- `Problem` model in `apps/api/prisma/schema.prisma`
- `Submission` model in `apps/api/prisma/schema.prisma`
- `Playlist` model in `apps/api/prisma/schema.prisma`
- `Comment` model in `apps/api/prisma/schema.prisma`
- `Like` model in `apps/api/prisma/schema.prisma`

## Database Models

### Problem Model
```prisma
model Problem {
  id          String   @id @default(uuid())
  title       String
  description String
  difficulty  String   @default("medium")
  tags        String[]
  examples    Json?
  constraints String?
  timeLimit   Int      @default(1)
  memoryLimit Int      @default(256)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  submissions Submission[]
  playlists   Playlist[]
  comments    Comment[]
  likes       Like[]
}
```

### Submission Model
```prisma
model Submission {
  id          String   @id @default(uuid())
  problemId   String
  userId      String
  code        String
  language    String
  status      String   @default("pending")
  runtime     Int?
  memory      Int?
  createdAt   DateTime @default(now())

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Playlist Model
```prisma
model Playlist {
  id          String   @id @default(uuid())
  name        String
  description String?
  problemIds  String[]
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  problems Problem[]
}
```

### Comment Model
```prisma
model Comment {
  id        String   @id @default(uuid())
  problemId String
  userId    String
  content   String
  createdAt DateTime @default(now())

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Like Model
```prisma
model Like {
  id        String   @id @default(uuid())
  problemId String
  userId    String
  createdAt DateTime @default(now())

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## API Routes

### Problem Management
- `GET /api/algorank/problems` - Get all problems (with pagination/filtering)
- `GET /api/algorank/problems/:id` - Get specific problem details
- `POST /api/algorank/problems` - Create new problem (admin only)
- `PUT /api/algorank/problems/:id` - Update problem (admin only)
- `DELETE /api/algorank/problems/:id` - Delete problem (admin only)

### Submission Management
- `POST /api/algorank/submissions` - Submit code solution
- `GET /api/algorank/submissions` - Get user's submissions
- `GET /api/algorank/submissions/:id` - Get specific submission details
- `GET /api/algorank/problems/:id/submissions` - Get submissions for a problem

### Playlist Management
- `GET /api/algorank/playlists` - Get user's playlists
- `POST /api/algorank/playlists` - Create new playlist
- `PUT /api/algorank/playlists/:id` - Update playlist
- `DELETE /api/algorank/playlists/:id` - Delete playlist

### Community Features
- `POST /api/algorank/comments` - Add comment to problem
- `GET /api/algorank/comments/:problemId` - Get comments for problem
- `POST /api/algorank/likes` - Like/unlike problem
- `GET /api/algorank/likes/:problemId` - Get like count for problem

### Code Execution
- `POST /api/algorank/execute` - Execute code via Piston API

### Request/Response Formats
Most routes require JWT authentication via `Authorization: Bearer <token>` header.
Problem viewing may be public for non-authenticated users.

### Error Handling
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User doesn't have permission (admin-only operations)
- `404 Not Found` - Resource doesn't exist
- `400 Bad Request` - Invalid code execution request
- `500 Internal Server Error` - Database or Piston API error

## Frontend Routes
- `/algorank` - Main AlgoRank page (problem list)
- `/algorank/problems/:id` - Individual problem detail page
- `/algorank/problems/:id/solve` - Code editor and submission page
- `/algorank/playlists` - User's playlists page
- `/algorank/submissions` - User's submission history
- Most routes are protected and require authentication

## External Integrations

### Piston API
- **Purpose**: Execute user code in various languages
- **Service**: Piston code execution engine
- **URL**: `http://localhost:2000/api/v2/execute` (local development)
- **Status**: Integration identified from legacy, needs implementation
- **Supported Languages**: Python, JavaScript, C++, Java (from legacy)

### Legacy Piston Integration
- Reference implementation in `legacy/AlgoRank/backend/src/libs/pistonlibs.js`
- Default configuration and language mappings available

## Constraints

### Do Not Change Without Approval
- Problem data model structure
- Submission evaluation logic
- Piston API integration contract
- Code execution timeout and resource limits
- Authentication and authorization requirements
- Database model relationships

### Safe Changes
- UI improvements and styling
- Problem filtering and sorting options
- Playlist management enhancements
- Comment and like UI improvements
- Submission history display improvements

## Testing Requirements

### Before Marking TODO as Complete
- Test problem CRUD operations (for admin users)
- Test code submission and execution via Piston
- Test submission status tracking (pending, accepted, rejected)
- Test playlist creation and management
- Test comment and like functionality
- Test user ownership validation
- Test Piston API error handling

### Integration Testing
- Test end-to-end flow from problem viewing to code submission
- Test code execution with different languages
- Test Piston API timeout and error handling
- Test concurrent submission handling
- Test database operations for submissions and playlists

## Dependencies

### Backend Dependencies
- `express` - Web framework
- `prisma` - Database ORM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation/validation
- `cors` - CORS middleware
- `axios` - HTTP client for Piston API (to be added)

### Frontend Dependencies
- `react` - UI framework
- `react-router-dom` - Client-side routing
- `lucide-react` - Icon library
- `@tailwindcss/vite` - Tailwind CSS integration
- `@monaco-editor/react` - Monaco React wrapper (to be added)

## Current Implementation Status

### Completed
- Prisma data models for problems, submissions, playlists, comments, likes
- JWT authentication integration (shared)
- Basic frontend structure (shared)

### In Progress
- AlgoRank API routes implementation
- Piston API integration
- Frontend pages for problem solving

### Not Started
- Code editor integration (Monaco Editor)
- Problem creation UI (admin)
- Advanced submission analysis
- Leaderboard functionality
- Code execution result visualization

## Known Issues

### Piston Integration
- Integration not yet implemented in new codebase
- Legacy reference exists but needs adaptation
- Error handling for Piston failures needs definition
- Code execution resource limits need configuration

### Code Editor
- Monaco Editor integration not yet started
- Syntax highlighting and autocomplete needed
- Multiple language support needed
- Code execution preview needed

### Problem Data
- No initial problem set imported
- Problem import system not defined
- Problem difficulty classification not standardized

## Development Guidelines

### Adding New Problems
1. Use admin API endpoint or direct database insertion
2. Ensure proper test cases are defined
3. Validate difficulty and tags
4. Test code execution with sample solutions
5. Update problem documentation

### Implementing Piston Integration
1. Create `apps/api/src/libs/piston.js` based on legacy implementation
2. Configure supported languages and versions
3. Implement code execution with timeout handling
4. Add error handling for Piston API failures
5. Test with multiple languages and code samples

### Adding Code Editor
1. Integrate Monaco Editor or similar
2. Configure syntax highlighting for supported languages
3. Add code execution preview panel
4. Implement submission interface
5. Add keyboard shortcuts and editor preferences

## Integration Points

### Shared Authentication
- Uses `packages/shared/src/auth/jwt.js` for token operations
- Uses `apps/api/src/middleware/auth.middleware.js` for route protection
- Follows shared User model and role system
- Admin-only operations require ADMIN role

### Dashboard Integration
- Problem solving statistics should appear in dashboard
- Recent submissions should be accessible from dashboard
- User's playlists should be accessible from dashboard
- Problem-solving streaks or achievements should be tracked

### Legacy Reference
- `legacy/AlgoRank` contains the original implementation
- Piston integration logic exists in legacy code
- Problem data structure can be referenced from legacy models

## Performance Considerations

### Database Optimization
- Add indexes on frequently queried fields (userId, problemId, status)
- Consider pagination for problem listings
- Optimize submission history queries
- Add composite indexes for user-problem queries

### Piston Optimization
- Implement caching for repeated code executions
- Set appropriate timeouts to prevent resource exhaustion
- Queue concurrent submissions to avoid Piston overload
- Monitor Piston service health and availability

### Frontend Optimization
- Lazy load problem cards
- Optimize code editor performance for large files
- Debounce auto-save functionality
- Implement virtual scrolling for long submission lists

## Security Considerations

### Code Execution Security
- Validate code before sending to Piston
- Set strict resource limits (time, memory)
- Sanitize problem descriptions and examples
- Prevent malicious code execution attempts

### Access Control
- Admin-only operations for problem management
- Users can only access their own submissions
- Playlist ownership validation
- Comment and like authentication requirements

### Data Validation
- Validate code size limits
- Sanitize user input in comments
- Validate language selection
- Prevent SQL injection in database queries

## Migration Notes

### From Legacy AlgoRank
- **Original**: Prisma/PostgreSQL with similar structure
- **Target**: PostgreSQL/Prisma with updated schema
- **Key Changes**:
  - Database structure largely preserved
  - API routes being refactored to Express.js
  - Authentication unified with CareerHub JWT
  - Piston integration adapted from legacy

### Preserved Legacy Features
- Problem submission and execution
- Piston API integration
- Playlist management
- Community features (comments, likes)

### Modified Legacy Features
- Authentication system unified with CareerHub
- API routes refactored to Express.js
- Frontend being rebuilt with React 18 + TypeScript

## Feature-Specific TODO Reference
See `docs/progress/algorank-todo.md` for detailed implementation tasks.

## Common Pitfalls

### Piston Integration
- Piston service must be running locally for development
- Code execution timeouts must be handled gracefully
- Language versions must match between legacy and new implementation
- Error responses from Piston need proper parsing

### Code Editor
- Monaco Editor can be resource-intensive
- Multiple language support requires proper configuration
- Code execution preview needs to handle long-running processes
- File size limits for code submissions

### Problem Data
- Test cases must be comprehensive and accurate
- Problem difficulty classification needs consistency
- Time and memory limits must be realistic
- Problem descriptions must be clear and unambiguous

### Submission Tracking
- Concurrent submissions need proper queuing
- Submission status updates must be atomic
- User submissions must be isolated and private
- Submission history can grow large (pagination needed)