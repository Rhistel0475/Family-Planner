'use client';

import { useTheme } from '../../providers/ThemeProvider';

export default function Input({ style = {}, ...rest }) {
  const { theme } = useTheme();
  const themeInput = theme.input || {};
  return (
    <input
      style={{
        width: '100%',
        padding: '0.6rem 0.75rem',
        borderRadius: 6,
        border: `1px solid ${themeInput.border || theme.card.border}`,
        background: themeInput.bg || theme.card.bg?.[0],
        color: themeInput.text || theme.card.text,
        fontSize: '0.95rem',
        boxSizing: 'border-box',
        ...style
      }}
      {...rest}
    />
  );
}
