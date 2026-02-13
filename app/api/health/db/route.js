import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      message: 'Database connection successful.'
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Database connection failed.',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
