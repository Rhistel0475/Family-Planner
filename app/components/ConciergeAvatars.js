'use client';

/**
 * Cartoon-style full body avatars for the Concierge page.
 * Each avatar is an SVG with viewBox "0 0 64 80" (portrait). Use size prop for pixel dimensions.
 */

const DEFAULT_FILL = '#3f2d1d';
const DEFAULT_ACCENT = '#c9f7a5';

function AvatarWrapper({ size = 48, children, style = {}, ariaLabel }) {
  const s = typeof size === 'number' ? size : 48;
  return (
    <span
      role="img"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: s,
        height: s,
        flexShrink: 0,
        ...style
      }}
    >
      <svg
        width={s}
        height={s}
        viewBox="0 0 64 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {children}
      </svg>
    </span>
  );
}

/** Friendly robot/assistant character for hero and AI features */
export function AIAssistantAvatar({ size = 48, fill = DEFAULT_FILL, accent = DEFAULT_ACCENT, style, ariaLabel = 'AI Assistant' }) {
  return (
    <AvatarWrapper size={size} style={style} ariaLabel={ariaLabel}>
      {/* Body - rounded robot torso */}
      <rect x="14" y="28" width="36" height="32" rx="8" fill={accent} stroke={fill} strokeWidth="2" />
      <rect x="20" y="34" width="24" height="6" rx="2" fill={fill} opacity="0.3" />
      <rect x="20" y="44" width="24" height="6" rx="2" fill={fill} opacity="0.3" />
      {/* Head - rounded with antenna */}
      <circle cx="32" cy="18" r="14" fill={accent} stroke={fill} strokeWidth="2" />
      <line x1="32" y1="4" x2="32" y2="0" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="0" r="2" fill={fill} />
      {/* Eyes */}
      <ellipse cx="26" cy="16" rx="3" ry="4" fill={fill} />
      <ellipse cx="38" cy="16" rx="3" ry="4" fill={fill} />
      {/* Smile */}
      <path d="M 26 22 Q 32 26 38 22" stroke={fill} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Feet */}
      <rect x="18" y="58" width="10" height="8" rx="4" fill={fill} opacity="0.5" />
      <rect x="36" y="58" width="10" height="8" rx="4" fill={fill} opacity="0.5" />
    </AvatarWrapper>
  );
}

/** Character with broom for chore-related features */
export function ChoresAvatar({ size = 48, fill = DEFAULT_FILL, accent = DEFAULT_ACCENT, style, ariaLabel = 'Chores' }) {
  return (
    <AvatarWrapper size={size} style={style} ariaLabel={ariaLabel}>
      {/* Broom - held to the right */}
      <line x1="48" y1="20" x2="58" y2="70" stroke={fill} strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="25" x2="62" y2="72" stroke={fill} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <rect x="54" y="68" width="12" height="4" rx="1" fill={fill} opacity="0.6" />
      {/* Body */}
      <ellipse cx="32" cy="42" rx="14" ry="18" fill={accent} stroke={fill} strokeWidth="2" />
      <path d="M 22 36 L 42 36 L 40 48 L 24 48 Z" fill={fill} opacity="0.2" />
      {/* Head */}
      <circle cx="32" cy="18" r="12" fill="#ffdfb8" stroke={fill} strokeWidth="2" />
      <circle cx="28" cy="16" r="2" fill={fill} />
      <circle cx="36" cy="16" r="2" fill={fill} />
      <path d="M 28 22 Q 32 25 36 22" stroke={fill} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Arm holding broom */}
      <path d="M 40 28 L 48 24" stroke="#ffdfb8" strokeWidth="4" strokeLinecap="round" />
      <path d="M 40 28 L 48 24" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      {/* Legs */}
      <path d="M 26 58 L 26 72 L 30 72" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 38 58 L 38 72 L 34 72" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </AvatarWrapper>
  );
}

/** Character with cooking/meal for meal planning */
export function MealsAvatar({ size = 48, fill = DEFAULT_FILL, accent = DEFAULT_ACCENT, style, ariaLabel = 'Meal planning' }) {
  return (
    <AvatarWrapper size={size} style={style} ariaLabel={ariaLabel}>
      {/* Plate with steam */}
      <ellipse cx="32" cy="52" rx="16" ry="6" fill="#fff" stroke={fill} strokeWidth="2" />
      <ellipse cx="32" cy="50" rx="12" ry="4" fill={accent} opacity="0.5" />
      <path d="M 24 44 Q 26 40 28 44" stroke={fill} strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M 32 42 Q 34 38 36 42" stroke={fill} strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M 40 44 Q 42 40 44 44" stroke={fill} strokeWidth="1" fill="none" opacity="0.6" />
      {/* Body / apron */}
      <path d="M 18 32 L 46 32 L 44 54 L 20 54 Z" fill={accent} stroke={fill} strokeWidth="2" />
      <path d="M 28 32 L 28 44 L 36 44 L 36 32" fill={fill} opacity="0.15" />
      {/* Head */}
      <circle cx="32" cy="18" r="12" fill="#ffdfb8" stroke={fill} strokeWidth="2" />
      <circle cx="28" cy="16" r="2" fill={fill} />
      <circle cx="36" cy="16" r="2" fill={fill} />
      <path d="M 28 22 Q 32 25 36 22" stroke={fill} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Chef hat hint */}
      <path d="M 22 12 L 32 6 L 42 12 L 40 16 L 24 16 Z" fill="#fff" stroke={fill} strokeWidth="1.5" />
    </AvatarWrapper>
  );
}

/** Character with calendar/planner for scheduling */
export function CalendarAvatar({ size = 48, fill = DEFAULT_FILL, accent = DEFAULT_ACCENT, style, ariaLabel = 'Calendar' }) {
  return (
    <AvatarWrapper size={size} style={style} ariaLabel={ariaLabel}>
      {/* Calendar in hands */}
      <rect x="28" y="26" width="22" height="24" rx="4" fill="#fff" stroke={fill} strokeWidth="2" />
      <rect x="28" y="26" width="22" height="8" rx="4" fill={accent} />
      <line x1="32" y1="38" x2="46" y2="38" stroke={fill} strokeWidth="1" opacity="0.6" />
      <line x1="32" y1="44" x2="46" y2="44" stroke={fill} strokeWidth="1" opacity="0.6" />
      <line x1="32" y1="50" x2="42" y2="50" stroke={fill} strokeWidth="1" opacity="0.6" />
      {/* Body */}
      <ellipse cx="24" cy="44" rx="10" ry="14" fill={accent} stroke={fill} strokeWidth="2" />
      {/* Head */}
      <circle cx="24" cy="18" r="11" fill="#ffdfb8" stroke={fill} strokeWidth="2" />
      <circle cx="21" cy="16" r="2" fill={fill} />
      <circle cx="27" cy="16" r="2" fill={fill} />
      <path d="M 21 22 Q 24 25 27 22" stroke={fill} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Arm holding calendar */}
      <path d="M 32 28 L 28 38" stroke="#ffdfb8" strokeWidth="3" strokeLinecap="round" />
      <path d="M 32 28 L 28 38" stroke={fill} strokeWidth="1.5" strokeLinecap="round" />
      {/* Legs */}
      <path d="M 18 56 L 18 72 L 22 72" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 30 56 L 30 72 L 26 72" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </AvatarWrapper>
  );
}

/** Celebratory character for success states */
export function SuccessAvatar({ size = 48, fill = '#fff', accent = '#2c7939', style, ariaLabel = 'Success' }) {
  return (
    <AvatarWrapper size={size} style={style} ariaLabel={ariaLabel}>
      {/* Arms up */}
      <path d="M 18 24 L 10 8" stroke="#ffdfb8" strokeWidth="4" strokeLinecap="round" />
      <path d="M 46 24 L 54 8" stroke="#ffdfb8" strokeWidth="4" strokeLinecap="round" />
      <path d="M 18 24 L 10 8" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      <path d="M 46 24 L 54 8" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      {/* Checkmark */}
      <path d="M 52 6 L 56 10 L 62 2" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Body */}
      <ellipse cx="32" cy="42" rx="14" ry="18" fill={accent} stroke={fill} strokeWidth="2" />
      {/* Head */}
      <circle cx="32" cy="18" r="12" fill="#ffdfb8" stroke={fill} strokeWidth="2" />
      <circle cx="28" cy="16" r="2" fill={fill} />
      <circle cx="36" cy="16" r="2" fill={fill} />
      <path d="M 26 24 Q 32 28 38 24" stroke={fill} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Legs */}
      <path d="M 24 58 L 24 72 L 28 72" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 40 58 L 40 72 L 36 72" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </AvatarWrapper>
  );
}

/** Alert character for warnings/errors */
export function WarningAvatar({ size = 48, fill = '#fff', accent = '#8b1f1f', style, ariaLabel = 'Warning' }) {
  return (
    <AvatarWrapper size={size} style={style} ariaLabel={ariaLabel}>
      {/* Exclamation above head */}
      <path d="M 32 0 L 32 12 M 32 16 L 32 18" stroke={fill} strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="22" r="3" fill={fill} />
      {/* Body */}
      <ellipse cx="32" cy="44" rx="14" ry="18" fill={accent} stroke={fill} strokeWidth="2" />
      {/* Head */}
      <circle cx="32" cy="18" r="12" fill="#ffdfb8" stroke={fill} strokeWidth="2" />
      <circle cx="28" cy="16" r="2" fill={fill} />
      <circle cx="36" cy="16" r="2" fill={fill} />
      <path d="M 28 22 L 36 22" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      {/* Arms - worried */}
      <path d="M 18 32 L 12 40" stroke="#ffdfb8" strokeWidth="4" strokeLinecap="round" />
      <path d="M 46 32 L 52 40" stroke="#ffdfb8" strokeWidth="4" strokeLinecap="round" />
      <path d="M 18 32 L 12 40" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      <path d="M 46 32 L 52 40" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      {/* Legs */}
      <path d="M 24 60 L 24 72 L 28 72" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 40 60 L 40 72 L 36 72" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </AvatarWrapper>
  );
}

/** Friendly helper for info messages */
export function InfoAvatar({ size = 48, fill = '#fff', accent = '#2b5f99', style, ariaLabel = 'Info' }) {
  return (
    <AvatarWrapper size={size} style={style} ariaLabel={ariaLabel}>
      {/* Info dot above head */}
      <circle cx="32" cy="8" r="4" fill={fill} />
      <path d="M 32 2 L 32 4 M 32 12 L 32 16" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      {/* Body */}
      <ellipse cx="32" cy="44" rx="14" ry="18" fill={accent} stroke={fill} strokeWidth="2" />
      {/* Head */}
      <circle cx="32" cy="18" r="12" fill="#ffdfb8" stroke={fill} strokeWidth="2" />
      <circle cx="28" cy="16" r="2" fill={fill} />
      <circle cx="36" cy="16" r="2" fill={fill} />
      <path d="M 28 22 Q 32 26 36 22" stroke={fill} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Arm pointing up / gesture */}
      <path d="M 44 26 L 52 14" stroke="#ffdfb8" strokeWidth="4" strokeLinecap="round" />
      <path d="M 44 26 L 52 14" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      <path d="M 52 12 L 54 10 L 56 14 L 52 16 Z" fill={fill} />
      {/* Legs */}
      <path d="M 24 60 L 24 72 L 28 72" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 40 60 L 40 72 L 36 72" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </AvatarWrapper>
  );
}

/** Neutral character for empty states */
export function EmptyStateAvatar({ size = 48, fill = DEFAULT_FILL, accent = DEFAULT_ACCENT, style, ariaLabel = 'Empty' }) {
  return (
    <AvatarWrapper size={size} style={style} ariaLabel={ariaLabel}>
      {/* Body */}
      <ellipse cx="32" cy="42" rx="14" ry="18" fill={accent} stroke={fill} strokeWidth="2" />
      {/* Head */}
      <circle cx="32" cy="18" r="12" fill="#ffdfb8" stroke={fill} strokeWidth="2" />
      <circle cx="28" cy="16" r="2" fill={fill} />
      <circle cx="36" cy="16" r="2" fill={fill} />
      <path d="M 28 22 Q 32 25 36 22" stroke={fill} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Arms at sides / neutral */}
      <path d="M 18 32 L 14 48" stroke="#ffdfb8" strokeWidth="4" strokeLinecap="round" />
      <path d="M 46 32 L 50 48" stroke="#ffdfb8" strokeWidth="4" strokeLinecap="round" />
      <path d="M 18 32 L 14 48" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      <path d="M 46 32 L 50 48" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      {/* Legs */}
      <path d="M 24 58 L 24 72 L 28 72" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 40 58 L 40 72 L 36 72" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </AvatarWrapper>
  );
}

/** Person avatar for "assigned to" labels (small inline) */
export function PersonAvatar({ size = 24, fill = DEFAULT_FILL, style, ariaLabel = 'Person' }) {
  return (
    <AvatarWrapper size={size} style={style} ariaLabel={ariaLabel}>
      <circle cx="32" cy="18" r="11" fill="#ffdfb8" stroke={fill} strokeWidth="2" />
      <circle cx="28" cy="16" r="2" fill={fill} />
      <circle cx="36" cy="16" r="2" fill={fill} />
      <path d="M 28 22 Q 32 25 36 22" stroke={fill} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="32" cy="46" rx="12" ry="18" fill={fill} opacity="0.35" stroke={fill} strokeWidth="2" />
      <path d="M 22 36 L 18 70 L 24 70" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 42 36 L 46 70 L 40 70" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </AvatarWrapper>
  );
}
