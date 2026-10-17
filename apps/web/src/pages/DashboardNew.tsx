import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Code2,
  FileText,
  Flame,
  LoaderCircle,
  Plus,
  RotateCcw,
  Settings2,
  Target,
  Trophy,
  UsersRound,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'

const DashboardDonutChart = lazy(() => import('../components/dashboard/DashboardDonutChart'))

interface ResumeRecord {
  id: string
  title: string
  template: string
  createdAt: string
  personalInfo?: {
    fullName?: string
    email?: string
  } | null
  professionSummary?: string
  skills?: string[]
  experience?: unknown[]
  education?: unknown[]
  projects?: unknown[]
}

interface MentorshipSession {
  id: string
  topic: string
  scheduledTime: string
  status: string
}

interface Submission {
  id: string
  status: string
  createdAt: string
  problem?: {
    title: string
  } | null
}

interface RankingStats {
  totalProblemsSolved: number
  acceptanceRate: number
  currentStreak: number
  rankingScore: number
  rank: number
}

interface DashboardStats {
  resumesCount: number
  resumesCompleted: number
  problemsSolved: number
  totalProblems: number
  acceptanceRate: number
  currentStreak: number
  rankingScore: number
  userRank: number
  connectSessions: number
  upcomingSessions: number
  completedSessions: number
}

interface ProblemChartEntry {
  name: string
  value: number
  fill: string
}

interface SessionChartEntry {
  name: string
  value: number
  fill: string
}

const initialStats: DashboardStats = {
  resumesCount: 0,
  resumesCompleted: 0,
  problemsSolved: 0,
  totalProblems: 0,
  acceptanceRate: 0,
  currentStreak: 0,
  rankingScore: 0,
  userRank: 0,
  connectSessions: 0,
  upcomingSessions: 0,
  completedSessions: 0,
}

const chartColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

const widgetOptions = [
  { key: 'metrics', label: 'Career statistics' },
  { key: 'problemProgress', label: 'AlgoRank progress' },
  { key: 'mentorship', label: 'Mentorship activity' },
  { key: 'performance', label: 'AlgoRank performance' },
  { key: 'sessions', label: 'Recent sessions' },
  { key: 'submissions', label: 'Recent submissions' },
  { key: 'resumes', label: 'Recent resumes' },
  { key: 'quickActions', label: 'Quick actions' },
] as const

type WidgetKey = (typeof widgetOptions)[number]['key']
type WidgetVisibility = Record<WidgetKey, boolean>

const defaultWidgetVisibility: WidgetVisibility = {
  metrics: true,
  problemProgress: true,
  mentorship: true,
  performance: true,
  sessions: true,
  submissions: true,
  resumes: true,
  quickActions: true,
}

async function fetchJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(`Dashboard request failed (${response.status}): ${path}`)
  }

  return response.json() as Promise<T>
}

function isResumeComplete(resume: ResumeRecord) {
  const hasContactInfo = Boolean(resume.personalInfo?.fullName && resume.personalInfo.email)
  const hasResumeContent = Boolean(
    resume.professionSummary?.trim() ||
    resume.skills?.length ||
    resume.experience?.length ||
    resume.education?.length ||
    resume.projects?.length
  )

  return hasContactInfo && hasResumeContent
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase()
  const statusClass =
    normalizedStatus === 'completed' || normalizedStatus === 'accepted'
      ? 'bg-success/10 text-success'
      : normalizedStatus === 'pending'
        ? 'bg-warning/10 text-warning'
        : normalizedStatus === 'wrong answer' || normalizedStatus === 'rejected'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-muted text-muted-foreground'

  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass}`}>
      {status}
    </span>
  )
}

function EmptyState({
  icon: Icon,
  message,
  link,
  linkLabel,
}: {
  icon: typeof FileText
  message: string
  link: string
  linkLabel: string
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center text-center">
      <Icon className="mb-3 size-8 text-muted-foreground/60" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link to={link} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        {linkLabel}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [sessions, setSessions] = useState<MentorshipSession[]>([])
  const [recentSessions, setRecentSessions] = useState<MentorshipSession[]>([])
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([])
  const [recentResumes, setRecentResumes] = useState<ResumeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [widgetVisibility, setWidgetVisibility] = useState(defaultWidgetVisibility)
  const [widgetPreferencesLoaded, setWidgetPreferencesLoaded] = useState(false)

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Your session has expired. Please sign in again.')
      }

      const [resumes, sessions, rankingResponse, problemsResponse, submissionsResponse] =
        await Promise.all([
          fetchJson<ResumeRecord[]>('/api/resume', token),
          fetchJson<MentorshipSession[]>('/api/connect/sessions', token),
          fetchJson<{ user: RankingStats }>('/api/algorank/ranking/me', token),
          fetchJson<{ pagination?: { totalProblems?: number } }>('/api/algorank/problems?limit=1', token),
          fetchJson<{ submissions?: Submission[] }>('/api/algorank/submissions?limit=5', token),
        ])

      const userStats = rankingResponse.user
      const totalProblems = problemsResponse.pagination?.totalProblems ?? 0
      const now = Date.now()
      const upcomingSessions = sessions.filter((session) =>
        ['pending', 'accepted'].includes(session.status.toLowerCase()) &&
        new Date(session.scheduledTime).getTime() > now
      ).length
      const completedSessions = sessions.filter(
        (session) => session.status.toLowerCase() === 'completed'
      ).length

      setStats({
        resumesCount: resumes.length,
        resumesCompleted: resumes.filter(isResumeComplete).length,
        problemsSolved: userStats.totalProblemsSolved,
        totalProblems,
        acceptanceRate: userStats.acceptanceRate,
        currentStreak: userStats.currentStreak,
        rankingScore: userStats.rankingScore,
        userRank: userStats.rank,
        connectSessions: sessions.length,
        upcomingSessions,
        completedSessions,
      })
      setSessions(sessions)
      setRecentSessions(sessions.slice(0, 5))
      setRecentSubmissions(submissionsResponse.submissions ?? [])
      setRecentResumes(resumes.slice(0, 5))
    } catch (fetchError) {
      console.error('Failed to fetch dashboard data:', fetchError)
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDashboardStats()
  }, [fetchDashboardStats])

  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('careerhub.dashboard.widgets')
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences) as Partial<WidgetVisibility>
        setWidgetVisibility({
          ...defaultWidgetVisibility,
          ...Object.fromEntries(
            widgetOptions.map(({ key }) => [key, typeof parsed[key] === 'boolean' ? parsed[key] : true])
          ),
        })
      }
    } catch (preferencesError) {
      console.error('Failed to load dashboard widget preferences:', preferencesError)
    } finally {
      setWidgetPreferencesLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!widgetPreferencesLoaded) return

    try {
      localStorage.setItem('careerhub.dashboard.widgets', JSON.stringify(widgetVisibility))
    } catch (preferencesError) {
      console.error('Failed to save dashboard widget preferences:', preferencesError)
    }
  }, [widgetPreferencesLoaded, widgetVisibility])

  const visibleActivityWidgets = widgetVisibility.sessions || widgetVisibility.submissions || widgetVisibility.resumes

  const problemChartData = useMemo<ProblemChartEntry[]>(() => {
    if (stats.totalProblems <= 0) return []

    const solved = Math.min(stats.problemsSolved, stats.totalProblems)
    return [
      { name: 'Solved', value: solved, fill: chartColors[0] },
      { name: 'Available', value: Math.max(stats.totalProblems - solved, 0), fill: chartColors[1] },
    ].filter((entry) => entry.value > 0)
  }, [stats.problemsSolved, stats.totalProblems])

  const sessionChartData = useMemo<SessionChartEntry[]>(() => {
    const counts = sessions.reduce<Record<string, number>>((result, session) => {
      const status = session.status.toLowerCase()
      result[status] = (result[status] ?? 0) + 1
      return result
    }, {})

    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      fill: chartColors[index % chartColors.length],
    }))
  }, [sessions])

  const metricCards = [
    {
      title: 'Resumes created',
      value: stats.resumesCount,
      detail: `${stats.resumesCompleted} with profile details`,
      icon: FileText,
      iconClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      href: '/resume',
    },
    {
      title: 'Problems solved',
      value: stats.problemsSolved,
      detail: `Rank ${stats.userRank > 0 ? `#${stats.userRank}` : 'not ranked yet'}`,
      icon: Code2,
      iconClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
      href: '/algorank',
    },
    {
      title: 'Mentorship sessions',
      value: stats.connectSessions,
      detail: `${stats.completedSessions} completed`,
      icon: UsersRound,
      iconClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      href: '/connect/sessions',
    },
    {
      title: 'Upcoming sessions',
      value: stats.upcomingSessions,
      detail: 'Pending or accepted',
      icon: CalendarClock,
      iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      href: '/connect/sessions',
    },
  ]

  const performanceMetrics = [
    { title: 'Acceptance rate', value: `${stats.acceptanceRate.toFixed(1)}%`, icon: Target },
    { title: 'Current streak', value: `${stats.currentStreak} days`, icon: Flame },
    { title: 'Ranking score', value: stats.rankingScore.toFixed(0), icon: Trophy },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        <span>Loading your dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="mx-auto mt-8 max-w-xl">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div role="alert" className="text-sm text-destructive">{error}</div>
          <button
            type="button"
            onClick={() => void fetchDashboardStats()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Career overview</p>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Your progress across resumes, problem solving, and mentorship.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <details className="relative">
            <summary className="inline-flex h-9 cursor-pointer list-none items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted">
              <Settings2 className="size-4" aria-hidden="true" />
              Customize
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-lg">
              <p className="px-2 pb-2 text-sm font-semibold">Dashboard widgets</p>
              <div className="space-y-1">
                {widgetOptions.map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={widgetVisibility[key]}
                      onChange={(event) => setWidgetVisibility((current) => ({
                        ...current,
                        [key]: event.target.checked,
                      }))}
                      className="size-4 accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setWidgetVisibility(defaultWidgetVisibility)}
                className="mt-2 inline-flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Restore defaults
              </button>
            </div>
          </details>
          <Link
            to="/resume"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden="true" />
            Create resume
          </Link>
          <Link
            to="/algorank"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
          >
            Explore AlgoRank
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {widgetVisibility.metrics && <section aria-label="Career statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon
          return (
            <Link key={metric.title} to={metric.href} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{metric.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
                  </div>
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${metric.iconClass}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </section>}

      {(widgetVisibility.problemProgress || widgetVisibility.mentorship) && <section aria-label="Progress and activity" className="grid gap-4 xl:grid-cols-3">
        {widgetVisibility.problemProgress && <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>AlgoRank progress</CardTitle>
              <CardDescription className="mt-1">
                Your solved problems compared with the available library.
              </CardDescription>
            </div>
            <Link to="/algorank" className="text-sm font-medium text-primary hover:underline">
              Practice
            </Link>
          </CardHeader>
          <CardContent>
            {problemChartData.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                Problem library data is not available yet.
              </div>
            ) : (
              <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(160px,0.8fr)]">
                <Suspense fallback={<div className="h-52 animate-pulse rounded-lg bg-muted/50" />}>
                  <DashboardDonutChart
                    data={problemChartData}
                    centerValue={stats.problemsSolved}
                    centerLabel="solved"
                    valueLabel="Problems"
                    className="h-52 min-w-0"
                  />
                </Suspense>
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Library completion</span>
                      <span className="font-medium tabular-nums">
                        {Math.min((stats.problemsSolved / stats.totalProblems) * 100, 100).toFixed(1)}%
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label="Problem library completion"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min((stats.problemsSolved / stats.totalProblems) * 100, 100)}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min((stats.problemsSolved / stats.totalProblems) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {problemChartData.map((item) => (
                      <div key={item.name} className="rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="size-2 rounded-full" style={{ backgroundColor: item.fill }} />
                          {item.name}
                        </div>
                        <p className="mt-2 text-lg font-semibold tabular-nums">{item.value.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>}

        {widgetVisibility.mentorship && <Card>
          <CardHeader>
            <CardTitle>Mentorship activity</CardTitle>
            <CardDescription>Session status across your bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            {sessionChartData.length === 0 ? (
              <EmptyState
                icon={UsersRound}
                message="No mentorship sessions yet."
                link="/connect"
                linkLabel="Find a mentor"
              />
            ) : (
              <>
                <Suspense fallback={<div className="h-44 animate-pulse rounded-lg bg-muted/50" />}>
                  <DashboardDonutChart
                    data={sessionChartData}
                    centerValue={stats.connectSessions}
                    centerLabel="total"
                    valueLabel="Sessions"
                    className="h-44"
                    innerRadius={48}
                    outerRadius={72}
                  />
                </Suspense>
                <div className="mt-3 space-y-2">
                  {sessionChartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 capitalize text-muted-foreground">
                        <span className="size-2 rounded-full" style={{ backgroundColor: item.fill }} />
                        {item.name}
                      </span>
                      <span className="font-medium tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>}
      </section>}

      {widgetVisibility.performance && <section aria-label="AlgoRank performance" className="grid gap-4 sm:grid-cols-3">
        {performanceMetrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.title}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">{metric.value}</p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          )
        })}
      </section>}

      {visibleActivityWidgets && <section aria-label="Recent activity" className="grid gap-4 xl:grid-cols-3">
        {widgetVisibility.sessions && <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent sessions</CardTitle>
              <CardDescription className="mt-1">Your latest mentorship activity.</CardDescription>
            </div>
            <Link to="/connect/sessions" aria-label="View all sessions" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <EmptyState icon={UsersRound} message="No sessions to show." link="/connect" linkLabel="Find mentors" />
            ) : (
              <div className="space-y-1">
                {recentSessions.slice(0, 4).map((session) => (
                  <div key={session.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{session.topic || 'Mentorship session'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(session.scheduledTime)}</p>
                    </div>
                    <StatusBadge status={session.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>}

        {widgetVisibility.submissions && <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent submissions</CardTitle>
              <CardDescription className="mt-1">Your latest AlgoRank attempts.</CardDescription>
            </div>
            <Link to="/algorank/submissions" aria-label="View all submissions" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <EmptyState icon={Code2} message="No submissions to show." link="/algorank" linkLabel="Solve a problem" />
            ) : (
              <div className="space-y-1">
                {recentSubmissions.slice(0, 4).map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{submission.problem?.title || 'Untitled problem'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(submission.createdAt)}</p>
                    </div>
                    <StatusBadge status={submission.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>}

        {widgetVisibility.resumes && <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent resumes</CardTitle>
              <CardDescription className="mt-1">Keep your career materials current.</CardDescription>
            </div>
            <Link to="/resume" aria-label="View all resumes" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentResumes.length === 0 ? (
              <EmptyState icon={FileText} message="No resumes to show." link="/resume" linkLabel="Create a resume" />
            ) : (
              <div className="space-y-1">
                {recentResumes.slice(0, 4).map((resume) => (
                  <Link
                    key={resume.id}
                    to={`/resume-builder/${resume.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{resume.title || 'Untitled resume'}</p>
                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {resume.template} · {formatDate(resume.createdAt)}
                      </p>
                    </div>
                    {isResumeComplete(resume) && (
                      <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="Resume has profile details" />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>}
      </section>}

      {widgetVisibility.quickActions && <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Pick up where you want to make progress.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: FileText, label: 'Create a resume', description: 'Build or update your profile', href: '/resume' },
            { icon: BookOpen, label: 'Practice problems', description: 'Continue with AlgoRank', href: '/algorank' },
            { icon: UsersRound, label: 'Find a mentor', description: 'Get guidance from alumni', href: '/connect' },
            { icon: CalendarClock, label: 'View sessions', description: 'Manage your mentorships', href: '/connect/sessions' },
          ].map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.label}
                to={action.href}
                className="group flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{action.label}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{action.description}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            )
          })}
        </CardContent>
      </Card>}
    </div>
  )
}
