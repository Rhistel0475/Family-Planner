import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

export async function POST(request) {
  const formData = await request.formData();
  const name = String(formData.get('name') || '').trim();
  const ingredients = String(formData.get('ingredients') || '').trim();
  const cookDay = String(formData.get('cookDay') || '').trim();

  if (!name || !ingredients || !cookDay) {
    return NextResponse.redirect(new URL('/recipes?error=1', request.url));
  }

  const family = await getOrCreateDefaultFamily();

  await prisma.recipe.create({
    data: {
      familyId: family.id,
      name,
      ingredients,
      cookDay
    }
  });

  return NextResponse.redirect(new URL('/recipes?saved=1', request.url));
}
