export const recordActivityStreak = async (prisma, userId, now = new Date()) => {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, lastSolvedDate: true },
    });
    if (!user) return { currentStreak: 0, longestStreak: 0 };

    const lastActivity = user.lastSolvedDate ? new Date(user.lastSolvedDate) : null;
    if (lastActivity) lastActivity.setUTCHours(0, 0, 0, 0);
    if (lastActivity && lastActivity >= today) {
      return { currentStreak: user.currentStreak, longestStreak: user.longestStreak };
    }

    const currentStreak = lastActivity?.getTime() === yesterday.getTime()
      ? user.currentStreak + 1
      : 1;
    const longestStreak = Math.max(user.longestStreak, currentStreak);
    const updated = await prisma.user.updateMany({
      where: { id: userId, lastSolvedDate: user.lastSolvedDate },
      data: { lastSolvedDate: today, currentStreak, longestStreak },
    });

    if (updated.count === 1) return { currentStreak, longestStreak };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true },
  });
  return { currentStreak: user?.currentStreak ?? 0, longestStreak: user?.longestStreak ?? 0 };
};