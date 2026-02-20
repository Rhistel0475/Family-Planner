'use client';

import { useTheme } from '../../providers/ThemeProvider';

export default function Label({ htmlFor, children, style = {}, ...rest }) {
  const { theme } = useTheme();
  return (
    <label
      htmlFor={htmlFor}
      style={{
        fontSize: '0.8rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '0.4rem',
        display: 'block',
        fontWeight: 700,
        color: theme.card.text,
        ...style
      }}
      {...rest}
    >
      {children}
    </label>
  );
}
