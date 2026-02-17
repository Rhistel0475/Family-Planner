import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';

/**
 * Get auth + family for API routes. Use in Route Handlers.
 * @returns {Promise<{ session: object, family: object } | Response>}
 *   Either { session, family } or a Response (401/403) to return.
 */
export async function requireAuthAndFamily() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Sign in required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const familyId = session.user.familyId;
  if (!familyId) {
    return new Response(
      JSON.stringify({ error: 'Forbidden', message: 'Complete family setup first' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const family = await prisma.family.findUnique({
    where: { id: familyId }
  });
  if (!family) {
    return new Response(
      JSON.stringify({ error: 'Forbidden', message: 'Family not found' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return { session, family };
}

/**
 * Require only authentication (for setup route when user may not have family yet).
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Sign in required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return { session };
}

/**
 * Return a JSON error response; avoid leaking internal details in production.
 */
export function apiError(error, defaultMessage, status = 500) {
  console.error(defaultMessage, error);
  const message = process.env.NODE_ENV === 'production' ? defaultMessage : (error?.message || defaultMessage);
  return new Response(
    JSON.stringify({ error: defaultMessage, ...(process.env.NODE_ENV !== 'production' && { details: message }) }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}
