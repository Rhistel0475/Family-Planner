'use client';

import { useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';

export default function Modal({ isOpen, onClose, title, children, size = 'medium' }) {
  const { theme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    small: '400px',
    medium: '600px',
    large: '800px'
  };

  return (
    <>
      <div style={styles.backdrop} onClick={onClose} />
      <div style={{
        ...styles.modal,
        maxWidth: sizes[size] || sizes.medium,
        background: theme.hero.bg,
        border: `2px solid ${theme.card.border}`
      }}>
        <div style={{...styles.header, borderBottom: `1px solid ${theme.card.border}`, background: theme.controls.bg}}>
          <h2 style={{...styles.title, color: theme.card.text}}>{title}</h2>
          <button
            onClick={onClose}
            style={{...styles.closeButton, color: theme.card.text}}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(25, 15, 3, 0.6)',
    zIndex: 9998,
    animation: 'fadeIn 0.2s ease-out'
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxHeight: '90vh',
    background: '#ffef7d',
    borderRadius: 12,
    border: '2px solid rgba(98, 73, 24, 0.3)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    zIndex: 9999,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideUp 0.3s ease-out'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid rgba(98, 73, 24, 0.2)',
    background: 'rgba(255, 255, 255, 0.3)'
  },
  title: {
    margin: 0,
    fontSize: '1.35rem',
    color: '#3f2d1d'
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#3f2d1d',
    lineHeight: 1,
    padding: '0 0.25rem',
    opacity: 0.7
  },
  content: {
    padding: '1.5rem',
    overflowY: 'auto',
    flex: 1
  }
};
