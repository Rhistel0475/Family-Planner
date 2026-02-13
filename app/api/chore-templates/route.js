import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';
import { initializeSystemTemplates, getTemplates } from '../../../lib/choreTemplates';
import { z } from 'zod';

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(500).nullable().optional()
});

export async function GET(req) {
  try {
    const family = await getOrCreateDefaultFamily();
    
    // Initialize system templates on first call
    await initializeSystemTemplates(prisma);

    // Get all templates (system + family custom)
    const templates = await getTemplates(prisma, family.id);

    return NextResponse.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const family = await getOrCreateDefaultFamily();
    const body = await req.json();

    // Validate input
    const validation = templateSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return NextResponse.json(
        { errors, error: 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, description } = validation.data;

    // Check for duplicate names (system or family custom)
    const existing = await prisma.choreTemplate.findFirst({
      where: {
        name: name,
        OR: [
          { isSystem: true },
          { familyId: family.id }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Template with this name already exists' },
        { status: 409 }
      );
    }

    // Create custom template
    const template = await prisma.choreTemplate.create({
      data: {
        name,
        description: description || null,
        isSystem: false,
        familyId: family.id
      }
    });

    return NextResponse.json({
      success: true,
      template
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}
