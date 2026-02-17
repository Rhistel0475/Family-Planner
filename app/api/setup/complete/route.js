import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, apiError } from '../../../../lib/sessionFamily';

/**
 * Single-call setup: create family, link user, create members, set work hours, mark complete.
 * Avoids session/cookie timing issues (client doesn't need familyId in session until after this).
 */
export async function POST(request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const { session } = auth;

  try {
    const body = await request.json().catch(() => ({}));
    const familyName = (body.familyName && String(body.familyName).trim()) || 'My Family';
    const members = Array.isArray(body.members) ? body.members : [];
    const workSchedules = body.workSchedules && typeof body.workSchedules === 'object' ? body.workSchedules : {};

    if (members.length === 0) {
      return NextResponse.json({ error: 'Add at least one family member' }, { status: 400 });
    }

    let family;

    if (session.user.familyId) {
      family = await prisma.family.findUnique({
        where: { id: session.user.familyId }
      });
      if (!family) {
        family = await prisma.family.create({
          data: { name: familyName, setupComplete: false }
        });
        await prisma.user.update({
          where: { id: session.user.id },
          data: { familyId: family.id }
        });
      }
    } else {
      try {
        family = await prisma.family.create({
          data: { name: familyName, setupComplete: false }
        });
      } catch (createErr) {
        if (createErr.code === 'P2002' && createErr.meta?.target?.includes('name')) {
          family = await prisma.family.findFirst({
            where: { name: familyName }
          });
          if (!family) throw createErr;
        } else {
          throw createErr;
        }
      }
      await prisma.user.update({
        where: { id: session.user.id },
        data: { familyId: family.id }
      });
    }

    const createdMembers = [];
    for (const m of members) {
      const name = (m.name && String(m.name).trim()) || 'Member';
      const member = await prisma.familyMember.create({
        data: {
          familyId: family.id,
          name,
          role: m.role && ['member', 'parent', 'kid'].includes(m.role) ? m.role : 'member'
        }
      });
      createdMembers.push({ ...member, name });
    }

    for (const member of createdMembers) {
      const schedule = workSchedules[member.name];
      if (schedule && typeof schedule === 'object') {
        const parts = Object.entries(schedule)
          .filter(([, hours]) => hours != null && String(hours).trim())
          .map(([day, hours]) => `${day}: ${String(hours).trim()}`);
        if (parts.length > 0) {
          await prisma.familyMember.update({
            where: { id: member.id },
            data: { workingHours: parts.join(', ') }
          });
        }
      }
    }

    await prisma.family.update({
      where: { id: family.id },
      data: { setupComplete: true, name: familyName }
    });

    return NextResponse.json({
      success: true,
      familyId: family.id,
      setupComplete: true
    });
  } catch (error) {
    return apiError(error, 'Failed to complete setup', 500);
  }
}
