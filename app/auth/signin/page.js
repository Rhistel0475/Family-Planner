'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        // Register new user
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to register');
        }

        // Auto sign in after registration
        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.error) {
          throw new Error(signInResult.error);
        }

        // Redirect to onboarding or dashboard
        router.push('/setup');
      } else {
        // Sign in existing user
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error('Invalid email or password');
        }

        // Redirect to callback URL or dashboard
        const callbackUrl = searchParams?.get('callbackUrl') || '/';
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signIn('google', {
        callbackUrl: searchParams?.get('callbackUrl') || '/',
      });
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>
              {mode === 'signin' ? '👋 Welcome Back!' : '🎉 Create Account'}
            </h1>
            <p style={styles.subtitle}>
              {mode === 'signin'
                ? 'Sign in to access your family planner'
                : 'Join your family and start planning together'}
            </p>
          </div>

          {error && (
            <div style={styles.error}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {mode === 'signup' && (
              <>
                <label style={styles.label}>Name</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your name"
                  required={mode === 'signup'}
                  disabled={loading}
                />
              </>
            )}

            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
              required
              disabled={loading}
            />

            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter your password"
              required
              disabled={loading}
              minLength={6}
            />

            <button type="submit" style={styles.button} disabled={loading}>
              {loading
                ? 'Please wait...'
                : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>or</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            style={styles.googleButton}
            disabled={loading}
          >
            <span style={styles.googleIcon}>🔗</span>
            Continue with Google
          </button>

          <div style={styles.footer}>
            {mode === 'signin' ? (
              <p style={styles.footerText}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  style={styles.link}
                  disabled={loading}
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p style={styles.footerText}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError('');
                  }}
                  style={styles.link}
                  disabled={loading}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    backgroundColor: '#f4e3bf',
    backgroundImage:
      'radial-gradient(circle at 25% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.22), transparent 45%)',
  },
  container: {
    width: '100%',
    maxWidth: '440px',
  },
  card: {
    background: '#fff59d',
    borderRadius: '12px',
    boxShadow: '0 14px 28px rgba(70, 45, 11, 0.25)',
    border: '1px solid rgba(98, 73, 24, 0.24)',
    padding: '2rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.75rem',
    color: '#3f2d1d',
  },
  subtitle: {
    margin: 0,
    fontSize: '0.95rem',
    color: '#6b5530',
    lineHeight: '1.5',
  },
  error: {
    marginBottom: '1.5rem',
    padding: '0.75rem',
    borderRadius: '8px',
    background: 'rgba(186, 62, 62, 0.12)',
    border: '1px solid rgba(186, 62, 62, 0.35)',
    color: '#8b1f1f',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#3f2d1d',
    marginTop: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(98, 73, 24, 0.3)',
    background: 'rgba(255, 255, 255, 0.7)',
    fontSize: '1rem',
    color: '#3f2d1d',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '9999px',
    border: '1px solid rgba(98, 73, 24, 0.32)',
    background: '#4b2f17',
    color: '#fff4cf',
    fontWeight: 800,
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '1.5rem 0',
    color: '#6b5530',
  },
  dividerText: {
    padding: '0 1rem',
    fontSize: '0.85rem',
    flex: 1,
    textAlign: 'center',
    position: 'relative',
    '::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '50%',
      width: '45%',
      height: '1px',
      background: 'rgba(98, 73, 24, 0.2)',
    },
    '::after': {
      content: '""',
      position: 'absolute',
      right: 0,
      top: '50%',
      width: '45%',
      height: '1px',
      background: 'rgba(98, 73, 24, 0.2)',
    },
  },
  googleButton: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '9999px',
    border: '1px solid rgba(98, 73, 24, 0.32)',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#3f2d1d',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  googleIcon: {
    fontSize: '1.2rem',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
  },
  footerText: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#6b5530',
  },
  link: {
    background: 'none',
    border: 'none',
    color: '#4b2f17',
    fontWeight: 700,
    textDecoration: 'underline',
    cursor: 'pointer',
    padding: 0,
  },
};
