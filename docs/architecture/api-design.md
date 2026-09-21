# CareerHub API Design

## Overview
This document describes the API design conventions, authentication patterns, error handling, and module boundaries for the CareerHub platform.

## API Architecture

### Technology Stack
- **Framework**: Express.js
- **Runtime**: Node.js
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: Custom JWT implementation
- **Documentation**: OpenAPI/Swagger (to be implemented)

### Server Configuration
- **Development Port**: 5000
- **Base URL**: `http://localhost:5000/api`
- **CORS**: Configured for frontend on `http://localhost:5173`

## Authentication

### JWT Implementation
- **Library**: `jsonwebtoken`
- **Token Type**: Bearer tokens
- **Expiration**: Configurable (default: 24 hours)
- **Secret**: Environment variable `JWT_SECRET`

### Authentication Flow
1. User registers via `/api/auth/register`
2. User logs in via `/api/auth/login`
3. Server returns JWT token
4. Client includes token in `Authorization: Bearer <token>` header
5. Middleware validates token on protected routes

### Authentication Middleware
- **Location**: `apps/api/src/middleware/auth.middleware.js`
- **Protected Routes**: All module-specific routes require authentication
- **Role-Based Access**: ADMIN role for admin-only operations

### Endpoints

#### Public Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification (optional)

#### Protected Endpoints
All other endpoints require valid JWT token in Authorization header.

## API Conventions

### Request Format
- **Content-Type**: `application/json`
- **Body**: JSON object with relevant fields
- **Query Parameters**: For filtering, pagination, sorting

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "error": null
}
```

### Error Response Format
```json
{
  "success": false,
  "data": null,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### HTTP Status Codes
- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate)
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service unavailable (e.g., ML service down)

## Module API Boundaries

### Authentication Module
- **Base Path**: `/api/auth`
- **Purpose**: User authentication and token management
- **Routes**:
  - `POST /register` - Create new user account
  - `POST /login` - Authenticate user and return token
  - `GET /verify` - Verify token validity

### Resume Builder Module
- **Base Path**: `/api/resumes`
- **Purpose**: Resume CRUD operations
- **Routes**:
  - `GET /` - Get user's resumes
  - `GET /:id` - Get specific resume
  - `POST /` - Create new resume
  - `PUT /:id` - Update resume
  - `DELETE /:id` - Delete resume

### Senior Connect Module
- **Base Path**: `/api/connect`
- **Purpose**: Mentorship platform operations
- **Routes**:
  - `GET /seniors` - Get available mentors
  - `GET /seniors/:id` - Get specific mentor profile
  - `POST /profile` - Create/update mentor profile
  - `PUT /profile` - Update mentor profile
  - `GET /availability/:seniorId` - Get mentor availability
  - `POST /availability` - Create availability slot
  - `PUT /availability/:id` - Update availability slot
  - `DELETE /availability/:id` - Delete availability slot
  - `GET /sessions` - Get user's sessions
  - `POST /sessions` - Book new session
  - `PUT /sessions/:id` - Update session
  - `DELETE /sessions/:id` - Cancel session
  - `POST /feedback` - Submit session feedback
  - `GET /feedback/:seniorId` - Get mentor's feedback

### AlgoRank Module
- **Base Path**: `/api/algorank`
- **Purpose**: Coding practice platform
- **Routes**:
  - `GET /problems` - Get problems (with pagination/filtering)
  - `GET /problems/:id` - Get specific problem
  - `POST /problems` - Create problem (admin only)
  - `PUT /problems/:id` - Update problem (admin only)
  - `DELETE /problems/:id` - Delete problem (admin only)
  - `POST /submissions` - Submit code solution
  - `GET /submissions` - Get user's submissions
  - `GET /submissions/:id` - Get specific submission
  - `GET /problems/:id/submissions` - Get problem submissions
  - `GET /playlists` - Get user's playlists
  - `POST /playlists` - Create playlist
  - `PUT /playlists/:id` - Update playlist
  - `DELETE /playlists/:id` - Delete playlist
  - `POST /comments` - Add comment
  - `GET /comments/:problemId` - Get problem comments
  - `POST /likes` - Like/unlike problem
  - `GET /likes/:problemId` - Get like count
  - `POST /execute` - Execute code via Piston

### AI Interview Module
- **Base Path**: `/api/interview`
- **Purpose**: AI mock interviews with emotion analysis
- **Routes**:
  - `POST /sessions` - Create interview session
  - `GET /sessions` - Get user's sessions
  - `GET /sessions/:id` - Get specific session
  - `PUT /sessions/:id` - Update session
  - `DELETE /sessions/:id` - Delete session
  - `POST /questions/generate` - Generate AI questions
  - `GET /questions/:sessionId` - Get session questions
  - `POST /questions/:id/answer` - Submit answer
  - `POST /evaluate` - Evaluate interview
  - `GET /feedback/:sessionId` - Get session feedback
  - `POST /analyze-emotion` - Trigger emotion analysis
  - `POST /ml/face` - Proxy to ML face analysis
  - `POST /ml/voice` - Proxy to ML voice analysis
  - `POST /ml/text` - Proxy to ML text analysis
  - `POST /ml/fusion` - Proxy to ML fusion
  - `POST /ml/verify-face` - Proxy to face verification

## Error Handling

### Global Error Handler
- **Location**: `apps/api/src/middleware/error.middleware.js` (to be created)
- **Purpose**: Centralized error handling and logging
- **Behavior**: Catches all errors and returns consistent error responses

### Validation Errors
- **Library**: `express-validator` or custom validation
- **Status**: 400 Bad Request
- **Response**: Detailed validation error messages

### Database Errors
- **Handling**: Prisma error mapping to HTTP status codes
- **Logging**: Database errors logged with context
- **Response**: Generic error message to client, detailed in logs

### Authentication Errors
- **Status**: 401 Unauthorized
- **Response**: "Invalid or missing authentication token"
- **Logging**: Failed authentication attempts logged

### Authorization Errors
- **Status**: 403 Forbidden
- **Response**: "Insufficient permissions for this operation"
- **Logging**: Unauthorized access attempts logged

## Pagination

### Standard Pagination Format
- **Query Parameters**:
  - `page` - Page number (default: 1)
  - `limit` - Items per page (default: 10)
  - `sort` - Sort field (optional)
  - `order` - Sort order: `asc` or `desc` (default: `asc`)

### Response Format
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

## Filtering and Search

### Standard Filter Format
- **Query Parameters**: Module-specific filter parameters
- **Example**: `?difficulty=medium&tags=array,sorting`
- **Response**: Filtered results with pagination

### Search Format
- **Query Parameter**: `q` for full-text search
- **Example**: `?q=dynamic+programming`
- **Response**: Search results with relevance scoring

## Rate Limiting

### Implementation
- **Library**: `express-rate-limit` (to be implemented)
- **Purpose**: Prevent API abuse
- **Configuration**: Different limits per endpoint type

### Rate Limits
- **Authentication**: 10 requests per minute
- **General API**: 100 requests per minute
- **Code Execution**: 20 requests per minute
- **ML Service**: 30 requests per minute

## Logging

### Implementation
- **Library**: `winston` or `morgan` (to be implemented)
- **Purpose**: Request logging and error tracking
- **Format**: Structured JSON logs

### Log Levels
- **error**: Critical errors
- **warn**: Warning messages
- **info**: General information
- **debug**: Debug information (development only)

## Security Considerations

### Input Validation
- All inputs validated on both client and server
- SQL injection prevention via parameterized queries
- XSS prevention via input sanitization

### CORS Configuration
- Origin whitelist for production
- Credential support for authentication
- Preflight request handling

### Security Headers
- Helmet.js for security headers (to be implemented)
- Content Security Policy (CSP)
- X-Frame-Options, X-Content-Type-Options

### Data Encryption
- Passwords hashed with bcrypt
- Sensitive data encrypted at rest (future)
- HTTPS required in production

## API Versioning

### Current Version
- **Version**: v1
- **Path**: `/api/v1/` (to be implemented)
- **Backward Compatibility**: Maintained for minor versions

### Versioning Strategy
- URL path versioning
- Deprecation notices for old versions
- Graceful migration periods

## API Documentation

### Documentation Format
- **Tool**: Swagger/OpenAPI (to be implemented)
- **Location**: `/api-docs` endpoint
- **Format**: Interactive API documentation

### Documentation Content
- Endpoint descriptions
- Request/response schemas
- Authentication requirements
- Error responses
- Example requests/responses

## Performance Considerations

### Response Time Targets
- Simple CRUD: < 100ms
- Complex queries: < 500ms
- ML service calls: < 2000ms
- Code execution: < 5000ms

### Optimization Strategies
- Database query optimization
- Response caching where appropriate
- Connection pooling
- Lazy loading for large datasets

## Testing

### API Testing
- **Framework**: Jest or Supertest (to be implemented)
- **Coverage**: All endpoints tested
- **Types**: Unit tests, integration tests, E2E tests

### Test Data
- Test database separate from development
- Seed data for consistent testing
- Cleanup after test runs

## Future Enhancements

### Planned Features
- GraphQL API (alternative to REST)
- WebSocket support for real-time features
- API key authentication for external integrations
- Advanced caching with Redis
- API analytics and monitoring

### Monitoring
- Request/response logging
- Performance metrics
- Error tracking (Sentry integration)
- Uptime monitoring