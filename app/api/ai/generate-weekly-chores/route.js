import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../../lib/defaultFamily';
import { generateWeeklyChoreAssignments } from '../../../../lib/ai';
import { assignChoresRuleBased } from '../../../../lib/choreAssignment';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function distributeDays(count) {
  if (count >= 7) return [...DAY_NAMES];
  if (count <= 0) return [];

  const spacing = 7 / count;
  const indices = [];
  for (let i = 0; i < count; i++) {
    indices.push(Math.round(i * spacing) % 7);
  }

  const unique = [...new Set(indices)];
  while (unique.length < count) {
    for (let d = 0; d < 7 && unique.length < count; d++) {
      if (!unique.includes(d)) unique.push(d);
    }
  }

  unique.sort((a, b) => a - b);
  return unique.map(i => DAY_NAMES[i]);
}

export async function POST() {
  try {
    const family = await getOrCreateDefaultFamily();

    const members = await prisma.familyMember.findMany({
      where: { familyId: family.id }
    });

    if (members.length === 0) {
      return NextResponse.json({
        error: 'No family members found. Please add family members first.'
      }, { status: 400 });
    }

    const boardSettings = await prisma.choreBoard.findMany({
      where: {
        familyId: family.id,
        isRecurring: true,
        frequencyType: 'WEEKLY',
        daysPerWeek: { not: null }
      }
    });

    if (boardSettings.length === 0) {
      return NextResponse.json({
        created: [],
        assignments: [],
        message: 'No chore board entries have weekly frequency with days-per-week set. Configure chores on the Chores page first.'
      });
    }

    const titlesToGenerate = boardSettings.map(b => b.title);

    await prisma.chore.deleteMany({
      where: {
        familyId: family.id,
        title: { in: titlesToGenerate },
        completed: false
      }
    });

    const createdChores = [];

    for (const board of boardSettings) {
      const daysPerWeek = board.daysPerWeek || 1;
      const days = distributeDays(daysPerWeek);

      for (const day of days) {
        const chore = await prisma.chore.create({
          data: {
            familyId: family.id,
            title: board.title,
            assignedTo: 'Unassigned',
            dueDay: day,
            completed: false,
            isRecurring: true,
            recurrencePattern: 'WEEKLY'
          }
        });

        createdChores.push({
          ...chore,
          eligibleMemberIds: board.eligibleMemberIds,
          defaultAssigneeMemberId: board.defaultAssigneeMemberId,
          daysPerWeek: board.daysPerWeek
        });
      }
    }

    let assignments;
    try {
      const result = await generateWeeklyChoreAssignments(members, createdChores, boardSettings);
      assignments = result.suggestions || [];
    } catch (aiError) {
      console.log('AI unavailable for weekly chores, using rule-based:', aiError.message);
      const result = assignChoresRuleBased(members, createdChores);
      assignments = result.suggestions || [];
    }

    for (const assignment of assignments) {
      if (assignment.choreId && assignment.suggestedAssignee) {
        await prisma.chore.update({
          where: { id: assignment.choreId },
          data: { assignedTo: assignment.suggestedAssignee }
        });
      }
    }

    return NextResponse.json({
      success: true,
      created: createdChores.map(c => ({
        id: c.id,
        title: c.title,
        dueDay: c.dueDay
      })),
      assignments,
      message: `Created ${createdChores.length} chore instances across the week and assigned them.`
    });
  } catch (error) {
    console.error('Generate weekly chores error:', error);
    return NextResponse.json(
      { error: 'Failed to generate weekly chores', details: error.message },
      { status: 500 }
    );
  }
}
