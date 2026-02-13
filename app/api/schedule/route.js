import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

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
  const formData = await request.formData();
  const day = String(formData.get('day') || '').trim();
  const workHours = String(formData.get('workHours') || '').trim();
  const event = String(formData.get('event') || '').trim();

  if (!day || (!workHours && !event)) {
    return NextResponse.redirect(new URL('/schedule?error=1', request.url));
  }

  const family = await getOrCreateDefaultFamily();
  const startsAt = getDateForDay(day);

  if (workHours) {
    await prisma.event.create({
      data: {
        familyId: family.id,
        type: 'WORK',
        title: workHours,
        description: `${day} work schedule`,
        startsAt
      }
    });
  }

  if (event) {
    await prisma.event.create({
      data: {
        familyId: family.id,
        type: 'EVENT',
        title: event,
        description: `${day} event`,
        startsAt
      }
    });
  }

  return NextResponse.redirect(new URL('/schedule?saved=1', request.url));
}
