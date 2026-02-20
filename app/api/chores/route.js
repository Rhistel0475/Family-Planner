import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

export async function GET(request) {
  try {
    const family = await getOrCreateDefaultFamily();

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const where = {
      familyId: family.id
    };

    // If date range provided, filter chores by dueDay matching days in the range
    if (startParam && endParam) {
      const startDate = new Date(startParam + 'T00:00:00.000Z');
      const endDate = new Date(endParam + 'T23:59:59.999Z');

      if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
        // Convert date range to day names
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const daysInRange = new Set();

        // Iterate through each day in the range
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dayIndex = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          // Convert to Monday-based: Sunday (0) -> 6, Monday (1) -> 0, etc.
          const mondayBasedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
          daysInRange.add(dayNames[mondayBasedIndex]);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Filter chores where dueDay matches any day in the range
        if (daysInRange.size > 0) {
          where.dueDay = {
            in: Array.from(daysInRange)
          };
        }
      }
    }

    const chores = await prisma.chore.findMany({
      where,
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ chores });
  } catch (error) {
    console.error('Chores GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chores', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, assignedTo, dueDay, description } = body;

    if (!title || !dueDay) {
      return NextResponse.json(
        { error: 'Title and due day are required' },
        { status: 400 }
      );
    }

    const family = await getOrCreateDefaultFamily();

    const chore = await prisma.chore.create({
      data: {
        familyId: family.id,
        title: title.trim(),
        description: description?.trim() || null,
        assignedTo: assignedTo?.trim() || 'Unassigned',
        dueDay: dueDay.trim(),
        completed: false
      }
    });

    return NextResponse.json(
      { success: true, chore },
      { status: 200 }
    );
  } catch (error) {
    console.error('Chores POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create chore',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, completed, title, assignedTo, dueDay, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Chore ID is required' },
        { status: 400 }
      );
    }

    const updateData = {};
    if (completed !== undefined) {
      updateData.completed = completed;
      updateData.completedAt = completed ? new Date() : null;
    }
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (dueDay !== undefined) updateData.dueDay = dueDay;

    const chore = await prisma.chore.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, chore });
  } catch (error) {
    console.error('Chore PATCH error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Chore not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update chore', details: error.message },
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
        { error: 'Chore ID is required' },
        { status: 400 }
      );
    }

    await prisma.chore.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chore DELETE error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Chore not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete chore', details: error.message },
      { status: 500 }
    );
  }
}
