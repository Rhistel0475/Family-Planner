import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';

export async function GET() {
  try {
    const family = await getOrCreateDefaultFamily();
    
    return NextResponse.json({
      setupComplete: family.setupComplete,
      familyName: family.name
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || 'Failed to check setup status' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { familyName } = body;
    const family = await getOrCreateDefaultFamily();
    
    const updated = await prisma.family.update({
      where: { id: family.id },
      data: { 
        setupComplete: true,
        ...(familyName && { name: familyName })
      }
    });

    return NextResponse.json({ setupComplete: updated.setupComplete });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || 'Failed to complete setup' },
      { status: 500 }
    );
  }
}
