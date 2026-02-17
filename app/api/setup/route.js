import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth, apiError } from '../../../lib/sessionFamily';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const { session } = auth;

  try {
    if (!session.user.familyId) {
      return NextResponse.json({ setupComplete: false });
    }
    const family = await prisma.family.findUnique({
      where: { id: session.user.familyId }
    });
    if (!family) {
      return NextResponse.json({ setupComplete: false });
    }
    return NextResponse.json({
      setupComplete: family.setupComplete,
      familyName: family.name
    });
  } catch (error) {
    return apiError(error, 'Failed to check setup status', 500);
  }
}

export async function POST(request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const { session } = auth;

  try {
    const body = await request.json().catch(() => ({}));
    const familyName = (body.familyName && String(body.familyName).trim()) || 'My Family';
    const markComplete = body.complete === true;

    if (!session.user.familyId) {
      const family = await prisma.family.create({
        data: { name: familyName, setupComplete: false }
      });
      await prisma.user.update({
        where: { id: session.user.id },
        data: { familyId: family.id }
      });
      return NextResponse.json({
        familyId: family.id,
        familyName: family.name,
        setupComplete: false
      });
    }

    if (markComplete) {
      const updated = await prisma.family.update({
        where: { id: session.user.familyId },
        data: { setupComplete: true, name: familyName }
      });
      return NextResponse.json({ setupComplete: updated.setupComplete });
    }

    const family = await prisma.family.findUnique({
      where: { id: session.user.familyId }
    });
    return NextResponse.json({ setupComplete: family?.setupComplete ?? false });
  } catch (error) {
    return apiError(error, 'Failed to complete setup', 500);
  }
}
