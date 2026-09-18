import prisma from "./prisma";

function toUtcDayIndex(date: Date) {
  return Math.floor(date.getTime() / 86400000);
}

export async function updateUserStreak(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const now = new Date();
  const todayIndex = toUtcDayIndex(now);
  const lastIndex = user.lastWorkoutDate ? toUtcDayIndex(user.lastWorkoutDate) : null;

  if (lastIndex === todayIndex) {
    return user;
  }

  const newStreak = lastIndex === todayIndex - 1 ? user.currentStreak + 1 : 1;

  return prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(user.longestStreak, newStreak),
      lastWorkoutDate: now,
    },
  });
}
