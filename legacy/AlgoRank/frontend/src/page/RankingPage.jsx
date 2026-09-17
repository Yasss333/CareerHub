import React, { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useRankingStore } from "../store/useRankingStore";
import Leaderboard from "../Components/Leaderboard";
import { Trophy, Target, TrendingUp, Clock, Award, Users } from "lucide-react";

const RankingPage = () => {
  const { authUser } = useAuthStore();
  const { userRank, rankingStats, getUserRanking, getUserRankingStats } = useRankingStore();

  useEffect(() => {
    if (authUser) {
      getUserRanking(authUser.id);
      getUserRankingStats(authUser.id);
    }
  }, [authUser, getUserRanking, getUserRankingStats]);

  if (!authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-base-content/70">Please log in to view rankings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 to-base-200 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            Global Leaderboard
          </h1>
          <p className="text-base-content/70">
            Compete with developers worldwide and climb the ranks
          </p>
        </div>

        {/* User Ranking Summary Card */}
        {userRank && (
          <div className="card bg-base-100 shadow-xl border-2 border-primary">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {authUser.image ? (
                    <div className="avatar">
                      <div className="w-16 h-16 rounded-full">
                        <img src={authUser.image} alt={authUser.name || "User"} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold">
                      {authUser.name
                        ? authUser.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                        : "U"}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{authUser.name || "Anonymous"}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge badge-lg ${userRank.rank <= 3 ? "badge-warning" : "badge-primary"}`}>
                        #{userRank.rank}
                      </span>
                      <span className="text-sm text-base-content/60">Global Rank</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-primary mb-1">
                      <Award className="w-5 h-5" />
                      <span className="text-sm font-semibold">Score</span>
                    </div>
                    <div className="text-2xl font-bold">{userRank.rankingScore.toFixed(1)}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-success mb-1">
                      <Target className="w-5 h-5" />
                      <span className="text-sm font-semibold">Solved</span>
                    </div>
                    <div className="text-2xl font-bold">{userRank.totalProblemsSolved}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-info mb-1">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-sm font-semibold">Acceptance</span>
                    </div>
                    <div className="text-2xl font-bold">{userRank.acceptanceRate.toFixed(1)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-warning mb-1">
                      <Clock className="w-5 h-5" />
                      <span className="text-sm font-semibold">Streak</span>
                    </div>
                    <div className="text-2xl font-bold">{userRank.currentStreak} days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Statistics */}
        {rankingStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h3 className="card-title text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-success" />
                  Difficulty Breakdown
                </h3>
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Easy</span>
                    <span className="badge badge-success">{rankingStats.difficultyBreakdown.EASY || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medium</span>
                    <span className="badge badge-warning">{rankingStats.difficultyBreakdown.MEDIUM || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Hard</span>
                    <span className="badge badge-error">{rankingStats.difficultyBreakdown.HARD || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h3 className="card-title text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Recent Activity
                </h3>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-primary">{rankingStats.recentActivity}</div>
                  <div className="text-sm text-base-content/60">Problems solved in last 7 days</div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h3 className="card-title text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-warning" />
                  Total Progress
                </h3>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-warning">{rankingStats.totalSolved}</div>
                  <div className="text-sm text-base-content/60">Total problems solved</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <Leaderboard limit={20} showPagination={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingPage;