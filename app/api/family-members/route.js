import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

export async function GET() {
  try {
    const family = await getOrCreateDefaultFamily();

    const members = await prisma.familyMember.findMany({
      where: { familyId: family.id },
      orderBy: { createdAt: 'asc' }
    });

    const validAvatarStyles = ['circle', 'rounded', 'square'];
    const enrichAvatar = (v) => (v && validAvatarStyles.includes(v) ? v : 'circle');

    const enrichedMembers = members.map((member) => ({
      ...member,
      color: member.color || '#3b82f6',
      avatar: enrichAvatar(member.avatar),
      workingHours: member.workingHours || '',
      role: member.role || 'member',
      abilities: member.abilities || [],
      dietaryRestrictions: member.dietaryRestrictions || [],
      chorePreferences: member.chorePreferences || null,
      availability: member.availability || null
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

    if (!body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    const {
      name, color, avatar, workingHours, role, age, relationship,
      availability, activities, abilities, chorePreferences,
      restrictions, dietaryRestrictions
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (age !== undefined && age !== null) {
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
        return NextResponse.json({ error: 'Age must be between 0 and 120' }, { status: 400 });
      }
    }

    const family = await getOrCreateDefaultFamily();

    const validAvatarStyles = ['circle', 'rounded', 'square'];
    const safeAvatar = (avatar && validAvatarStyles.includes(avatar)) ? avatar : 'circle';

    const data = {
      familyId: family.id,
      name: name.trim(),
      color: color || '#3b82f6',
      avatar: safeAvatar,
      workingHours: workingHours ? String(workingHours).trim() : null,
      role: role || 'member',
      age: age !== undefined && age !== null ? parseInt(age, 10) : null,
      relationship: relationship ? String(relationship).trim() : null,
      availability: availability || null,
      activities: activities ? String(activities).trim() : null,
      abilities: Array.isArray(abilities) ? abilities : [],
      chorePreferences: chorePreferences || null,
      restrictions: restrictions ? String(restrictions).trim() : null,
      dietaryRestrictions: Array.isArray(dietaryRestrictions) ? dietaryRestrictions : []
    };

    const member = await prisma.familyMember.create({ data });

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

    if (!body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    const {
      id, name, color, avatar, workingHours, role, age, relationship,
      availability, activities, abilities, chorePreferences,
      restrictions, dietaryRestrictions
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    if (age !== undefined && age !== null) {
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
        return NextResponse.json({ error: 'Age must be between 0 and 120' }, { status: 400 });
      }
    }

    const validAvatarStyles = ['circle', 'rounded', 'square'];
    const safeAvatar = (v) => (v && validAvatarStyles.includes(v) ? v : 'circle');

    const updateData = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (color !== undefined) updateData.color = color;
    if (avatar !== undefined) updateData.avatar = safeAvatar(avatar);
    if (role !== undefined) updateData.role = role;
    if (age !== undefined) updateData.age = age !== null ? parseInt(age, 10) : null;
    if (relationship !== undefined) updateData.relationship = relationship || null;
    if (workingHours !== undefined) {
      const wh = String(workingHours || '').trim();
      updateData.workingHours = wh ? wh : null;
    }
    if (availability !== undefined) updateData.availability = availability || null;
    if (activities !== undefined) {
      updateData.activities = activities ? String(activities).trim() : null;
    }
    if (abilities !== undefined) updateData.abilities = Array.isArray(abilities) ? abilities : [];
    if (chorePreferences !== undefined) updateData.chorePreferences = chorePreferences || null;
    if (restrictions !== undefined) {
      updateData.restrictions = restrictions ? String(restrictions).trim() : null;
    }
    if (dietaryRestrictions !== undefined) {
      updateData.dietaryRestrictions = Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [];
    }

    const member = await prisma.familyMember.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('Family member PATCH error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    await prisma.familyMember.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Family member DELETE error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to delete family member', details: error.message },
      { status: 500 }
    );
  }
}
