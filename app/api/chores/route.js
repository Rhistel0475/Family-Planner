import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

export async function POST(request) {
  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const assignedTo = String(formData.get('assignedTo') || '').trim();
  const dueDay = String(formData.get('dueDay') || '').trim();

  if (!title || !assignedTo || !dueDay) {
    return NextResponse.redirect(new URL('/chores?error=1', request.url));
  }

  const family = await getOrCreateDefaultFamily();

  await prisma.chore.create({
    data: {
      familyId: family.id,
      title,
      assignedTo,
      dueDay
    }
  });

  return NextResponse.redirect(new URL('/chores?saved=1', request.url));
}
