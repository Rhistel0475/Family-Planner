import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';
import { getNextOccurrence } from '../../../lib/recurring';

const dayToIndex = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6
};

// Returns the date of the chosen day in the current week (Mon-based), at a specific HH:MM
function getDateForDayAndTime(dayName, timeHHMM = '09:00') {
  const now = new Date();
  const currentDay = now.getDay(); // 0=Sun..6=Sat
  const daysFromMonday = (currentDay + 6) % 7;

  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - daysFromMonday);

  const date = new Date(monday);
  date.setDate(monday.getDate() + (dayToIndex[dayName] ?? 0));

  const [hh, mm] = String(timeHHMM).split(':');
  const hour = Number(hh);
  const minute = Number(mm);

  if (Number.isFinite(hour) && Number.isFinite(minute)) {
    date.setHours(hour, minute, 0, 0);
  } else {
    // fallback
    date.setHours(9, 0, 0, 0);
  }

  return date;
}

export async function GET(request) {
  try {
    // For a calendar view, return actual occurrences (non-parent, non-pattern rows).
    // Your POST creates parents (isRecurring true) and instances (isRecurring false).
    const family = await getOrCreateDefaultFamily();

    const events = await prisma.event.findMany({
      where: {
        familyId: family.id,
        isRecurring: false // show real occurrences only
      },
      orderBy: {
        startsAt: 'asc'
      }
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Schedule GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // NEW: Schedule page now only sends event + day + time (+ optional recurrence)
    const day = String(body.day || '').trim();
    const event = String(body.event || '').trim();
    const eventTime = String(body.eventTime || '').trim(); // "HH:MM"
    const isRecurring = body.isRecurring === true;

    const recurrencePattern = body.recurrencePattern || null;
    const recurrenceInterval = parseInt(body.recurrenceInterval, 10) || 1;
    const recurrenceEndDate = body.recurrenceEndDate ? new Date(body.recurrenceEndDate) : null;

    if (!day || !event) {
      return NextResponse.json(
        { error: 'Please choose a day and enter an event.' },
        { status: 400 }
      );
    }

    const family = await getOrCreateDefaultFamily();

    // NEW: startsAt uses day + time
    const startsAt = getDateForDayAndTime(day, eventTime || '09:00');

    let createdCount = 0;

    if (isRecurring && recurrencePattern) {
      // Create parent recurring event (pattern)
      const parentEvent = await prisma.event.create({
        data: {
          familyId: family.id,
          type: 'EVENT',
          title: event,
          description: `${day} event (recurring)`,
          startsAt,
          isRecurring: true,
          recurrencePattern,
          recurrenceInterval,
          recurrenceEndDate
        }
      });

      // Generate instances for next 12 months (or until end)
      const endOfRange =
        recurrenceEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1));

      let currentDate = new Date(startsAt);
      let eventCount = 0;

      while (currentDate <= endOfRange) {
        const instanceDate = new Date(currentDate);

        await prisma.event.create({
          data: {
            familyId: family.id,
            type: 'EVENT',
            title: event,
            description: `${day} event (instance)`,
            startsAt: instanceDate,
            parentEventId: parentEvent.id,
            isRecurring: false
          }
        });

        eventCount++;
        currentDate = getNextOccurrence(currentDate, recurrencePattern, recurrenceInterval);

        // Safety limit
        if (eventCount >= 100) break;
      }

      createdCount = eventCount;
    } else {
      // Single occurrence
      await prisma.event.create({
        data: {
          familyId: family.id,
          type: 'EVENT',
          title: event,
          description: `${day} event`,
          startsAt,
          isRecurring: false
        }
      });

      createdCount = 1;
    }

    return NextResponse.json(
      { success: true, message: `Created ${createdCount} event(s)` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Schedule POST error:', error.message || error);
    return NextResponse.json(
      { error: 'Failed to save schedule item', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, title, type, description, startsAt, attended } = body;

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (startsAt !== undefined) updateData.startsAt = new Date(startsAt);

    if (attended !== undefined) {
      updateData.attended = attended;
      updateData.attendedAt = attended ? new Date() : null;
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Event PATCH error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to update event', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body?.id;

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // If someone deletes a recurring parent by accident, delete its instances too.
    // (Harmless for non-parent items)
    await prisma.event.deleteMany({
      where: { parentEventId: id }
    });

    await prisma.event.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Event DELETE error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to delete event', details: error.message },
      { status: 500 }
    );
  }
}
