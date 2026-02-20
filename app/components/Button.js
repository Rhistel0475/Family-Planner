'use client';

import { useTheme } from '../providers/ThemeProvider';

const baseStyle = {
  padding: '0.65rem 1rem',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: '1px solid transparent'
};

export default function Button({
  variant = 'primary',
  type = 'button',
  onClick,
  children,
  disabled,
  style = {},
  ...rest
}) {
  const { theme } = useTheme();

  const variantStyles = {
    primary: {
      background: theme.button.primary,
      color: theme.button.primaryText,
      borderColor: theme.card.border
    },
    secondary: {
      background: theme.button.secondary,
      color: theme.card.text,
      borderColor: theme.card.border
    },
    danger: {
      background: theme.toast.error.bg,
      color: 'white',
      borderColor: theme.toast.error.border
    }
  };

  const combined = {
    ...baseStyle,
    ...variantStyles[variant],
    ...style
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={combined}
      {...rest}
    >
      {children}
    </button>
  );
}
