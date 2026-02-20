import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

// Recipe Library: single source for listing/CRUD. When Concierge Meal Planning is added,
// that route should fetch recipes (e.g. prisma.recipe.findMany by familyId) and pass
// as existingRecipes to generateMealPlan(familyMembers, existingRecipes, daysToFill) in lib/ai.js.

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

export async function PATCH(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const id = body?.id;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });
  }
  const family = await getOrCreateDefaultFamily();
  const existing = await prisma.recipe.findFirst({
    where: { id, familyId: family.id }
  });
  if (!existing) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }
  const updates = {};
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.ingredients !== undefined) updates.ingredients = String(body.ingredients).trim();
  if (body.instructions !== undefined) updates.instructions = String(body.instructions).trim() || null;
  if (body.sourceUrl !== undefined) updates.sourceUrl = String(body.sourceUrl).trim() || null;
  if (body.cookDay !== undefined) updates.cookDay = String(body.cookDay).trim();
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(existing);
  }
  const recipe = await prisma.recipe.update({
    where: { id },
    data: updates
  });
  return NextResponse.json(recipe);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const family = await getOrCreateDefaultFamily();
  const existing = await prisma.recipe.findFirst({
    where: { id, familyId: family.id }
  });
  if (!existing) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }
  await prisma.recipe.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
