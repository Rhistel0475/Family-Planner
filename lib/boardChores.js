// Predefined chores for the chore board
export const PREDEFINED_CHORES = [
  {
    templateKey: 'clean_kitchen',
    title: 'Clean Kitchen'
  },
  {
    templateKey: 'clean_bathroom',
    title: 'Clean Bathroom'
  },
  {
    templateKey: 'clean_bedroom',
    title: 'Clean Bedroom'
  },
  {
    templateKey: 'clean_living_room',
    title: 'Clean Living Room'
  },
  {
    templateKey: 'vacuum',
    title: 'Vacuum'
  },
  {
    templateKey: 'sweep_mop',
    title: 'Sweep/Mop'
  },
  {
    templateKey: 'dishes',
    title: 'Dishes'
  },
  {
    templateKey: 'laundry',
    title: 'Laundry'
  },
  {
    templateKey: 'dusting',
    title: 'Dusting'
  },
  {
    templateKey: 'trash',
    title: 'Take Out Trash'
  },
  {
    templateKey: 'wipe_counters',
    title: 'Wipe Counters'
  },
  {
    templateKey: 'declutter',
    title: 'Organize/Declutter'
  }
];

// Get status string for a board setting
export function getStatusString(setting) {
  const parts = [];

  // Recurring status
  if (setting.isRecurring) {
    const freqLabel = {
      'ONE_TIME': 'One-time',
      'DAILY': 'Daily',
      'WEEKLY': 'Weekly',
      'BIWEEKLY': 'Biweekly',
      'MONTHLY': 'Monthly',
      'CUSTOM': `Every ${setting.customEveryDays} days`
    }[setting.frequencyType] || setting.frequencyType;

    parts.push(`Recurring: ${freqLabel}`);
  } else {
    parts.push('One-time');
  }

  // Default assignee
  if (setting.defaultAssigneeMemberId) {
    parts.push(`Default: ${setting.defaultAssigneeLabel || 'Unassigned'}`);
  }

  // Eligibility
  if (setting.eligibilityMode === 'ALL') {
    parts.push('Eligible: All');
  } else {
    const count = setting.eligibleMemberIds?.length || 0;
    parts.push(`Eligible: ${count}`);
  }

  return parts.join(' • ');
}

// Get a deterministic rotation angle for visual variety
export function getRotationAngle(templateKey) {
  const seed = templateKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const angles = [-2, -1, 0, 1, 2];
  return angles[seed % angles.length];
}
