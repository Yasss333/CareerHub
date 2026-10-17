import { existsSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import dotenv from 'dotenv'

if (existsSync('apps/api/.env')) {
  dotenv.config({ path: 'apps/api/.env' })
}

const apiRequire = createRequire(new URL('./apps/api/package.json', import.meta.url))
const { PrismaClient } = apiRequire('@prisma/client')
const prisma = new PrismaClient()

const API_BASE = process.env.API_BASE || 'http://localhost:5000'
const hasUsableAIKey = Boolean(
  process.env.OPENROUTER_API_KEY?.trim() &&
  !/^(your|replace|placeholder|example|change.?me)/i.test(process.env.OPENROUTER_API_KEY)
)
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const password = `CareerHub-${runId}-Test!`
const testAccounts = [
  { email: `careerhub-e2e-junior-${runId}@example.com`, name: 'E2E Junior' },
  { email: `careerhub-e2e-mentor-${runId}@example.com`, name: 'E2E Mentor' },
  { email: `careerhub-e2e-admin-${runId}@example.com`, name: 'E2E Admin' }
]
const tests = []
let juniorToken
let mentorToken
let juniorId
let mentorId
let adminId
let adminToken
let resumeId
let duplicateResumeId
let roadmapId
let generatedRoadmapId
let playlistId
let commentId
let sessionId
let availabilitySlotId
let problemId

function record(name, status, message) {
  const timestamp = new Date().toISOString()
  const result = { name, status, message, timestamp }
  tests.push(result)
  console.log(`[${timestamp}] ${name}: ${status} - ${message}`)
}

async function check(name, callback) {
  try {
    await callback()
    record(name, 'PASSED', 'Expected result received')
  } catch (error) {
    record(name, 'FAILED', error instanceof Error ? error.message : String(error))
    throw error
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  })
  const text = await response.text()
  let data

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  return { response, data }
}

function expectStatus(result, status) {
  if (result.response.status !== status) {
    const detail = result.data?.error || result.data?.message || result.response.statusText
    throw new Error(`Expected HTTP ${status}; received ${result.response.status}${detail ? `: ${detail}` : ''}`)
  }
}

function futureDate(daysAhead) {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

async function run() {
  let result

  await check('API health', async () => {
    result = await request('/health')
    expectStatus(result, 200)
    if (result.data?.status !== 'ok') throw new Error('Health status was not ok')
  })

  await check('Auth registration creates a new account', async () => {
    result = await request('/api/auth/register', {
      method: 'POST',
      body: { ...testAccounts[0], password }
    })
    expectStatus(result, 201)
    if (!result.data?.user?.id || !result.data?.token) throw new Error('Registration response omitted user or token')
    juniorId = result.data.user.id
    juniorToken = result.data.token
  })

  await check('Auth login and current-user identity', async () => {
    result = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testAccounts[0].email, password, accountType: 'USER' }
    })
    expectStatus(result, 200)
    if (!result.data?.token || result.data.user?.email !== testAccounts[0].email) {
      throw new Error('Login response did not identify the registered account')
    }
    juniorToken = result.data.token

    result = await request('/api/auth/me', { token: juniorToken })
    expectStatus(result, 200)
    if (result.data?.id !== juniorId) throw new Error('Current-user endpoint returned the wrong account')
  })

  await check('Protected APIs reject missing authentication', async () => {
    result = await request('/api/resume')
    expectStatus(result, 401)
    result = await request('/api/connect/sessions')
    expectStatus(result, 401)
    result = await request('/api/roadmaps')
    expectStatus(result, 401)
    result = await request('/api/connect/admin/mentor-applications', { token: juniorToken })
    expectStatus(result, 403)
  })

  await check(
    hasUsableAIKey
      ? 'AI resume enhancement endpoints return enhanced content'
      : 'AI resume enhancement endpoints explain missing provider configuration',
    async () => {
      result = await request('/api/ai/enhance-pro-sum', {
        method: 'POST',
        token: juniorToken,
        body: { userContent: 'Software engineer with experience building reliable web applications and collaborating across teams.' }
      })
      if (!hasUsableAIKey) {
        expectStatus(result, 503)
        if (!result.data?.error?.includes('not configured')) {
          throw new Error('AI endpoint did not explain that a valid provider key is required')
        }
      } else {
        expectStatus(result, 200)
        if (typeof result.data?.enhancedSolution !== 'string' || result.data.enhancedSolution.length < 20) {
          throw new Error('Professional summary enhancement returned no useful content')
        }
      }

      result = await request('/api/ai/enhance-job-desc', {
        method: 'POST',
        token: juniorToken,
        body: { userContent: 'Built web applications, improved performance, and worked with product teams.' }
      })
      if (!hasUsableAIKey) {
        expectStatus(result, 503)
        if (!result.data?.error?.includes('not configured')) {
          throw new Error('AI endpoint did not explain that a valid provider key is required')
        }
      } else {
        expectStatus(result, 200)
        if (typeof result.data?.enhancedSolution !== 'string' || result.data.enhancedSolution.length < 20) {
          throw new Error('Job description enhancement returned no useful content')
        }
      }
    }
  )

  await check('Resume create, list, read, update, duplicate, and delete', async () => {
    result = await request('/api/resume', { token: juniorToken })
    expectStatus(result, 200)
    if (!Array.isArray(result.data)) throw new Error('Resume list response was not an array')

    result = await request('/api/resume', {
      method: 'POST',
      token: juniorToken,
      body: {
        title: `E2E Resume ${runId}`,
        professionSummary: 'End-to-end test profile',
        skills: ['Testing'],
        personalInfo: { name: testAccounts[0].name, email: testAccounts[0].email },
        experience: [],
        projects: [],
        education: []
      }
    })
    expectStatus(result, 201)
    resumeId = result.data?.id
    if (!resumeId) throw new Error('Resume creation did not return an id')

    result = await request(`/api/resume/${resumeId}`, { token: juniorToken })
    expectStatus(result, 200)
    if (result.data?.title !== `E2E Resume ${runId}`) throw new Error('Created resume was not returned')

    result = await request(`/api/resume/${resumeId}`, {
      method: 'PUT',
      token: juniorToken,
      body: { title: `Updated E2E Resume ${runId}` }
    })
    expectStatus(result, 200)
    if (result.data?.title !== `Updated E2E Resume ${runId}`) throw new Error('Resume update was not persisted')

    result = await request(`/api/resume/${resumeId}/duplicate`, { method: 'POST', token: juniorToken })
    expectStatus(result, 201)
    duplicateResumeId = result.data?.id
    if (!duplicateResumeId) throw new Error('Resume duplication did not return an id')

    result = await request(`/api/resume/${duplicateResumeId}`, { method: 'DELETE', token: juniorToken })
    expectStatus(result, 200)
    duplicateResumeId = undefined

    result = await request(`/api/resume/${resumeId}`, { method: 'DELETE', token: juniorToken })
    expectStatus(result, 200)
    resumeId = undefined
  })

  await check('AlgoRank public problems and protected community flow', async () => {
    result = await request('/api/algorank/problems?limit=1')
    expectStatus(result, 200)
    problemId = result.data?.problems?.[0]?.id
    if (!problemId) throw new Error('Problem list did not return a problem')

    result = await request(`/api/algorank/problems/${problemId}`)
    expectStatus(result, 200)
    if (result.data?.problem?.id !== problemId) throw new Error('Problem detail returned the wrong problem')

    result = await request('/api/algorank/playlists', {
      method: 'POST',
      token: juniorToken,
      body: { title: `E2E Playlist ${runId}`, description: 'Temporary test playlist' }
    })
    expectStatus(result, 201)
    playlistId = result.data?.playlist?.id
    if (!playlistId) throw new Error('Playlist creation did not return an id')

    result = await request(`/api/algorank/playlists/${playlistId}/problems`, {
      method: 'POST',
      token: juniorToken,
      body: { problemIds: [problemId] }
    })
    expectStatus(result, 200)

    result = await request(`/api/algorank/playlists/${playlistId}`, { token: juniorToken })
    expectStatus(result, 200)
    if (result.data?.playlist?.problems?.length !== 1) throw new Error('Problem was not added to the playlist')

    result = await request('/api/algorank/comments', {
      method: 'POST',
      token: juniorToken,
      body: { problemId, content: `E2E comment ${runId}` }
    })
    expectStatus(result, 201)
    commentId = result.data?.comment?.id
    if (!commentId) throw new Error('Comment creation did not return an id')

    result = await request(`/api/algorank/comments/${problemId}`)
    expectStatus(result, 200)
    if (!result.data?.comments?.some((comment) => comment.id === commentId)) {
      throw new Error('Created comment was not returned in the discussion')
    }

    result = await request('/api/algorank/likes', {
      method: 'POST',
      token: juniorToken,
      body: { problemId }
    })
    expectStatus(result, 200)
    if (result.data?.liked !== true) throw new Error('Problem like was not enabled')

    result = await request('/api/algorank/likes', {
      method: 'POST',
      token: juniorToken,
      body: { problemId }
    })
    expectStatus(result, 200)
    if (result.data?.liked !== false) throw new Error('Problem like was not removed')

    result = await request(`/api/algorank/comments/${commentId}`, {
      method: 'DELETE',
      token: juniorToken
    })
    expectStatus(result, 200)
    commentId = undefined

    result = await request(`/api/algorank/playlists/${playlistId}`, {
      method: 'DELETE',
      token: juniorToken
    })
    expectStatus(result, 200)
    playlistId = undefined
  })

  await check('AlgoRank leaderboard data contract', async () => {
    result = await request('/api/algorank/leaderboard')
    expectStatus(result, 200)
    if (!Array.isArray(result.data?.leaderboard)) {
      throw new Error('Leaderboard response did not include an array')
    }
    if (result.data.leaderboard.some((entry) => !entry.id || !('name' in entry))) {
      throw new Error('Leaderboard entries do not match the frontend data contract')
    }
  })

  await check('Roadmap template, milestone progress, and deletion flow', async () => {
    result = await request('/api/roadmaps/templates')
    expectStatus(result, 200)
    const template = result.data?.templates?.[0]
    if (!template) throw new Error('No roadmap templates were returned')

    result = await request('/api/roadmaps/generate', {
      method: 'POST',
      token: juniorToken,
      body: { roleType: template.key, skillLevel: 'beginner', userGoals: 'Build accessible web applications' }
    })
    expectStatus(result, 201)
    generatedRoadmapId = result.data?.roadmap?.id
    const generatedMilestone = result.data?.roadmap?.milestones?.[0]
    if (!generatedRoadmapId || !generatedMilestone) throw new Error('Roadmap generation did not return stages')
    if (!generatedMilestone.resources?.articles?.some((resource) => resource.free)) {
      throw new Error('Generated stages did not include curated free resources')
    }
    result = await request(`/api/roadmaps/${generatedRoadmapId}`, { method: 'DELETE', token: juniorToken })
    expectStatus(result, 200)
    generatedRoadmapId = undefined

    result = await request('/api/roadmaps', {
      method: 'POST',
      token: juniorToken,
      body: {
        title: `E2E Roadmap ${runId}`,
        roleType: template.key,
        description: 'Temporary roadmap for regression testing',
        topics: []
      }
    })
    expectStatus(result, 201)
    roadmapId = result.data?.roadmap?.id
    if (!roadmapId) throw new Error('Roadmap creation did not return an id')

    for (const order of [1, 2]) {
      result = await request(`/api/roadmaps/${roadmapId}/milestones`, {
        method: 'POST',
        token: juniorToken,
        body: { title: `E2E milestone ${order}`, order, topics: order === 1 ? ['JavaScript', 'DOM manipulation'] : [] }
      })
      expectStatus(result, 201)
    }

    result = await request(`/api/roadmaps/${roadmapId}`, { token: juniorToken })
    expectStatus(result, 200)
    const firstMilestone = result.data?.roadmap?.milestones?.[0]
    if (!firstMilestone) throw new Error('Created milestones were not returned')
    const jsResources = firstMilestone.resources?.articles || []
    if (!jsResources.some((resource) => resource.free && resource.url.startsWith('https://'))) {
      throw new Error('Milestone did not include a curated free learning link')
    }

    result = await request(`/api/roadmaps/${roadmapId}/resources`, {
      method: 'POST',
      token: juniorToken,
      body: { topic: firstMilestone.title, milestoneId: firstMilestone.id }
    })
    expectStatus(result, 200)
    if (!result.data?.resources?.articles?.some((resource) => resource.free)) {
      throw new Error('Milestone resource refresh did not return free learning links')
    }

    result = await request(`/api/roadmaps/${roadmapId}/milestones/${firstMilestone.id}/complete`, {
      method: 'PUT',
      token: juniorToken
    })
    expectStatus(result, 200)

    result = await request(`/api/roadmaps/${roadmapId}`, { token: juniorToken })
    expectStatus(result, 200)
    if (result.data?.roadmap?.progress !== 50) {
      throw new Error(`Expected roadmap progress 50; received ${result.data?.roadmap?.progress}`)
    }

    result = await request(`/api/roadmaps/${roadmapId}`, { method: 'DELETE', token: juniorToken })
    expectStatus(result, 200)
    roadmapId = undefined
  })

  await check('Senior Connect mentor, booking, session, feedback, and notification flow', async () => {
    result = await request('/api/auth/register', {
      method: 'POST',
      body: { ...testAccounts[1], password }
    })
    expectStatus(result, 201)
    mentorId = result.data?.user?.id
    mentorToken = result.data?.token
    if (!mentorId || !mentorToken) throw new Error('Mentor registration did not return identity and token')

    result = await request('/api/connect/profile', {
      method: 'POST',
      token: mentorToken,
      body: {
        title: 'E2E Mentor',
        company: 'CareerHub Test',
        domain: 'Software Engineering',
        role: 'Mentor',
        bio: 'Temporary end-to-end test profile',
        experience: 5,
        location: 'Remote',
        expertise: ['Testing'],
        achievements: []
      }
    })
    expectStatus(result, 200)
    if (result.data?.mentorApprovalStatus !== 'PENDING') {
      throw new Error('New mentor profile was not queued for administrator review')
    }

    result = await request('/api/connect/profile', { token: mentorToken })
    expectStatus(result, 200)
    if (result.data?.user?.isAlumniMentor !== false || result.data?.user?.mentorApprovalStatus !== 'PENDING') {
      throw new Error('The applicant was given mentor permissions before approval')
    }

    result = await request('/api/connect/seniors?search=E2E%20Mentor')
    expectStatus(result, 200)
    if (result.data?.some((profile) => profile.userId === mentorId)) {
      throw new Error('Unapproved mentor application was publicly discoverable')
    }

    result = await request('/api/connect/availability', {
      method: 'POST',
      token: mentorToken,
      body: { date: futureDate(3), startTime: '10:00', endTime: '10:45', timezone: 'UTC' }
    })
    expectStatus(result, 403)

    result = await request('/api/auth/register', {
      method: 'POST',
      body: { ...testAccounts[2], password }
    })
    expectStatus(result, 201)
    adminId = result.data?.user?.id
    if (!adminId) throw new Error('Admin test account registration did not return a user id')
    await prisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } })
    result = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testAccounts[2].email, password, accountType: 'ADMIN' }
    })
    expectStatus(result, 200)
    adminToken = result.data?.token
    if (!adminToken || result.data?.user?.role !== 'ADMIN') throw new Error('Admin login did not return the administrator role')

    result = await request('/api/connect/admin/mentor-applications', { token: adminToken })
    expectStatus(result, 200)
    if (!result.data?.some((application) => application.id === mentorId)) {
      throw new Error('Administrator review queue did not include the pending application')
    }

    result = await request(`/api/connect/admin/mentor-applications/${mentorId}`, {
      method: 'PATCH',
      token: adminToken,
      body: { decision: 'approve' }
    })
    expectStatus(result, 200)
    if (result.data?.mentorApprovalStatus !== 'APPROVED') throw new Error('Admin approval was not persisted')

    result = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testAccounts[1].email, password, accountType: 'MENTOR' }
    })
    expectStatus(result, 200)
    if (result.data?.user?.role !== 'MENTOR') throw new Error('Approved mentor login did not return the MENTOR role')
    mentorToken = result.data.token

    result = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testAccounts[1].email, password, accountType: 'USER' }
    })
    expectStatus(result, 401)

    result = await request('/api/resume', { token: mentorToken })
    expectStatus(result, 403)

    result = await request('/api/connect/sessions', { token: mentorToken })
    expectStatus(result, 200)

    result = await request('/api/connect/seniors?search=E2E%20Mentor')
    expectStatus(result, 200)
    if (!Array.isArray(result.data) || !result.data.some((profile) => profile.userId === mentorId)) {
      throw new Error('Mentor profile was not discoverable')
    }

    const date = futureDate(3)
    result = await request('/api/connect/availability', {
      method: 'POST',
      token: mentorToken,
      body: { date, startTime: '10:00', endTime: '10:45', timezone: 'UTC' }
    })
    expectStatus(result, 201)
    availabilitySlotId = result.data?.[0]?.id
    if (!availabilitySlotId) throw new Error('Availability slot creation did not return an id')

    result = await request(`/api/connect/availability/${mentorId}`)
    expectStatus(result, 200)
    if (!result.data?.some((slot) => slot.id === availabilitySlotId)) {
      throw new Error('New availability slot was not returned to discovery')
    }

    result = await request('/api/connect/sessions', {
      method: 'POST',
      token: juniorToken,
      body: {
        seniorId: mentorId,
        availabilitySlotId,
        scheduledTime: `${date}T10:00:00`,
        duration: 45,
        topic: 'E2E mentorship session'
      }
    })
    expectStatus(result, 201)
    sessionId = result.data?.id
    if (!sessionId || result.data?.status !== 'pending') throw new Error('Session request was not created as pending')

    result = await request('/api/connect/sessions', {
      method: 'POST',
      token: juniorToken,
      body: {
        seniorId: mentorId,
        availabilitySlotId,
        scheduledTime: `${date}T10:00:00`,
        duration: 45,
        topic: 'Duplicate E2E booking'
      }
    })
    expectStatus(result, 409)

    result = await request(`/api/connect/sessions/${sessionId}/status`, {
      method: 'PUT',
      token: mentorToken,
      body: { status: 'accepted' }
    })
    expectStatus(result, 200)
    if (result.data?.status !== 'accepted') throw new Error('Mentor did not accept the session')

    result = await request(`/api/connect/sessions/${sessionId}/start`, {
      method: 'POST',
      token: juniorToken,
      body: {}
    })
    expectStatus(result, 200)
    if (!result.data?.jitsiRoomUrl?.startsWith('https://meet.jit.si/')) {
      throw new Error('Session did not return a Jitsi room URL')
    }

    result = await request(`/api/connect/sessions/${sessionId}/complete`, {
      method: 'POST',
      token: juniorToken,
      body: {}
    })
    expectStatus(result, 200)
    if (result.data?.status !== 'completed') throw new Error('Session was not marked completed')

    result = await request(`/api/connect/sessions/${sessionId}/feedback`, {
      method: 'POST',
      token: juniorToken,
      body: { rating: 5, comment: 'E2E feedback', tags: ['Helpful'] }
    })
    expectStatus(result, 201)
    result = await request(`/api/connect/sessions/${sessionId}/feedback`, {
      method: 'POST',
      token: juniorToken,
      body: { rating: 5 }
    })
    expectStatus(result, 409)

    result = await request(`/api/connect/feedback/${mentorId}`)
    expectStatus(result, 200)
    if (result.data?.rating !== 5 || result.data?.reviewCount !== 1) {
      throw new Error('Mentor feedback summary was not updated')
    }

    result = await request('/api/connect/notifications/count', { token: mentorToken })
    expectStatus(result, 200)
    if (result.data?.unreadCount < 1) throw new Error('Mentor notification was not created')
  })

  await check('Administrator can reject mentor applications without granting mentor access', async () => {
    result = await request('/api/connect/profile', {
      method: 'POST',
      token: juniorToken,
      body: {
        title: 'E2E Applicant',
        company: 'CareerHub Test',
        bio: 'Temporary application used to verify rejection permissions'
      }
    })
    expectStatus(result, 200)
    if (result.data?.mentorApprovalStatus !== 'PENDING') throw new Error('Application did not enter the pending state')

    result = await request(`/api/connect/admin/mentor-applications/${juniorId}`, {
      method: 'PATCH',
      token: adminToken,
      body: { decision: 'reject' }
    })
    expectStatus(result, 200)
    if (result.data?.mentorApprovalStatus !== 'REJECTED') throw new Error('Administrator rejection was not persisted')

    result = await request('/api/connect/profile', { token: juniorToken })
    expectStatus(result, 200)
    if (result.data?.user?.mentorApprovalStatus !== 'REJECTED' || result.data?.user?.isAlumniMentor !== false) {
      throw new Error('Rejected applicant retained mentor permissions')
    }
  })
}

async function cleanup() {
  const userIds = [juniorId, mentorId, adminId].filter(Boolean)

  try {
    if (generatedRoadmapId) {
      await prisma.roadmap.deleteMany({ where: { id: generatedRoadmapId } })
    }
    if (roadmapId) {
      await prisma.roadmap.deleteMany({ where: { id: roadmapId } })
    }
    if (sessionId) {
      await prisma.sessionFeedback.deleteMany({ where: { bookingId: sessionId } })
      await prisma.sessionBooking.deleteMany({ where: { id: sessionId } })
    }
    if (mentorId) {
      await prisma.availabilitySlot.deleteMany({ where: { seniorId: mentorId } })
    }
    if (userIds.length) {
      await prisma.seniorProfile.deleteMany({ where: { userId: { in: userIds } } })
      await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    }
    record('E2E test data cleanup', 'PASSED', 'Temporary accounts and associated data removed')
  } catch (error) {
    record('E2E test data cleanup', 'FAILED', error instanceof Error ? error.message : String(error))
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  console.log('=== CareerHub Authenticated End-to-End Regression ===\n')

  try {
    await run()
  } catch {
    // The failing check is already recorded; cleanup still runs below.
  }

  await cleanup()

  const passed = tests.filter((test) => test.status === 'PASSED').length
  const failed = tests.filter((test) => test.status === 'FAILED').length
  const report = [
    '# CareerHub End-to-End Test Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Total checks: ${tests.length}`,
    `- Passed: ${passed}`,
    `- Failed: ${failed}`,
    '',
    '## Results',
    '',
    '| Check | Status | Details |',
    '|---|---|---|',
    ...tests.map((test) => `| ${test.name} | ${test.status} | ${test.message.replaceAll('|', '\\|')} |`)
  ].join('\n')

  writeFileSync('test-report.md', `${report}\n`)
  console.log(`\nTotal checks: ${tests.length}; passed: ${passed}; failed: ${failed}`)
  console.log('Report saved to test-report.md')

  if (failed > 0) process.exitCode = 1
}

main().catch(async (error) => {
  console.error('E2E runner failed:', error)
  await prisma.$disconnect()
  process.exitCode = 1
})
