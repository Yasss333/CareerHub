import { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, Star, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalSessions: number;
    completedSessions: number;
    pendingSessions: number;
    acceptedSessions: number;
    cancelledSessions: number;
    rejectedSessions: number;
    upcomingSessions: number;
  };
  metrics: {
    averageDuration: number;
    averageRating: number;
    completionRate: number;
  };
  sessionsByMonth: Record<string, { total: number; completed: number; cancelled: number }>;
  recentSessions: any[];
}

interface SessionAnalyticsProps {
  role?: 'junior' | 'senior' | 'all';
}

const SessionAnalytics = ({ role: initialRole = 'all' }: SessionAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState(initialRole);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = role !== 'all' ? `?role=${role}` : '';
      const response = await fetch(`/api/connect/analytics${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Session Analytics
        </h2>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'junior' | 'senior' | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Sessions</option>
          <option value="junior">As Junior</option>
          <option value="senior">As Senior</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Sessions"
          value={analytics.overview.totalSessions}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={analytics.overview.completedSessions}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={Clock}
          label="Upcoming"
          value={analytics.overview.upcomingSessions}
          color="bg-yellow-100 text-yellow-600"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending"
          value={analytics.overview.pendingSessions}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard
          icon={Clock}
          label="Avg Duration (min)"
          value={analytics.metrics.averageDuration}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={Star}
          label="Avg Rating"
          value={analytics.metrics.averageRating.toFixed(1)}
          color="bg-yellow-100 text-yellow-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Completion Rate"
          value={`${analytics.metrics.completionRate}%`}
          color="bg-green-100 text-green-600"
        />
      </div>

      {/* Session Status Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{analytics.overview.acceptedSessions}</p>
            <p className="text-sm text-gray-600">Accepted</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{analytics.overview.completedSessions}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{analytics.overview.pendingSessions}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{analytics.overview.cancelledSessions}</p>
            <p className="text-sm text-gray-600">Cancelled</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">{analytics.overview.rejectedSessions}</p>
            <p className="text-sm text-gray-600">Rejected</p>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      {Object.keys(analytics.sessionsByMonth).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          <div className="space-y-3">
            {Object.entries(analytics.sessionsByMonth)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([month, data]) => (
                <div key={month} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600">{month}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all"
                      style={{ width: `${(data.completed / data.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-600 whitespace-nowrap">
                    {data.completed}/{data.total} completed
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {analytics.recentSessions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>
          <div className="space-y-3">
            {analytics.recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{session.topic}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(session.scheduledTime).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  session.status === 'completed' ? 'bg-green-100 text-green-700' :
                  session.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                  session.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionAnalytics;