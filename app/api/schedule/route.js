import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

export async function GET(request) {
  try {
    const family = await getOrCreateDefaultFamily();

    const events = await prisma.event.findMany({
      where: {
        familyId: family.id
      },
      orderBy: {
        startsAt: 'asc'
      }
      where: { familyId: family.id },
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
    const { title, type, startsAt, description } = body;

    if (!title || !startsAt) {
      return NextResponse.json(
        { error: 'Title and start time are required' },
        { status: 400 }
      );
    }

    const family = await getOrCreateDefaultFamily();

    const event = await prisma.event.create({
      data: {
        familyId: family.id,
        type: type || 'PERSONAL',
        title: title.trim(),
        description: description?.trim() || null,
        startsAt: new Date(startsAt)
      }
    });

    return NextResponse.json(
      { success: true, event },
      { status: 200 }
    );

    const title = String(body.title || '').trim();
    const category = body.category ? String(body.category).trim() : null;
    const location = body.location ? String(body.location).trim() : null;
    const description = body.description ? String(body.description).trim() : null;

    const startsAt = body.startsAt ? new Date(body.startsAt) : null;
    const endsAt = body.endsAt ? new Date(body.endsAt) : null;

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

    const family = await getOrCreateDefaultFamily();

    const event = await prisma.event.create({
      data: {
        familyId: family.id,
        type: 'EVENT',
        title,
        description,
        location,
        startsAt,
        endsAt,
        // category is optional — if your Prisma model doesn't have it yet,
        // comment the next line out until you add it.
        category
      }
    });

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error) {
    console.error('Schedule POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error.message },
      { error: 'Failed to save event', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, title, type, description, startsAt } = body;
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (startsAt !== undefined) updateData.startsAt = new Date(startsAt);

    if (body.title !== undefined) updateData.title = String(body.title || '').trim();
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

    // Validate end > start if both present
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
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
