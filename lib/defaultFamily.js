import { prisma } from './prisma';

export async function getOrCreateDefaultFamily() {
  // Get the first family, or create one if none exist
  let family = await prisma.family.findFirst({
    orderBy: { createdAt: 'asc' }
  });
  
  if (!family) {
    family = await prisma.family.create({
      data: {
        name: 'My Family',
        setupComplete: false
      }
    });
  }
  
  return family;
}
