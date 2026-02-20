// Predefined chores for the chore board (streamlined)
export const PREDEFINED_CHORES = [
  { templateKey: 'clean_kitchen', title: 'Clean Kitchen', description: 'Wipe counters, dishes' },
  { templateKey: 'clean_bathroom', title: 'Clean Bathroom' },
  { templateKey: 'clean_bedroom', title: 'Clean Bedroom' },
  { templateKey: 'clean_living_room', title: 'Clean Living Room' },
  { templateKey: 'tidy_room', title: 'Tidy Room', description: 'Dust, vacuum, pick up' },
  { templateKey: 'sweep_mop', title: 'Sweep/Mop' },
  { templateKey: 'laundry', title: 'Laundry' },
  { templateKey: 'trash', title: 'Take Out Trash' }
];

// Mapping for migrating old chores/templates to new combined ones
export const CHORE_MIGRATION_MAP = {
  // Old titles -> { newTitle, newTemplateKey, defaultDescription }
  'Wipe Counters': { newTitle: 'Clean Kitchen', newTemplateKey: 'clean_kitchen', defaultDescription: 'Wipe counters' },
  'Dishes': { newTitle: 'Clean Kitchen', newTemplateKey: 'clean_kitchen', defaultDescription: 'Dishes' },
  'Clean Kitchen': { newTitle: 'Clean Kitchen', newTemplateKey: 'clean_kitchen' },
  'Dusting': { newTitle: 'Tidy Room', newTemplateKey: 'tidy_room', defaultDescription: 'Dust, vacuum, pick up' },
  'Vacuum': { newTitle: 'Tidy Room', newTemplateKey: 'tidy_room', defaultDescription: 'Dust, vacuum, pick up' },
  'Organize/Declutter': { newTitle: 'Tidy Room', newTemplateKey: 'tidy_room', defaultDescription: 'Dust, vacuum, pick up' },
  'Clean Bedroom': { newTitle: 'Clean Bedroom', newTemplateKey: 'clean_bedroom' },
  'Clean Living Room': { newTitle: 'Clean Living Room', newTemplateKey: 'clean_living_room' },
  'Clean Bathroom': { newTitle: 'Clean Bathroom', newTemplateKey: 'clean_bathroom' },
  'Sweep/Mop': { newTitle: 'Sweep/Mop', newTemplateKey: 'sweep_mop' },
  'Laundry': { newTitle: 'Laundry', newTemplateKey: 'laundry' },
  'Take Out Trash': { newTitle: 'Take Out Trash', newTemplateKey: 'trash' }
};

// Old templateKeys -> new templateKey
export const TEMPLATE_KEY_MIGRATION_MAP = {
  wipe_counters: 'clean_kitchen',
  dishes: 'clean_kitchen',
  clean_kitchen: 'clean_kitchen',
  dusting: 'tidy_room',
  vacuum: 'tidy_room',
  declutter: 'tidy_room',
  clean_bedroom: 'clean_bedroom',
  clean_living_room: 'clean_living_room',
  clean_bathroom: 'clean_bathroom',
  sweep_mop: 'sweep_mop',
  laundry: 'laundry',
  trash: 'trash'
};

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
