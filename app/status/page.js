import { prisma } from '../../lib/prisma';

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

  return (
    <main style={styles.main}>
      <section style={styles.card}>
        <h1 style={styles.title}>System Status</h1>
        <p style={styles.subtitle}>Run a live Prisma → Postgres connectivity check.</p>

        <div
          style={{
            ...styles.statusBox,
            background: dbStatus.ok ? 'rgba(63, 152, 76, 0.15)' : 'rgba(186, 62, 62, 0.12)',
            borderColor: dbStatus.ok ? 'rgba(44, 121, 57, 0.35)' : 'rgba(186, 62, 62, 0.35)',
            color: dbStatus.ok ? '#1f602a' : '#8b1f1f'
          }}
        >
          <p style={styles.statusTitle}>{dbStatus.ok ? 'Connected' : 'Not Connected'}</p>
          <p>{dbStatus.message}</p>
          <p style={styles.details}>{dbStatus.details}</p>
        </div>

        <p style={styles.tip}>API check endpoint: /api/health/db</p>
      </section>
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    padding: '5rem 1.5rem 2rem 1.5rem',
    backgroundColor: '#f4e3bf',
    backgroundImage:
      'radial-gradient(circle at 25% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.22), transparent 45%)',
    color: '#3f2d1d'
  },
  card: {
    maxWidth: 640,
    margin: '0 auto',
    background: '#fff59d',
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.24)',
    boxShadow: '0 14px 24px rgba(70, 45, 11, 0.2)',
    padding: '1.2rem'
  },
  title: {
    marginBottom: '0.35rem'
  },
  subtitle: {
    marginBottom: '1rem'
  },
  statusBox: {
    border: '1px solid',
    borderRadius: 8,
    padding: '0.8rem 0.9rem',
    marginBottom: '0.8rem'
  },
  statusTitle: {
    fontWeight: 700,
    marginBottom: '0.4rem'
  },
  details: {
    marginTop: '0.45rem',
    fontSize: '0.9rem',
    opacity: 0.95
  },
  tip: {
    fontSize: '0.88rem',
    opacity: 0.8
  }
};
