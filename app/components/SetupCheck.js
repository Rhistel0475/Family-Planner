'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function SetupCheck({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

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
      const res = await fetch('/api/setup');
      const data = await res.json();

      if (!data.setupComplete && pathname !== '/setup') {
        setNeedsSetup(true);
        router.push('/setup');
      } else {
        setNeedsSetup(false);
      }
    } catch (error) {
      console.error('Failed to check setup:', error);
      setNeedsSetup(false);
    } finally {
      setLoading(false);
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
  }
};
