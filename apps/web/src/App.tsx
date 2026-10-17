import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

const Landing = lazy(() => import('./pages/Landing'))
const Dashboard = lazy(() => import('./pages/DashboardNew'))
const ResumeList = lazy(() => import('./pages/ResumeList'))
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'))
const SeniorConnect = lazy(() => import('./pages/SeniorConnect'))
const SeniorConnectBooking = lazy(() => import('./pages/SeniorConnectBooking'))
const SeniorConnectSessions = lazy(() => import('./pages/SeniorConnectSessions'))
const SeniorConnectProfile = lazy(() => import('./pages/SeniorConnectProfile'))
const AlgoRank = lazy(() => import('./pages/AlgoRank'))
const ProblemDetail = lazy(() => import('./pages/ProblemDetail'))
const ProblemEditor = lazy(() => import('./pages/ProblemEditor'))
const ProblemCreate = lazy(() => import('./pages/ProblemCreate'))
const Submissions = lazy(() => import('./pages/Submissions'))
const AdminProblems = lazy(() => import('./pages/AdminProblems'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Playlists = lazy(() => import('./pages/Playlists'))
const PlaylistDetail = lazy(() => import('./pages/PlaylistDetail'))
const RoadmapList = lazy(() => import('./pages/RoadmapList'))
const RoadmapBuilder = lazy(() => import('./pages/RoadmapBuilder'))
const RoadmapDetail = lazy(() => import('./pages/RoadmapDetail'))
const Interview = lazy(() => import('./pages/Interview'))
const InterviewSetup = lazy(() => import('./pages/InterviewSetup'))
const InterviewSession = lazy(() => import('./pages/InterviewSession'))
const InterviewResults = lazy(() => import('./pages/InterviewResults'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const AdminMentorApplications = lazy(() => import('./pages/AdminMentorApplications'))
const Settings = lazy(() => import('./pages/Settings'))

function AppRootLayout() {
  const location = useLocation()

  if (!localStorage.getItem('token') && location.pathname === '/') {
    return <Landing />
  }

  return (
    <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
      <Layout />
    </ProtectedRoute>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={(
        <div role="status" className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          <span className="mr-3 size-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
          Loading CareerHub…
        </div>
      )}>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mentor" element={
          <ProtectedRoute allowedRoles={['MENTOR']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<SeniorConnectSessions />} />
          <Route path="profile" element={<SeniorConnectProfile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/" element={<AppRootLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="resume" element={<ResumeList />} />
          <Route path="resume-builder/:resumeId" element={<ResumeBuilder />} />
          <Route path="connect" element={<SeniorConnect />} />
          <Route path="connect/booking/:seniorId" element={<SeniorConnectBooking />} />
          <Route path="connect/sessions" element={<SeniorConnectSessions />} />
          <Route path="connect/profile" element={<SeniorConnectProfile />} />
          <Route path="admin/mentor-applications" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminMentorApplications />
            </ProtectedRoute>
          } />
          <Route path="algorank" element={<AlgoRank />} />
          <Route path="algorank/problems/:id" element={<ProblemDetail />} />
          <Route path="algorank/problems/:id/solve" element={<ProblemEditor />} />
          <Route path="algorank/problems/create" element={<ProblemCreate />} />
          <Route path="algorank/submissions" element={<Submissions />} />
          <Route path="algorank/admin" element={<AdminProblems />} />
          <Route path="algorank/leaderboard" element={<Leaderboard />} />
          <Route path="algorank/playlists" element={<Playlists />} />
          <Route path="algorank/playlists/:id" element={<PlaylistDetail />} />
          <Route path="roadmaps" element={<RoadmapList />} />
          <Route path="roadmaps/builder" element={<RoadmapBuilder />} />
          <Route path="roadmaps/:id" element={<RoadmapDetail />} />
          <Route path="interview" element={<Interview />} />
          <Route path="interview/setup" element={<InterviewSetup />} />
          <Route path="interview/session/:id" element={<InterviewSession />} />
          <Route path="interview/results/:id" element={<InterviewResults />} />
          {/* Add more routes as we implement other modules */}
        </Route>
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
