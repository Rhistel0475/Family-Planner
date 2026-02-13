import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

const dayToIndex = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6
};

function getDateForDay(dayName) {
  const now = new Date();
  const currentDay = now.getDay();
  const daysFromMonday = (currentDay + 6) % 7;

  const monday = new Date(now);
  monday.setHours(9, 0, 0, 0);
  monday.setDate(now.getDate() - daysFromMonday);

  const date = new Date(monday);
  date.setDate(monday.getDate() + (dayToIndex[dayName] ?? 0));
  return date;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const day = String(body.day || '').trim();
    const workHours = String(body.workHours || '').trim();
    const event = String(body.event || '').trim();
    const isRecurring = body.isRecurring === true;
    const recurrencePattern = body.recurrencePattern || null;
    const recurrenceInterval = parseInt(body.recurrenceInterval) || 1;
    const recurrenceEndDate = body.recurrenceEndDate ? new Date(body.recurrenceEndDate) : null;

    if (!day || (!workHours && !event)) {
      return NextResponse.json(
        { error: 'Please add a day and at least one field.' },
        { status: 400 }
      );
    }

    const family = await getOrCreateDefaultFamily();
    const startsAt = getDateForDay(day);

    let createdCount = 0;

    if (workHours) {
      // For now, create single event (recurring support comes after DB migration)
      await prisma.event.create({
        data: {
          familyId: family.id,
          type: 'WORK',
          title: workHours,
          description: `${day} work schedule${isRecurring ? ' (recurring)' : ''}`,
          startsAt
        }
      });
      createdCount = 1;
    }

    if (event) {
      // For now, create single event (recurring support comes after DB migration)
      await prisma.event.create({
        data: {
          familyId: family.id,
          type: 'EVENT',
          title: event,
          description: `${day} event${isRecurring ? ' (recurring)' : ''}`,
          startsAt
        }
      });
      createdCount += 1;
    }

    return NextResponse.json(
      { success: true, message: `Created ${createdCount} event(s)` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Schedule POST error:', error.message || error);
    console.error('Error details:', error);
    return NextResponse.json(
      { error: 'Failed to save schedule item', details: error.message },
      { status: 500 }
    );
  }
}
