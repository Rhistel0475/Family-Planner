import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';
import { getNextOccurrence } from '../../../lib/recurring';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0');

    const family = await getOrCreateDefaultFamily();

    // Get all events for the family
    const events = await prisma.event.findMany({
      where: {
        familyId: family.id,
        parentEventId: null // Only get actual instances, not parent patterns
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
      if (isRecurring && recurrencePattern) {
        // Create parent recurring event
        const parentEvent = await prisma.event.create({
          data: {
            familyId: family.id,
            type: 'WORK',
            title: workHours,
            description: `${day} work schedule (recurring)`,
            startsAt,
            isRecurring: true,
            recurrencePattern,
            recurrenceInterval,
            recurrenceEndDate
          }
        });

        // Generate instances for the next 12 months (or until recurrence end)
        const endOfRange = recurrenceEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        let currentDate = new Date(startsAt);
        
        while (currentDate <= endOfRange) {
          const instanceDate = new Date(currentDate);
          
          await prisma.event.create({
            data: {
              familyId: family.id,
              type: 'WORK',
              title: workHours,
              description: `${day} work schedule (instance)`,
              startsAt: instanceDate,
              parentEventId: parentEvent.id,
              isRecurring: false
            }
          });
          
          createdCount++;
          currentDate = getNextOccurrence(currentDate, recurrencePattern, recurrenceInterval);
          
          // Safety limit to prevent too many instances
          if (createdCount >= 100) break;
        }
      } else {
        // Single event
        await prisma.event.create({
          data: {
            familyId: family.id,
            type: 'WORK',
            title: workHours,
            description: `${day} work schedule`,
            startsAt,
            isRecurring: false
          }
        });
        createdCount = 1;
      }
    }

    if (event) {
      if (isRecurring && recurrencePattern) {
        // Create parent recurring event
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

        // Generate instances for the next 12 months (or until recurrence end)
        const endOfRange = recurrenceEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1));
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
          
          // Safety limit to prevent too many instances
          if (eventCount >= 100) break;
        }
        
        createdCount += eventCount;
      } else {
        // Single event
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
        createdCount += 1;
      }
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

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, title, type, description, startsAt, attended } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update event', details: error.message },
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
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    await prisma.event.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Event DELETE error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete event', details: error.message },
      { status: 500 }
    );
  }
}
