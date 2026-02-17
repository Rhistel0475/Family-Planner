'use client';

import Link from 'next/link';
import { useState } from 'react';

// Main navigation = destinations (NOT actions)
const navItems = [
  { href: '/dashboard', label: '📊 Dashboard' },
  { href: '/', label: 'Weekly View' },
  { href: '/schedule', label: 'Calendar' },
  { href: '/chores', label: 'Chores' },
  { href: '/recipes', label: 'Meals' },
  { href: '/family', label: 'Family' },
  { href: '/ai', label: 'Concierge' }
];

// Admin/Dev links (hidden in production)
const adminItems =
  process.env.NODE_ENV !== 'production'
    ? [
        { href: '/setup', label: 'Setup' },
        { href: '/status', label: 'DB Status' }
      ]
    : [];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        style={styles.button}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span style={styles.line} />
        <span style={styles.line} />
        <span style={styles.line} />
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          style={styles.backdrop}
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        style={{
          ...styles.drawer,
          transform: open ? 'translateX(0)' : 'translateX(-112%)'
        }}
      >
        <h2 style={styles.title}>Family Planner</h2>
        <p style={styles.subtitle}>Jump to a section</p>

        <nav style={styles.nav} aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={styles.link}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {adminItems.length > 0 && (
          <>
            <div style={styles.sectionLabel}>Admin</div>
            <nav style={styles.nav} aria-label="Admin navigation">
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={styles.link}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </>
        )}
      </aside>
    </>
  );
}

const styles = {
  button: {
    position: 'fixed',
    top: '1rem',
    left: '1rem',
    zIndex: 50,
    width: 46,
    height: 46,
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    background: '#fff59d',
    boxShadow: '0 10px 20px rgba(70, 45, 11, 0.2)',
    display: 'grid',
    alignContent: 'center',
    gap: 5,
    paddingInline: 10,
    cursor: 'pointer'
  },
  line: {
    display: 'block',
    height: 3,
    borderRadius: 999,
    background: '#4b2f17'
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    border: 'none',
    background: 'rgba(25, 15, 3, 0.32)',
    zIndex: 40,
    cursor: 'pointer'
  },
  drawer: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: 'min(82vw, 320px)',
    padding: '5rem 1rem 1rem 1rem',
    background: '#ffe77a',
    borderRight: '1px solid rgba(98, 73, 24, 0.28)',
    boxShadow: '0 14px 28px rgba(70, 45, 11, 0.22)',
    zIndex: 45,
    transition: 'transform 180ms ease',
    overflowY: 'auto'
  },
  title: {
    margin: 0,
    color: '#3f2d1d'
  },
  subtitle: {
    marginTop: '0.4rem',
    marginBottom: '1rem',
    color: '#5b4228'
  },
  sectionLabel: {
    marginTop: '1.2rem',
    marginBottom: '0.5rem',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#5b4228',
    opacity: 0.8
  },
  nav: {
    display: 'grid',
    gap: '0.6rem'
  },
  link: {
    textDecoration: 'none',
    color: '#3f2d1d',
    background: '#fff8bf',
    border: '1px solid rgba(98, 73, 24, 0.22)',
    borderRadius: 8,
    padding: '0.7rem 0.8rem',
    fontWeight: 700
  }
};

