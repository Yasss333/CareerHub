import { useState } from 'react';
import { useApp } from '@/store';
import type { UserRole } from '@/types';
import { Compass, ArrowRight, Mail, Lock, User, Building2, GraduationCap, CheckCircle2 } from 'lucide-react';

function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const { navigate } = useApp();
  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-secondary-900 p-12 lg:flex">
        <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-primary-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-primary-500/10 blur-3xl" />

        <button onClick={() => navigate('landing')} className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Compass className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold text-white">SeniorConnect</span>
        </button>

        <div className="relative">
          <h2 className="font-display text-3xl font-bold leading-tight text-white">
            "I went from confused student to confident backend intern in three sessions."
          </h2>
          <div className="mt-6 flex items-center gap-3">
            <img
              src="https://api.dicebear.com/7.x/initials/svg?seed=Rohan%20Verma&backgroundColor=f59e0b&textColor=ffffff"
              alt=""
              className="h-10 w-10 rounded-xl"
            />
            <div>
              <p className="font-semibold text-white">Rohan Verma</p>
              <p className="text-sm text-secondary-400">Final-year CS Student</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-3">
          {['Verified senior mentors from top companies', 'Structured 1-on-1 sessions, not just chats', 'Track your growth with credibility scores'].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-secondary-300">
              <CheckCircle2 className="h-5 w-5 text-primary-400" />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-col items-center justify-center bg-secondary-50 px-4 py-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-bold text-secondary-900">{title}</h1>
            <p className="mt-1.5 text-sm text-secondary-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, navigate } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your mentorship journey.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input pl-10"
            />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input pl-10"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-secondary-500">
            <input type="checkbox" className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
            Remember me
          </label>
          <button type="button" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Forgot password?
          </button>
        </div>
        <button type="submit" className="btn-primary w-full">
          Sign in
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-secondary-500">
        Don't have an account?{' '}
        <button onClick={() => navigate('signup')} className="font-semibold text-primary-600 hover:text-primary-700">
          Sign up free
        </button>
      </p>
    </AuthShell>
  );
}

export function SignupPage() {
  const { role, setRole, login, navigate } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');

  const selectedRole: UserRole = role ?? 'junior';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
  };

  return (
    <AuthShell title="Create your account" subtitle="Start learning from senior engineers today.">
      {/* Role toggle */}
      <div className="mb-5">
        <label className="label">I am a...</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('junior')}
            className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all ${
              selectedRole === 'junior'
                ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-100'
                : 'border-secondary-200 bg-white hover:border-secondary-300'
            }`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              selectedRole === 'junior' ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-500'
            }`}>
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-secondary-800">Junior</p>
              <p className="text-[11px] text-secondary-400">Student / early career</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setRole('senior')}
            className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all ${
              selectedRole === 'senior'
                ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-100'
                : 'border-secondary-200 bg-white hover:border-secondary-300'
            }`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              selectedRole === 'senior' ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-500'
            }`}>
              <Building2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-secondary-800">Senior</p>
              <p className="text-[11px] text-secondary-400">Mentor / professional</p>
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={selectedRole === 'junior' ? 'Your name' : 'Your name'}
              className="input pl-10"
            />
          </div>
        </div>
        {selectedRole === 'senior' && (
          <div>
            <label className="label">Company</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Where do you work?"
                className="input pl-10"
              />
            </div>
          </div>
        )}
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input pl-10"
            />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="input pl-10"
            />
          </div>
        </div>
        <button type="submit" className="btn-primary w-full">
          Create account
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-secondary-500">
        Already have an account?{' '}
        <button onClick={() => navigate('login')} className="font-semibold text-primary-600 hover:text-primary-700">
          Sign in
        </button>
      </p>
    </AuthShell>
  );
}
