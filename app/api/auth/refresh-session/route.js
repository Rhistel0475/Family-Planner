import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken, encode } from 'next-auth/jwt';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const [key, ...v] = part.trim().split('=');
    if (key) cookies[key.trim()] = v.join('=').trim();
  }
  return cookies;
}

/**
 * Server-side session refresh: update JWT with familyId after setup.
 * Call this after /api/setup/complete returns familyId, then redirect to /.
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { familyId } = body;
  if (!familyId || typeof familyId !== 'string') {
    return NextResponse.json({ error: 'Missing familyId' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });
  if (!user || user.familyId !== familyId) {
    return NextResponse.json({ error: 'Invalid family' }, { status: 403 });
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const req = { cookies, headers: request.headers };

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });
  if (!token) {
    return NextResponse.json({ error: 'No session token' }, { status: 401 });
  }

  const newToken = { ...token, familyId };
  const secret = process.env.NEXTAUTH_SECRET;
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  const encoded = await encode({
    token: newToken,
    secret,
    maxAge
  });

  const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://');
  const cookieName = useSecureCookies ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, encoded, {
    httpOnly: true,
    path: '/',
    maxAge,
    sameSite: 'lax',
    secure: useSecureCookies
  });

  return response;
}
