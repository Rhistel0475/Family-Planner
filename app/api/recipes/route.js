import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuthAndFamily, apiError } from '../../../lib/sessionFamily';
import { validateRequest, recipeSchema } from '../../../lib/validators';

export async function GET() {
  const auth = await requireAuthAndFamily();
  if (auth instanceof Response) return auth;
  const { family } = auth;

  try {
    const recipes = await prisma.recipe.findMany({
      where: { familyId: family.id },
      orderBy: [{ cookDay: 'asc' }, { name: 'asc' }]
    });
    return NextResponse.json({ recipes });
  } catch (error) {
    return apiError(error, 'Failed to fetch recipes', 500);
  }
}

export async function POST(request) {
  const auth = await requireAuthAndFamily();
  if (auth instanceof Response) return auth;
  const { family } = auth;

  const contentType = request.headers.get('content-type') || '';
  try {
    let body;
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = {
        name: formData.get('name') ?? '',
        ingredients: formData.get('ingredients') ?? '',
        cookDay: formData.get('cookDay') ?? 'Sunday'
      };
    }
    const validation = validateRequest(recipeSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const data = validation.data;

    const recipe = await prisma.recipe.create({
      data: {
        familyId: family.id,
        name: data.name.trim(),
        ingredients: data.ingredients.trim(),
        cookDay: data.cookDay
      }
    });
    if (contentType.includes('application/json')) {
      return NextResponse.json({ success: true, recipe }, { status: 201 });
    }
    return NextResponse.redirect(new URL('/recipes?saved=1', request.url));
  } catch (error) {
    if (typeof contentType === 'string' && contentType.includes('application/json')) {
      return apiError(error, 'Failed to create recipe', 500);
    }
    return NextResponse.redirect(new URL('/recipes?error=1', request.url));
  }
}
