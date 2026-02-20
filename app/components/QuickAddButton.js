'use client';

import { useTheme } from '../providers/ThemeProvider';

export default function QuickAddButton({ onClick, icon, label, color = '#c9f7a5', disabled }) {
  const { theme } = useTheme();
  const textColor = theme?.button?.primaryText ?? theme?.card?.text ?? '#3f2d1d';
  const borderColor = theme?.card?.border ?? 'rgba(98, 73, 24, 0.28)';
  const shadowColor = theme?.card?.shadow ?? 'rgba(70, 45, 11, 0.15)';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.button,
        background: color,
        color: textColor,
        border: `1px solid ${borderColor}`,
        boxShadow: shadowColor ? `0 4px 12px ${shadowColor}` : undefined
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
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  icon: {
    fontSize: '1.2rem',
    lineHeight: 1
  },
  label: {
    whiteSpace: 'nowrap'
  }
};
