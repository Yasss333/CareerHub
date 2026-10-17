import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Landing from './pages/Landing';

function AuthPlaceholder({ mode }: { mode: 'login' | 'register' }) {
  return (
    <div className="landing min-h-screen flex items-center justify-center p-4 bg-[#05050B]">
      <div className="max-w-md w-full rounded-2xl border border-[#242433] bg-[#12121C] p-8 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-xl ln-btn-primary mx-auto grid place-items-center text-lg font-bold text-white mb-4">
          CH
        </div>
        <h2 className="text-2xl font-bold text-white">
          {mode === 'login' ? 'Log in to Career Hub' : 'Create your Career Hub account'}
        </h2>
        <p className="mt-2 text-sm text-[#9A9AAE]">
          {mode === 'login'
            ? 'Sign in to access your placement dashboard and interview trials.'
            : 'Academic project platform for multimodal interview coaching, DSA, and ATS resume evaluation.'}
        </p>
        <div className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="student@ves.ac.in"
            className="w-full px-4 py-3 rounded-xl border border-[#242433] bg-[#0A0A12] text-white placeholder-[#6E6E85] focus:outline-none focus:border-[#8B5CF6]"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl border border-[#242433] bg-[#0A0A12] text-white placeholder-[#6E6E85] focus:outline-none focus:border-[#8B5CF6]"
          />
          <button className="w-full py-3 rounded-full ln-btn-primary font-semibold text-white shadow-lg">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>
        <div className="mt-6 pt-4 border-t border-[#242433] text-sm text-[#9A9AAE]">
          <Link to="/landing" className="text-[#A78BFA] hover:underline">
            &larr; Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<AuthPlaceholder mode="login" />} />
        <Route path="/register" element={<AuthPlaceholder mode="register" />} />
        <Route path="/" element={<Navigate to="/landing" replace />} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
