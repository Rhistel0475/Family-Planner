'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

/**
 * Landing page after setup: update session with familyId, then redirect to home.
 * Kept separate so middleware allows it without familyId; session is updated here before going to /.
 */
export default function SetupDonePage() {
  const searchParams = useSearchParams();
  const { data: session, status, update: updateSession } = useSession();
  const [statusMsg, setStatusMsg] = useState('Loading session...');
  const hasRun = useRef(false);

  useEffect(() => {
    const familyId = searchParams.get('familyId');
    if (!familyId || familyId === 'undefined' || familyId === 'null') {
      setStatusMsg('Session update failed — redirecting to setup');
      window.location.href = '/setup';
      return;
    }

    // NextAuth updateSession returns early if loading or !session — wait for session to be ready
    if (status === 'loading' || !session) {
      setStatusMsg('Loading session...');
      return;
    }

    if (hasRun.current) return;
    hasRun.current = true;

    let cancelled = false;
    setStatusMsg('Updating session...');

    async function run() {
      try {
        if (typeof updateSession === 'function') {
          await Promise.race([
            updateSession({ familyId }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
          ]);
        }
        if (cancelled) return;
        setStatusMsg('Taking you home...');
        window.location.href = '/?setupComplete=true';
      } catch (e) {
        if (!cancelled) {
          if (e?.message === 'timeout') {
            setStatusMsg('Taking you home...');
            window.location.href = '/?setupComplete=true';
          } else {
            setStatusMsg('Something went wrong — redirecting to setup');
            window.location.href = '/setup';
          }
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, [searchParams, updateSession, status, session]);

  return (
    <div style={styles.container}>
      <div style={styles.spinner} />
      <p style={styles.text}>{statusMsg}</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4e3bf',
    color: '#3f2d1d'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(98, 73, 24, 0.2)',
    borderTop: '4px solid #3f2d1d',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
  },
  text: {
    fontSize: '1rem'
  }
};
