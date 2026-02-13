import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../../lib/defaultFamily';
import { generateChoreAssignments } from '../../../../lib/ai';

export async function GET() {
  try {
    const family = await getOrCreateDefaultFamily();
    
    const members = await prisma.familyMember.findMany({
      where: { familyId: family.id }
    });

    const unassignedChores = await prisma.chore.findMany({
      where: {
        familyId: family.id,
        assignedTo: null
      }
    });

    if (unassignedChores.length === 0) {
      return NextResponse.json({
        suggestions: [],
        message: 'All chores are already assigned!'
      });
    }

    const suggestions = await generateChoreAssignments(members, unassignedChores);

    return NextResponse.json(suggestions);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to generate chore assignments',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { choreId, assignedTo } = await request.json();

    if (!choreId || !assignedTo) {
      return NextResponse.json(
        { error: 'Missing choreId or assignedTo' },
        { status: 400 }
      );
    }

    const updatedChore = await prisma.chore.update({
      where: { id: choreId },
      data: { assignedTo }
    });

    return NextResponse.json(updatedChore);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to assign chore',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
