# AI Interview End-to-End Test Plan

## Prerequisites
- PostgreSQL database running (Docker container)
- API server running on port 5000
- Web server running on port 5173
- User account created and logged in
- OpenRouter API key configured in `.env`
- ML service (optional, for multimodal features)

## Test Environment Setup

### 1. Database Verification
```bash
cd apps/api
npx prisma migrate dev
npx prisma studio  # Verify InterviewSession, InterviewQuestion, EmotionResult, ProctoringEvent tables exist
```

### 2. Environment Variables
Ensure `apps/api/.env` has:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - JWT signing key
- `OPENROUTER_API_KEY` - For AI question generation
- `INTERVIEW_ML_URL` - ML service URL (optional, default: http://127.0.0.1:8000)
- `INTERVIEW_ML_TOKEN` - ML service auth token (optional)

### 3. Start Servers
```bash
# Terminal 1 - API
cd apps/api
npm run dev

# Terminal 2 - Web
cd apps/web
npm run dev
```

## Test Cases

### Test 1: Interview Setup
**Steps:**
1. Login to CareerHub
2. Navigate to `/interview`
3. Click "Start an interview"
4. Fill in interview configuration:
   - Type: Technical
   - Topics: "Data structures, algorithms"
   - Role: "Software Engineer"
   - Experience: Mid-level
   - Difficulty: Medium
   - Duration: 20 minutes
   - Camera consent: Check (optional)
   - Microphone consent: Check (optional)
5. Click "Start interview"

**Expected Results:**
- Redirects to `/interview/session/:id`
- Session created in database with status "in_progress"
- Questions generated automatically via OpenRouter
- Camera/microphone permissions requested if consent given

**API Calls:**
- `POST /api/interview/sessions` - Create session
- `POST /api/interview/sessions/:id/questions` - Generate questions

**Database Verification:**
```sql
SELECT * FROM "InterviewSession" WHERE status = 'in_progress' ORDER BY "createdAt" DESC LIMIT 1;
SELECT * FROM "InterviewQuestion" WHERE "sessionId" = [session_id];
```

---

### Test 2: Active Interview Session
**Steps:**
1. On the interview session page, verify:
   - Question displayed with index (e.g., "Question 1 of 5")
   - Progress bar showing completion percentage
   - Answer textarea available
   - Camera preview visible (if consent given)
   - Microphone button available (if consent given)

2. Type an answer in the textarea
3. Click "Save & continue"

**Expected Results:**
- Answer saved to database
- Progress bar updates
- Next question appears
- On last question, button changes to "Finish interview"

**API Calls:**
- `PUT /api/interview/questions/:id/answer` - Save answer
- If microphone enabled: `POST /api/interview/sessions/:id/analysis/voice` - Voice analysis

**Database Verification:**
```sql
SELECT * FROM "InterviewQuestion" WHERE "sessionId" = [session_id] AND "answerText" IS NOT NULL;
```

---

### Test 3: Camera and Microphone Features
**Steps:**
1. Start a new interview with camera and microphone consent
2. Allow browser permissions when prompted
3. Verify camera preview shows video feed
4. Click "Speak answer" button
5. Speak an answer
6. Click "Stop voice answer"

**Expected Results:**
- Camera feed visible in preview
- "Camera active" indicator shown
- Speech transcription appears in textarea
- Voice analysis triggered (if ML service running)
- Emotion analysis periodically updates (if ML service running)

**API Calls:**
- `POST /api/interview/sessions/:id/analysis/face` - Face emotion analysis
- `POST /api/interview/sessions/:id/analysis/face-register` - Face registration
- `POST /api/interview/sessions/:id/analysis/face-verify` - Face verification
- `POST /api/interview/sessions/:id/analysis/voice` - Voice emotion analysis

**Database Verification:**
```sql
SELECT * FROM "EmotionResult" WHERE "sessionId" = [session_id];
SELECT * FROM "ProctoringEvent" WHERE "sessionId" = [session_id];
```

---

### Test 4: Interview Completion and Evaluation
**Steps:**
1. Answer all questions in the interview
2. On the last question, click "Finish interview"
3. Wait for evaluation to complete

**Expected Results:**
- Redirects to `/interview/results/:id`
- Overall score displayed (0-100%)
- Per-question feedback shown
- Strengths and areas to improve listed
- Session status changed to "completed"
- Duration calculated and displayed

**API Calls:**
- `POST /api/interview/sessions/:id/evaluate` - Evaluate answers

**Database Verification:**
```sql
SELECT * FROM "InterviewSession" WHERE id = [session_id];
-- Check: status = 'completed', feedback JSON populated, durationSeconds set
```

---

### Test 5: Interview Results Page
**Steps:**
1. View the interview results page
2. Verify:
   - Overall score displayed prominently
   - Questions answered count shown
   - Practice time displayed
   - Question-by-question feedback with scores
   - Strengths and improvement areas
   - "Practice again" button available
   - Delete button available

**Expected Results:**
- All feedback data displayed correctly
- Delete removes session and dependent records
- "Practice again" redirects to setup

**API Calls:**
- `GET /api/interview/sessions/:id` - Get session with results
- `DELETE /api/interview/sessions/:id` - Delete session

---

### Test 6: Interview History
**Steps:**
1. Navigate to `/interview`
2. Verify interview history list shows:
   - All completed interviews
   - In-progress interviews
   - Session dates and question counts
   - Status badges (completed/in_progress)

**Expected Results:**
- Sessions ordered by newest first
- Clicking a completed interview navigates to results
- Clicking an in-progress interview navigates to session

**API Calls:**
- `GET /api/interview/sessions` - List user's sessions

---

### Test 7: Error Handling
**Test 7a: AI Service Unavailable**
1. Remove or invalidate OpenRouter API key
2. Try to create an interview
3. Expected: Error message "AI question generation is not configured"

**Test 7b: ML Service Unavailable**
1. Start interview with camera/microphone consent
2. ML service not running
3. Expected: Camera/microphone features unavailable, interview continues with text-only

**Test 7c: Invalid Configuration**
1. Try to create interview with empty topics
2. Expected: Validation error "Add at least one interview topic"

---

### Test 8: Privacy and Consent
**Steps:**
1. Start interview without camera/microphone consent
2. Answer questions via text only
3. Complete interview

**Expected Results:**
- No camera/microphone permissions requested
- Interview completes successfully
- No emotion analysis records in database
- Text-only answers evaluated normally

**Database Verification:**
```sql
SELECT * FROM "InterviewSession" WHERE id = [session_id];
-- Check: cameraEnabled = false, microphoneEnabled = false
SELECT COUNT(*) FROM "EmotionResult" WHERE "sessionId" = [session_id];
-- Should be 0
```

---

### Test 9: Face Verification
**Steps:**
1. Start interview with camera consent
2. Verify face is detected and registered
3. Move away from camera during session
4. Return to camera

**Expected Results:**
- Initial face registration successful
- "Camera coaching is active" message
- Proctoring events logged when face lost/returned
- Emotion analysis continues when face visible

**Database Verification:**
```sql
SELECT * FROM "ProctoringEvent" WHERE "sessionId" = [session_id] AND "eventType" LIKE 'face_%';
```

---

### Test 10: Achievement Unlocking
**Steps:**
1. Complete first interview
2. Check achievements badge on dashboard
3. Complete 5 interviews
4. Get perfect score (100%) on an interview

**Expected Results:**
- "Interview Practice" achievement unlocked after first interview
- "Interview Pro" achievement unlocked after 5 interviews
- "Perfect Performance" achievement unlocked for 100% score

**API Calls:**
- `POST /api/achievements/check?type=interview` - Check interview achievements

---

## Manual Testing Checklist

### Backend API Tests
- [ ] `POST /api/interview/sessions` - Create session
- [ ] `GET /api/interview/sessions` - List sessions
- [ ] `GET /api/interview/sessions/:id` - Get session
- [ ] `POST /api/interview/sessions/:id/questions` - Generate questions
- [ ] `PUT /api/interview/questions/:id/answer` - Save answer
- [ ] `POST /api/interview/sessions/:id/evaluate` - Evaluate
- [ ] `POST /api/interview/sessions/:id/analysis/face` - Face analysis
- [ ] `POST /api/interview/sessions/:id/analysis/voice` - Voice analysis
- [ ] `POST /api/interview/sessions/:id/proctor-events` - Proctor events
- [ ] `DELETE /api/interview/sessions/:id` - Delete session

### Frontend Page Tests
- [ ] `/interview` - Interview list page
- [ ] `/interview/setup` - Interview setup page
- [ ] `/interview/session/:id` - Active interview page
- [ ] `/interview/results/:id` - Results page

### Component Tests
- [ ] Camera capture component
- [ ] Audio recording component
- [ ] Speech transcription
- [ ] Emotion display
- [ ] Progress bar
- [ ] Answer textarea
- [ ] Achievement badge

### Database Tests
- [ ] InterviewSession table
- [ ] InterviewQuestion table
- [ ] EmotionResult table
- [ ] ProctoringEvent table
- [ ] Foreign key constraints
- [ ] Cascade deletion

### Integration Tests
- [ ] JWT authentication on all endpoints
- [ ] Owner-scoped session access
- [ ] OpenRouter API integration
- [ ] ML service proxy (if available)
- [ ] Error handling and fallbacks
- [ ] Privacy controls (consent)

---

## Known Limitations for Testing

### ML Service
- ML service (FastAPI) must be running on localhost:8000 for multimodal features
- Without ML service, camera/microphone features will be unavailable
- Text-only interview flow works without ML service

### OpenRouter API
- Requires valid API key for question generation and evaluation
- Without API key, interview creation fails with clear error message
- Test with mock/sandbox API key if available

### Prisma Engine Issue (Windows)
- Current Prisma engine compatibility issue on Windows
- Workaround: Use WSL2 or Linux environment for testing
- Alternative: Use Prisma with PostgreSQL connection pooling

---

## Success Criteria

The AI Interview module is considered fully functional when:
1. ✅ Users can create and configure interviews
2. ✅ Questions are generated via AI
3. ✅ Users can answer questions via text or voice
4. ✅ Camera/microphone features work with consent
5. ✅ Interviews are evaluated with feedback
6. ✅ Results are displayed correctly
7. ✅ Privacy controls (consent) are enforced
8. ✅ Error handling is robust
9. ✅ Achievements unlock correctly
10. ✅ Database operations complete successfully

---

## Bug Report Template

If issues are found during testing, report with:

**Issue Title:** [Brief description]

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Environment:**
- OS: [Windows/Linux/Mac]
- Node version: [Run `node --version`]
- Browser: [Chrome/Firefox/Edge]
- Database: [PostgreSQL version]

**Error Messages:**
[Any console errors or API error responses]

**Screenshots:**
[If applicable]
