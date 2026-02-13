'use client';

import { useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';

export default function Toast({ message, type = 'success', onClose, action, duration = 3000 }) {
  const { theme } = useTheme();

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const colors = {
    success: theme.toast.success,
    error: theme.toast.error,
    info: theme.toast.info
  };

  const color = colors[type] || colors.info;

  return (
    <div style={{
      ...styles.toast,
      background: color.bg,
      borderColor: color.border
    }}>
      <span style={styles.message}>{message}</span>
      {action && (
        <button
          onClick={() => {
            action.onClick();
            onClose();
          }}
          style={styles.actionButton}
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
      <button
        onClick={onClose}
        style={styles.closeButton}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

const styles = {
  toast: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    padding: '1rem 1.5rem',
    borderRadius: 8,
    border: '2px solid',
    color: 'white',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    zIndex: 9999,
    minWidth: '280px',
    maxWidth: '400px',
    animation: 'slideIn 0.3s ease-out'
  },
  message: {
    flex: 1,
    fontSize: '0.95rem',
    fontWeight: 500
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0 0.25rem',
    lineHeight: 1,
    opacity: 0.8
  },
  actionButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '0.375rem 0.75rem',
    borderRadius: 4,
    transition: 'all 150ms ease',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.3)'
    }
  }
};
