import { db } from "../libs/db.js";
import { updateUserRankingStats } from "../utils/rankingUtils.js";

// Get global leaderboard with pagination
export const getGlobalLeaderboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || "rankingScore";
    const sortOrder = req.query.sortOrder || "desc";

    const skip = (page - 1) * limit;

    // Validate sortBy parameter
    const validSortFields = ["rankingScore", "totalProblemsSolved", "acceptanceRate", "currentStreak", "longestStreak"];
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        error: "Invalid sortBy parameter",
        validFields
      });
    }

    // Get total count for pagination
    const totalCount = await db.user.count({
      where: {
        role: "USER" // Only rank regular users, not admins
      }
    });

    // Get leaderboard data
    const leaderboard = await db.user.findMany({
      where: {
        role: "USER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        totalProblemsSolved: true,
        acceptanceRate: true,
        averageSolveTime: true,
        currentStreak: true,
        longestStreak: true,
        rankingScore: true,
        createdAt: true
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    });

    // Add rank positions
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: skip + index + 1
    }));

    res.status(200).json({
      success: true,
      message: "Leaderboard fetched successfully",
      leaderboard: rankedLeaderboard,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalUsers: totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      message: "Failed to fetch leaderboard",
      error: error.message
    });
  }
};

// Get individual user's ranking position and stats
export const getUserRanking = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's current stats
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        totalProblemsSolved: true,
        acceptanceRate: true,
        averageSolveTime: true,
        currentStreak: true,
        longestStreak: true,
        rankingScore: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    // Calculate user's rank by rankingScore
    const usersWithHigherScore = await db.user.count({
      where: {
        role: "USER",
        rankingScore: {
          gt: user.rankingScore
        }
      }
    });

    const userRank = usersWithHigherScore + 1;

    // Get nearby users for context
    const nearbyUsers = await db.user.findMany({
      where: {
        role: "USER",
        id: { not: userId }
      },
      select: {
        id: true,
        name: true,
        image: true,
        totalProblemsSolved: true,
        acceptanceRate: true,
        currentStreak: true,
        rankingScore: true
      },
      orderBy: {
        rankingScore: "desc"
      },
      take: 5
    });

    res.status(200).json({
      success: true,
      message: "User ranking fetched successfully",
      user: {
        ...user,
        rank: userRank
      },
      nearbyUsers
    });
  } catch (error) {
    console.error("Error fetching user ranking:", error);
    res.status(500).json({
      message: "Failed to fetch user ranking",
      error: error.message
    });
  }
};

// Get detailed ranking statistics for a user
export const getUserRankingStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's solved problems
    const solvedProblems = await db.problemSolved.findMany({
      where: { userID: userId },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            tags: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Get user's submissions
    const submissions = await db.submission.findMany({
      where: { userID: userId },
      select: {
        id: true,
        status: true,
        language: true,
        createdAt: true,
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    });

    // Calculate statistics by difficulty
    const difficultyStats = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0
    };

    solvedProblems.forEach(({ problem }) => {
      if (problem && problem.difficulty) {
        difficultyStats[problem.difficulty]++;
      }
    });

    // Calculate statistics by topic
    const topicStats = {};
    solvedProblems.forEach(({ problem }) => {
      if (problem && problem.tags) {
        problem.tags.forEach(tag => {
          topicStats[tag] = (topicStats[tag] || 0) + 1;
        });
      }
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await db.problemSolved.count({
      where: {
        userID: userId,
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    res.status(200).json({
      success: true,
      message: "User ranking stats fetched successfully",
      stats: {
        totalSolved: solvedProblems.length,
        difficultyBreakdown: difficultyStats,
        topicBreakdown: topicStats,
        recentActivity,
        recentSubmissions: submissions.slice(0, 10)
      }
    });
  } catch (error) {
    console.error("Error fetching user ranking stats:", error);
    res.status(500).json({
      message: "Failed to fetch user ranking stats",
      error: error.message
    });
  }
};



// Calculate and update streak for all users (can be run as a scheduled job)
export const recalculateAllStreaks = async (req, res) => {
  try {
    const users = await db.user.findMany({
      where: { role: "USER" },
      select: { id: true }
    });

    let updatedCount = 0;

    for (const user of users) {
      // Get solved problems sorted by date
      const solvedProblems = await db.problemSolved.findMany({
        where: { userID: user.id },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" }
      });

      if (solvedProblems.length === 0) continue;

      // Calculate streak from solved problems
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = solvedProblems.length - 1; i >= 0; i--) {
        const solveDate = new Date(solvedProblems[i].createdAt);
        solveDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today - solveDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0 || daysDiff === tempStreak) {
          tempStreak++;
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
        } else if (daysDiff === tempStreak + 1) {
          tempStreak++;
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
        } else {
          tempStreak = 1;
        }
      }

      currentStreak = tempStreak;

      await db.user.update({
        where: { id: user.id },
        data: {
          currentStreak,
          longestStreak
        }
      });

      updatedCount++;
    }

    res.status(200).json({
      success: true,
      message: "Streaks recalculated successfully",
      updatedCount
    });
  } catch (error) {
    console.error("Error recalculating streaks:", error);
    res.status(500).json({
      message: "Failed to recalculate streaks",
      error: error.message
    });
  }
};