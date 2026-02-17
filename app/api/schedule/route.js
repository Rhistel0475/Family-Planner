import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuthAndFamily, apiError } from '../../../lib/sessionFamily';
import { generateRecurringInstances } from '../../../lib/recurring';
import { validateRequest, eventSchema } from '../../../lib/validators';

export async function GET(request) {
  const auth = await requireAuthAndFamily();
  if (auth instanceof Response) return auth;
  const { family } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const where = { familyId: family.id };
    if (start || end) {
      where.startsAt = {};
      if (start) where.startsAt.gte = new Date(start);
      if (end) where.startsAt.lte = new Date(end);
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startsAt: 'asc' }
    });
    return NextResponse.json({ events });
  } catch (error) {
    return apiError(error, 'Failed to fetch events', 500);
  }
}

export async function POST(request) {
  const auth = await requireAuthAndFamily();
  if (auth instanceof Response) return auth;
  const { family } = auth;

  try {
    const body = await request.json();
    const validation = validateRequest(eventSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const data = validation.data;

    const title = data.title.trim();
    const category = data.category ? String(data.category).trim() : null;
    const location = data.location ? String(data.location).trim() : null;
    const description = data.description ? String(data.description).trim() : null;
    const startsAt = data.startsAt;
    const endsAt = data.endsAt ?? null;

    if (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt)) {
      return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 });
    }

    const isRecurring = data.isRecurring === true;
    const recurrencePattern = isRecurring ? data.recurrencePattern : null;
    const recurrenceInterval = isRecurring ? (parseInt(data.recurrenceInterval, 10) || 1) : null;
    const recurrenceEndDate = isRecurring && data.recurrenceEndDate ? data.recurrenceEndDate : null;

    if (!isRecurring) {
      const event = await prisma.event.create({
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
      return NextResponse.json({ success: true, event }, { status: 200 });
    }

    const instances = generateRecurringInstances({
      pattern: recurrencePattern,
      interval: recurrenceInterval,
      startDate: startsAt,
      endDate: recurrenceEndDate,
      startTime: startsAt,
      endTime: endsAt
    });

    const parentEvent = await prisma.event.create({
      data: {
        familyId: family.id,
        type: 'EVENT',
        category,
        title,
        description,
        location,
        startsAt,
        endsAt,
        isRecurring: true,
        recurrencePattern,
        recurrenceInterval,
        recurrenceEndDate
      }
    });

    await prisma.event.createMany({
      data: instances.map((instance) => ({
        familyId: family.id,
        type: 'EVENT',
        category,
        title,
        description,
        location,
        startsAt: instance.startsAt,
        endsAt: instance.endsAt,
        isRecurring: false,
        parentEventId: parentEvent.id
      }))
    });

    return NextResponse.json({
      success: true,
      event: parentEvent,
      instanceCount: instances.length
    }, { status: 200 });
  } catch (error) {
    return apiError(error, 'Failed to save event', 500);
  }
}

export async function PATCH(request) {
  const auth = await requireAuthAndFamily();
  if (auth instanceof Response) return auth;
  const { family } = auth;

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing || existing.familyId !== family.id) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const updateData = {};
    if (body.title !== undefined) updateData.title = String(body.title || '').trim();
    if (body.description !== undefined) updateData.description = body.description ? String(body.description) : null;
    if (body.location !== undefined) updateData.location = body.location ? String(body.location) : null;
    if (body.category !== undefined) updateData.category = body.category ? String(body.category).trim() : null;

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

    if (updateData.startsAt && updateData.endsAt && updateData.endsAt <= updateData.startsAt) {
      return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 });
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json({ success: true, event });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return apiError(error, 'Failed to update event', 500);
  }
}

export async function DELETE(request) {
  const auth = await requireAuthAndFamily();
  if (auth instanceof Response) return auth;
  const { family } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing || existing.familyId !== family.id) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return apiError(error, 'Failed to delete event', 500);
  }
}
