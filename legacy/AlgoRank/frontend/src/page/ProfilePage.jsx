import React, { useEffect, useMemo } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useProblemStore } from "../store/useProblemStore";
import { usePlaylistStore } from "../store/usePlaylistStore";
import { useSubmissionStore } from "../store/useSubmissionStore";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Shield,
  Mail,
  Calendar,
  Code,
  BookOpen,
  Trophy,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import ContributionGraph from "../Components/ContributionGraph";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { problems, getAllProblems, isProblemsLoading } = useProblemStore();
  const { playlists, getAllPlaylists, isLoading: isPlaylistsLoading } = usePlaylistStore();
  const { submissions, getAllSubmissions, isLoading: isSubmissionsLoading } = useSubmissionStore();

  useEffect(() => {
    if (authUser) {
      getAllPlaylists();
      getAllSubmissions();
      if (authUser.role === "ADMIN") {
        getAllProblems();
      }
    }
  }, [authUser, getAllPlaylists, getAllSubmissions, getAllProblems]);

  // Filter problems created by current user (if admin)
  const myProblems = useMemo(() => {
    if (!authUser || authUser.role !== "ADMIN" || !problems) return [];
    return problems.filter((p) => p.userID === authUser.id);
  }, [problems, authUser]);

  // Calculate stats
  const stats = useMemo(() => {
    const solvedCount = problems?.filter((p) => 
      p.solvedBy?.some((s) => s.userID === authUser?.id)
    ).length || 0;

    const totalSubmissions = submissions?.length || 0;
    const acceptedSubmissions = submissions?.filter(
      (s) => s.status === "Accepted"
    ).length || 0;

    const acceptanceRate = totalSubmissions > 0 
      ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1)
      : 0;

    return {
      solvedCount,
      totalSubmissions,
      acceptedSubmissions,
      acceptanceRate,
      problemsCreated: myProblems.length,
      playlistsCount: playlists?.length || 0,
    };
  }, [problems, submissions, myProblems, playlists, authUser]);

  if (!authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-base-content/70">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 to-base-200 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div>
                {authUser.image ? (
                  <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-base-200 shadow-sm">
                    <img src={authUser.image} alt={authUser.name || "User"} className="object-cover w-full h-full" />
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                    {authUser.name
                      ? authUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : "AD"}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{authUser.name || "User"}</h1>
                  <span className={`badge badge-lg ${authUser.role === "ADMIN" ? "badge-neutral" : "badge-primary"}`}>
                    {authUser.role === "ADMIN" ? (
                      <>
                        <Shield className="w-4 h-4 mr-1" />
                        Administrator
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 mr-1" />
                        User
                      </>
                    )}
                  </span>
                  <Link to="/profile/edit" className="btn btn-sm btn-outline ml-3">
                    Edit Profile
                  </Link>
                </div>
                <div className="space-y-2 text-base-content/70">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{authUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined {new Date(authUser.createdAt || Date.now()).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {/* Professional subtitle / bio */}
                  <div className="mt-2 text-sm text-base-content/70">
                    <div className="font-medium">{authUser.role === "ADMIN" ? "Platform Administrator" : "Learner"}</div>
                    <div className="mt-1">
                      {authUser.bio || "Passionate about building developer tools and improving the learning experience for algorithm practice."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-4">
              <div className="flex items-center gap-2 text-base-content/70 mb-1">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="text-sm font-semibold">Solved</span>
              </div>
              <div className="text-2xl font-bold">{stats.solvedCount}</div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-4">
              <div className="flex items-center gap-2 text-base-content/70 mb-1">
                <Code className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold">Submissions</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-4">
              <div className="flex items-center gap-2 text-base-content/70 mb-1">
                <TrendingUp className="w-5 h-5 text-info" />
                <span className="text-sm font-semibold">Acceptance</span>
              </div>
              <div className="text-2xl font-bold">{stats.acceptanceRate}%</div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-4">
              <div className="flex items-center gap-2 text-base-content/70 mb-1">
                <Trophy className="w-5 h-5 text-warning" />
                <span className="text-sm font-semibold">Created</span>
              </div>
              <div className="text-2xl font-bold">{stats.problemsCreated}</div>
            </div>
          </div>
        </div>

        {/* Contribution Graph */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Contribution Graph
            </h2>
            <ContributionGraph submissions={submissions || []} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Problems (Admin Only) */}
          {authUser.role === "ADMIN" && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="card-title flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    My Problems
                  </h2>
                  <Link to="/add-problem" className="btn btn-primary btn-sm">
                    Add Problem
                  </Link>
                </div>
                {isProblemsLoading ? (
                  <div className="flex justify-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </div>
                ) : myProblems.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {myProblems.map((problem) => (
                      <Link
                        key={problem.id}
                        to={`/problem/${problem.id}`}
                        className="block card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
                      >
                        <div className="card-body p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{problem.title}</h3>
                              <div className="flex items-center gap-2 mt-2">
                                <span
                                  className={`badge badge-sm ${
                                    problem.difficulty === "EASY"
                                      ? "badge-success"
                                      : problem.difficulty === "MEDIUM"
                                      ? "badge-warning"
                                      : "badge-error"
                                  }`}
                                >
                                  {problem.difficulty}
                                </span>
                                <span className="text-sm text-base-content/70">
                                  {new Date(problem.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-base-content/70">
                    <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No problems created yet</p>
                    <Link to="/add-problem" className="btn btn-primary btn-sm mt-4">
                      Create Your First Problem
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Playlists */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                My Playlists
              </h2>
              {isPlaylistsLoading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : playlists && playlists.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      onClick={() => navigate(`/playlist/${playlist.id}`)}
                      className="block card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{playlist.name}</h3>
                            <p className="text-sm text-base-content/70 mt-1">
                              {playlist.description || "No description"}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-base-content/70">
                              <span>
                                {playlist.problems?.length || 0} problems
                              </span>
                              <span>
                                {new Date(playlist.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-base-content/70">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No playlists created yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
