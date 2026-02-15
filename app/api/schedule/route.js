import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

function parseLocalDateTime(dateStr, timeStr) {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM (24h)
  // Creates a Date in local time.
  if (!dateStr || !timeStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export async function GET() {
  try {
    const family = await getOrCreateDefaultFamily();

    // Schedule page should show EVENTS only (not WORK)
    const events = await prisma.event.findMany({
      where: { familyId: family.id, type: 'EVENT' },
      orderBy: { startsAt: 'asc' }
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

    // We now create EVENT only on this route
    const title = String(body.title || '').trim();
    const category = body.category || 'OTHER';
    const description = body.description ? String(body.description).trim() : null;
    const location = body.location ? String(body.location).trim() : null;

    const date = String(body.date || '').trim();        // YYYY-MM-DD
    const startTime = String(body.startTime || '').trim(); // HH:MM
    const endTime = String(body.endTime || '').trim();     // HH:MM

    if (!title || !date || !startTime) {
      return NextResponse.json(
        { error: 'Title, date, and start time are required.' },
        { status: 400 }
      );
    }

    const startsAt = parseLocalDateTime(date, startTime);
    if (!startsAt) {
      return NextResponse.json({ error: 'Invalid start date/time.' }, { status: 400 });
    }

    let endsAt = null;
    if (endTime) {
      endsAt = parseLocalDateTime(date, endTime);
      if (!endsAt) {
        return NextResponse.json({ error: 'Invalid end time.' }, { status: 400 });
      }
      if (endsAt <= startsAt) {
        return NextResponse.json(
          { error: 'End time must be after start time.' },
          { status: 400 }
        );
      }
    }

    const family = await getOrCreateDefaultFamily();

    const created = await prisma.event.create({
      data: {
        familyId: family.id,
        type: 'EVENT',
        category,
        title,
        description,
        location,
        startsAt,
        endsAt,
        isRecurring: false
      }
    });

    return NextResponse.json(
      { success: true, message: 'Event created.', event: created },
      { status: 200 }
    );
  } catch (error) {
    console.error('Schedule POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, title, category, description, location, date, startTime, endTime } = body;

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const updateData = {};

    if (title !== undefined) updateData.title = String(title || '').trim();
    if (category !== undefined) updateData.category = category || 'OTHER';
    if (description !== undefined) updateData.description = description ? String(description).trim() : null;
    if (location !== undefined) updateData.location = location ? String(location).trim() : null;

    // If date/startTime provided, recompute startsAt/endsAt
    if (date !== undefined || startTime !== undefined || endTime !== undefined) {
      const safeDate = String(date || '').trim();
      const safeStart = String(startTime || '').trim();
      const safeEnd = String(endTime || '').trim();

      if (!safeDate || !safeStart) {
        return NextResponse.json(
          { error: 'To update time, date and start time are required.' },
          { status: 400 }
        );
      }

      const startsAt = parseLocalDateTime(safeDate, safeStart);
      if (!startsAt) return NextResponse.json({ error: 'Invalid start date/time.' }, { status: 400 });
      updateData.startsAt = startsAt;

      if (safeEnd) {
        const endsAt = parseLocalDateTime(safeDate, safeEnd);
        if (!endsAt) return NextResponse.json({ error: 'Invalid end time.' }, { status: 400 });
        if (endsAt <= startsAt) {
          return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 });
        }
        updateData.endsAt = endsAt;
      } else {
        updateData.endsAt = null;
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Schedule PATCH error:', error);
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

    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Schedule DELETE error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete event', details: error.message },
      { status: 500 }
    );
  }
}

