'use client';

import React from 'react';

/**
 * ErrorBoundary - Catches JavaScript errors anywhere in child component tree
 * 
 * Usage:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error details
    this.setState({
      error,
      errorInfo
    });

    // Optional: Send to error tracking service (e.g., Sentry)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return <DefaultErrorUI error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Default Error UI
 */
function DefaultErrorUI({ error, onReset }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>😵</div>
        <h2 style={styles.title}>Oops! Something went wrong</h2>
        <p style={styles.message}>
          Don't worry, your data is safe. This is just a temporary hiccup.
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details style={styles.details}>
            <summary style={styles.summary}>Error Details (Development Only)</summary>
            <pre style={styles.errorText}>{error.toString()}</pre>
          </details>
        )}

        <div style={styles.actions}>
          <button onClick={onReset} style={styles.primaryButton}>
            Try Again
          </button>
          <button 
            onClick={() => window.location.href = '/'} 
            style={styles.secondaryButton}
          >
            Go Home
          </button>
        </div>

        <p style={styles.help}>
          If this keeps happening, try refreshing the page or{' '}
          <a href="mailto:support@example.com" style={styles.link}>
            contact support
          </a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: '#f4e3bf',
    backgroundImage: 'radial-gradient(circle at 25% 20%, rgba(255,255,255,0.35), transparent 45%)'
  },
  card: {
    maxWidth: '500px',
    width: '100%',
    background: '#ffef7d',
    borderRadius: '12px',
    padding: '2.5rem',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(70, 45, 11, 0.2)',
    border: '1px solid rgba(98, 73, 24, 0.2)'
  },
  icon: {
    fontSize: '4rem',
    marginBottom: '1rem'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#3f2d1d',
    marginBottom: '0.75rem'
  },
  message: {
    fontSize: '1rem',
    color: '#5b4228',
    marginBottom: '1.5rem',
    lineHeight: 1.6
  },
  details: {
    textAlign: 'left',
    background: 'rgba(255, 255, 255, 0.5)',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    border: '1px solid rgba(98, 73, 24, 0.2)'
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 600,
    color: '#3f2d1d',
    marginBottom: '0.5rem'
  },
  errorText: {
    fontSize: '0.75rem',
    color: '#ba3e3e',
    overflow: 'auto',
    maxHeight: '150px',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '1.5rem'
  },
  primaryButton: {
    padding: '0.75rem 1.5rem',
    background: '#c9f7a5',
    border: '1px solid rgba(98, 73, 24, 0.32)',
    borderRadius: '8px',
    color: '#2b4d1f',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  secondaryButton: {
    padding: '0.75rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.6)',
    border: '1px solid rgba(98, 73, 24, 0.32)',
    borderRadius: '8px',
    color: '#3f2d1d',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  help: {
    fontSize: '0.875rem',
    color: '#5b4228',
    opacity: 0.8
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'underline'
  }
};

/**
 * Compact Error Boundary for smaller components
 */
export function CompactErrorBoundary({ children, fallbackMessage = "Something went wrong" }) {
  return (
    <ErrorBoundary 
      fallback={
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '6px',
          color: '#ba3e3e',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>⚠️ {fallbackMessage}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Reload Page
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
