'use client';

import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const colors = {
    success: {
      bg: 'rgba(63, 152, 76, 0.95)',
      border: '#2c7939'
    },
    error: {
      bg: 'rgba(186, 62, 62, 0.95)',
      border: '#8b1f1f'
    },
    info: {
      bg: 'rgba(52, 120, 186, 0.95)',
      border: '#2b5f99'
    }
  };

  const color = colors[type] || colors.info;

  return (
    <div style={{
      ...styles.toast,
      background: color.bg,
      borderColor: color.border
    }}>
      <span style={styles.message}>{message}</span>
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
  }
};
