import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import ResumeBuilder from './pages/ResumeBuilder'
import SeniorConnect from './pages/SeniorConnect'
import SeniorConnectBooking from './pages/SeniorConnectBooking'
import SeniorConnectSessions from './pages/SeniorConnectSessions'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="resume" element={<ResumeBuilder />} />
          <Route path="connect" element={<SeniorConnect />} />
          <Route path="connect/booking" element={<SeniorConnectBooking />} />
          <Route path="connect/sessions" element={<SeniorConnectSessions />} />
          {/* Add more routes as we implement other modules */}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App