import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

export async function GET(request) {
  try {
    const family = await getOrCreateDefaultFamily();

    // Get all events for the family
    const events = await prisma.event.findMany({
      where: {
        familyId: family.id
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
  } catch (error) {
    console.error('Schedule POST error:', error.message || error);
    console.error('Error details:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, title, type, description, startsAt } = body;

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
