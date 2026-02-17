import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuthAndFamily, apiError } from '../../../lib/sessionFamily';
import { validateRequest, choreSchema, choreUpdateSchema } from '../../../lib/validators';

export async function GET() {
  const auth = await requireAuthAndFamily();
  if (auth instanceof Response) return auth;
  const { family } = auth;

  try {
    const chores = await prisma.chore.findMany({
      where: { familyId: family.id },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json({ chores });
  } catch (error) {
    return apiError(error, 'Failed to fetch chores', 500);
  }
}

export async function POST(request) {
  const auth = await requireAuthAndFamily();
  if (auth instanceof Response) return auth;
  const { family } = auth;

  try {
    const body = await request.json();
    const validation = validateRequest(choreSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const data = validation.data;

    const chore = await prisma.chore.create({
      data: {
        familyId: family.id,
        title: data.title.trim(),
        assignedTo: (data.assignedTo && String(data.assignedTo).trim()) || 'Unassigned',
        dueDay: data.dueDay,
        completed: false
      }
    });
    return NextResponse.json({ success: true, chore }, { status: 200 });
  } catch (error) {
    return apiError(error, 'Failed to create chore', 500);
  }
}

export async function PATCH(request) {
  const auth = await requireAuthAndFamily();
  if (auth instanceof Response) return auth;
  const { family } = auth;

  try {
    const body = await request.json();
    const validation = validateRequest(choreUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { id, completed, title, assignedTo, dueDay } = validation.data;

    const existing = await prisma.chore.findUnique({ where: { id } });
    if (!existing || existing.familyId !== family.id) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }

    const updateData = {};
    if (completed !== undefined) {
      updateData.completed = completed;
      updateData.completedAt = completed ? new Date() : null;
    }
    if (title !== undefined) updateData.title = title;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (dueDay !== undefined) updateData.dueDay = dueDay;

    const chore = await prisma.chore.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json({ success: true, chore });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }
    return apiError(error, 'Failed to update chore', 500);
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
      return NextResponse.json({ error: 'Chore ID is required' }, { status: 400 });
    }

    const existing = await prisma.chore.findUnique({ where: { id } });
    if (!existing || existing.familyId !== family.id) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }

    await prisma.chore.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }
    return apiError(error, 'Failed to delete chore', 500);
  }
}
