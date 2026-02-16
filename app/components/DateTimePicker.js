'use client';

import { useTheme } from '../providers/ThemeProvider';

/**
 * DateTimePicker Component
 * A user-friendly date and time picker for scheduling events
 */
export default function DateTimePicker({ value, onChange, label, includeTime = true, required = false }) {
  const { theme } = useTheme();

  // Parse existing value or create new date
  const dateValue = value ? new Date(value) : new Date();

  // Format for input fields
  const dateString = dateValue.toISOString().split('T')[0];
  const timeString = dateValue.toTimeString().slice(0, 5);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    const newDateTime = new Date(`${newDate}T${timeString}`);
    onChange(newDateTime);
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    const newDateTime = new Date(`${dateString}T${newTime}`);
    onChange(newDateTime);
  };

  return (
    <div style={styles.container}>
      {label && (
        <label style={{ ...styles.label, color: theme.card.text }}>
          {label}
          {required && <span style={styles.required}> *</span>}
        </label>
      )}

      <div style={styles.inputRow}>
        <div style={styles.inputGroup}>
          <span style={{ ...styles.inputIcon, color: theme.card.text }}>📅</span>
          <input
            type="date"
            value={dateString}
            onChange={handleDateChange}
            required={required}
            style={{
              ...styles.input,
              ...styles.dateInput,
              background: theme.input.bg,
              color: theme.input.text,
              border: `1px solid ${theme.input.border}`
            }}
          />
        </div>

        {includeTime && (
          <div style={styles.inputGroup}>
            <span style={{ ...styles.inputIcon, color: theme.card.text }}>🕐</span>
            <input
              type="time"
              value={timeString}
              onChange={handleTimeChange}
              required={required}
              style={{
                ...styles.input,
                ...styles.timeInput,
                background: theme.input.bg,
                color: theme.input.text,
                border: `1px solid ${theme.input.border}`
              }}
            />
          </div>
        )}
      </div>

      <div style={{ ...styles.preview, color: theme.card.text, opacity: 0.7 }}>
        {dateValue.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          ...(includeTime && {
            hour: 'numeric',
            minute: '2-digit'
          })
        })}
      </div>
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
    marginBottom: '0.5rem',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  required: {
    color: '#ef5350'
  },
  inputRow: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  inputGroup: {
    flex: 1,
    minWidth: '140px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  inputIcon: {
    fontSize: '1.2rem',
    pointerEvents: 'none'
  },
  input: {
    flex: 1,
    padding: '0.65rem',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none',
    fontFamily: 'inherit'
  },
  dateInput: {
    minWidth: '140px'
  },
  timeInput: {
    minWidth: '100px'
  },
  preview: {
    marginTop: '0.5rem',
    fontSize: '0.85rem',
    fontStyle: 'italic'
  }
};
