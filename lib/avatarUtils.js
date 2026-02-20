export const AVATAR_STYLES = [
  { id: 'circle', label: 'Circle', borderRadius: '50%' },
  { id: 'rounded', label: 'Rounded', borderRadius: '12px' },
  { id: 'square', label: 'Square', borderRadius: '4px' }
];

export function getInitials(name) {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function getAvatarStyle(avatarValue) {
  return AVATAR_STYLES.some(s => s.id === avatarValue) ? avatarValue : 'circle';
}
