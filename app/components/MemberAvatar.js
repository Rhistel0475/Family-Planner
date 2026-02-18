'use client';

import { getInitials, getAvatarStyle, AVATAR_STYLES } from '../../lib/avatarUtils';

const SIZE_MAP = {
  sm: { size: 28, fontSize: '0.75rem' },
  md: { size: 40, fontSize: '1rem' },
  lg: { size: 80, fontSize: '1.75rem' }
};

export default function MemberAvatar({ name, color = '#3b82f6', style: styleProp, size = 'md' }) {
  const avatarStyle = getAvatarStyle(styleProp);
  const styleDef = AVATAR_STYLES.find(s => s.id === avatarStyle) || AVATAR_STYLES[0];
  const { size: px, fontSize } = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: styleDef.borderRadius,
        background: color,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 700,
        fontFamily: 'var(--font-handwritten), "Permanent Marker", cursive',
        border: `${Math.max(2, px / 20)}px solid rgba(255,255,255,0.8)`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        flexShrink: 0
      }}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
