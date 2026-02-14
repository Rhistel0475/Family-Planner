import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateKey = searchParams.get('templateKey');

    const family = await getOrCreateDefaultFamily();

    if (templateKey) {
      // Get specific template
      const template = await prisma.choreBoard.findUnique({
        where: {
          familyId_templateKey: {
            familyId: family.id,
            templateKey: templateKey
          }
        }
      });

      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ template });
    } else {
      // Get all templates
      const templates = await prisma.choreBoard.findMany({
        where: {
          familyId: family.id
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      return NextResponse.json({ templates });
    }
  } catch (error) {
    console.error('Chore Board GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chore board templates', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      templateKey,
      title,
      isRecurring = false,
      frequencyType = 'ONE_TIME',
      customEveryDays = null,
      eligibilityMode = 'ALL',
      eligibleMemberIds = [],
      defaultAssigneeMemberId = null
    } = body;

    if (!templateKey || !title) {
      return NextResponse.json(
        { error: 'Template key and title are required' },
        { status: 400 }
      );
    }

    const family = await getOrCreateDefaultFamily();

    // Check if template already exists
    const existing = await prisma.choreBoard.findUnique({
      where: {
        familyId_templateKey: {
          familyId: family.id,
          templateKey: templateKey
        }
      }
    });

    if (existing) {
      // Update existing template
      const updated = await prisma.choreBoard.update({
        where: {
          id: existing.id
        },
        data: {
          title,
          isRecurring,
          frequencyType,
          customEveryDays,
          eligibilityMode,
          eligibleMemberIds,
          defaultAssigneeMemberId,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({ template: updated, created: false });
    } else {
      // Create new template
      const template = await prisma.choreBoard.create({
        data: {
          familyId: family.id,
          templateKey,
          title,
          isRecurring,
          frequencyType,
          customEveryDays,
          eligibilityMode,
          eligibleMemberIds,
          defaultAssigneeMemberId
        }
      });

      return NextResponse.json({ template, created: true }, { status: 201 });
    }
  } catch (error) {
    console.error('Chore Board POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save chore board template', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const template = await prisma.choreBoard.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Chore Board PATCH error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update template', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    await prisma.choreBoard.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chore Board DELETE error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete template', details: error.message },
      { status: 500 }
    );
  }
}
