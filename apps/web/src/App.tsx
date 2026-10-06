import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Dashboard from './pages/DashboardNew'
import ResumeList from './pages/ResumeList'
import ResumeBuilder from './pages/ResumeBuilder'
import SeniorConnect from './pages/SeniorConnect'
import SeniorConnectBooking from './pages/SeniorConnectBooking'
import SeniorConnectSessions from './pages/SeniorConnectSessions'
import SeniorConnectProfile from './pages/SeniorConnectProfile'
import AlgoRank from './pages/AlgoRank'
import ProblemDetail from './pages/ProblemDetail'
import ProblemEditor from './pages/ProblemEditor'
import ProblemCreate from './pages/ProblemCreate'
import Submissions from './pages/Submissions'
import AdminProblems from './pages/AdminProblems'
import Leaderboard from './pages/Leaderboard'
import Playlists from './pages/Playlists'
import PlaylistDetail from './pages/PlaylistDetail'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="resume" element={<ResumeList />} />
          <Route path="resume-builder/:resumeId" element={<ResumeBuilder />} />
          <Route path="connect" element={<SeniorConnect />} />
          <Route path="connect/booking/:seniorId" element={<SeniorConnectBooking />} />
          <Route path="connect/sessions" element={<SeniorConnectSessions />} />
          <Route path="connect/profile" element={<SeniorConnectProfile />} />
          <Route path="algorank" element={<AlgoRank />} />
          <Route path="algorank/problems/:id" element={<ProblemDetail />} />
          <Route path="algorank/problems/:id/solve" element={<ProblemEditor />} />
          <Route path="algorank/problems/create" element={<ProblemCreate />} />
          <Route path="algorank/submissions" element={<Submissions />} />
          <Route path="algorank/admin" element={<AdminProblems />} />
          <Route path="algorank/leaderboard" element={<Leaderboard />} />
          <Route path="algorank/playlists" element={<Playlists />} />
          <Route path="algorank/playlists/:id" element={<PlaylistDetail />} />
          {/* Add more routes as we implement other modules */}
        </Route>
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App