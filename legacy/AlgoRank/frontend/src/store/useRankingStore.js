import { create } from "zustand";
import api from "../lib/axios";
import toast from "react-hot-toast";

export const useRankingStore = create((set) => ({
  leaderboard: [],
  userRank: null,
  rankingStats: null,
  isLoadingLeaderboard: false,
  isLoadingUserRank: false,
  isLoadingStats: false,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPreviousPage: false
  },

  // Get global leaderboard with pagination
  getLeaderboard: async (page = 1, limit = 20, sortBy = "rankingScore") => {
    set({ isLoadingLeaderboard: true });
    try {
      const res = await api.get("/ranking/leaderboard", {
        params: { page, limit, sortBy }
      });

      if (res.data.success) {
        set({
          leaderboard: res.data.leaderboard,
          pagination: res.data.pagination,
          isLoadingLeaderboard: false
        });
      } else {
        set({ leaderboard: [], isLoadingLeaderboard: false });
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast.error("Failed to fetch leaderboard");
      set({ leaderboard: [], isLoadingLeaderboard: false });
    }
  },

  // Get individual user's ranking
  getUserRanking: async (userId) => {
    set({ isLoadingUserRank: true });
    try {
      const res = await api.get(`/ranking/user-rank/${userId}`);

      if (res.data.success) {
        set({
          userRank: res.data.user,
          isLoadingUserRank: false
        });
      } else {
        set({ userRank: null, isLoadingUserRank: false });
      }
    } catch (error) {
      console.error("Error fetching user ranking:", error);
      set({ userRank: null, isLoadingUserRank: false });
    }
  },

  // Get detailed ranking statistics for a user
  getUserRankingStats: async (userId) => {
    set({ isLoadingStats: true });
    try {
      const res = await api.get(`/ranking/stats/${userId}`);

      if (res.data.success) {
        set({
          rankingStats: res.data.stats,
          isLoadingStats: false
        });
      } else {
        set({ rankingStats: null, isLoadingStats: false });
      }
    } catch (error) {
      console.error("Error fetching ranking stats:", error);
      set({ rankingStats: null, isLoadingStats: false });
    }
  },

  // Clear ranking data
  clearRankingData: () => {
    set({
      leaderboard: [],
      userRank: null,
      rankingStats: null,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        hasNextPage: false,
        hasPreviousPage: false
      }
    });
  }
}));