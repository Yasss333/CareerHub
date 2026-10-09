import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, FileText, Code, Users, MessageSquare, Trophy, Settings, LogOut, Bell, Sun, Moon, ChevronRight, ArrowUpRight, Plus, TrendingUp, DollarSign, Users as UsersIcon, Target, Activity, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useDarkMode } from '../contexts/DarkModeContext';

export default function Dashboard() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [stats, setStats] = useState({
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
    mentorRating: 0,
  });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [recentResumes, setRecentResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');

      // Resume Builder stats
      const resumesResponse = await fetch('/api/resume', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resumesData = await resumesResponse.json();
      const resumes = Array.isArray(resumesData) ? resumesData : [];
      const resumesCount = resumes.length;
      const resumesCompleted = resumes.filter((r: any) => r.template && r.sections).length;

      // Senior Connect stats
      const connectResponse = await fetch('/api/connect/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const connectData = await connectResponse.json();
      const connectSessions = Array.isArray(connectData) ? connectData : [];
      const upcomingSessions = connectSessions.filter((s: any) =>
        ['pending', 'accepted'].includes(s.status) && new Date(s.scheduledTime) > new Date()
      ).length;
      const completedSessions = connectSessions.filter((s: any) => s.status === 'completed').length;

      // User stats (includes AlgoRank data)
      const userResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = await userResponse.json();

      // AlgoRank stats
      const problemsResponse = await fetch('/api/algorank/problems?limit=1');
      const problemsData = await problemsResponse.json();
      const totalProblems = problemsData.pagination?.totalProblems || 0;

      // User rank
      let userRank = 0;
      try {
        const rankResponse = await fetch('/api/algorank/ranking/user/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (rankResponse.ok) {
          const rankData = await rankResponse.json();
          userRank = rankData.rank || 0;
        }
      } catch (e) {
        // Ignore rank fetch errors
      }

      // Recent submissions
      try {
        const submissionsResponse = await fetch('/api/algorank/submissions?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          setRecentSubmissions(Array.isArray(submissionsData.submissions) ? submissionsData.submissions : []);
        }
      } catch (e) {
        // Ignore submission fetch errors
      }

      setStats({
        resumesCount,
        resumesCompleted,
        problemsSolved: userData.totalProblemsSolved || 0,
        totalProblems,
        acceptanceRate: userData.acceptanceRate || 0,
        currentStreak: userData.currentStreak || 0,
        rankingScore: userData.rankingScore || 0,
        userRank,
        connectSessions: connectSessions.length,
        upcomingSessions,
        completedSessions,
        mentorRating: userData.rating || 0,
      });

      setRecentSessions(connectSessions.slice(0, 5));
      setRecentResumes(resumes.slice(0, 3));
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Resumes Created',
      value: stats.resumesCount,
      subtitle: `${stats.resumesCompleted} completed`,
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      link: '/resume',
    },
    {
      title: 'Problems Solved',
      value: stats.problemsSolved,
      subtitle: `Rank #${stats.userRank}`,
      icon: Code,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      link: '/algorank',
    },
    {
      title: 'Mentorship Sessions',
      value: stats.connectSessions,
      subtitle: `${stats.completedSessions} completed`,
      icon: Users,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      link: '/connect/sessions',
    },
    {
      title: 'Upcoming Sessions',
      value: stats.upcomingSessions,
      subtitle: 'Scheduled',
      icon: Bell,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      link: '/connect/sessions',
    },
  ];

  const performanceCards = [
    {
      title: 'Acceptance Rate',
      value: `${stats.acceptanceRate.toFixed(1)}%`,
      icon: Target,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Current Streak',
      value: `${stats.currentStreak} days`,
      icon: TrendingUp,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Ranking Score',
      value: stats.rankingScore.toFixed(0),
      icon: Trophy,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
  ];

  const navItems = [
    { icon: Home, label: 'Overview', href: '/' },
    { icon: FileText, label: 'Resumes', href: '/resume' },
    { icon: Code, label: 'AlgoRank', href: '/algorank' },
    { icon: Users, label: 'Senior Connect', href: '/connect' },
    { icon: MessageSquare, label: 'AI Interview', href: '/interview' },
    { icon: Trophy, label: 'Leaderboard', href: '/algorank/leaderboard' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  const quickActions = [
    { icon: FileText, label: 'Create Resume', href: '/resume', color: 'bg-blue-500' },
    { icon: Code, label: 'Solve Problem', href: '/algorank', color: 'bg-purple-500' },
    { icon: Users, label: 'Find Mentor', href: '/connect', color: 'bg-orange-500' },
    { icon: Plus, label: 'New Session', href: '/connect/sessions', color: 'bg-green-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 p-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CH</span>
          </div>
          <span className="text-xl font-bold">CareerHub</span>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back! Here's what's happening with your career.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} to={card.link}>
                <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">{card.title}</p>
                        <p className="text-2xl font-bold">{card.value}</p>
                        {card.subtitle && (
                          <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                        )}
                      </div>
                      <div className={`p-3 rounded-lg ${card.bgColor}`}>
                        <Icon className={`w-6 h-6 ${card.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {performanceCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">{card.title}</p>
                      <p className="text-2xl font-bold">{card.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${card.bgColor}`}>
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Sessions */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Your latest mentorship sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No sessions yet</p>
                  <Link to="/connect" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
                    Find mentors →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{session.topic}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(session.scheduledTime).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        session.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        session.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
                        session.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Submissions */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Your latest AlgoRank submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSubmissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No submissions yet</p>
                  <Link to="/algorank" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
                    Start solving →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentSubmissions.slice(0, 5).map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{sub.problem?.title || 'Unknown Problem'}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        sub.status === 'Accepted' ? 'bg-green-500/20 text-green-400' :
                        sub.status === 'Wrong Answer' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Resumes */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Recent Resumes</CardTitle>
              <CardDescription>Your latest resume drafts</CardDescription>
            </CardHeader>
            <CardContent>
              {recentResumes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No resumes yet</p>
                  <Link to="/resume" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
                    Create resume →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentResumes.slice(0, 5).map((resume: any) => (
                    <div key={resume.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{resume.template || 'Untitled'}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(resume.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {resume.sections && Object.keys(resume.sections).length > 0 && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with these common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} to={action.href}>
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                      <div className={`p-3 rounded-full ${action.color} mb-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium">{action.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
