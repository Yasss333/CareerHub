import React, { useEffect } from "react";

import { useProblemStore } from "../store/useProblemStore";
import { Loader, Trophy } from "lucide-react";
import ProblemTable from "../Components/ProblemTable";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

const HomePage = () => {
  const { getAllProblems, problems, isProblemsLoading } = useProblemStore();

  useEffect(() => {
    getAllProblems();
  }, [getAllProblems]);

  useEffect(() => {
    console.log("Problems in store:", problems);
    console.log("Problems length:", problems?.length);
  }, [problems]);

  const { authUser } = useAuthStore();

  if(isProblemsLoading){
    return (
      <div className="flex items-center justify-center h-screen">
          <Loader className="size-10 animate-spin"/>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center mt-14 px-4">
      <div className="absolute top-16 left-0 w-1/3 h-1/3 bg-primary opacity-30 blur-3xl rounded-md bottom-9"></div>
      <h1 className="text-4xl font-extrabold z-10 text-center">
        Welcome to <span className="text-primary">AlgoRank</span>
      </h1>

      <p className="mt-4 text-center text-lg font-semibold text-gray-500 dark:text-gray-400 z-10">
        A Platform Inspired by Leetcode/TUF+ which helps you to prepare for coding
        interviews and helps you to improve your coding skills by solving coding
        problems. Compete with others on the global leaderboard!
      </p>

      {/* Hero CTAs and stats */}
      <div className="mt-6 flex flex-col md:flex-row items-center gap-4 z-10">
        <div className="flex gap-3">
          <Link to="/" className="btn btn-primary">Explore Problems</Link>
          <Link to="/ranking" className="btn btn-secondary gap-2">
            <Trophy className="w-4 h-4" />
            Leaderboard
          </Link>
          {authUser && authUser.role === "ADMIN" && (
            <Link to="/add-problem" className="btn btn-outline">Add Problem</Link>
          )}
        </div>
        <div className="ml-0 md:ml-6 bg-base-100 p-3 rounded-md shadow-sm">
          <div className="text-sm text-base-content/70">Total Problems</div>
          <div className="text-2xl font-bold">{problems?.length || 0}</div>
        </div>
      </div>
      {
        problems.length > 0 ? <ProblemTable problems={problems}/> : (
            <p className="mt-10 text-center text-lg font-semibold text-gray-500 dark:text-gray-400 z-10 border border-primary px-4 py-2 rounded-md border-dashed">
          No problems found
        </p>
        )
      }
    </div>
  );
};

export default HomePage;