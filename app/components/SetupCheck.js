'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function SetupCheck({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [error, setError] = useState(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    // Skip check on setup page itself
    if (pathname === '/setup') {
      setLoading(false);
      return;
    }

    // Skip check if URL has setupComplete parameter
    if (typeof window !== 'undefined' && window.location.search.includes('setupComplete=true')) {
      setLoading(false);
      return;
    }

    checkSetupStatus();
  }, [pathname]);

  async function checkSetupStatus() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch('/api/setup', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Setup check failed with status ${res.status}`);
      }

      const data = await res.json();

      if (!data.setupComplete && pathname !== '/setup') {
        setNeedsSetup(true);
        router.push('/setup');
      } else {
        setNeedsSetup(false);
      }

      // Reset retry count on success
      retryCount.current = 0;
      setError(null);
    } catch (error) {
      console.error('Failed to check setup:', error);

      // On error, allow app to load anyway after max retries
      retryCount.current += 1;

      if (retryCount.current >= maxRetries) {
        console.warn('Max retries reached for setup check. Allowing app to load.');
        setError('Could not verify setup status. Continuing anyway.');
        setNeedsSetup(false);
      } else {
        // Retry after a short delay
        setTimeout(() => checkSetupStatus(), 1000 * retryCount.current);
        return; // Don't set loading to false yet
      }
    } finally {
      if (retryCount.current >= maxRetries || retryCount.current === 0) {
        setLoading(false);
      }
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  // Show error message if setup check failed after retries
  if (error) {
    return (
      <>
        <div style={styles.errorBanner}>
          {error}
        </div>
        {children}
      </>
    );
  }

  // Always render children, redirect happens via router.push
  return children;
}

const styles = {
  loadingContainer: {
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
  errorBanner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    padding: '0.75rem',
    background: 'rgba(186, 62, 62, 0.9)',
    color: 'white',
    textAlign: 'center',
    fontSize: '0.9rem',
    zIndex: 1000
  }
};
