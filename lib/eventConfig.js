/**
 * Event category configurations
 * Icons, colors, and labels for different event types
 */

export const EVENT_CATEGORIES = {
  WORK: {
    icon: '💼',
    label: 'Work',
    color: '#3a5a2a',
    lightColor: '#c9f7a5',
    darkColor: '#3a5a2a',
    description: 'Work-related events and meetings'
  },
  PERSONAL: {
    icon: '⭐',
    label: 'Personal',
    color: '#ffd9a8',
    lightColor: '#ffd9a8',
    darkColor: '#634a2a',
    description: 'Personal activities and hobbies'
  },
  APPOINTMENT: {
    icon: '📅',
    label: 'Appointment',
    color: '#ffd6e7',
    lightColor: '#ffd6e7',
    darkColor: '#613a4a',
    description: 'Doctor, dentist, and other appointments'
  },
  OTHER: {
    icon: '📌',
    label: 'Other',
    color: '#fff59d',
    lightColor: '#fff59d',
    darkColor: '#6b6429',
    description: 'Other events and activities'
  },
  EVENT: {
    icon: '🎉',
    label: 'Event',
    color: '#c9f7a5',
    lightColor: '#c9f7a5',
    darkColor: '#3a5a2a',
    description: 'General events and activities'
  }
};

/**
 * Get event category configuration
 * @param {string} type - Event type (WORK, PERSONAL, APPOINTMENT, OTHER, EVENT)
 * @returns {object} Category configuration
 */
export function getEventCategory(type) {
  return EVENT_CATEGORIES[type] || EVENT_CATEGORIES.OTHER;
}

/**
 * Get event color based on type and theme
 * @param {string} type - Event type
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {string} Color hex code
 */
export function getEventColor(type, isDarkMode = false) {
  const category = getEventCategory(type);
  return isDarkMode ? category.darkColor : category.lightColor;
}

/**
 * Get all event type options for dropdown/selector
 * @returns {Array} Array of event type options
 */
export function getEventTypeOptions() {
  return Object.entries(EVENT_CATEGORIES).map(([value, config]) => ({
    value,
    label: config.label,
    icon: config.icon,
    description: config.description
  }));
}
