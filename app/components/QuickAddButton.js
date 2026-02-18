'use client';

export default function QuickAddButton({ onClick, icon, label, color = '#c9f7a5', disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.button,
        background: color
      }}
      aria-label={label}
    >
      <span style={styles.icon}>{icon}</span>
      <span style={styles.label}>{label}</span>
    </button>
  );
}

const styles = {
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    borderRadius: 9999,
    border: '1px solid rgba(98, 73, 24, 0.28)',
    boxShadow: '0 4px 12px rgba(70, 45, 11, 0.15)',
    color: '#3f2d1d',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(70, 45, 11, 0.25)'
    }
  },
  icon: {
    fontSize: '1.2rem',
    lineHeight: 1
  },
  label: {
    whiteSpace: 'nowrap'
  }
};
