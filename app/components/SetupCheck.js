'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../providers/ThemeProvider';

let checkcount = 0;

export default function SetupCheck({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('initializing...');
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    const init = async () => {
      try {
        const currentPathname = pathname;
        setDebugInfo('checking setup on ' + currentPathname);
        
        // Skip check on setup page itself
        if (currentPathname === '/setup') {
          setDebugInfo('on setup page');
          setLoading(false);
          return;
        }

        // Skip check if URL has setupComplete parameter
        if (typeof window !== 'undefined' && window.location.search.includes('setupComplete=true')) {
          setDebugInfo('setupComplete param');
          setLoading(false);
          return;
        }

        // Try to fetch, but don't wait too long
        try {
          const res = await Promise.race([
            fetch('/api/setup'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
          ]);
          
          if (res && res.ok) {
            const data = await res.json();
            if (!data.setupComplete && currentPathname !== '/setup') {
              setDebugInfo('setup incomplete, redirecting');
              router.push('/setup');
              return;
            }
          }
        } catch (e) {
          setDebugInfo('fetch error: ' + e.message);
        }

        // Always set loading to false, regardless of fetch result
        setLoading(false);
      } catch (err) {
        console.error('[SetupCheck] error:', err);
        setDebugInfo('error: ' + err.message);
        setLoading(false);
      }
    };

    init();
  }, [pathname]);

  if (loading) {
    return (
      <div style={{ ...styles.loadingContainer, backgroundColor: theme.pageBackground, color: theme.card.text }}>
        <div style={styles.spinner} />
        <p>Loading...</p>
        {process.env.NODE_ENV === 'development' && <p style={{fontSize: '12px', color: '#999'}}>{debugInfo}</p>}
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
    justifyContent: 'center'
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
