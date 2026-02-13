import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

export async function POST(request) {
  try {
    const body = await request.json();
    const title = String(body.title || '').trim();
    const assignedTo = String(body.assignedTo || '').trim();
    const dueDay = String(body.dueDay || '').trim();
    const isRecurring = body.isRecurring === true;
    const recurrencePattern = body.recurrencePattern || null;
    const recurrenceInterval = parseInt(body.recurrenceInterval) || 1;
    const recurrenceEndDate = body.recurrenceEndDate ? new Date(body.recurrenceEndDate) : null;

    if (!title || !assignedTo || !dueDay) {
      return NextResponse.json(
        { error: 'Please provide title, assignee, and due day.' },
        { status: 400 }
      );
    }

    const family = await getOrCreateDefaultFamily();

    // Create single chore
    await prisma.chore.create({
      data: {
        familyId: family.id,
        title,
        assignedTo,
        dueDay
      }
    });

    const createdCount = 1;
    return NextResponse.json(
      { success: true, message: `Created ${createdCount} chore(s)` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Chores POST error:', error.message || error);
    return NextResponse.json(
      { error: 'Failed to save chore', details: error.message },
      { status: 500 }
    );
  }
}
