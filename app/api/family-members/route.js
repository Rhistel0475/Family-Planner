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

    return NextResponse.json({ members });
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

    // Try to create with color/avatar, but if columns don't exist, fall back to basic fields
    try {
      const member = await prisma.familyMember.create({
        data: {
          familyId: family.id,
          name: name.trim(),
          color: color || '#3b82f6',
          avatar: avatar || '👤'
        }
      });
      return NextResponse.json({ success: true, member });
    } catch (dbError) {
      // If color/avatar columns don't exist, create without them
      if (dbError.message?.includes('Unknown argument')) {
        const member = await prisma.familyMember.create({
          data: {
            familyId: family.id,
            name: name.trim()
          }
        });
        return NextResponse.json({ success: true, member });
      }
      throw dbError;
    }
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

    try {
      const member = await prisma.familyMember.update({
        where: { id },
        data: updateData
      });
      return NextResponse.json({ success: true, member });
    } catch (dbError) {
      // If color/avatar columns don't exist, update without them
      if (dbError.message?.includes('Unknown argument')) {
        const safeUpdateData = {};
        if (name !== undefined) safeUpdateData.name = name.trim();
        
        const member = await prisma.familyMember.update({
          where: { id },
          data: safeUpdateData
        });
        return NextResponse.json({ success: true, member });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Family member PATCH error:', error);

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
