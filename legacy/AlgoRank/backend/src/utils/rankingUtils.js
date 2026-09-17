import { db } from "../libs/db.js";

// Update user ranking statistics after submission
export const updateUserRankingStats = async (userId) => {
  try {
    // Get total problems solved
    const totalSolved = await db.problemSolved.count({
      where: { userID: userId }
    });

    // Get total submissions
    const totalSubmissions = await db.submission.count({
      where: { userID: userId }
    });

    // Get accepted submissions
    const acceptedSubmissions = await db.submission.count({
      where: {
        userID: userId,
        status: "Accepted"
      }
    });

    // Calculate acceptance rate
    const acceptanceRate = totalSubmissions > 0 
      ? (acceptedSubmissions / totalSubmissions) * 100 
      : 0;

    // Calculate average solve time (from submission timestamps)
    const submissions = await db.submission.findMany({
      where: {
        userID: userId,
        status: "Accepted"
      },
      select: {
        createdAt: true,
        problem: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    // Calculate solve times (time between first submission and acceptance for each problem)
    let totalSolveTime = 0;
    let solveTimeCount = 0;

    const problemFirstSubmissions = {};

    submissions.forEach(submission => {
      const problemId = submission.problem.id;
      if (!problemFirstSubmissions[problemId]) {
        problemFirstSubmissions[problemId] = submission.createdAt;
      } else {
        const solveTime = (new Date(submission.createdAt) - new Date(problemFirstSubmissions[problemId])) / 1000; // in seconds
        if (solveTime > 0 && solveTime < 3600) { // Only count reasonable solve times (< 1 hour)
          totalSolveTime += solveTime;
          solveTimeCount++;
        }
      }
    });

    const averageSolveTime = solveTimeCount > 0 ? totalSolveTime / solveTimeCount : null;

    // Calculate streak
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { lastSolvedDate: true, currentStreak: true, longestStreak: true }
    });

    let currentStreak = user?.currentStreak || 0;
    let longestStreak = user?.longestStreak || 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastSolved = user?.lastSolvedDate ? new Date(user.lastSolvedDate) : null;
    lastSolved?.setHours(0, 0, 0, 0);

    if (lastSolved) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastSolved.getTime() === yesterday.getTime()) {
        // Solved yesterday, increment streak
        currentStreak++;
      } else if (lastSolved.getTime() === today.getTime()) {
        // Already solved today, keep streak
        // No change needed
      } else {
        // Streak broken
        currentStreak = 1;
      }
    } else {
      // First problem solved
      currentStreak = 1;
    }

    // Update longest streak if needed
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // Calculate composite ranking score
    // Weight: 50% problems solved, 25% acceptance rate, 15% streak, 10% speed
    const normalizedProblems = Math.min(totalSolved / 100, 1) * 50; // Max 50 points
    const normalizedAcceptance = (acceptanceRate / 100) * 25; // Max 25 points
    const normalizedStreak = Math.min(currentStreak / 30, 1) * 15; // Max 15 points
    const normalizedSpeed = averageSolveTime ? Math.max(0, (1 - (averageSolveTime / 1800))) * 10 : 0; // Max 10 points

    const rankingScore = normalizedProblems + normalizedAcceptance + normalizedStreak + normalizedSpeed;

    // Update user with new stats
    await db.user.update({
      where: { id: userId },
      data: {
        totalProblemsSolved: totalSolved,
        acceptanceRate: acceptanceRate,
        averageSolveTime: averageSolveTime,
        currentStreak: currentStreak,
        longestStreak: longestStreak,
        lastSolvedDate: new Date(),
        rankingScore: rankingScore
      }
    });

    console.log(`Updated ranking stats for user ${userId}:`, {
      totalSolved,
      acceptanceRate,
      currentStreak,
      rankingScore
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user ranking stats:", error);
    return { success: false, error: error.message };
  }
};