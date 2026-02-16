'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { countActiveFilters } from '../../lib/filterUtils';

export default function FilterBar({ onFilterChange, initialFilters = {} }) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || '');
  const [statusFilter, setStatusFilter] = useState(initialFilters.statusFilter || 'all');
  const [typeFilter, setTypeFilter] = useState(initialFilters.typeFilter || 'all');

  // Notify parent component of filter changes
  useEffect(() => {
    onFilterChange({
      searchQuery,
      statusFilter,
      typeFilter
    });
  }, [searchQuery, statusFilter, typeFilter, onFilterChange]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
  };

  const handleTypeChange = (type) => {
    setTypeFilter(type);
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const activeFilterCount = countActiveFilters({ searchQuery, statusFilter, typeFilter });

  return (
    <div
      style={{
        ...styles.container,
        background: theme.controls.bg,
        border: `1px solid ${theme.controls.border}`
      }}
    >
      {/* Search Input */}
      <div style={styles.searchWrapper}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Search chores and events..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={{
            ...styles.searchInput,
            background: theme.input.bg,
            color: theme.input.text,
            border: `1px solid ${theme.input.border}`
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{...styles.clearSearchBtn, color: theme.card.text}}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Filter Buttons Row */}
      <div style={styles.filtersRow}>
        {/* Status Filter */}
        <div style={styles.filterGroup}>
          <span style={{...styles.filterLabel, color: theme.card.text}}>Status:</span>
          <div style={styles.buttonGroup}>
            <button
              onClick={() => handleStatusChange('all')}
              style={{
                ...styles.filterBtn,
                background: statusFilter === 'all' ? theme.card.bg[2] : theme.button.secondary,
                color: theme.card.text,
                border: `1px solid ${theme.card.border}`
              }}
            >
              All
            </button>
            <button
              onClick={() => handleStatusChange('complete')}
              style={{
                ...styles.filterBtn,
                background: statusFilter === 'complete' ? theme.toast.success.bg : theme.button.secondary,
                color: statusFilter === 'complete' ? 'white' : theme.card.text,
                border: `1px solid ${theme.card.border}`
              }}
            >
              ✓ Done
            </button>
            <button
              onClick={() => handleStatusChange('incomplete')}
              style={{
                ...styles.filterBtn,
                background: statusFilter === 'incomplete' ? theme.toast.error.bg : theme.button.secondary,
                color: statusFilter === 'incomplete' ? 'white' : theme.card.text,
                border: `1px solid ${theme.card.border}`
              }}
            >
              ○ Todo
            </button>
          </div>
        </div>

        {/* Type Filter */}
        <div style={styles.filterGroup}>
          <span style={{...styles.filterLabel, color: theme.card.text}}>Type:</span>
          <div style={styles.buttonGroup}>
            <button
              onClick={() => handleTypeChange('all')}
              style={{
                ...styles.filterBtn,
                background: typeFilter === 'all' ? theme.card.bg[1] : theme.button.secondary,
                color: theme.card.text,
                border: `1px solid ${theme.card.border}`
              }}
            >
              All
            </button>
            <button
              onClick={() => handleTypeChange('chores')}
              style={{
                ...styles.filterBtn,
                background: typeFilter === 'chores' ? theme.card.bg[2] : theme.button.secondary,
                color: theme.card.text,
                border: `1px solid ${theme.card.border}`
              }}
            >
              Chores
            </button>
            <button
              onClick={() => handleTypeChange('events')}
              style={{
                ...styles.filterBtn,
                background: typeFilter === 'events' ? theme.card.bg[3] : theme.button.secondary,
                color: theme.card.text,
                border: `1px solid ${theme.card.border}`
              }}
            >
              Events
            </button>
            <button
              onClick={() => handleTypeChange('work')}
              style={{
                ...styles.filterBtn,
                background: typeFilter === 'work' ? theme.card.bg[0] : theme.button.secondary,
                color: theme.card.text,
                border: `1px solid ${theme.card.border}`
              }}
            >
              Work
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Indicator */}
      {activeFilterCount > 0 && (
        <div style={styles.activeFilters}>
          <span style={{...styles.activeText, color: theme.card.text}}>
            🔧 {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </span>
          <button
            onClick={handleClearAll}
            style={{
              ...styles.clearBtn,
              background: theme.toast.error.bg,
              border: `1px solid ${theme.card.border}`
            }}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    borderRadius: 10,
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },

  // Search Input
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%'
  },
  searchIcon: {
    position: 'absolute',
    left: '0.75rem',
    fontSize: '1.1rem',
    pointerEvents: 'none',
    opacity: 0.6
  },
  searchInput: {
    width: '100%',
    padding: '0.6rem 0.75rem 0.6rem 2.5rem',
    borderRadius: 8,
    fontSize: '0.95rem',
    outline: 'none'
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '0.5rem',
    background: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0 0.5rem',
    opacity: 0.6,
    lineHeight: 1
  },

  // Filters Row
  filtersRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    alignItems: 'center'
  },

  // Filter Group
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  filterLabel: {
    fontSize: '0.85rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap'
  },
  filterBtn: {
    padding: '0.4rem 0.75rem',
    borderRadius: 6,
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },

  // Active Filters
  activeFilters: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    paddingTop: '0.5rem',
    borderTop: '1px dashed rgba(0, 0, 0, 0.1)',
    flexWrap: 'wrap'
  },
  activeText: {
    fontSize: '0.85rem',
    fontWeight: 600
  },
  clearBtn: {
    padding: '0.4rem 0.75rem',
    borderRadius: 6,
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    color: 'white',
    transition: 'all 0.2s ease'
  }
};
