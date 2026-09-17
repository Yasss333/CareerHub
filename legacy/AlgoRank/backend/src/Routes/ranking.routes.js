import express from "express";
import {
  getGlobalLeaderboard,
  getUserRanking,
  getUserRankingStats,
  recalculateAllStreaks
} from "../Controller/ranking.controller.js";
import { verfiyJWT } from "../Middleware/userverifymiddlware.js";

const router = express.Router();

// Get global leaderboard with pagination
router.get("/leaderboard", verfiyJWT, getGlobalLeaderboard);

// Get individual user's ranking
router.get("/user-rank/:userId", verfiyJWT, getUserRanking);

// Get detailed ranking statistics for a user
router.get("/stats/:userId", verfiyJWT, getUserRankingStats);

// Recalculate all streaks (admin only or scheduled job)
router.post("/recalculate-streaks", verfiyJWT, recalculateAllStreaks);

export default router;