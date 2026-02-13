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
    try {
      await initializeSystemTemplates(prisma);
    } catch (initError) {
      console.error('Failed to initialize templates:', initError);
      // Continue - return in-memory templates as fallback
    }

    // Get all templates (system + family custom)
    let templates = [];
    try {
      templates = await getTemplates(prisma, family.id);
    } catch (getError) {
      console.error('Failed to get templates from DB:', getError);
      // Return in-memory system templates as fallback
      templates = [
        { id: 'system-1', name: 'Clean Bedroom', description: 'Tidy and vacuum bedroom', isSystem: true, familyId: null },
        { id: 'system-2', name: 'Clean Kitchen', description: 'Wipe counters, clean sink, sweep floor', isSystem: true, familyId: null },
        { id: 'system-3', name: 'Clean Living Room', description: 'Dust furniture, pick up items, vacuum', isSystem: true, familyId: null },
        { id: 'system-4', name: 'Take Out Trash', description: 'Empty trash cans and take to curb', isSystem: true, familyId: null },
        { id: 'system-5', name: 'Wash Dishes', description: 'Wash or load dishes into dishwasher', isSystem: true, familyId: null },
        { id: 'system-6', name: 'Do Laundry', description: 'Wash, dry, and fold laundry', isSystem: true, familyId: null },
        { id: 'system-7', name: 'Vacuum Floors', description: 'Vacuum all carpeted areas', isSystem: true, familyId: null },
        { id: 'system-8', name: 'Clean Bathroom', description: 'Clean toilet, sink, and shower', isSystem: true, familyId: null },
        { id: 'system-9', name: 'Mop Floors', description: 'Mop kitchen and bathroom floors', isSystem: true, familyId: null },
        { id: 'system-10', name: 'Grocery Shopping', description: 'Shop for weekly groceries', isSystem: true, familyId: null },
        { id: 'system-11', name: 'Yard Work', description: 'Mow lawn and trim edges', isSystem: true, familyId: null },
        { id: 'system-12', name: 'Organize Closet', description: 'Sort and organize closet', isSystem: true, familyId: null }
      ];
    }

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

    const template = await prisma.choreTemplate.create({
      data: {
        name,
        description,
        isSystem: false,
        familyId: family.id
      }
    });

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}
