import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

export async function GET(request) {
  try {
    const family = await getOrCreateDefaultFamily();

    const members = await prisma.familyMember.findMany({
      where: {
        familyId: family.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Ensure color and avatar fields exist (with defaults if missing from DB)
    const enrichedMembers = members.map(member => ({
      ...member,
      color: member.color || '#3b82f6',
      avatar: member.avatar || '👤'
    }));

    return NextResponse.json({ members: enrichedMembers });
  } catch (error) {
    console.error('Family members GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family members', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, color, avatar } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const family = await getOrCreateDefaultFamily();

    const createData = {
      familyId: family.id,
      name: name.trim()
    };

    // Try to add color and avatar if provided
    if (color) createData.color = color;
    if (avatar) createData.avatar = avatar;

    let member;
    try {
      member = await prisma.familyMember.create({ data: createData });
    } catch (dbError) {
      // If color/avatar fields don't exist in DB, try without them
      if (dbError.message && (dbError.message.includes('Unknown argument `color`') || dbError.message.includes('Unknown argument `avatar`') || dbError.message.includes('does not exist'))) {
        member = await prisma.familyMember.create({
          data: {
            familyId: family.id,
            name: name.trim()
          }
        });
        // Add color and avatar to response if provided
        if (color) member.color = color;
        if (avatar) member.avatar = avatar;
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('Family member POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create family member', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, name, color, avatar } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color;
    if (avatar !== undefined) updateData.avatar = avatar;

    let member;
    try {
      member = await prisma.familyMember.update({
        where: { id },
        data: updateData
      });
    } catch (dbError) {
      // If color/avatar fields don't exist in DB, try without them
      if (dbError.message && (dbError.message.includes('Unknown argument `color`') || dbError.message.includes('Unknown argument `avatar`') || dbError.message.includes('does not exist'))) {
        const fallbackData = { ...updateData };
        delete fallbackData.color;
        delete fallbackData.avatar;
        
        member = await prisma.familyMember.update({
          where: { id },
          data: fallbackData
        });

        // Add color and avatar to response if provided
        if (color) member.color = color;
        if (avatar) member.avatar = avatar;
      } else if (dbError.code === 'P2025') {
        return NextResponse.json(
          { error: 'Family member not found' },
          { status: 404 }
        );
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('Family member PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update family member', details: error.message },
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
    console.error('Family member DELETE error:', error);

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
