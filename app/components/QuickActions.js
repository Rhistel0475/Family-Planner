'use client';

import Link from 'next/link';
import { useTheme } from '../providers/ThemeProvider';

export default function QuickActions() {
  const { theme } = useTheme();
  const actions = [
    {
      name: 'View Calendar',
      href: '/',
      icon: '📅',
      description: 'Browse your weekly schedule',
      color: '#3b82f6'
    },
    {
      name: 'Manage Chores',
      href: '/chores',
      icon: '✓',
      description: 'View and update chores',
      color: '#22c55e'
    },
    {
      name: 'Add Event',
      href: '/',
      icon: '+',
      description: 'Create a new event',
      color: '#a855f7'
    },
    {
      name: 'AI Assistant',
      href: '/ai',
      icon: '🤖',
      description: 'Smart chore assignments',
      color: '#f59e0b'
    }
  ];

  return (
    <div
      style={{
        background: theme.card?.bg?.[0] || theme.hero?.bg || 'rgba(255,255,255,0.95)',
        color: theme.card?.text || '#3f2d1d',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: `1px solid ${theme.card?.border || 'rgba(0,0,0,0.1)'}`,
        padding: '1.5rem'
      }}
    >
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: theme.card?.text || '#3f2d1d' }}>
        Quick Actions
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            aria-label={action.description}
            style={{
              display: 'block',
              padding: '1rem',
              borderRadius: 8,
              border: `2px solid ${theme.card?.border || 'rgba(0,0,0,0.1)'}`,
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s',
              background: 'rgba(255,255,255,0.5)',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.outline = '2px solid #3b82f6';
              e.target.style.outlineOffset = '2px';
              e.target.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.target.style.outline = 'none';
              e.target.style.borderColor = theme.card?.border || 'rgba(0,0,0,0.1)';
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: action.color,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                marginBottom: '0.75rem'
              }}
            >
              {action.icon}
            </div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.95rem' }}>
              {action.name}
            </h3>
            <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>{action.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
