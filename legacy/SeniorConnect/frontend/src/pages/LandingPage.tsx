import { useApp } from '@/store';
import { seniors } from '@/mockData';
import { CredibilityBadge, RatingStars } from '@/components/ui';
import {
  Compass,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Star,
  ArrowRight,
  Users,
  Award,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function LandingPage() {
  const { navigate, setRole, login } = useApp();

  const handleStart = (role: 'junior' | 'senior') => {
    setRole(role);
    navigate('signup');
  };

  const featuredSeniors = seniors.slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-secondary-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
              <Compass className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold text-secondary-800">
              SeniorConnect
            </span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <button onClick={() => navigate('discover')} className="text-sm font-medium text-secondary-500 hover:text-secondary-800">Discover</button>
            <a href="#how" className="text-sm font-medium text-secondary-500 hover:text-secondary-800">How it works</a>
            <a href="#mentors" className="text-sm font-medium text-secondary-500 hover:text-secondary-800">Mentors</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('login')} className="btn-ghost">Sign in</button>
            <button onClick={() => handleStart('junior')} className="btn-primary">Get started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />
        <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary-100/40 blur-3xl" />
        <div className="absolute -left-20 top-40 -z-10 h-[400px] w-[400px] rounded-full bg-accent-100/30 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-in-up">
              <span className="chip-primary mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                Trusted by 5,000+ junior engineers
              </span>
              <h1 className="font-display text-4xl font-extrabold leading-[1.1] text-secondary-900 lg:text-5xl">
                Learn from the engineers who{' '}
                <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                  built the products
                </span>{' '}
                you admire.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-secondary-500">
                Connect with senior professionals from top companies for structured
                one-on-one mentorship. Discover, book, and grow — all in one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => handleStart('junior')} className="btn-primary text-base">
                  Find a mentor
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => handleStart('senior')} className="btn-secondary text-base">
                  Become a mentor
                </button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-secondary-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success-500" />
                  Free to join
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success-500" />
                  No credit card
                </div>
              </div>
            </div>

            {/* Hero card */}
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="card relative overflow-hidden p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="chip-success">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-success-500" />
                    Live session
                  </span>
                  <span className="text-xs font-medium text-secondary-400">Today · 16:00</span>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <img
                    src={seniors[0].avatar}
                    alt={seniors[0].name}
                    className="h-12 w-12 rounded-xl ring-2 ring-primary-100"
                  />
                  <div>
                    <p className="font-semibold text-secondary-800">{seniors[0].name}</p>
                    <p className="text-sm text-secondary-500">{seniors[0].title} · {seniors[0].company}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-secondary-50 p-4">
                  <p className="text-sm font-medium text-secondary-700">System design for a URL shortener</p>
                  <p className="mt-1 text-xs text-secondary-400">45 min · 1-on-1 mentoring</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RatingStars rating={5} size={14} />
                    <span className="text-sm font-semibold text-secondary-700">{seniors[0].rating}</span>
                  </div>
                  <CredibilityBadge score={seniors[0].credibilityScore} />
                </div>
              </div>

              {/* Floating stat cards */}
              <div className="absolute -left-6 -bottom-4 hidden card animate-fade-in-up p-3 sm:block" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 text-success-600">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-secondary-800">96/100</p>
                    <p className="text-[11px] text-secondary-400">Credibility score</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 hidden card animate-fade-in-up p-3 sm:block" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-secondary-800">318</p>
                    <p className="text-[11px] text-secondary-400">Sessions delivered</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-secondary-100 bg-secondary-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 lg:grid-cols-4 lg:px-8">
          {[
            { icon: Users, value: '5,000+', label: 'Junior engineers' },
            { icon: Award, value: '500+', label: 'Verified seniors' },
            { icon: Calendar, value: '12,000+', label: 'Sessions booked' },
            { icon: Star, value: '4.9/5', label: 'Average rating' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary-600 shadow-soft">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary-800">{stat.value}</p>
                <p className="text-sm text-secondary-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="text-center">
          <span className="chip-primary mb-4">How it works</span>
          <h2 className="font-display text-3xl font-bold text-secondary-900 lg:text-4xl">
            Three steps to your next milestone
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-secondary-500">
            No endless searching, no back-and-forth emails. Just find, book, and learn.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Compass,
              step: '01',
              title: 'Discover the right mentor',
              desc: 'Filter by role, company, domain, and expertise. See credibility scores and ratings at a glance.',
            },
            {
              icon: Calendar,
              step: '02',
              title: 'Book a session in minutes',
              desc: 'Pick an available slot, set your topic, and get an instant confirmation. No scheduling back-and-forth.',
            },
            {
              icon: MessageSquare,
              step: '03',
              title: 'Learn and leave feedback',
              desc: 'Join the session, get personalized guidance, then rate your mentor to build their credibility.',
            },
          ].map((item) => (
            <div key={item.step} className="card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="font-display text-3xl font-bold text-secondary-100">{item.step}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-secondary-800">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured mentors */}
      <section id="mentors" className="bg-secondary-50 py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <span className="chip-primary mb-4">Featured mentors</span>
              <h2 className="font-display text-3xl font-bold text-secondary-900 lg:text-4xl">
                Meet a few of our seniors
              </h2>
            </div>
            <button onClick={() => { login(); navigate('discover'); }} className="hidden btn-secondary sm:flex">
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredSeniors.map((senior) => (
              <div key={senior.id} className="card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <img src={senior.avatar} alt={senior.name} className="h-12 w-12 rounded-xl ring-2 ring-primary-100" />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-secondary-800">{senior.name}</h3>
                    <p className="truncate text-xs text-secondary-500">{senior.company}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-xs text-secondary-500">{senior.bio}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {senior.expertise.slice(0, 2).map((skill) => (
                    <span key={skill} className="chip-secondary">{skill}</span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-secondary-100 pt-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
                    <span className="text-sm font-semibold text-secondary-700">{senior.rating}</span>
                  </div>
                  <CredibilityBadge score={senior.credibilityScore} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / credibility */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="chip-primary mb-4">Trust & credibility</span>
            <h2 className="font-display text-3xl font-bold text-secondary-900 lg:text-4xl">
              Every mentor is verified and rated
            </h2>
            <p className="mt-4 text-secondary-500">
              Our credibility system combines verified experience, session history,
              and real student feedback — so you always know who you are learning from.
            </p>
            <div className="mt-6 space-y-4">
              {[
                { icon: ShieldCheck, title: 'Verified experience', desc: 'Employment and credentials checked by our team.' },
                { icon: Award, title: 'Transparent scoring', desc: 'A 0–100 credibility score updated after every session.' },
                { icon: Clock, title: 'Session history', desc: 'See how many sessions each mentor has delivered.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-secondary-800">{item.title}</p>
                    <p className="text-sm text-secondary-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="card p-8 text-center">
              <div className="relative inline-flex h-40 w-40 items-center justify-center">
                <svg width="160" height="160" className="-rotate-90">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle
                    cx="80" cy="80" r="70" fill="none" stroke="#0d9488" strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 70}
                    strokeDashoffset={2 * Math.PI * 70 * (1 - 0.96)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-secondary-800">96</span>
                  <span className="text-sm text-secondary-400">/ 100</span>
                </div>
              </div>
              <p className="mt-4 font-semibold text-secondary-800">Credibility Score</p>
              <p className="text-sm text-secondary-400">Updated after every session</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary-900 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
          <h2 className="font-display text-3xl font-bold text-white lg:text-4xl">
            Your career deserves a guide.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-secondary-300">
            Join thousands of junior engineers who are leveling up with senior mentors.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => handleStart('junior')} className="btn-primary text-base">
              Find your mentor
              <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => handleStart('senior')} className="btn bg-white text-secondary-800 hover:bg-secondary-100 text-base">
              Become a mentor
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-secondary-800 bg-secondary-900 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Compass className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-sm font-bold text-white">SeniorConnect</span>
          </div>
          <p className="text-sm text-secondary-400">© 2026 CareerHub SeniorConnect. Built for future engineers.</p>
        </div>
      </footer>
    </div>
  );
}