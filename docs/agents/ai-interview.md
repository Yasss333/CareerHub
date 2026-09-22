# AI Interview Module Agent Instructions

## Module Purpose
The AI Interview module provides automated mock interviews with AI-generated questions, real-time emotion analysis (facial, voice, text), behavioral metrics, face verification, and proctoring. It helps users practice interview skills with multimodal feedback.

## Current Architecture

### Legacy Architecture (Reference)
- **Frontend**: React 18 + TypeScript + Supabase client
- **Backend**: Supabase Auth + database + Edge Functions
- **ML Service**: FastAPI Python service for emotion analysis
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth

### Target Architecture (CareerHub)
- **Frontend**: React 18 + TypeScript (integrated into shared frontend)
- **Backend**: Express.js + Prisma (replacing Supabase)
- **ML Service**: FastAPI Python service (preserved, secured)
- **Database**: PostgreSQL via Prisma (unified)
- **Authentication**: CareerHub JWT (replacing Supabase Auth)

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Server**: Express.js
- **Database**: PostgreSQL (Prisma)
- **Authentication**: JWT + bcrypt
- **ML Integration**: FastAPI microservice on port 8000
- **AI Generation**: OpenRouter API (planned)

### Frontend
- **UI Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Camera/Mic**: WebRTC APIs

### ML Service
- **Framework**: FastAPI (Python)
- **Models**: Facial emotion, voice emotion, text emotion, fusion engine
- **Face Verification**: Face recognition model
- **Proctoring**: Behavioral analysis and event tracking

## File Paths

### Legacy Reference Files
- `legacy/ai-mock-interview-platform/` - Complete legacy implementation
- `legacy/ai-mock-interview-platform/supabase/functions/generate-interview/index.ts` - Question generation
- `legacy/ai-mock-interview-platform/supabase/functions/evaluate-interview/index.ts` - Answer evaluation
- `legacy/ai-mock-interview-platform/ml-service/server.py` - ML service endpoints
- `legacy/ai-mock-interview-platform/ml-service/models/` - ML model files

### Target Backend Files (To Be Created)
- `apps/api/src/routes/interview.routes.js` - Interview API endpoints
- `apps/api/src/services/interview.service.js` - Interview business logic
- `apps/api/src/services/ml-proxy.service.js` - ML service proxy
- `apps/api/prisma/schema.prisma` - Interview data models (extensions)

### Target Frontend Files (To Be Created)
- `apps/web/src/pages/Interview.tsx` - Main interview page
- `apps/web/src/pages/InterviewSetup.tsx` - Interview configuration
- `apps/web/src/pages/InterviewSession.tsx` - Active interview session
- `apps/web/src/pages/InterviewResults.tsx` - Interview feedback/results
- `apps/web/src/components/CameraCapture.tsx` - Camera component
- `apps/web/src/components/AudioRecorder.tsx` - Audio recording component

### Database Models (To Be Extended)
- `InterviewSession` model in `apps/api/prisma/schema.prisma`
- `InterviewQuestion` model in `apps/api/prisma/schema.prisma`
- Additional models for emotion analysis, proctoring, face verification

## Database Models (Current Schema)

### InterviewSession Model (Current - Needs Extension)
```prisma
model InterviewSession {
  id              String   @id @default(uuid())
  userId          String
  type            String   @default("custom")
  topics          String[]
  role            String?
  experienceLevel String?
  plannedDuration Int      @default(30)
  cameraEnabled   Boolean  @default(false)
  status          String   @default("in_progress")
  startedAt       DateTime @default(now())
  endedAt         DateTime?
  durationSeconds Int?
  feedback        Json?

  user      User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  questions InterviewQuestion[]
  createdAt DateTime           @default(now())
}
```

### InterviewQuestion Model (Current - Needs Extension)
```prisma
model InterviewQuestion {
  id               String   @id @default(uuid())
  sessionId        String
  questionText     String
  questionIndex    Int
  category         String?
  answerText       String?
  answeredAt       DateTime?
  questionFeedback Json?

  session   InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  createdAt DateTime          @default(now())
}
```

### Additional Models Needed (Not Yet Implemented)
- `EmotionResult` - Facial, voice, text emotion analysis results
- `ProctoringEvent` - Proctoring alerts and events
- `FaceVerification` - Face verification events and results
- `BehavioralMetric` - Eye contact, speaking patterns, etc.

## API Routes (To Be Created)

### Interview Management
- `POST /api/interview/sessions` - Create new interview session
- `GET /api/interview/sessions` - Get user's interview sessions
- `GET /api/interview/sessions/:id` - Get specific session details
- `PUT /api/interview/sessions/:id` - Update session status
- `DELETE /api/interview/sessions/:id` - Delete session

### Question Management
- `POST /api/interview/questions/generate` - Generate AI questions
- `GET /api/interview/questions/:sessionId` - Get questions for session
- `POST /api/interview/questions/:id/answer` - Submit answer to question

### Evaluation & Feedback
- `POST /api/interview/evaluate` - Evaluate interview performance
- `GET /api/interview/feedback/:sessionId` - Get session feedback
- `POST /api/interview/analyze-emotion` - Trigger emotion analysis via ML service

### ML Service Proxy
- `POST /api/interview/ml/face` - Proxy to ML face emotion endpoint
- `POST /api/interview/ml/voice` - Proxy to ML voice emotion endpoint
- `POST /api/interview/ml/text` - Proxy to ML text emotion endpoint
- `POST /api/interview/ml/fusion` - Proxy to ML fusion endpoint
- `POST /api/interview/ml/verify-face` - Proxy to face verification endpoint

### Request/Response Formats
All routes require JWT authentication via `Authorization: Bearer <token>` header.

### Error Handling
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - Session or question doesn't exist
- `400 Bad Request` - Invalid interview configuration
- `500 Internal Server Error` - ML service or database error
- `503 Service Unavailable` - ML service not responding

## Frontend Routes (To Be Created)
- `/interview` - Interview main page and session list
- `/interview/setup` - Interview configuration page
- `/interview/session/:id` - Active interview session page
- `/interview/results/:id` - Interview results and feedback page
- All routes protected and require authentication

## External Integrations

### ML Service (FastAPI)
- **Purpose**: Multimodal emotion analysis and proctoring
- **Service**: FastAPI Python microservice
- **URL**: `http://localhost:8000` (local development)
- **Status**: Available in legacy, needs integration and security hardening
- **Endpoints**:
  - `POST /predict/face` - Facial emotion analysis
  - `POST /predict/voice` - Voice emotion analysis
  - `POST /predict/text` - Text emotion analysis
  - `POST /fusion` - Multimodal fusion
  - `POST /verify-face` - Face verification (needs verification of implementation)

### OpenRouter API (Planned)
- **Purpose**: AI question generation and answer evaluation
- **Status**: To be integrated on backend
- **Security**: API keys must be stored in environment variables
- **Model**: To be selected based on requirements and cost

### WebRTC APIs
- **Purpose**: Camera and microphone access for emotion analysis
- **Status**: Browser native APIs, requires user permission
- **Privacy**: Requires explicit user consent and secure handling

## Constraints

### Do Not Change Without Approval
- ML service integration contract and API structure
- Privacy and consent handling for biometric data
- Face verification and proctoring logic
- Database schema structure for interview data
- Authentication migration from Supabase to JWT
- AI evaluation and generation logic

### Safe Changes
- UI improvements and styling
- Interview configuration options
- Feedback display enhancements
- Session history and analytics improvements
- Frontend state management improvements

## Testing Requirements

### Before Marking TODO as Complete
- Test interview session creation and management
- Test AI question generation via backend
- Test answer evaluation and feedback generation
- Test ML service integration (face, voice, text analysis)
- Test face verification functionality
- Test proctoring event tracking
- Test emotion analysis data storage
- Test authentication migration from Supabase to JWT
- Test camera and microphone permissions
- Test error handling for ML service failures

### Integration Testing
- Test end-to-end interview flow from setup to results
- Test multimodal emotion analysis accuracy
- Test face verification under different conditions
- Test proctoring event detection
- Test data privacy and consent handling
- Test ML service timeout and failure recovery

## Dependencies

### Backend Dependencies
- `express` - Web framework
- `prisma` - Database ORM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation/validation
- `cors` - CORS middleware
- `axios` - HTTP client for ML service and OpenRouter API (to be added)
- `multer` - File upload handling for face verification (to be added)

### Frontend Dependencies
- `react` - UI framework
- `react-router-dom` - Client-side routing
- `lucide-react` - Icon library
- `@tailwindcss/vite` - Tailwind CSS integration
- WebRTC native APIs (no external dependency)

### ML Service Dependencies
- `fastapi` - Python web framework
- `uvicorn` - ASGI server
- ML model dependencies (see legacy requirements)

## Current Implementation Status

### Completed
- Basic Prisma schema for InterviewSession and InterviewQuestion
- JWT authentication integration (shared)
- Basic frontend structure (shared)

### In Progress
- Complete assessment of legacy implementation
- Documentation of integration requirements

### Not Started
- Express API routes for interview management
- ML service proxy and integration
- AI question generation and evaluation
- Extended Prisma schema for emotion/proctoring data
- Frontend pages for interview workflow
- Camera and microphone components
- Privacy and consent handling
- Face verification implementation
- OpenRouter API integration

## Known Issues

### Authentication Migration
- Legacy uses Supabase Auth, needs migration to CareerHub JWT
- User context and session management needs adaptation
- Authentication middleware needs integration

### ML Service Security
- Legacy ML service is development-grade, needs security hardening
- No authentication between API and ML service
- Face embeddings held in memory only (persistence needed)
- No rate limiting or abuse prevention

### Data Privacy
- Biometric data handling policies not defined
- Consent management system not implemented
- Data retention policies not established
- Encryption for sensitive data not implemented

### Schema Completeness
- Current schema lacks emotion analysis models
- Proctoring event tracking not modeled
- Face verification data structure not defined
- Behavioral metrics storage not designed

## Development Guidelines

### Extending Prisma Schema
1. **Requires approval** for schema changes
2. Add models for EmotionResult, ProctoringEvent, FaceVerification, BehavioralMetric
3. Define proper relations with InterviewSession and InterviewQuestion
4. Generate and test migration: `npx prisma migrate dev`
5. Ensure backward compatibility with existing data

### Implementing ML Service Proxy
1. Create `apps/api/src/services/ml-proxy.service.js`
2. Implement authentication between API and ML service
3. Add proper error handling and timeout management
4. Implement retry logic for ML service failures
5. Add rate limiting to prevent abuse
6. Test all ML endpoints thoroughly

### Migrating Supabase Edge Functions
1. Convert Supabase Edge Functions to Express routes
2. Replace Supabase client calls with Prisma queries
3. Update authentication from Supabase Auth to JWT
4. Adapt environment variables and configuration
5. Test function behavior matches legacy implementation

### Frontend Camera/Mic Integration
1. Implement WebRTC API access with proper error handling
2. Add user consent dialogs and permission handling
3. Implement real-time preview for camera
4. Add audio level visualization for microphone
5. Handle permission denials gracefully

## Integration Points

### Shared Authentication
- Must replace Supabase Auth with CareerHub JWT
- Use `packages/shared/src/auth/jwt.js` for token operations
- Use `apps/api/src/middleware/auth.middleware.js` for route protection
- Follow shared User model and role system

### Dashboard Integration
- Interview statistics should appear in dashboard
- Recent interview sessions should be accessible from dashboard
- Performance trends and improvements should be tracked
- Interview recommendations should be provided

### ML Service Integration
- ML service runs as separate Python process on port 8000
- API acts as secure proxy to ML service
- All ML requests must go through Express API
- ML service must be secured with authentication in production

## Performance Considerations

### Database Optimization
- Add indexes on frequently queried fields (userId, status, createdAt)
- Consider partitioning for large interview session tables
- Optimize JSON field queries for emotion data
- Implement data archival for old sessions

### ML Service Optimization
- Implement request queuing for ML service calls
- Add caching for repeated emotion analysis
- Optimize model loading and inference time
- Monitor ML service resource usage

### Frontend Optimization
- Optimize camera capture performance
- Implement efficient audio processing
- Lazy load interview history
- Optimize real-time emotion analysis display

## Security Considerations

### Biometric Data Security
- Implement proper consent management before capture
- Encrypt biometric data at rest
- Secure transmission of biometric data to ML service
- Implement data retention policies
- Provide data deletion capabilities

### ML Service Security
- Add authentication between API and ML service
- Implement rate limiting to prevent abuse
- Sanitize inputs to ML service
- Monitor for malicious inputs
- Implement request size limits

### Privacy Considerations
- Explicit user consent for camera/microphone access
- Clear data usage policies
- Secure storage of interview recordings
- Provide privacy controls for users
- Compliance with data protection regulations

## Migration Notes

### From Legacy AI Interview
- **Original**: Supabase Auth + database + Edge Functions + FastAPI ML
- **Target**: CareerHub JWT + Prisma + Express + FastAPI ML (secured)
- **Key Changes**:
  - Authentication: Supabase Auth → CareerHub JWT
  - Database: Supabase direct access → Prisma/PostgreSQL
  - Backend: Edge Functions → Express routes
  - ML Service: Development-grade → Production-ready with security
  - Frontend: Standalone → Integrated into shared CareerHub frontend

### Preserved Legacy Features
- AI question generation
- AI answer evaluation
- Multimodal emotion analysis (face, voice, text)
- Fusion engine for combined analysis
- Face verification
- Proctoring event tracking
- Behavioral metrics

### Modified Legacy Features
- Authentication system completely replaced
- Database access layer changed from Supabase to Prisma
- Backend architecture changed from Edge Functions to Express
- Frontend integrated into shared application

### Complex Migration Points
- Supabase Edge Functions need complete rewrite as Express routes
- AI generation/evaluation logic needs OpenRouter integration
- ML service needs security hardening and authentication
- Frontend needs to replace Supabase client with CareerHub API calls
- Schema needs significant extension for emotion/proctoring data

## Feature-Specific TODO Reference
See `docs/progress/ai-interview-todo.md` for detailed implementation tasks.

## Common Pitfalls

### ML Service Integration
- ML service must be running locally for development
- ML service timeouts can break interview flow
- Face embeddings are memory-only in legacy (persistence needed)
- ML service error handling must be robust

### Biometric Data Handling
- User consent must be obtained before camera/mic access
- Biometric data must be encrypted at rest
- Data retention policies must be implemented
- Users must be able to delete their biometric data

### Authentication Migration
- Supabase Auth tokens cannot be used with new system
- User sessions need to be migrated or recreated
- Authentication context needs to be updated throughout
- Edge functions must be completely rewritten

### Schema Complexity
- Emotion analysis data can be complex and nested
- Proctoring events can be high-volume
- Face verification data needs proper indexing
- JSON fields need careful validation and querying

### Frontend Complexity
- Camera and microphone access requires proper permissions
- Real-time emotion analysis needs efficient updates
- Interview session state management is complex
- Error handling for ML service failures is critical