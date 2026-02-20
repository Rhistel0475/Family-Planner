import { prisma } from '../../lib/prisma';
import StatusContent from './StatusContent';

export default async function StatusPage() {
  let dbStatus = {
    ok: false,
    message: 'Database connection failed.',
    details: 'Unknown error'
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = {
      ok: true,
      message: 'Database connection successful.',
      details: 'Prisma can reach Postgres.'
    };
  } catch (error) {
    dbStatus = {
      ok: false,
      message: 'Database connection failed.',
      details: error?.message || 'Unknown error'
    };
  }

  return <StatusContent dbStatus={dbStatus} />;
}
