/**
 * Chore Template Library
 * Manages system templates and custom templates
 */

export const SYSTEM_CHORE_TEMPLATES = [
  {
    name: 'Clean Bedroom',
    description: 'Tidy and vacuum bedroom'
  },
  {
    name: 'Clean Kitchen',
    description: 'Wipe counters, clean sink, sweep floor'
  },
  {
    name: 'Clean Living Room',
    description: 'Dust furniture, pick up items, vacuum'
  },
  {
    name: 'Take Out Trash',
    description: 'Empty trash cans and take to curb'
  },
  {
    name: 'Wash Dishes',
    description: 'Wash or load dishes into dishwasher'
  },
  {
    name: 'Do Laundry',
    description: 'Wash, dry, and fold laundry'
  },
  {
    name: 'Vacuum Floors',
    description: 'Vacuum all carpeted areas'
  },
  {
    name: 'Clean Bathroom',
    description: 'Clean toilet, sink, and shower'
  },
  {
    name: 'Mop Floors',
    description: 'Mop kitchen and bathroom floors'
  },
  {
    name: 'Grocery Shopping',
    description: 'Shop for weekly groceries'
  },
  {
    name: 'Yard Work',
    description: 'Mow lawn and trim edges'
  },
  {
    name: 'Organize Closet',
    description: 'Sort and organize closet'
  }
];

export const FREQUENCY_OPTIONS = [
  'once',
  'daily',
  'weekly',
  'biweekly',
  'monthly'
];

/**
 * Initialize system templates in the database
 * Idempotent - safe to call multiple times
 */
export async function initializeSystemTemplates(prisma) {
  try {
    // Check if system templates already exist
    const existing = await prisma.choreTemplate.findFirst({
      where: { isSystem: true }
    });

    if (existing) {
      // System templates already initialized
      return [];
    }

    // Create all system templates
    const results = await Promise.all(
      SYSTEM_CHORE_TEMPLATES.map(template =>
        prisma.choreTemplate.create({
          data: {
            name: template.name,
            description: template.description,
            isSystem: true,
            familyId: null
          }
        })
      )
    );
    return results;
  } catch (error) {
    console.error('Failed to initialize templates:', error);
    throw error;
  }
}

/**
 * Get all available templates for a family
 * Returns system templates + family custom templates
 */
export async function getTemplates(prisma, familyId) {
  try {
    // First, ensure system templates are initialized
    await initializeSystemTemplates(prisma);

    // Then get both system and family-specific templates
    const templates = await prisma.choreTemplate.findMany({
      where: {
        OR: [
          { isSystem: true, familyId: null },
          { familyId: familyId }
        ]
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' }
      ]
    });

    return templates;
  } catch (error) {
    console.error('Failed to get templates:', error);
    throw error;
  }
}

/**
 * Parse eligible member IDs from JSON string
 * Returns array of member IDs or empty array if null/invalid
 */
export function parseEligibleMembers(eligibleMemberIds) {
  if (!eligibleMemberIds) {
    return [];
  }

  try {
    const parsed = JSON.parse(eligibleMemberIds);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse eligible members:', error);
    return [];
  }
}

/**
 * Stringify eligible member IDs to JSON
 * Accepts array of member IDs
 */
export function stringifyEligibleMembers(memberIds) {
  if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    return null;
  }

  return JSON.stringify(memberIds);
}
