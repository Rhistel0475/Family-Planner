import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';
import { familyMemberSchema, familyMemberUpdateSchema, validateRequest } from '../../../lib/validators';

export async function GET(request) {
  try {
    const family = await getOrCreateDefaultFamily();

    const members = await prisma.familyMember.findMany({
      where: { familyId: family.id },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Failed to fetch family members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family members', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateRequest(familyMemberSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, errors: validation.errors },
        { status: 400 }
      );
    }

    const { name, role, workingHours } = validation.data;

    const family = await getOrCreateDefaultFamily();

    const member = await prisma.familyMember.create({
      data: {
        familyId: family.id,
        name,
        role,
        workingHours
      }
    });

    return NextResponse.json({
      success: true,
      member
    });
  } catch (error) {
    console.error('Failed to create family member:', error);
    return NextResponse.json(
      { error: 'Failed to create family member', details: error.message },
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
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    await prisma.familyMember.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete family member:', error);

    // Check for specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete family member', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateRequest(familyMemberUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, errors: validation.errors },
        { status: 400 }
      );
    }

    const { id, name, role, workingHours } = validation.data;

    const member = await prisma.familyMember.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(workingHours !== undefined && { workingHours })
      }
    });

    return NextResponse.json({
      success: true,
      member
    });
  } catch (error) {
    console.error('Failed to update family member:', error);

    // Check for specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update family member', details: error.message },
      { status: 500 }
    );
  }
}
