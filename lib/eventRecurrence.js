/**
 * Generate occurrences for a recurring event within a date range.
 * @param {Object} event - Event object with recurrence fields
 * @param {Date} rangeStart - Start of the date range
 * @param {Date} rangeEnd - End of the date range
 * @returns {Array<{startsAt: Date, endsAt: Date|null}>} Array of occurrence times
 */
export function getOccurrencesInRange(event, rangeStart, rangeEnd) {
  const { startsAt, endsAt, isRecurring, recurrencePattern, recurrenceInterval, recurrenceEndDate } = event;

  // If not recurring, return single occurrence if in range
  if (!isRecurring || !recurrencePattern) {
    const start = new Date(startsAt);
    if (start >= rangeStart && start <= rangeEnd) {
      return [{ startsAt: start, endsAt: endsAt ? new Date(endsAt) : null }];
    }
    return [];
  }

  const occurrences = [];
  const firstStart = new Date(startsAt);
  const duration = endsAt ? new Date(endsAt).getTime() - firstStart.getTime() : 0;
  const interval = recurrenceInterval || 1;
  const endDate = recurrenceEndDate ? new Date(recurrenceEndDate) : null;

  // Cap at 500 occurrences or 2 years to prevent runaway loops
  const maxOccurrences = 500;
  const maxDate = new Date(rangeEnd);
  maxDate.setFullYear(maxDate.getFullYear() + 2);

  let current = new Date(firstStart);
  let count = 0;

  // Start from first occurrence, but only include those in range
  while (count < maxOccurrences && current <= maxDate) {
    // Check if we've passed the recurrence end date
    if (endDate && current > endDate) {
      break;
    }

    // Check if we've passed the range end
    if (current > rangeEnd) {
      break;
    }

    // Include if in range
    if (current >= rangeStart && current <= rangeEnd) {
      const occEndsAt = endsAt ? new Date(current.getTime() + duration) : null;
      occurrences.push({ startsAt: new Date(current), endsAt: occEndsAt });
    }

    // Advance to next occurrence based on pattern
    switch (recurrencePattern) {
      case 'DAILY':
        current.setDate(current.getDate() + interval);
        break;
      case 'WEEKLY':
        current.setDate(current.getDate() + (7 * interval));
        break;
      case 'MONTHLY':
        current.setMonth(current.getMonth() + interval);
        break;
      case 'YEARLY':
        current.setFullYear(current.getFullYear() + interval);
        break;
      default:
        // Unknown pattern, stop
        return occurrences;
    }

    count++;
  }

  return occurrences;
}
