import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';
import { getNextOccurrence } from '../../../lib/recurring';
import { DAY_NAMES } from '../../../lib/constants';
import { choreSchema, validateRequest } from '../../../lib/validators';
import { stringifyEligibleMembers } from '../../../lib/choreTemplates';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0');

    const family = await getOrCreateDefaultFamily();

    // Get all chores for the family
    const chores = await prisma.chore.findMany({
      where: {
        familyId: family.id,
        parentEventId: null // Only get actual instances, not parent patterns
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ chores });
  } catch (error) {
    console.error('Chores GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chores', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateRequest(choreSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, errors: validation.errors },
        { status: 400 }
      );
    }

    const { 
      title, 
      assignedTo, 
      dueDay, 
      choreTemplateId,
      frequency,
      eligibleMemberIds,
      isRecurring, 
      recurrencePattern, 
      recurrenceInterval, 
      recurrenceEndDate 
    } = validation.data;

    const family = await getOrCreateDefaultFamily();

    // If eligibleMemberIds is provided, validate that assignedTo is in the list
    if (eligibleMemberIds && eligibleMemberIds.length > 0) {
      const assignedMember = await prisma.familyMember.findFirst({
        where: { familyId: family.id, name: assignedTo }
      });

      if (assignedMember && !eligibleMemberIds.includes(assignedMember.id)) {
        return NextResponse.json(
          { error: 'Assigned member is not in eligible members list' },
          { status: 400 }
        );
      }
    }

    // Create a date for the due day (Monday-Sunday of current week)
    const dayIndex = DAY_NAMES.indexOf(dueDay);
    const now = new Date();
    const currentDay = now.getDay();
    const daysFromMonday = (currentDay + 6) % 7;

    const monday = new Date(now);
    monday.setHours(9, 0, 0, 0);
    monday.setDate(now.getDate() - daysFromMonday);

    const dueDate = new Date(monday);
    dueDate.setDate(monday.getDate() + (dayIndex >= 0 ? dayIndex : 0));

    // Serialize eligible member IDs
    const eligibleMembersJson = stringifyEligibleMembers(eligibleMemberIds);

    let createdCount = 0;

    if (isRecurring && recurrencePattern) {
      // Create parent recurring chore
      const parentChore = await prisma.chore.create({
        data: {
          familyId: family.id,
          choreTemplateId: choreTemplateId || null,
          title,
          assignedTo,
          dueDay,
          frequency: frequency || 'once',
          eligibleMemberIds: eligibleMembersJson,
          isRecurring: true,
          recurrencePattern,
          recurrenceInterval: recurrenceInterval || 1,
          recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null
        }
      });

      // Generate instances for the next 12 months (or until recurrence end)
      const endOfRange = recurrenceEndDate ? new Date(recurrenceEndDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1));
      let currentDate = new Date(dueDate);

      while (currentDate <= endOfRange) {
        const instanceDate = new Date(currentDate);

        await prisma.chore.create({
          data: {
            familyId: family.id,
            choreTemplateId: choreTemplateId || null,
            title,
            assignedTo,
            dueDay: DAY_NAMES[(instanceDate.getDay() + 6) % 7],
            frequency: frequency || 'once',
            eligibleMemberIds: eligibleMembersJson,
            completed: false,
            parentEventId: parentChore.id,
            isRecurring: false
          }
        });

        createdCount++;
        currentDate = getNextOccurrence(currentDate, recurrencePattern, recurrenceInterval || 1);

        // Safety limit to prevent too many instances
        if (createdCount >= 100) break;
      }
    } else {
      // Single chore
      await prisma.chore.create({
        data: {
          familyId: family.id,
          choreTemplateId: choreTemplateId || null,
          title,
          assignedTo,
          dueDay,
          frequency: frequency || 'once',
          eligibleMemberIds: eligibleMembersJson,
          completed: false,
          isRecurring: false
        }
      });
      createdCount = 1;
    }

    return NextResponse.json(
      { success: true, message: `Created ${createdCount} chore(s)` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Chores POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save chore',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, completed, title, assignedTo, dueDay } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Chore ID is required' },
        { status: 400 }
      );
    }

    const updateData = {};
    if (completed !== undefined) {
      updateData.completed = completed;
      updateData.completedAt = completed ? new Date() : null;
    }
    if (title) updateData.title = title;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (dueDay) updateData.dueDay = dueDay;

    const chore = await prisma.chore.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, chore });
  } catch (error) {
    console.error('Chore PATCH error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Chore not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update chore', details: error.message },
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
        { error: 'Chore ID is required' },
        { status: 400 }
      );
    }

    await prisma.chore.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chore DELETE error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Chore not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete chore', details: error.message },
      { status: 500 }
    );
  }
}
