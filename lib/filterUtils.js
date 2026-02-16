/**
 * Filter utilities for searching and filtering chores and events
 */

/**
 * Search items by text query in title and description
 * @param {Array} items - Array of items (chores or events)
 * @param {string} query - Search query
 * @returns {Array} Filtered items matching the query
 */
export function searchItems(items, query) {
  if (!query || !query.trim()) return items;

  const lowerQuery = query.toLowerCase().trim();

  return items.filter(item => {
    const title = item.title?.toLowerCase() || '';
    const description = item.description?.toLowerCase() || '';
    const assignedTo = item.assignedTo?.toLowerCase() || '';

    return (
      title.includes(lowerQuery) ||
      description.includes(lowerQuery) ||
      assignedTo.includes(lowerQuery)
    );
  });
}

/**
 * Filter chores by completion status
 * @param {Array} chores - Array of chore objects
 * @param {string} status - Filter status: 'all', 'complete', or 'incomplete'
 * @returns {Array} Filtered chores
 */
export function filterByStatus(chores, status) {
  if (status === 'all') return chores;
  if (status === 'complete') return chores.filter(c => c.completed);
  if (status === 'incomplete') return chores.filter(c => !c.completed);
  return chores;
}

/**
 * Filter items by type (chores, events, work)
 * @param {Object} data - Object with chores and events arrays
 * @param {string} type - Filter type: 'all', 'chores', 'events', or 'work'
 * @returns {Object} Filtered data object
 */
export function filterByType(data, type) {
  if (type === 'all') {
    return data;
  }

  if (type === 'chores') {
    return {
      chores: data.chores,
      events: []
    };
  }

  if (type === 'events') {
    return {
      chores: [],
      events: data.events.filter(e => e.type === 'EVENT')
    };
  }

  if (type === 'work') {
    return {
      chores: [],
      events: data.events.filter(e => e.type === 'WORK')
    };
  }

  return data;
}

/**
 * Apply all filters to chores and events
 * @param {Object} params - Filter parameters
 * @param {Array} params.chores - Array of chore objects
 * @param {Array} params.events - Array of event objects
 * @param {string} params.searchQuery - Search text
 * @param {string} params.statusFilter - Status filter ('all', 'complete', 'incomplete')
 * @param {string} params.typeFilter - Type filter ('all', 'chores', 'events', 'work')
 * @returns {Object} Filtered data with chores and events
 */
export function applyAllFilters({ chores, events, searchQuery, statusFilter, typeFilter }) {
  // Apply type filter first
  let filteredData = filterByType({ chores, events }, typeFilter);

  // Apply status filter to chores
  if (statusFilter && statusFilter !== 'all') {
    filteredData.chores = filterByStatus(filteredData.chores, statusFilter);
  }

  // Apply search query
  if (searchQuery && searchQuery.trim()) {
    filteredData.chores = searchItems(filteredData.chores, searchQuery);
    filteredData.events = searchItems(filteredData.events, searchQuery);
  }

  return filteredData;
}

/**
 * Count active filters
 * @param {Object} filters - Filter object
 * @returns {number} Number of active filters
 */
export function countActiveFilters(filters) {
  let count = 0;

  if (filters.searchQuery && filters.searchQuery.trim()) count++;
  if (filters.statusFilter && filters.statusFilter !== 'all') count++;
  if (filters.typeFilter && filters.typeFilter !== 'all') count++;

  return count;
}
