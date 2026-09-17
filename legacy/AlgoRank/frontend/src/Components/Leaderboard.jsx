import React, { useEffect, useState } from "react";
import { useRankingStore } from "../store/useRankingStore";
import { useAuthStore } from "../store/useAuthStore";
import { Trophy, Medal, TrendingUp, Clock, Target, ArrowUpDown, ChevronLeft, ChevronRight, Crown } from "lucide-react";

const Leaderboard = ({ limit = 20, showPagination = true }) => {
  const { authUser } = useAuthStore();
  const {
    leaderboard,
    pagination,
    isLoadingLeaderboard,
    getLeaderboard
  } = useRankingStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("rankingScore");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    getLeaderboard(currentPage, limit, sortBy);
  }, [currentPage, sortBy, limit, getLeaderboard]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-semibold text-base-content/60">#{rank}</span>;
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return "badge-warning";
    if (rank === 2) return "badge-neutral";
    if (rank === 3) return "badge-amber-700";
    return "badge-primary badge-outline";
  };

  if (isLoadingLeaderboard && leaderboard.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with sorting options */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Global Leaderboard</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="select select-bordered select-sm"
          >
            <option value="rankingScore">Ranking Score</option>
            <option value="totalProblemsSolved">Problems Solved</option>
            <option value="acceptanceRate">Acceptance Rate</option>
            <option value="currentStreak">Current Streak</option>
            <option value="longestStreak">Longest Streak</option>
          </select>
          
          <button
            onClick={() => handleSortChange(sortBy)}
            className="btn btn-sm btn-outline"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === "desc" ? "Descending" : "Ascending"}
          </button>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th className="w-16">Rank</th>
              <th>User</th>
              <th>Score</th>
              <th>Solved</th>
              <th>Acceptance</th>
              <th>Streak</th>
              <th>Best Streak</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((user) => (
              <tr
                key={user.id}
                className={user.id === authUser?.id ? "bg-primary/10 font-semibold" : ""}
              >
                <td>
                  <div className="flex items-center gap-2">
                    {getRankIcon(user.rank)}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <div className="avatar">
                        <div className="w-8 h-8 rounded-full">
                          <img src={user.image} alt={user.name || "User"} />
                        </div>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold">
                        {user.name
                          ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                          : "U"}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{user.name || "Anonymous"}</div>
                      {user.id === authUser?.id && (
                        <span className="badge badge-xs badge-primary ml-2">You</span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="font-bold text-primary">{user.rankingScore.toFixed(1)}</div>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-success" />
                    <span>{user.totalProblemsSolved}</span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-info" />
                    <span>{user.acceptanceRate.toFixed(1)}%</span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-warning" />
                    <span>{user.currentStreak} days</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${getRankBadgeColor(user.longestStreak)}`}>
                    {user.longestStreak} days
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {leaderboard.length === 0 && !isLoadingLeaderboard && (
        <div className="text-center py-12 text-base-content/60">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No users on the leaderboard yet</p>
          <p className="text-sm mt-2">Start solving problems to appear on the leaderboard!</p>
        </div>
      )}

      {/* Pagination */}
      {showPagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.hasPreviousPage}
            className="btn btn-sm btn-outline"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <span className="px-4 py-2 bg-base-200 rounded-md">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="btn btn-sm btn-outline"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* User rank info */}
      {authUser && !leaderboard.find(u => u.id === authUser.id) && (
        <div className="alert alert-info mt-4">
          <Trophy className="w-5 h-5" />
          <div>
            <h3 className="font-bold">Your Rank</h3>
            <div className="text-xs">Start solving problems to appear on the leaderboard!</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;