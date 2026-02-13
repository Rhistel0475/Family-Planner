import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../../lib/defaultFamily';
import { generateChoreAssignments } from '../../../../lib/ai';
import { assignChoresRuleBased } from '../../../../lib/choreAssignment';

export async function GET() {
  try {
    const family = await getOrCreateDefaultFamily();
    
    const members = await prisma.familyMember.findMany({
      where: { familyId: family.id }
    });

    if (members.length === 0) {
      return NextResponse.json({
        suggestions: [],
        message: 'No family members found. Please add family members in the Family page first.'
      });
    }

    const unassignedChores = await prisma.chore.findMany({
      where: {
        familyId: family.id,
        completed: false
      }
    });

    if (unassignedChores.length === 0) {
      return NextResponse.json({
        suggestions: [],
        message: 'No incomplete chores found. All chores are done!'
      });
    }

    // Try AI first, fallback to rule-based on error
    try {
      const suggestions = await generateChoreAssignments(members, unassignedChores);
      return NextResponse.json(suggestions);
    } catch (aiError) {
      console.log('AI unavailable, using rule-based assignment:', aiError.message);
      // Use rule-based fallback
      const suggestions = assignChoresRuleBased(members, unassignedChores);
      return NextResponse.json(suggestions);
    }
  } catch (error) {
    console.error('Chore assignment error:', error);
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
