import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';
import { getNextOccurrence } from '../../../lib/recurring';
import { DAY_NAMES } from '../../../lib/constants';
import { choreSchema, validateRequest } from '../../../lib/validators';

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

    const { title, assignedTo, dueDay, isRecurring, recurrencePattern, recurrenceInterval, recurrenceEndDate } = validation.data;

    const family = await getOrCreateDefaultFamily();

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

    let createdCount = 0;

    if (isRecurring && recurrencePattern) {
      // Create parent recurring chore
      const parentChore = await prisma.chore.create({
        data: {
          familyId: family.id,
          title,
          assignedTo,
          dueDay,
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
            title,
            assignedTo,
            dueDay: DAY_NAMES[(instanceDate.getDay() + 6) % 7],
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
          title,
          assignedTo,
          dueDay,
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
