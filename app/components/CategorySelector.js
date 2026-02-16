'use client';

import { useTheme } from '../providers/ThemeProvider';
import { getEventTypeOptions, getEventCategory } from '../../lib/eventConfig';

/**
 * CategorySelector Component
 * A visual selector for event categories with icons and descriptions
 */
export default function CategorySelector({ value, onChange, label, required = false }) {
  const { theme, isDarkMode } = useTheme();
  const options = getEventTypeOptions();
  const selectedCategory = getEventCategory(value);

  return (
    <div style={styles.container}>
      {label && (
        <label style={{ ...styles.label, color: theme.card.text }}>
          {label}
          {required && <span style={styles.required}> *</span>}
        </label>
      )}

      <div style={styles.grid}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const category = getEventCategory(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              style={{
                ...styles.option,
                background: isSelected
                  ? (isDarkMode ? category.darkColor : category.lightColor)
                  : theme.button.secondary,
                border: `2px solid ${isSelected ? (isDarkMode ? category.darkColor : category.lightColor) : theme.card.border}`,
                color: isSelected ? (isDarkMode ? '#fff' : theme.card.text) : theme.card.text,
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isSelected
                  ? `0 4px 12px ${isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(70, 45, 11, 0.3)' }`
                  : 'none'
              }}
            >
              <span style={styles.icon}>{option.icon}</span>
              <span style={styles.optionLabel}>{option.label}</span>
              {isSelected && <span style={styles.checkmark}>✓</span>}
            </button>
          );
        })}
      </div>

      {value && (
        <div style={{ ...styles.description, color: theme.card.text, opacity: 0.7 }}>
          {selectedCategory.description}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginBottom: '1rem'
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  required: {
    color: '#ef5350'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '0.75rem'
  },
  option: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 0.75rem',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: 600,
    fontSize: '0.9rem'
  },
  icon: {
    fontSize: '2rem',
    lineHeight: 1
  },
  optionLabel: {
    fontSize: '0.85rem',
    fontWeight: 600
  },
  checkmark: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 700
  },
  description: {
    marginTop: '0.5rem',
    fontSize: '0.85rem',
    fontStyle: 'italic',
    textAlign: 'center'
  }
};
