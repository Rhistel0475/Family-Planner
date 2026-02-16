/**
 * Calculate weekly statistics for the family planner
 * @param {Array} chores - Array of chore objects
 * @param {Array} members - Array of family member objects
 * @param {Array} weekDates - Array of week date objects with day names
 * @returns {Object} Statistics object with weekly completion, member stats, etc.
 */
export function calculateWeeklyStats(chores, members, weekDates) {
  const totalChores = chores.length;
  const completedChores = chores.filter(c => c.completed).length;
  const weeklyCompletion = totalChores > 0
    ? Math.round((completedChores / totalChores) * 100)
    : 0;

  // Calculate stats for each member
  const memberStats = members.map(member => {
    const memberChores = chores.filter(c => c.assignedTo === member.name);
    const completed = memberChores.filter(c => c.completed).length;
    const total = memberChores.length;
    return {
      ...member,
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }).sort((a, b) => b.percentage - a.percentage); // Sort by completion percentage descending

  // Find top performer (member with highest completion %)
  const topPerformer = memberStats.length > 0 && memberStats[0].total > 0
    ? memberStats[0]
    : null;

  // Count pending chores
  const pendingCount = totalChores - completedChores;

  // Calculate days on track (days with 100% completion)
  const daysOnTrack = weekDates.filter(dayObj => {
    const dayChores = chores.filter(c => c.dueDay === dayObj.day);
    if (dayChores.length === 0) return false;
    const completed = dayChores.filter(c => c.completed).length;
    return completed === dayChores.length; // All chores completed
  }).length;

  return {
    weeklyCompletion,
    memberStats,
    topPerformer,
    pendingCount,
    daysOnTrack,
    totalChores,
    completedChores
  };
}

/**
 * Calculate consecutive weeks streak for a member
 * Note: Requires historical data. Currently returns 0 as placeholder.
 * Future enhancement: Track completion history in database
 * @param {Array} allChores - All chores including historical data
 * @param {string} memberName - Name of the member
 * @returns {number} Number of consecutive weeks with 100% completion
 */
export function calculateStreak(allChores, memberName) {
  // Placeholder for future enhancement
  // Would need to group chores by week and check completion status
  return 0;
}

/**
 * Calculate leaderboard rankings
 * @param {Array} members - Array of family member objects
 * @param {Array} chores - Array of chore objects
 * @returns {Array} Sorted array of members with completion stats
 */
export function calculateLeaderboard(members, chores) {
  const memberStats = members.map(member => {
    const memberChores = chores.filter(c => c.assignedTo === member.name);
    const completed = memberChores.filter(c => c.completed).length;
    const total = memberChores.length;
    return {
      ...member,
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });

  // Sort by percentage desc, then by total completed desc
  return memberStats.sort((a, b) => {
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }
    return b.completed - a.completed;
  });
}

/**
 * Get completion trend (improving, declining, steady)
 * Note: Requires historical data. Currently returns 'steady' as placeholder.
 * @param {Array} historicalData - Historical completion data
 * @returns {string} 'improving', 'declining', or 'steady'
 */
export function getCompletionTrend(historicalData) {
  // Placeholder for future enhancement
  return 'steady';
}
