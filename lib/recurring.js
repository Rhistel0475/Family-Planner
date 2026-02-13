// Utility functions for handling recurring events

/**
 * Generate the next occurrence date based on recurrence pattern
 */
export function getNextOccurrence(startDate, pattern, interval = 1) {
  const date = new Date(startDate);
  
  switch (pattern) {
    case 'DAILY':
      date.setDate(date.getDate() + interval);
      break;
    case 'WEEKLY':
      date.setDate(date.getDate() + (7 * interval));
      break;
    case 'MONTHLY':
      date.setMonth(date.getMonth() + interval);
      break;
    case 'YEARLY':
      date.setFullYear(date.getFullYear() + interval);
      break;
  }
  
  return date;
}

/**
 * Generate all occurrences for a recurring event within a date range
 */
export function generateOccurrences(event, startDate, endDate) {
  if (!event.isRecurring || !event.recurrencePattern) {
    return [event];
  }
  
  const occurrences = [];
  const interval = event.recurrenceInterval || 1;
  let currentDate = new Date(event.startsAt);
  const rangeStart = new Date(startDate);
  const rangeEnd = new Date(endDate);
  const recurrenceEnd = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : null;
  
  // Generate occurrences until we reach the range end or recurrence end
  while (currentDate <= rangeEnd) {
    // Check if occurrence is within the query range and before recurrence end
    if (currentDate >= rangeStart && (!recurrenceEnd || currentDate <= recurrenceEnd)) {
      const duration = event.endsAt ? new Date(event.endsAt) - new Date(event.startsAt) : 0;
      
      occurrences.push({
        ...event,
        id: `${event.id}_${currentDate.toISOString()}`,
        startsAt: new Date(currentDate),
        endsAt: duration ? new Date(currentDate.getTime() + duration) : null,
        parentEventId: event.id,
        isInstance: true
      });
    }
    
    // Break if we've passed the recurrence end date
    if (recurrenceEnd && currentDate >= recurrenceEnd) {
      break;
    }
    
    currentDate = getNextOccurrence(currentDate, event.recurrencePattern, interval);
    
    // Safety check: don't generate more than 1000 occurrences
    if (occurrences.length >= 1000) {
      break;
    }
  }
  
  return occurrences;
}

/**
 * Check if an event should recur on a specific day
 */
export function shouldRecurOnDay(event, targetDate) {
  if (!event.isRecurring) return false;
  
  const start = new Date(event.startsAt);
  const target = new Date(targetDate);
  
  // Check if before start date
  if (target < start) return false;
  
  // Check if after end date
  if (event.recurrenceEndDate && target > new Date(event.recurrenceEndDate)) {
    return false;
  }
  
  const interval = event.recurrenceInterval || 1;
  const diffTime = Math.abs(target - start);
  
  switch (event.recurrencePattern) {
    case 'DAILY':
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays % interval === 0;
      
    case 'WEEKLY':
      const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      return diffWeeks % interval === 0 && start.getDay() === target.getDay();
      
    case 'MONTHLY':
      return start.getDate() === target.getDate() && 
             (target.getMonth() - start.getMonth() + 
              (target.getFullYear() - start.getFullYear()) * 12) % interval === 0;
      
    case 'YEARLY':
      return start.getDate() === target.getDate() && 
             start.getMonth() === target.getMonth() &&
             (target.getFullYear() - start.getFullYear()) % interval === 0;
      
    default:
      return false;
  }
}

/**
 * Get human-readable description of recurrence
 */
export function getRecurrenceDescription(pattern, interval = 1) {
  if (!pattern) return 'Does not repeat';
  
  const intervalText = interval > 1 ? `every ${interval} ` : '';
  
  switch (pattern) {
    case 'DAILY':
      return interval === 1 ? 'Daily' : `Every ${interval} days`;
    case 'WEEKLY':
      return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
    case 'MONTHLY':
      return interval === 1 ? 'Monthly' : `Every ${interval} months`;
    case 'YEARLY':
      return interval === 1 ? 'Yearly' : `Every ${interval} years`;
    default:
      return 'Does not repeat';
  }
}
