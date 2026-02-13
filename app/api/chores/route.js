import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';
import { getNextOccurrence } from '../../../lib/recurring';

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

    // Create a date for the due day (Monday-Sunday of current week)
    const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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
          recurrenceInterval,
          recurrenceEndDate
        }
      });

      // Generate instances for the next 12 months (or until recurrence end)
      const endOfRange = recurrenceEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1));
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
        currentDate = getNextOccurrence(currentDate, recurrencePattern, recurrenceInterval);
        
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
    console.error('Chores POST error:', error.message || error);
    return NextResponse.json(
      { error: 'Failed to save chore', details: error.message },
      { status: 500 }
    );
  }
}
