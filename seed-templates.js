import { prisma } from './lib/prisma.js';

const SYSTEM_CHORE_TEMPLATES = [
  { name: 'Clean Bedroom', description: 'Tidy and vacuum bedroom' },
  { name: 'Clean Kitchen', description: 'Wipe counters, clean sink, sweep floor' },
  { name: 'Clean Living Room', description: 'Dust furniture, pick up items, vacuum' },
  { name: 'Take Out Trash', description: 'Empty trash cans and take to curb' },
  { name: 'Wash Dishes', description: 'Wash or load dishes into dishwasher' },
  { name: 'Do Laundry', description: 'Wash, dry, and fold laundry' },
  { name: 'Vacuum Floors', description: 'Vacuum all carpeted areas' },
  { name: 'Clean Bathroom', description: 'Clean toilet, sink, and shower' },
  { name: 'Mop Floors', description: 'Mop kitchen and bathroom floors' },
  { name: 'Grocery Shopping', description: 'Shop for weekly groceries' },
  { name: 'Yard Work', description: 'Mow lawn and trim edges' },
  { name: 'Organize Closet', description: 'Sort and organize closet' }
];

async function main() {
  try {
    console.log('🌱 Seeding system templates...');
    
    for (const template of SYSTEM_CHORE_TEMPLATES) {
      const existing = await prisma.choreTemplate.findFirst({
        where: { name: template.name, isSystem: true }
      });

      if (!existing) {
        const created = await prisma.choreTemplate.create({
          data: {
            name: template.name,
            description: template.description,
            isSystem: true,
            familyId: null
          }
        });
        console.log(✅ Created: ${created.name});
      } else {
        console.log(⏭️  Already exists: ${template.name});
      }
    }

    console.log('✅ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
