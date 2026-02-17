import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuthAndFamily, apiError } from '../../../lib/sessionFamily';
import { validateRequest, familyMemberSchema, familyMemberUpdateSchema } from '../../../lib/validators';

export async function GET() {
  const auth = await requireAuthAndFamily();
  if (auth instanceof Response) return auth;
  const { family } = auth;

  try {
    const members = await prisma.familyMember.findMany({
      where: { familyId: family.id },
      orderBy: { createdAt: 'asc' }
    });
    const enrichedMembers = members.map((member) => ({
      ...member,
      color: member.color || '#3b82f6',
      avatar: member.avatar || '👤',
      workingHours: member.workingHours || ''
    }));
    return NextResponse.json({ members: enrichedMembers });
  } catch (error) {
    return apiError(error, 'Failed to fetch family members', 500);
  }
}

export async function POST(request) {
  const auth = await requireAuthAndFamily();
  if (auth instanceof Response) return auth;
  const { family } = auth;

  try {
    const body = await request.json();
    const validation = validateRequest(familyMemberSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const data = validation.data;

    const member = await prisma.familyMember.create({
      data: {
        familyId: family.id,
        name: data.name.trim(),
        color: data.color || '#3b82f6',
        avatar: data.avatar || '👤',
        workingHours: data.workingHours ? String(data.workingHours).trim() : null
      }
    });
    return NextResponse.json({ success: true, member });
  } catch (error) {
    return apiError(error, 'Failed to create family member', 500);
  }
}

export async function PATCH(request) {
  const auth = await requireAuthAndFamily();
  if (auth instanceof Response) return auth;
  const { family } = auth;

  try {
    const body = await request.json();
    const validation = validateRequest(familyMemberUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { id, ...rest } = validation.data;

    const existing = await prisma.familyMember.findUnique({ where: { id } });
    if (!existing || existing.familyId !== family.id) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 });
    }

    const updateData = {};
    if (rest.name !== undefined) updateData.name = String(rest.name).trim();
    if (rest.role !== undefined) updateData.role = rest.role;
    if (rest.color !== undefined) updateData.color = rest.color;
    if (rest.avatar !== undefined) updateData.avatar = rest.avatar;
    if (rest.workingHours !== undefined) {
      const wh = String(rest.workingHours || '').trim();
      updateData.workingHours = wh || null;
    }

    const member = await prisma.familyMember.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json({ success: true, member });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 });
    }
    return apiError(error, 'Failed to update family member', 500);
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
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const existing = await prisma.familyMember.findUnique({ where: { id } });
    if (!existing || existing.familyId !== family.id) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 });
    }

    await prisma.familyMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 });
    }
    return apiError(error, 'Failed to delete family member', 500);
  }
}
