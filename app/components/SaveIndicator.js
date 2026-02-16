'use client';

import { useEffect, useState } from 'react';

/**
 * SaveIndicator - Shows save status with animations
 * 
 * Usage:
 * const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
 * <SaveIndicator status={saveStatus} />
 */
export default function SaveIndicator({ status = 'idle', message = '' }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status !== 'idle') {
      setShow(true);
    }
    
    // Auto-hide after "saved" appears for 2 seconds
    if (status === 'saved') {
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!show) return null;

  const configs = {
    saving: {
      icon: '⏳',
      text: message || 'Saving...',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    saved: {
      icon: '✓',
      text: message || 'Saved',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)'
    },
    error: {
      icon: '✕',
      text: message || 'Failed to save',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)'
    }
  };

  const config = configs[status] || configs.saving;

  return (
    <>
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }

        .save-indicator {
          animation: slideIn 0.3s ease-out;
        }

        .save-indicator.saved .icon {
          animation: bounce 0.5s ease-in-out;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .save-indicator.saving .icon {
          animation: spin 1s linear infinite;
        }
      `}</style>

      <div 
        className={`save-indicator ${status}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          background: config.bgColor,
          color: config.color,
          fontSize: '0.875rem',
          fontWeight: 600,
          border: `1px solid ${config.color}30`
        }}
      >
        <span className="icon" style={{ fontSize: '1rem' }}>
          {config.icon}
        </span>
        <span>{config.text}</span>
      </div>
    </>
  );
}

/**
 * Inline save indicator for forms
 */
export function InlineSaveIndicator({ status, style = {} }) {
  if (status === 'idle') return null;

  const configs = {
    saving: { icon: '⏳', text: 'Saving...', color: '#3b82f6' },
    saved: { icon: '✓', text: 'Saved', color: '#22c55e' },
    error: { icon: '✕', text: 'Error', color: '#ef4444' }
  };

  const config = configs[status] || configs.saving;

  return (
    <span style={{
      marginLeft: '0.5rem',
      fontSize: '0.875rem',
      color: config.color,
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      ...style
    }}>
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </span>
  );
}

/**
 * Hook for managing save status
 */
export function useSaveStatus() {
  const [status, setStatus] = useState('idle');

  const save = async (saveFunction) => {
    setStatus('saving');
    try {
      await saveFunction();
      setStatus('saved');
      // Auto-reset after 2 seconds
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      setStatus('error');
      // Reset after showing error
      setTimeout(() => setStatus('idle'), 3000);
      throw error;
    }
  };

  return { status, save, setStatus };
}
