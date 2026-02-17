import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuthAndFamily, apiError } from '../../../../lib/sessionFamily';
import { generateChoreAssignments } from '../../../../lib/ai';
import { assignChoresRuleBased } from '../../../../lib/choreAssignment';

export async function GET() {
  const auth = await requireAuthAndFamily();
  if (auth instanceof Response) return auth;
  const { family } = auth;

  try {
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

    try {
      const suggestions = await generateChoreAssignments(members, unassignedChores);
      return NextResponse.json(suggestions);
    } catch (aiError) {
      console.log('AI unavailable, using rule-based assignment:', aiError.message);
      const suggestions = assignChoresRuleBased(members, unassignedChores);
      return NextResponse.json(suggestions);
    }
  } catch (error) {
    return apiError(error, 'Failed to generate chore assignments', 500);
  }
}

export async function POST(request) {
  const auth = await requireAuthAndFamily();
  if (auth instanceof Response) return auth;
  const { family } = auth;

  try {
    const body = await request.json();
    const { choreId, assignedTo } = body;
    if (!choreId || assignedTo == null || assignedTo === '') {
      return NextResponse.json(
        { error: 'Missing choreId or assignedTo' },
        { status: 400 }
      );
    }

    const existing = await prisma.chore.findUnique({ where: { id: choreId } });
    if (!existing || existing.familyId !== family.id) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }

    const updatedChore = await prisma.chore.update({
      where: { id: choreId },
      data: { assignedTo: String(assignedTo) }
    });
    return NextResponse.json(updatedChore);
  } catch (error) {
    return apiError(error, 'Failed to assign chore', 500);
  }
}
