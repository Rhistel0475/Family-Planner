import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../../lib/defaultFamily';

export async function GET() {
  try {
    const family = await getOrCreateDefaultFamily();
    
    const members = await prisma.familyMember.findMany({
      where: { familyId: family.id },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch family members' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { name, role } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const family = await getOrCreateDefaultFamily();
    
    const member = await prisma.familyMember.create({
      data: {
        familyId: family.id,
        name,
        role: role || 'member'
      }
    });

    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create family member' },
      { status: 500 }
    );
  }
}
