'use client';

import { useEffect, useState } from 'react';

/**
 * Enhanced Toast component with undo functionality
 * Replaces the basic Toast with better features
 */
export default function EnhancedToast({ 
  message, 
  type = 'success', 
  onClose, 
  onUndo,
  duration = 3000,
  position = 'bottom-right' 
}) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0 && !onUndo) {
      const timer = setTimeout(() => handleClose(), duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onUndo]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Match animation duration
  };

  const handleUndo = () => {
    if (onUndo) {
      onUndo();
      handleClose();
    }
  };

  const configs = {
    success: {
      icon: '✓',
      bg: 'rgba(63, 152, 76, 0.95)',
      border: '#2c7939',
      iconBg: 'rgba(255, 255, 255, 0.2)'
    },
    error: {
      icon: '✕',
      bg: 'rgba(186, 62, 62, 0.95)',
      border: '#8b1f1f',
      iconBg: 'rgba(255, 255, 255, 0.2)'
    },
    warning: {
      icon: '⚠',
      bg: 'rgba(234, 179, 8, 0.95)',
      border: '#b8940a',
      iconBg: 'rgba(255, 255, 255, 0.2)'
    },
    info: {
      icon: 'ℹ',
      bg: 'rgba(52, 120, 186, 0.95)',
      border: '#2b5f99',
      iconBg: 'rgba(255, 255, 255, 0.2)'
    }
  };

  const config = configs[type] || configs.info;

  const positions = {
    'top-left': { top: '2rem', left: '2rem' },
    'top-right': { top: '2rem', right: '2rem' },
    'bottom-left': { bottom: '2rem', left: '2rem' },
    'bottom-right': { bottom: '2rem', right: '2rem' },
    'top-center': { top: '2rem', left: '50%', transform: 'translateX(-50%)' },
    'bottom-center': { bottom: '2rem', left: '50%', transform: 'translateX(-50%)' }
  };

  return (
    <>
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(100%) translateX(${position.includes('center') ? '-50%' : '0'});
          }
          to {
            opacity: 1;
            transform: translateY(0) translateX(${position.includes('center') ? '-50%' : '0'});
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0) translateX(${position.includes('center') ? '-50%' : '0'});
          }
          to {
            opacity: 0;
            transform: translateY(100%) translateX(${position.includes('center') ? '-50%' : '0'});
          }
        }

        .toast {
          animation: ${isExiting ? 'slideOut' : 'slideIn'} 0.3s ease-out;
        }

        @media (max-width: 640px) {
          .toast {
            left: 1rem !important;
            right: 1rem !important;
            transform: none !important;
            min-width: auto !important;
            max-width: none !important;
          }
        }
      `}</style>

      <div 
        className="toast"
        style={{
          ...styles.toast,
          ...positions[position],
          background: config.bg,
          borderColor: config.border
        }}
      >
        {/* Icon */}
        <div style={{
          ...styles.iconContainer,
          background: config.iconBg
        }}>
          <span style={styles.icon}>{config.icon}</span>
        </div>

        {/* Message */}
        <span style={styles.message}>{message}</span>

        {/* Undo Button */}
        {onUndo && (
          <button onClick={handleUndo} style={styles.undoButton}>
            Undo
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={handleClose}
          style={styles.closeButton}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </>
  );
}

const styles = {
  toast: {
    position: 'fixed',
    padding: '1rem 1.5rem',
    borderRadius: '10px',
    border: '2px solid',
    color: 'white',
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    zIndex: 9999,
    minWidth: '320px',
    maxWidth: '450px',
    backdropFilter: 'blur(10px)'
  },
  iconContainer: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  icon: {
    fontSize: '1.25rem',
    fontWeight: 'bold'
  },
  message: {
    flex: 1,
    fontSize: '0.95rem',
    fontWeight: 500,
    lineHeight: 1.4
  },
  undoButton: {
    background: 'rgba(255, 255, 255, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    transition: 'all 150ms ease',
    flexShrink: 0,
    ':hover': {
      background: 'rgba(255, 255, 255, 0.35)'
    }
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '1.75rem',
    cursor: 'pointer',
    padding: '0 0.25rem',
    lineHeight: 1,
    opacity: 0.8,
    transition: 'opacity 150ms ease',
    flexShrink: 0,
    ':hover': {
      opacity: 1
    }
  }
};

/**
 * Toast Queue Manager Hook
 * Manages multiple toasts with auto-dismiss and stacking
 */
export function useToastQueue() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      onUndo: options.onUndo,
      duration: options.duration || 3000
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remove if no undo action
    if (!options.onUndo && toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const success = (message, options) => addToast(message, 'success', options);
  const error = (message, options) => addToast(message, 'error', options);
  const warning = (message, options) => addToast(message, 'warning', options);
  const info = (message, options) => addToast(message, 'info', options);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
}

/**
 * Toast Container - Renders all toasts with stacking
 */
export function ToastContainer({ toasts, onRemove, position = 'bottom-right' }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      {toasts.map((toast, index) => (
        <div 
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            marginBottom: index < toasts.length - 1 ? '0.75rem' : '0'
          }}
        >
          <EnhancedToast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
            onUndo={toast.onUndo}
            duration={toast.duration}
            position={position}
          />
        </div>
      ))}
    </div>
  );
}
