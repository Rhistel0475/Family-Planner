'use client';

import { useTheme } from '../providers/ThemeProvider';
import { MAIN_PADDING_WITH_NAV, CONTENT_WIDTH_FORM } from '../../lib/layout';

export default function StatusContent({ dbStatus }) {
  const { theme } = useTheme();

  return (
    <main
      style={{
        ...styles.main,
        backgroundColor: theme.pageBackground,
        backgroundImage: theme.pageGradient || undefined,
        color: theme.card.text
      }}
    >
      <section
        style={{
          ...styles.card,
          background: theme.card.bg[0],
          border: `1px solid ${theme.card.border}`
        }}
      >
        <h1 style={styles.title}>System Status</h1>
        <p style={styles.subtitle}>Run a live Prisma to Postgres connectivity check.</p>

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
    padding: MAIN_PADDING_WITH_NAV
  },
  card: {
    maxWidth: CONTENT_WIDTH_FORM,
    margin: '0 auto',
    borderRadius: 10,
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
