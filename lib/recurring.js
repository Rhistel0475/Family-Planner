/**
 * Recurring Events & Chores Library
 * Generates recurring instances using the instance-based approach
 */

/**
 * Generate recurring event instances
 * @param {Object} baseEvent - The base event template
 * @param {string} baseEvent.pattern - DAILY, WEEKLY, MONTHLY, YEARLY
 * @param {number} baseEvent.interval - 1 for weekly, 2 for biweekly, etc.
 * @param {Date} baseEvent.startDate - First occurrence date
 * @param {Date} baseEvent.endDate - Optional end date (defaults to 1 year)
 * @param {Date} baseEvent.startTime - Time of day for the event
 * @param {Date} baseEvent.endTime - Optional end time
 * @returns {Array} Array of event instances
 */
export function generateRecurringInstances(baseEvent) {
  const {
    pattern,
    interval = 1,
    startDate,
    endDate,
    startTime,
    endTime
  } = baseEvent;

  if (!pattern || !startDate) {
    throw new Error('Pattern and startDate are required');
  }

  const instances = [];
  const maxInstances = 365; // Safety limit
  const defaultEndDate = new Date(startDate);
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1); // 1 year default

  const finalEndDate = endDate ? new Date(endDate) : defaultEndDate;
  let currentDate = new Date(startDate);
  let count = 0;

  while (currentDate <= finalEndDate && count < maxInstances) {
    // Create instance for this date
    const instanceStart = new Date(currentDate);
    if (startTime) {
      instanceStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    }

    let instanceEnd = null;
    if (endTime) {
      instanceEnd = new Date(currentDate);
      instanceEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
    }

    instances.push({
      startsAt: instanceStart,
      endsAt: instanceEnd
    });

    // Calculate next occurrence based on pattern
    switch (pattern) {
      case 'DAILY':
        currentDate.setDate(currentDate.getDate() + interval);
        break;

      case 'WEEKLY':
        currentDate.setDate(currentDate.getDate() + (7 * interval));
        break;

      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;

      case 'YEARLY':
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;

      default:
        throw new Error(`Unknown recurrence pattern: ${pattern}`);
    }

    count++;
  }

  return instances;
}

/**
 * Generate recurring chore instances
 * Similar to events but uses dueDay (day of week) instead of specific dates
 */
export function generateRecurringChoreInstances(baseChore) {
  const {
    pattern,
    interval = 1,
    startDate,
    endDate,
    dueDay // Day of week: Monday, Tuesday, etc.
  } = baseChore;

  if (!pattern || !startDate || !dueDay) {
    throw new Error('Pattern, startDate, and dueDay are required');
  }

  const instances = [];
  const maxInstances = 365;
  const defaultEndDate = new Date(startDate);
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);

  const finalEndDate = endDate ? new Date(endDate) : defaultEndDate;
  let currentDate = new Date(startDate);
  let count = 0;

  // Find the first occurrence of the target day
  const targetDayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dueDay);
  if (targetDayIndex === -1) {
    throw new Error(`Invalid dueDay: ${dueDay}`);
  }

  const currentDayIndex = currentDate.getDay();
  const daysUntilTarget = (targetDayIndex - currentDayIndex + 7) % 7;
  currentDate.setDate(currentDate.getDate() + daysUntilTarget);

  while (currentDate <= finalEndDate && count < maxInstances) {
    instances.push({
      dueDate: new Date(currentDate)
    });

    // Calculate next occurrence
    switch (pattern) {
      case 'DAILY':
        currentDate.setDate(currentDate.getDate() + interval);
        break;

      case 'WEEKLY':
        currentDate.setDate(currentDate.getDate() + (7 * interval));
        break;

      case 'MONTHLY':
        // For monthly, find the next occurrence of the same weekday
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;

      case 'YEARLY':
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;

      default:
        throw new Error(`Unknown recurrence pattern: ${pattern}`);
    }

    count++;
  }

  return instances;
}

/**
 * Parse recurrence UI input into a standardized format
 */
export function parseRecurrenceInput(input) {
  const {
    isRecurring,
    pattern,
    interval,
    endDate
  } = input;

  if (!isRecurring) {
    return null;
  }

  return {
    pattern: pattern || 'WEEKLY',
    interval: parseInt(interval) || 1,
    endDate: endDate ? new Date(endDate) : null
  };
}

/**
 * Format recurrence for display
 */
export function formatRecurrence(event) {
  if (!event.isRecurring || !event.recurrencePattern) {
    return null;
  }

  const pattern = event.recurrencePattern.toLowerCase();
  const interval = event.recurrenceInterval || 1;

  let display = '';
  if (interval === 1) {
    display = pattern.charAt(0).toUpperCase() + pattern.slice(1);
  } else {
    display = `Every ${interval} ${pattern === 'daily' ? 'days' : pattern === 'weekly' ? 'weeks' : pattern === 'monthly' ? 'months' : 'years'}`;
  }

  if (event.recurrenceEndDate) {
    const endDate = new Date(event.recurrenceEndDate);
    display += ` until ${endDate.toLocaleDateString()}`;
  }

  return display;
}
