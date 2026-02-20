import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';
import { getOccurrencesInRange } from '../../../lib/eventRecurrence';

export async function GET(request) {
  try {
    const family = await getOrCreateDefaultFamily();

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const hasDateRange = startParam && endParam;
    const startDate = startParam ? new Date(startParam + 'T00:00:00.000Z') : null;
    const endDate = endParam ? new Date(endParam + 'T23:59:59.999Z') : null;

    let events = [];

    if (hasDateRange && startDate && endDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
      // Fetch non-recurring events in range
      const nonRecurringWhere = {
        familyId: family.id,
        isRecurring: false,
        startsAt: {
          gte: startDate,
          lte: endDate
        }
      };

      const nonRecurringEvents = await prisma.event.findMany({
        where: nonRecurringWhere,
        orderBy: {
          startsAt: 'asc'
        }
      });

      // Fetch recurring events that might have occurrences in range
      // (startsAt <= endDate and (no end date or recurrenceEndDate >= startDate))
      const recurringWhere = {
        familyId: family.id,
        isRecurring: true,
        startsAt: {
          lte: endDate
        },
        OR: [
          { recurrenceEndDate: null },
          { recurrenceEndDate: { gte: startDate } }
        ]
      };

      const recurringEvents = await prisma.event.findMany({
        where: recurringWhere,
        orderBy: {
          startsAt: 'asc'
        }
      });

      // Expand recurring events into occurrences
      const expandedOccurrences = [];
      for (const event of recurringEvents) {
        const occurrences = getOccurrencesInRange(event, startDate, endDate);
        for (const occ of occurrences) {
          expandedOccurrences.push({
            ...event,
            id: `${event.id}-${occ.startsAt.toISOString()}`,
            parentEventId: event.id,
            startsAt: occ.startsAt,
            endsAt: occ.endsAt
          });
        }
      }

      // Merge and sort
      events = [...nonRecurringEvents, ...expandedOccurrences].sort((a, b) => {
        return new Date(a.startsAt) - new Date(b.startsAt);
      });
    } else {
      // No date range: return all events without expansion
      const where = { familyId: family.id };
      events = await prisma.event.findMany({
        where,
        orderBy: {
          startsAt: 'asc'
        }
      });
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Schedule GET error:', error);
    const details = error.message || 'Unknown error';
    const code = error.code;
    if (code === 'P2021') {
      return NextResponse.json(
        { error: 'Database table missing. Run: npx prisma migrate deploy', details },
        { status: 500 }
      );
    }
    if (code === 'P1001' || code === 'P1002') {
      return NextResponse.json(
        { error: 'Cannot reach database. Check DATABASE_URL and that the database is running.', details },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch events', details, code: code || undefined },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const title = String(body.title || '').trim();
    const category = body.category ? String(body.category).trim() : null;
    const location = body.location ? String(body.location).trim() : null;
    const description = body.description ? String(body.description).trim() : null;

    const startsAt = body.startsAt ? new Date(body.startsAt) : null;
    const endsAt = body.endsAt ? new Date(body.endsAt) : null;

    const isRecurring = body.isRecurring === true;
    const recurrencePattern = body.recurrencePattern ? String(body.recurrencePattern).trim().toUpperCase() : null;
    const recurrenceInterval = body.recurrenceInterval ? parseInt(body.recurrenceInterval, 10) : null;
    const recurrenceEndDate = body.recurrenceEndDate ? new Date(body.recurrenceEndDate) : null;

    if (!title) {
      return NextResponse.json({ error: 'Event title is required.' }, { status: 400 });
    }
    if (!startsAt || Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ error: 'Start date/time is required.' }, { status: 400 });
    }
    if (endsAt && Number.isNaN(endsAt.getTime())) {
      return NextResponse.json({ error: 'End date/time is invalid.' }, { status: 400 });
    }
    if (endsAt && endsAt <= startsAt) {
      return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 });
    }

    // Validate recurrence fields
    if (isRecurring) {
      const validPatterns = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
      if (!recurrencePattern || !validPatterns.includes(recurrencePattern)) {
        return NextResponse.json({ error: 'Recurrence pattern must be DAILY, WEEKLY, MONTHLY, or YEARLY.' }, { status: 400 });
      }
      if (recurrenceInterval !== null && (recurrenceInterval < 1 || !Number.isInteger(recurrenceInterval))) {
        return NextResponse.json({ error: 'Recurrence interval must be a positive integer.' }, { status: 400 });
      }
      if (recurrenceEndDate && Number.isNaN(recurrenceEndDate.getTime())) {
        return NextResponse.json({ error: 'Recurrence end date is invalid.' }, { status: 400 });
      }
    }

    const family = await getOrCreateDefaultFamily();

    const eventData = {
      familyId: family.id,
      type: 'EVENT',
      title,
      description,
      location,
      startsAt,
      endsAt,
      category,
      isRecurring: isRecurring || false,
      recurrencePattern: isRecurring ? recurrencePattern : null,
      recurrenceInterval: isRecurring ? (recurrenceInterval || 1) : null,
      recurrenceEndDate: isRecurring ? recurrenceEndDate : null
    };

    const event = await prisma.event.create({
      data: eventData
    });

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error) {
    console.error('Schedule POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save event', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    // Handle parentEventId for occurrences (use parent id for update)
    const id = body.parentEventId || body.id;

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const updateData = {};

    if (body.title !== undefined) updateData.title = String(body.title || '').trim();
    if (body.type !== undefined) updateData.type = body.type;
    if (body.description !== undefined) updateData.description = body.description ? String(body.description) : null;
    if (body.location !== undefined) updateData.location = body.location ? String(body.location) : null;

    if (body.startsAt !== undefined) {
      const d = new Date(body.startsAt);
      if (Number.isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid startsAt' }, { status: 400 });
      updateData.startsAt = d;
    }
    if (body.endsAt !== undefined) {
      if (body.endsAt === null || body.endsAt === '') {
        updateData.endsAt = null;
      } else {
        const d = new Date(body.endsAt);
        if (Number.isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid endsAt' }, { status: 400 });
        updateData.endsAt = d;
      }
    }

    if (body.category !== undefined) {
      updateData.category = body.category ? String(body.category).trim() : null;
    }

    // Handle recurrence fields
    if (body.isRecurring !== undefined) {
      updateData.isRecurring = body.isRecurring === true;
      if (!updateData.isRecurring) {
        // Clearing recurrence
        updateData.recurrencePattern = null;
        updateData.recurrenceInterval = null;
        updateData.recurrenceEndDate = null;
      }
    }

    if (body.recurrencePattern !== undefined) {
      const pattern = body.recurrencePattern ? String(body.recurrencePattern).trim().toUpperCase() : null;
      if (pattern) {
        const validPatterns = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
        if (!validPatterns.includes(pattern)) {
          return NextResponse.json({ error: 'Recurrence pattern must be DAILY, WEEKLY, MONTHLY, or YEARLY.' }, { status: 400 });
        }
        updateData.recurrencePattern = pattern;
        updateData.isRecurring = true;
      } else {
        updateData.recurrencePattern = null;
      }
    }

    if (body.recurrenceInterval !== undefined) {
      if (body.recurrenceInterval === null || body.recurrenceInterval === '') {
        updateData.recurrenceInterval = null;
      } else {
        const interval = parseInt(body.recurrenceInterval, 10);
        if (interval < 1 || !Number.isInteger(interval)) {
          return NextResponse.json({ error: 'Recurrence interval must be a positive integer.' }, { status: 400 });
        }
        updateData.recurrenceInterval = interval;
        updateData.isRecurring = true;
      }
    }

    if (body.recurrenceEndDate !== undefined) {
      if (body.recurrenceEndDate === null || body.recurrenceEndDate === '') {
        updateData.recurrenceEndDate = null;
      } else {
        const d = new Date(body.recurrenceEndDate);
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json({ error: 'Recurrence end date is invalid.' }, { status: 400 });
        }
        updateData.recurrenceEndDate = d;
      }
    }

    if (updateData.startsAt && updateData.endsAt && updateData.endsAt <= updateData.startsAt) {
      return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 });
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
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // If id is an occurrence id (contains ISO date pattern), extract parent id
    // Occurrence ids are formatted as: ${parentId}-${isoDate}
    // ISO date format: YYYY-MM-DDTHH:mm:ss.sssZ
    if (id.includes('T') && id.match(/\d{4}-\d{2}-\d{2}T/)) {
      // Extract parent id: everything before the ISO date pattern
      const match = id.match(/^(.+?)-(\d{4}-\d{2}-\d{2}T)/);
      if (match) {
        id = match[1];
      }
    }

    await prisma.event.delete({ where: { id } });

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
