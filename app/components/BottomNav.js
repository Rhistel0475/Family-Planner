'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: '🏠', label: 'Home' },
    { href: '/chores', icon: '✓', label: 'Chores' },
    { href: '/schedule', icon: '📅', label: 'Schedule' },
    { href: '/family', icon: '👥', label: 'Family' },
    { href: '/ai', icon: '🤖', label: 'AI' }
  ];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div style={styles.spacer} />

      <nav style={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...styles.navItem,
                background: isActive ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
                color: isActive ? '#3f2d1d' : '#5b4228'
              }}
            >
              <span style={styles.icon}>{item.icon}</span>
              <span style={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

const styles = {
  spacer: {
    display: 'none',
    '@media (maxWidth: 768px)': {
      display: 'block',
      height: '70px'
    }
  },
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#ffe77a',
    borderTop: '2px solid rgba(98, 73, 24, 0.2)',
    boxShadow: '0 -4px 12px rgba(70, 45, 11, 0.15)',
    display: 'none',
    justifyContent: 'space-around',
    padding: '0.5rem 0',
    zIndex: 100,
    '@media (maxWidth: 768px)': {
      display: 'flex'
    }
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.5rem 0.75rem',
    borderRadius: 8,
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    minWidth: '60px'
  },
  icon: {
    fontSize: '1.4rem',
    lineHeight: 1
  },
  label: {
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.02em'
  }
};
