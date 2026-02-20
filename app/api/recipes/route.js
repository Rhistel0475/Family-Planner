import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

export async function GET() {
  const family = await getOrCreateDefaultFamily();
  const recipes = await prisma.recipe.findMany({
    where: { familyId: family.id },
    orderBy: [{ cookDay: 'asc' }, { createdAt: 'desc' }]
  });
  return NextResponse.json(recipes);
}

export async function POST(request) {
  const formData = await request.formData();
  const name = String(formData.get('name') || '').trim();
  const ingredients = String(formData.get('ingredients') || '').trim();
  const cookDay = String(formData.get('cookDay') || '').trim();
  const instructions = String(formData.get('instructions') || '').trim() || null;
  const sourceUrl = String(formData.get('sourceUrl') || '').trim() || null;

  if (!name || !ingredients || !cookDay) {
    return NextResponse.redirect(new URL('/recipes?error=1', request.url));
  }

  const family = await getOrCreateDefaultFamily();

  await prisma.recipe.create({
    data: {
      familyId: family.id,
      name,
      ingredients,
      cookDay,
      instructions,
      sourceUrl
    }
  });

  return NextResponse.redirect(new URL('/recipes?saved=1', request.url));
}
