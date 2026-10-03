import { useState, useEffect } from 'react';
import { Trophy, Medal, TrendingUp, Award, Target } from 'lucide-react';
import { api } from '../lib/api';

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  totalProblemsSolved: number;
  acceptanceRate: number;
  currentStreak: number;
  longestStreak: number;
  rankingScore: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'weekly' | 'monthly'>('all');

  const fetchLeaderboard = async () => {
    try {
      const data = await api<{ leaderboard: LeaderboardEntry[]; userRank?: LeaderboardEntry }>(
        `/algorank/leaderboard?timeFilter=${timeFilter}`
      );
      setLeaderboard(data.leaderboard);
      setUserRank(data.userRank || null);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFilter]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 border-yellow-200';
    if (rank === 2) return 'bg-gray-50 border-gray-200';
    if (rank === 3) return 'bg-amber-50 border-amber-200';
    return 'bg-white border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-gray-600 mt-2">Top performers in algorithmic problem solving</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTimeFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            timeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => setTimeFilter('weekly')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            timeFilter === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setTimeFilter('monthly')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            timeFilter === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Month
        </button>
      </div>

      {/* User's Rank */}
      {userRank && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {userRank.rank}
              </div>
              <div>
                <p className="text-sm text-gray-600">Your Rank</p>
                <p className="text-lg font-bold text-gray-900">{userRank.user.name}</p>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-gray-600">Solved</p>
                <p className="font-bold text-gray-900">{userRank.totalProblemsSolved}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Acceptance</p>
                <p className="font-bold text-gray-900">{userRank.acceptanceRate.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Streak</p>
                <p className="font-bold text-gray-900">{userRank.currentStreak}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8 h-48">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <img
              src={leaderboard[1].user.avatar || '/default-avatar.png'}
              alt={leaderboard[1].user.name}
              className="w-16 h-16 rounded-full border-4 border-gray-300 mb-2"
            />
            <p className="font-semibold text-gray-900 text-sm">{leaderboard[1].user.name}</p>
            <p className="text-xs text-gray-600">{leaderboard[1].totalProblemsSolved} solved</p>
            <div className="w-20 h-24 bg-gray-200 rounded-t-lg mt-2 flex items-start justify-center pt-2">
              <Medal className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <img
              src={leaderboard[0].user.avatar || '/default-avatar.png'}
              alt={leaderboard[0].user.name}
              className="w-20 h-20 rounded-full border-4 border-yellow-400 mb-2"
            />
            <p className="font-bold text-gray-900">{leaderboard[0].user.name}</p>
            <p className="text-sm text-gray-600">{leaderboard[0].totalProblemsSolved} solved</p>
            <div className="w-24 h-32 bg-yellow-100 rounded-t-lg mt-2 flex items-start justify-center pt-2">
              <Trophy className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <img
              src={leaderboard[2].user.avatar || '/default-avatar.png'}
              alt={leaderboard[2].user.name}
              className="w-16 h-16 rounded-full border-4 border-amber-600 mb-2"
            />
            <p className="font-semibold text-gray-900 text-sm">{leaderboard[2].user.name}</p>
            <p className="text-xs text-gray-600">{leaderboard[2].totalProblemsSolved} solved</p>
            <div className="w-20 h-20 bg-amber-100 rounded-t-lg mt-2 flex items-start justify-center pt-2">
              <Medal className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Solved</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acceptance</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Streak</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leaderboard.map((entry) => (
              <tr key={entry.user.id} className={`hover:bg-gray-50 ${getRankColor(entry.rank)}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getRankIcon(entry.rank)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <img
                      src={entry.user.avatar || '/default-avatar.png'}
                      alt={entry.user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="font-medium text-gray-900">{entry.user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="font-semibold">{entry.totalProblemsSolved}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`font-semibold ${
                    entry.acceptanceRate >= 80 ? 'text-green-600' :
                    entry.acceptanceRate >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {entry.acceptanceRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold">{entry.currentStreak}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Award className="w-4 h-4 text-purple-500" />
                    <span className="font-semibold">{entry.rankingScore.toFixed(0)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leaderboard.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No rankings yet</h3>
          <p className="text-gray-600">Start solving problems to appear on the leaderboard!</p>
        </div>
      )}
    </div>
  );
}