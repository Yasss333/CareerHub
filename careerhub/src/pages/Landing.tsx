import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import {
  ArrowRight,
  Code,
  FileText,
  Users,
  Target,
  Menu,
  X,
  Trophy,
  Terminal,
  TrendingUp,
  Bell,
  Search,
  Laptop,
  GraduationCap,
  ChevronDown,
  Sun,
  Shield,
  Cpu,
  Brain,
  Video,
  CheckCircle2,
  GitBranch
} from 'lucide-react';

/* ─── Interfaces ─── */
interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/* ─── Constants ─── */
const TECH_STACK_ITEMS = [
  'FastAPI Microservices',
  'Next.js 14 & React',
  'PostgreSQL 15',
  'ViT-Base Vision Transformer',
  'Wav2Vec2-XLSR-53',
  'DistilRoBERTa Sentiment',
  'MTCNN Face Detection',
  'FaceNet 512-D Embeddings',
  'Piston Isolated Sandbox',
  'WebRTC & Jitsi Core',
  'SpaCy NLP Engine',
  'Docker Containers'
];

const FAQS: FaqItem[] = [
  {
    id: 'item-1',
    question: 'What is Career Hub?',
    answer: 'Career Hub is an academic final-year project developed in the Department of Electronics and Computer Science at VESIT. It unifies multimodal AI interview coaching, DSA coding evaluation, ATS resume scoring, and peer mentorship into an all-in-one placement preparation system.'
  },
  {
    id: 'item-2',
    question: 'How does the AI Mock Interviewer evaluate candidates?',
    answer: 'It employs decision-level late fusion across three neural backbones: Vision Transformers (ViT-Base) for facial affect, Wav2Vec2 for speech tone and vocal micro-tremors, and DistilRoBERTa for transcript sentiment, achieving 91.82% affect classification accuracy with automated MTCNN proctoring.'
  },
  {
    id: 'item-3',
    question: 'What is the Placement Readiness Index (PRI)?',
    answer: 'The Placement Readiness Index is a composite mathematical formulation: S_Placement = 0.45 · S_Interview + 0.40 · S_AlgoRank + 0.15 · S_Resume, consolidating interview nonverbal composure, code pass rate, and ATS resume alignment into a standardized 0–100 benchmark.'
  },
  {
    id: 'item-4',
    question: 'Which programming languages are supported in AlgoRank?',
    answer: 'AlgoRank runs in an isolated Piston sandbox container and supports C++, Python, and Java with per-testcase verdicts (Accepted, Wrong Answer, Runtime Error) and execution time/memory profiling.'
  },
  {
    id: 'item-5',
    question: 'How does SeniorConnect work?',
    answer: 'SeniorConnect provides peer-to-peer live mock interviews using WebRTC, Jitsi Core, and Socket.io signaling, enabling students to schedule review slots and receive structured evaluation feedback.'
  },
  {
    id: 'item-6',
    question: 'Is this an active commercial product or a college project?',
    answer: 'Career Hub is a final-year academic engineering project (Course NECMM55, Academic Year 2026–27) developed under the guidance of Dr. Sarika Kuhikar at Vivekanand Education Society’s Institute of Technology (VESIT). It is an experimental research prototype without commercial user claims or paid tiers.'
  }
];

/* ─── Rising Cosmic Stardust Canvas ─── */
function CosmicStardustCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
    }

    const particles: Particle[] = [];
    const colors = ['#818CF8', '#A78BFA', '#C084FC', '#38BDF8', '#FFFFFF'];

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * (Math.min(width * 0.8, 600)),
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: -0.5 - Math.random() * 1.4,
        size: Math.random() * 2.2 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.7 + 0.2,
        decay: Math.random() * 0.005 + 0.003
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (particles.length < 55) {
        particles.push({
          x: width / 2 + (Math.random() - 0.5) * (Math.min(width * 0.7, 500)),
          y: height * 0.88 + Math.random() * 40,
          vx: (Math.random() - 0.5) * 0.7,
          vy: -0.7 - Math.random() * 1.6,
          size: Math.random() * 2.4 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 0.85,
          decay: Math.random() * 0.006 + 0.003
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y < 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
    />
  );
}

/* ─── Career Hub Logo Icon ─── */
function CareerHubLogo({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <div className={`rounded-xl ln-btn-primary grid place-items-center font-bold text-white shadow-md ${className}`}>
      CH
    </div>
  );
}

/* ─── Main Landing Component ─── */
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 3D Dashboard Mockup Interactive State
  const [activeSidebarTab, setActiveSidebarTab] = useState<'dashboard' | 'interview' | 'algo' | 'resume' | 'senior' | 'pri'>('dashboard');
  const [activeChartMetric, setActiveChartMetric] = useState<'pri' | 'algo'>('pri');

  // Bento Interactive States
  const [skillLevel, setSkillLevel] = useState<number>(85);
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    affect: true,
    algo: true,
    ats: false
  });
  const [codeLanguage, setCodeLanguage] = useState<'cpp' | 'py'>('cpp');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      document.querySelectorAll('.landing [data-reveal]').forEach((el) => {
        el.classList.add('ln-visible');
      });
      return;
    }

    const revealElements = document.querySelectorAll('.landing [data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('ln-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="landing min-h-screen text-white bg-[#05050B]">
      {/* ─── Academic Project Header Strip ─── */}
      <div className="relative z-50 bg-[#0E0E18] border-b border-[#242433] text-center py-2 px-4 text-xs font-medium text-[#C7C7D6] flex flex-wrap items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-violet-400" />
        <span className="font-semibold text-white">Department of Electronics &amp; Computer Science · VESIT</span>
        <span className="text-[#6E6E85]">|</span>
        <span>Final Year Project 2026–27</span>
        <a href="#research" className="text-violet-400 hover:text-white underline ml-1 font-medium">
          View Academic Specs &rarr;
        </a>
      </div>

      {/* ─── Career Hub Navbar ─── */}
      <nav
        className={`sticky top-0 inset-x-0 z-40 transition-all duration-300 border-b ${
          scrolled
            ? 'bg-[rgba(5,5,11,0.85)] backdrop-blur-xl border-[#242433]'
            : 'border-transparent bg-[#05050B]/90 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/landing" className="flex items-center gap-2.5 group">
            <CareerHubLogo className="w-8 h-8 text-sm" />
            <span className="font-bold text-2xl tracking-tight text-white">
              Career Hub
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7 text-[#9A9AAE] text-sm font-medium">
            <a href="#features" className="hover:text-white transition-colors">
              Modules
            </a>
            <a href="#dashboard" className="hover:text-white transition-colors">
              Platform Preview
            </a>
            <a href="#pri-formula" className="hover:text-white transition-colors">
              PRI Architecture
            </a>
            <a href="#research" className="hover:text-white transition-colors">
              Research Scope
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </div>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-full border border-[#242433] bg-[#12121C] text-[#9A9AAE] hover:text-white grid place-items-center transition-colors"
            >
              <Sun className="w-4 h-4" />
            </button>
            <Link to="/register">
              <Button
                size="sm"
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-full px-6 py-2 text-sm font-semibold shadow-[0_4px_20px_rgba(139,92,246,0.4)] transition-all"
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden text-[#9A9AAE] hover:text-white p-2 rounded-lg border border-[#242433] bg-[#12121C]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#242433] bg-[#05050B]/98 backdrop-blur-2xl px-4 py-6 space-y-4">
            <div className="flex flex-col space-y-3 text-base font-medium text-[#9A9AAE]">
              <a href="#features" onClick={closeMenu} className="hover:text-white py-1">
                Modules
              </a>
              <a href="#dashboard" onClick={closeMenu} className="hover:text-white py-1">
                Platform Preview
              </a>
              <a href="#pri-formula" onClick={closeMenu} className="hover:text-white py-1">
                PRI Architecture
              </a>
              <a href="#research" onClick={closeMenu} className="hover:text-white py-1">
                Research Scope
              </a>
              <a href="#faq" onClick={closeMenu} className="hover:text-white py-1">
                FAQ
              </a>
            </div>
            <div className="pt-4 border-t border-[#242433] flex flex-col gap-3">
              <Link to="/login" onClick={closeMenu}>
                <Button
                  variant="outline"
                  className="w-full rounded-full border-[#32324A] bg-white/5 text-white"
                >
                  Log In
                </Button>
              </Link>
              <Link to="/register" onClick={closeMenu}>
                <Button className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-full text-white font-semibold">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero Section with Serif Headline & Cosmic Beam ─── */}
      <section className="relative overflow-hidden pt-20 sm:pt-28 pb-12 sm:pb-16 ln-hero-bg">
        {/* Central Atmospheric Cosmic Beam */}
        <div
          aria-hidden="true"
          className="ln-beam-anim absolute top-0 left-1/2 -translate-x-1/2 w-[340px] sm:w-[540px] h-[750px] bg-gradient-to-b from-purple-600/35 via-violet-600/20 to-transparent blur-[90px] rounded-full pointer-events-none z-0"
        />

        {/* Rising Stardust Particles */}
        <CosmicStardustCanvas />

        {/* Concentric Faint Orbital Arcs with Floating Badges */}
        <div
          aria-hidden="true"
          className="absolute top-12 left-1/2 -translate-x-1/2 w-[720px] sm:w-[1040px] h-[480px] sm:h-[620px] border border-violet-500/15 rounded-[50%] pointer-events-none z-10"
        >
          <div className="ln-float-node-1 absolute top-[28%] left-[10%] w-10 h-10 rounded-xl bg-[#12121C]/90 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <Brain className="w-5 h-5" />
          </div>
          <div className="ln-float-node-2 absolute top-[62%] left-[16%] w-10 h-10 rounded-xl bg-[#12121C]/90 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Code className="w-5 h-5" />
          </div>
          <div className="ln-float-node-2 absolute top-[24%] right-[12%] w-10 h-10 rounded-xl bg-[#12121C]/90 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="ln-float-node-1 absolute top-[58%] right-[14%] w-10 h-10 rounded-xl bg-[#12121C]/90 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        {/* Hero Content Container */}
        <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#32324A] bg-[#12121C]/80 px-4 py-1.5 text-xs sm:text-sm font-medium text-[#C7C7D6] backdrop-blur-md mb-6">
            <Cpu className="w-4 h-4 text-[#A78BFA]" />
            Final Year Engineering Project · Department of ECS, VESIT
          </div>

          {/* Headline requested by user: Serif "Prepare with Career Hub" + Sans "An All-in-One..." */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.08] text-white">
            <span className="ln-font-serif block font-normal tracking-wide text-white">
              Prepare with Career Hub
            </span>
            <span className="font-extrabold tracking-tight block mt-2 sm:mt-3 text-white text-3xl sm:text-5xl lg:text-6xl">
              An All-in-One Interview Preparation Platform
            </span>
          </h1>

          {/* Subtitle matching research proposal */}
          <p className="mt-5 text-base sm:text-lg lg:text-xl text-[#9A9AAE] max-w-2xl mx-auto leading-relaxed">
            An end-to-end placement preparation platform unifying multimodal affective AI mock interviews,
            an AlgoRank DSA coding sandbox, ResumeRanker ATS optimization, and SeniorConnect peer mentorship.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-7 text-sm sm:text-base border-[#32324A] bg-[#12121C]/90 hover:bg-[#161622] text-white"
              >
                Explore Modules
              </Button>
            </a>
            <Link to="/register">
              <Button
                size="lg"
                className="bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full px-8 text-sm sm:text-base font-semibold shadow-[0_10px_35px_-10px_rgba(99,102,241,0.65)] flex items-center gap-2"
              >
                <span>Explore Career Hub</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* ─── Massive 3D Perspective Dashboard Preview (Career Hub Research Prototype) ─── */}
        <div id="dashboard" className="ln-perspective-container max-w-6xl mx-auto px-4 sm:px-6 mt-14 sm:mt-20">
          <div className="ln-dashboard-3d rounded-2xl border border-[#242433] bg-[#0E0E17]/95 backdrop-blur-2xl overflow-hidden text-left shadow-2xl">
            {/* Window Chrome Header Bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#242433] bg-[#0A0A12]/80">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
                <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="ml-3 text-xs text-[#9A9AAE] font-mono">
                  careerhub.internal/dashboard
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">Research Prototype Active</span>
              </div>
            </div>

            {/* Dashboard Workspace Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
              {/* Left Sidebar */}
              <div className="hidden md:block md:col-span-3 border-r border-[#242433] p-4 bg-[#090910]/70">
                <div className="flex items-center gap-2 px-3 py-2 mb-4">
                  <CareerHubLogo className="w-6 h-6 text-xs" />
                  <span className="font-bold text-white text-base tracking-tight">Career Hub</span>
                </div>

                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => setActiveSidebarTab('dashboard')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                      activeSidebarTab === 'dashboard'
                        ? 'bg-[#1C1C2A] text-white border border-[#32324A]'
                        : 'text-[#9A9AAE] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5 text-[#A78BFA]" />
                    Diagnostic Dashboard
                  </button>

                  <button
                    onClick={() => setActiveSidebarTab('interview')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                      activeSidebarTab === 'interview'
                        ? 'bg-[#1C1C2A] text-white border border-[#32324A]'
                        : 'text-[#9A9AAE] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-blue-400" />
                    AI Mock Interviewer
                  </button>

                  <button
                    onClick={() => setActiveSidebarTab('algo')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                      activeSidebarTab === 'algo'
                        ? 'bg-[#1C1C2A] text-white border border-[#32324A]'
                        : 'text-[#9A9AAE] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    AlgoRank Sandbox
                  </button>

                  <button
                    onClick={() => setActiveSidebarTab('resume')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                      activeSidebarTab === 'resume'
                        ? 'bg-[#1C1C2A] text-white border border-[#32324A]'
                        : 'text-[#9A9AAE] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    ResumeRanker ATS
                  </button>

                  <button
                    onClick={() => setActiveSidebarTab('senior')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                      activeSidebarTab === 'senior'
                        ? 'bg-[#1C1C2A] text-white border border-[#32324A]'
                        : 'text-[#9A9AAE] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    SeniorConnect
                  </button>

                  <div className="pt-3 pb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#6E6E85]">
                    Architecture
                  </div>
                  <div className="text-[#9A9AAE] px-3 py-1.5 hover:text-white cursor-pointer transition-colors flex items-center gap-2">
                    <Brain className="w-3 h-3 text-[#A78BFA]" />
                    Affective AI Late Fusion
                  </div>
                  <div className="text-[#9A9AAE] px-3 py-1.5 hover:text-white cursor-pointer transition-colors flex items-center gap-2">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    MTCNN CV Proctoring
                  </div>
                  <div className="text-[#9A9AAE] px-3 py-1.5 hover:text-white cursor-pointer transition-colors flex items-center gap-2">
                    <Cpu className="w-3 h-3 text-amber-400" />
                    PRI Scoring Engine
                  </div>
                </div>
              </div>

              {/* Main Content Stage */}
              <div className="md:col-span-9 p-5 sm:p-7 space-y-6">
                {/* Search & Top Action Bar */}
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#242433]">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Placement Readiness Index (PRI)</h2>
                    <p className="text-xs text-[#9A9AAE]">Candidate Evaluation Pipeline — Trial Sample (D16-ECS)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#242433] bg-[#0A0A12] text-xs text-[#6E6E85]">
                      <Search className="w-3.5 h-3.5" />
                      <span>Search modules &amp; testcases...</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[#161622] text-[10px] text-[#A78BFA] border border-[#32324A]">
                        ⌘ K
                      </kbd>
                    </div>
                    <button className="w-8 h-8 rounded-lg border border-[#242433] bg-[#0A0A12] grid place-items-center text-[#9A9AAE] hover:text-white">
                      <Bell className="w-4 h-4" />
                    </button>
                    <div className="px-3 py-1 rounded-lg border border-[#242433] bg-[#12121C] text-xs text-white font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Latency: 27.52ms
                    </div>
                  </div>
                </div>

                {/* 3 Real Metric KPI Cards based on PRD mathematical formula */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: Composite PRI */}
                  <div className="p-4 rounded-xl border border-[#242433] bg-[#12121C] hover:border-[#32324A] transition-colors">
                    <div className="flex items-center justify-between text-xs text-[#9A9AAE]">
                      <span className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
                        Composite PRI Score
                      </span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-white">84.6</span>
                      <span className="text-[11px] font-medium text-emerald-400">
                        / 100 High Readiness
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-[#6E6E85]">
                      0.45·Interview + 0.40·Algo + 0.15·ATS
                    </div>
                  </div>

                  {/* Card 2: AlgoRank Pass Rate */}
                  <div className="p-4 rounded-xl border border-[#242433] bg-[#12121C] hover:border-[#32324A] transition-colors">
                    <div className="flex items-center justify-between text-xs text-[#9A9AAE]">
                      <span className="flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-blue-400" />
                        AlgoRank Pass Rate
                      </span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-white">87.5%</span>
                      <span className="text-[11px] font-medium text-emerald-400">
                        Piston Sandbox
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-[#6E6E85]">
                      Testcases passed: 28 / 32
                    </div>
                  </div>

                  {/* Card 3: Multimodal Poise */}
                  <div className="p-4 rounded-xl border border-[#242433] bg-[#12121C] hover:border-[#32324A] transition-colors">
                    <div className="flex items-center justify-between text-xs text-[#9A9AAE]">
                      <span className="flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5 text-purple-400" />
                        Affective Poise
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-white">91.8%</span>
                      <span className="text-xs text-[#9A9AAE]">Confidence</span>
                    </div>
                    <div className="mt-1 text-[11px] text-[#6E6E85]">
                      ViT-Base + Wav2Vec2 + DistilRoBERTa
                    </div>
                  </div>
                </div>

                {/* Rank & Score Progress Chart Card */}
                <div className="p-4 sm:p-5 rounded-xl border border-[#242433] bg-[#12121C]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Diagnostic Trajectory &amp; Microservice Benchmarks</h3>
                      <p className="text-xs text-[#9A9AAE]">Asynchronous pipeline operates at 27.52 ms vs 90.0 ms budget</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex p-0.5 rounded-lg bg-[#0A0A12] border border-[#242433] text-xs">
                        <button
                          onClick={() => setActiveChartMetric('pri')}
                          className={`px-3 py-1 rounded-md font-medium transition-all ${
                            activeChartMetric === 'pri'
                              ? 'bg-[#1C1C2A] text-white shadow'
                              : 'text-[#9A9AAE] hover:text-white'
                          }`}
                        >
                          PRI Trend
                        </button>
                        <button
                          onClick={() => setActiveChartMetric('algo')}
                          className={`px-3 py-1 rounded-md font-medium transition-all ${
                            activeChartMetric === 'algo'
                              ? 'bg-[#1C1C2A] text-white shadow'
                              : 'text-[#9A9AAE] hover:text-white'
                          }`}
                        >
                          AlgoRank
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#9A9AAE] px-2.5 py-1 rounded bg-[#0A0A12] border border-[#242433]">
                        <span>Trial Cohort</span>
                        <ChevronDown className="w-3 h-3" />
                      </div>
                    </div>
                  </div>

                  {/* Chart Visual Progress Bars */}
                  <div className="h-28 flex items-end gap-2 sm:gap-3 pt-4 border-b border-[#242433]">
                    {[50, 58, 55, 68, 64, 76, 72, 80, 82, 85, 90, 88, 92, 94, 96].map(
                      (val, idx) => {
                        const heightPct = activeChartMetric === 'pri' ? (val / 100) * 100 : ((val * 1.2) / 120) * 100;
                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                          >
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full rounded-t-sm transition-all duration-300 ${
                                idx === 14
                                  ? 'bg-gradient-to-t from-violet-600 to-indigo-400 shadow-[0_0_12px_rgba(139,92,246,0.6)]'
                                  : 'bg-[#1E1E2E] group-hover:bg-violet-500/50'
                              }`}
                            />
                          </div>
                        );
                      }
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-[#6E6E85] pt-2 font-mono">
                    <span>Trial 1</span>
                    <span>Trial 5</span>
                    <span>Trial 10</span>
                    <span className="text-[#A78BFA] font-medium">Evaluation Final: PRI 84.6</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tech Stack Marquee (Authentic research stack) ─── */}
      <section className="py-10 border-y border-[#242433] bg-[#05050B] overflow-hidden">
        <p className="text-center text-xs sm:text-sm uppercase tracking-[0.22em] text-[#6E6E85] mb-6 font-semibold">
          Built on a decoupled microservice &amp; multimodal AI stack
        </p>
        <div className="relative">
          <div className="ln-marquee gap-12 items-center text-[#9A9AAE]">
            {[...TECH_STACK_ITEMS, ...TECH_STACK_ITEMS].map((item, index) => (
              <span
                key={index}
                className="text-base sm:text-lg font-semibold whitespace-nowrap opacity-75 hover:opacity-100 transition-opacity select-none flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                {item}
              </span>
            ))}
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#05050B] to-transparent pointer-events-none z-10"
          />
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#05050B] to-transparent pointer-events-none z-10"
          />
        </div>
      </section>

      {/* ─── Features: "Power Your Learning" (Kept per instruction, mapped to real 4 modules) ─── */}
      <section id="features" className="py-20 sm:py-28 bg-[#0A0A12] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left max-w-3xl mb-14" data-reveal>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Power Your Learning
            </h2>
            <p className="mt-3 text-base text-[#9A9AAE]">
              Four core engineering modules designed to eliminate preparation silos and measure real technical competence.
            </p>
          </div>

          {/* 4 Bento Grid Cards with Ambient Glow Spots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bento Card 1: AI Mock Interviewer & Affect Engine */}
            <div
              data-reveal
              className="relative rounded-2xl border border-[#242433] bg-[#12121C] hover:border-[#32324A] p-7 flex flex-col justify-between transition-all overflow-hidden"
            >
              <div aria-hidden="true" className="ln-ambient-glow absolute inset-0 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-[#9A9AAE] mb-4">
                  <span className="font-semibold text-white">Affective Computing Readiness</span>
                  <span className="font-semibold text-[#A78BFA]">ViT-Base + Wav2Vec2</span>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-3 bg-[#1A1A28] rounded-full overflow-hidden p-0.5">
                  <div
                    style={{ width: `${skillLevel}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-300"
                  />
                </div>
                <div className="mt-3 flex justify-between items-center text-xs">
                  <span className="text-[#6E6E85]">Nonverbal Poise &amp; Stress Regulation</span>
                  <span className="font-mono text-violet-400 font-semibold">{skillLevel}% Verified</span>
                </div>

                <div className="mt-4 flex gap-2">
                  {[45, 70, 92].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSkillLevel(lvl)}
                      className={`px-3 py-1 rounded text-xs transition-colors ${
                        skillLevel === lvl
                          ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                          : 'bg-[#161622] text-[#9A9AAE] border border-[#242433]'
                      }`}
                    >
                      {lvl === 45 ? 'Hesitant' : lvl === 70 ? 'Composed' : '91.82% Poised'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative z-10 mt-8 pt-4 border-t border-[#242433]">
                <h3 className="text-lg font-semibold text-white">AI Mock Interviewer &amp; Proctoring</h3>
                <p className="mt-1 text-sm text-[#9A9AAE]">
                  Tri-modal decision late fusion evaluating facial expression, vocal tone, and transcript sentiment with automated MTCNN identity verification.
                </p>
              </div>
            </div>

            {/* Bento Card 2: ResumeRanker ATS Optimization */}
            <div
              data-reveal
              style={{ transitionDelay: '80ms' }}
              className="relative rounded-2xl border border-[#242433] bg-[#12121C] hover:border-[#32324A] p-7 flex flex-col justify-between transition-all overflow-hidden"
            >
              <div aria-hidden="true" className="ln-ambient-glow absolute inset-0 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    ResumeRanker Engine
                  </span>
                  <span className="text-xs text-[#6E6E85]">PyMuPDF + SpaCy NLP</span>
                </div>

                {/* Interactive Checklist */}
                <div className="space-y-3">
                  <label
                    onClick={() => setChecklist({ ...checklist, affect: !checklist.affect })}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-[#242433] bg-[#0A0A12] cursor-pointer hover:bg-[#161622] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checklist.affect}
                      readOnly
                      className="w-4 h-4 rounded text-violet-600 focus:ring-0 cursor-pointer"
                    />
                    <span className={`text-sm ${checklist.affect ? 'text-white' : 'text-[#6E6E85]'}`}>
                      ATS Formatting &amp; Section Hierarchy Check
                    </span>
                  </label>

                  <label
                    onClick={() => setChecklist({ ...checklist, algo: !checklist.algo })}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-[#242433] bg-[#0A0A12] cursor-pointer hover:bg-[#161622] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checklist.algo}
                      readOnly
                      className="w-4 h-4 rounded text-violet-600 focus:ring-0 cursor-pointer"
                    />
                    <span className={`text-sm ${checklist.algo ? 'text-white' : 'text-[#6E6E85]'}`}>
                      Coding Achievements Linked to Resume Skill Bullets
                    </span>
                  </label>

                  <label
                    onClick={() => setChecklist({ ...checklist, ats: !checklist.ats })}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-[#242433] bg-[#0A0A12] cursor-pointer hover:bg-[#161622] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checklist.ats}
                      readOnly
                      className="w-4 h-4 rounded text-violet-600 focus:ring-0 cursor-pointer"
                    />
                    <span className={`text-sm ${checklist.ats ? 'text-white' : 'text-[#6E6E85]'}`}>
                      TF-IDF Keyword Density &amp; Jaccard Similarity Score
                    </span>
                  </label>
                </div>
              </div>

              <div className="relative z-10 mt-8 pt-4 border-t border-[#242433]">
                <h3 className="text-lg font-semibold text-white">ResumeRanker ATS Engine</h3>
                <p className="mt-1 text-sm text-[#9A9AAE]">
                  Automated parsing, formatting compliance analysis, and algorithmic skill validation directly mapped into your PRI profile.
                </p>
              </div>
            </div>

            {/* Bento Card 3: AlgoRank DSA Coding Sandbox */}
            <div
              data-reveal
              style={{ transitionDelay: '160ms' }}
              className="relative rounded-2xl border border-[#242433] bg-[#12121C] hover:border-[#32324A] p-7 flex flex-col justify-between transition-all overflow-hidden"
            >
              <div aria-hidden="true" className="ln-ambient-glow absolute inset-0 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCodeLanguage('cpp')}
                      className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                        codeLanguage === 'cpp'
                          ? 'bg-[#1E1E2E] text-violet-400 border border-[#32324A]'
                          : 'text-[#6E6E85] hover:text-white'
                      }`}
                    >
                      solution.cpp
                    </button>
                    <button
                      onClick={() => setCodeLanguage('py')}
                      className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                        codeLanguage === 'py'
                          ? 'bg-[#1E1E2E] text-violet-400 border border-[#32324A]'
                          : 'text-[#6E6E85] hover:text-white'
                      }`}
                    >
                      solution.py
                    </button>
                  </div>
                  <span className="text-xs text-[#10B981] font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Piston Runner Active
                  </span>
                </div>

                {/* Code Window Box */}
                <pre className="p-4 rounded-xl border border-[#242433] bg-[#0A0A12] text-xs font-mono text-[#C7C7D6] overflow-x-auto leading-relaxed">
                  {codeLanguage === 'cpp' ? (
                    <code>
                      <span className="text-[#6E6E85]">1.</span>{' '}
                      <span className="text-[#A78BFA]">#include</span>{' '}
                      <span className="text-[#6EE7B7]">&lt;vector&gt;</span>
                      <span className="animate-pulse text-violet-400 font-bold ml-1">|</span>
                      {'\n'}
                      <span className="text-[#6E6E85]">2.</span>{' '}
                      <span className="text-[#60A5FA]">vector&lt;int&gt;</span>{' '}
                      <span className="text-[#F472B6]">twoSum</span>(vector&lt;int&gt;&amp; nums, <span className="text-[#60A5FA]">int</span> target) &#123;{'\n'}
                      <span className="text-[#6E6E85]">3.</span>     unordered_map&lt;int, int&gt; mp;{'\n'}
                      <span className="text-[#6E6E85]">4.</span>     <span className="text-[#A78BFA]">for</span> (<span className="text-[#60A5FA]">int</span> i = 0; i &lt; nums.size(); i++) &#123;{'\n'}
                      <span className="text-[#6E6E85]">5.</span>         <span className="text-[#A78BFA]">if</span> (mp.count(target - nums[i])) <span className="text-[#A78BFA]">return</span> &#123;mp[target - nums[i]], i&#125;;{'\n'}
                      <span className="text-[#6E6E85]">6.</span>         mp[nums[i]] = i;{'\n'}
                      <span className="text-[#6E6E85]">7.</span>     &#125;{'\n'}
                      <span className="text-[#6E6E85]">8.</span>     <span className="text-[#A78BFA]">return</span> &#123;&#125;;{'\n'}
                      <span className="text-[#6E6E85]">9.</span> &#125;
                    </code>
                  ) : (
                    <code>
                      <span className="text-[#6E6E85]">1.</span>{' '}
                      <span className="text-[#A78BFA]">def</span>{' '}
                      <span className="text-[#60A5FA]">two_sum</span>(nums: list[int], target: int) -&gt; list[int]:{'\n'}
                      <span className="text-[#6E6E85]">2.</span>     seen = &#123;&#125;{'\n'}
                      <span className="text-[#6E6E85]">3.</span>     <span className="text-[#A78BFA]">for</span> i, num{' '}
                      <span className="text-[#A78BFA]">in</span>{' '}
                      <span className="text-[#60A5FA]">enumerate</span>(nums):{'\n'}
                      <span className="text-[#6E6E85]">4.</span>         comp = target - num{'\n'}
                      <span className="text-[#6E6E85]">5.</span>         <span className="text-[#A78BFA]">if</span> comp in seen:{'\n'}
                      <span className="text-[#6E6E85]">6.</span>             <span className="text-[#A78BFA]">return</span> [seen[comp], i]{'\n'}
                      <span className="text-[#6E6E85]">7.</span>         seen[num] = i
                    </code>
                  )}
                </pre>
              </div>

              <div className="relative z-10 mt-8 pt-4 border-t border-[#242433]">
                <h3 className="text-lg font-semibold text-white">AlgoRank DSA Coding Sandbox</h3>
                <p className="mt-1 text-sm text-[#9A9AAE]">
                  Piston-backed isolated code execution supporting Python, C++, and Java with per-testcase verdicts and runtime metrics.
                </p>
              </div>
            </div>

            {/* Bento Card 4: SeniorConnect & AI Roadmap */}
            <div
              data-reveal
              style={{ transitionDelay: '240ms' }}
              className="relative rounded-2xl border border-[#242433] bg-[#12121C] hover:border-[#32324A] p-7 flex flex-col justify-between transition-all overflow-hidden"
            >
              <div aria-hidden="true" className="ln-ambient-glow absolute inset-0 pointer-events-none" />
              <div className="relative z-10">
                <div className="relative h-44 flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full border border-violet-500/20 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border border-indigo-500/30 flex items-center justify-center">
                      <CareerHubLogo className="w-9 h-9 text-xs" />
                    </div>
                  </div>

                  <div className="absolute top-2 left-16 p-2 rounded-lg bg-[#161622] border border-[#242433] text-violet-400 text-xs shadow-md">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="absolute bottom-2 left-14 p-2 rounded-lg bg-[#161622] border border-[#242433] text-indigo-400 text-xs shadow-md">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="absolute top-2 right-16 p-2 rounded-lg bg-[#161622] border border-[#242433] text-purple-400 text-xs shadow-md">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="absolute bottom-2 right-14 p-2 rounded-lg bg-[#161622] border border-[#242433] text-emerald-400 text-xs shadow-md">
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="absolute top-[42%] left-4 p-2 rounded-lg bg-[#161622] border border-[#242433] text-sky-400 text-xs shadow-md">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="absolute top-[42%] right-4 p-2 rounded-lg bg-[#161622] border border-[#242433] text-amber-400 text-xs shadow-md">
                    <GitBranch className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-8 pt-4 border-t border-[#242433]">
                <h3 className="text-lg font-semibold text-white">SeniorConnect &amp; AI Roadmap</h3>
                <p className="mt-1 text-sm text-[#9A9AAE]">
                  Peer-to-peer WebRTC mentorship sessions combined with Gemini 1.5 Flash dynamic study roadmaps based on PRI analytics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Placement Readiness Index (PRI) Mathematical Framework ─── */}
      <section id="pri-formula" className="py-20 sm:py-28 bg-[#05050B] border-t border-[#242433]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14" data-reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#242433] bg-[#12121C] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#A78BFA]">
              Research Formulation
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              The Placement Readiness Index (PRI)
            </h2>
            <p className="mt-3 text-base text-[#9A9AAE]">
              A composite mathematical score unifying nonverbal composure, algorithmic problem solving, and ATS resume keyword matching into a single 0–100 benchmark.
            </p>
          </div>

          {/* Formula Callout Strip */}
          <div className="max-w-4xl mx-auto mb-12 p-5 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/30 via-indigo-950/20 to-purple-950/30 text-center font-mono text-sm sm:text-base text-violet-200 shadow-xl" data-reveal>
            <span className="text-[#A78BFA] font-bold">S_Placement</span> = 0.45 · <span className="text-blue-300">S_Interview</span> + 0.40 · <span className="text-emerald-300">S_AlgoRank</span> + 0.15 · <span className="text-amber-300">S_Resume</span>
          </div>

          {/* 3 Component Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-reveal>
            <div className="p-7 rounded-2xl border border-[#242433] bg-[#12121C] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 grid place-items-center mb-5">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="text-xs uppercase font-mono font-bold text-blue-400 tracking-wider">Weight: 45%</div>
                <h3 className="text-xl font-bold text-white mt-1">S_Interview (0–100)</h3>
                <p className="mt-3 text-sm text-[#9A9AAE] leading-relaxed">
                  Tri-modal decision late fusion evaluating facial expression (ViT-Base), speech pitch &amp; pace (Wav2Vec2), and sentiment (DistilRoBERTa) with sub-30ms execution.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#242433] text-xs font-mono text-[#6E6E85]">
                Classification Accuracy: 91.82%
              </div>
            </div>

            <div className="p-7 rounded-2xl border border-[#242433] bg-[#12121C] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 grid place-items-center mb-5">
                  <Code className="w-6 h-6" />
                </div>
                <div className="text-xs uppercase font-mono font-bold text-emerald-400 tracking-wider">Weight: 40%</div>
                <h3 className="text-xl font-bold text-white mt-1">S_AlgoRank (0–100)</h3>
                <p className="mt-3 text-sm text-[#9A9AAE] leading-relaxed">
                  Pass ratio across edge-case test suites, optimal time and memory complexity benchmarks, and algorithmic correctness in C++, Python, and Java.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#242433] text-xs font-mono text-[#6E6E85]">
                Sandbox: Isolated Piston Engine
              </div>
            </div>

            <div className="p-7 rounded-2xl border border-[#242433] bg-[#12121C] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 grid place-items-center mb-5">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-xs uppercase font-mono font-bold text-amber-400 tracking-wider">Weight: 15%</div>
                <h3 className="text-xl font-bold text-white mt-1">S_Resume (0–100)</h3>
                <p className="mt-3 text-sm text-[#9A9AAE] leading-relaxed">
                  Applicant Tracking System (ATS) structure parsing, keyword density check, formatting hygiene, and dynamic verification against candidate coding skill bullets.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#242433] text-xs font-mono text-[#6E6E85]">
                NLP: SpaCy + TF-IDF Vectorizer
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Academic Context & Research Team ─── */}
      <section id="research" className="py-20 sm:py-28 bg-[#0A0A12] border-t border-[#242433]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center" data-reveal>
            <div className="lg:col-span-6 space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#242433] bg-[#12121C] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#A78BFA]">
                Academic Project Context
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Vivekanand Education Society's Institute of Technology (VESIT)
              </h2>
              <p className="text-base text-[#9A9AAE] leading-relaxed">
                Department of Electronics and Computer Science · Research Methodology (NECMM55).
                Developed as a comprehensive final-year research proposal to solve placement preparation fragmentation in higher engineering education.
              </p>
              <div className="pt-2 space-y-2 text-sm text-[#C7C7D6]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Project Guide: <strong>Dr. Sarika Kuhikar</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Student Investigators: <strong>Parth Chavan, Vedant Gawande, Lucky Lalwani, Yash Mandhare, Charu Tardeja</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Target Class: Final Year D16-ECS (Sem VII, Academic Year 2026–27)</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-[#242433] bg-[#12121C] p-6 space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-white border-b border-[#242433] pb-3">
                  Core Architectural Benchmarks
                </h4>
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between p-2.5 rounded-lg bg-[#0A0A12] border border-[#242433]">
                    <span className="text-[#9A9AAE]">Facial Vision Analytics (ViT)</span>
                    <span className="text-emerald-400">18.42 ms (Budget: 30 ms)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-[#0A0A12] border border-[#242433]">
                    <span className="text-[#9A9AAE]">Voice Pitch &amp; Pace (Wav2Vec2)</span>
                    <span className="text-emerald-400">4.36 ms (Budget: 25 ms)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-[#0A0A12] border border-[#242433]">
                    <span className="text-[#9A9AAE]">Text Sentiment (DistilRoBERTa)</span>
                    <span className="text-emerald-400">0.24 ms (Budget: 5 ms)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-[#0A0A12] border border-[#242433]">
                    <span className="text-[#9A9AAE]">Total Multimodal Execution</span>
                    <span className="text-emerald-400 font-bold">27.52 ms (Target: &le; 90 ms)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-[#0A0A12] border border-[#242433]">
                    <span className="text-[#9A9AAE]">Tri-Modal Affect Accuracy</span>
                    <span className="text-violet-400 font-bold">91.82% Top-1 F1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Interactive FAQ Accordion ─── */}
      <section id="faq" className="py-20 sm:py-28 bg-[#05050B] border-t border-[#242433] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14" data-reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#242433] bg-[#12121C] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#A78BFA]">
              FAQ
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Questions? <span className="ln-text-gradient-2">Answered.</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="max-w-3xl mx-auto" data-reveal>
            {FAQS.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="border-b border-[#242433]">
                <AccordionTrigger className="text-base sm:text-lg font-semibold text-white py-5 hover:text-[#A78BFA]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[#9A9AAE] leading-relaxed text-sm sm:text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative overflow-hidden py-20 sm:py-28 bg-[#0A0A12] border-t border-[#242433]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(99,102,241,0.22),transparent_70%)] pointer-events-none"
        />

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center" data-reveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Ready to explore <span className="ln-text-gradient">Career Hub?</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-[#9A9AAE]">
            Experience the unified placement preparation platform developed at VESIT Department of Electronics and Computer Science.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button
                size="lg"
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-full px-8 text-base text-white w-full sm:w-auto shadow-[0_10px_40px_-15px_rgba(139,92,246,0.45)]"
              >
                Launch Prototype <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 text-base border-[#32324A] bg-white/5 hover:bg-white/10 text-white w-full sm:w-auto"
              >
                Access Dashboard
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm text-[#C7C7D6]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>Multimodal Affective AI</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>Sub-30ms Microservices</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>Standardized PRI Score</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Academic Project Footer ─── */}
      <footer className="border-t border-[#242433] bg-[#05050B] pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Col 1: Logo + Blurb */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <CareerHubLogo className="w-7 h-7 text-xs" />
                <span className="font-bold text-xl tracking-tight text-white">Career Hub</span>
              </div>
              <p className="text-sm text-[#9A9AAE] leading-relaxed max-w-xs">
                An End-to-End Placement Preparation Platform Powered by Multimodal AI, Automated Proctoring, and Unified Performance Analytics.
              </p>
              <div className="pt-2 text-xs text-[#6E6E85]">
                Vivekanand Education Society's Institute of Technology (VESIT)
              </div>
            </div>

            {/* Col 2: Modules */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
                Core Modules
              </h4>
              <ul className="space-y-2.5 text-sm text-[#9A9AAE]">
                <li>
                  <a href="#dashboard" className="hover:text-white transition-colors">
                    AI Mock Interviewer
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    AlgoRank Sandbox
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    ResumeRanker ATS
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    SeniorConnect
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Research */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
                Research Project
              </h4>
              <ul className="space-y-2.5 text-sm text-[#9A9AAE]">
                <li>
                  <a href="#pri-formula" className="hover:text-white transition-colors">
                    PRI Mathematical Model
                  </a>
                </li>
                <li>
                  <a href="#research" className="hover:text-white transition-colors">
                    Microservice Benchmarks
                  </a>
                </li>
                <li>
                  <a href="#research" className="hover:text-white transition-colors">
                    Investigation Team
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Project FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Investigators */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
                Team (D16-ECS)
              </h4>
              <ul className="space-y-1.5 text-xs text-[#9A9AAE]">
                <li>Parth Chavan (03)</li>
                <li>Vedant Gawande (40)</li>
                <li>Lucky Lalwani (47)</li>
                <li>Yash Mandhare (48)</li>
                <li>Charu Tardeja (65)</li>
                <li className="pt-2 text-violet-400">Guide: Dr. Sarika Kuhikar</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#242433] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-[#6E6E85] gap-4">
            <div>&copy; 2026–27 Career Hub · Department of Electronics and Computer Science, VESIT.</div>
            <div>Final Year Research Project (Course Code: NECMM55)</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
