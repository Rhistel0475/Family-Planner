'use client';

import { useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';

export default function UpcomingChores({ chores, onToggle }) {
  const { theme } = useTheme();
  const cardBg = theme.card?.bg?.[2] || theme.hero?.bg || 'rgba(255,255,255,0.95)';
  const textColor = theme.card?.text || '#3f2d1d';
  const borderColor = theme.card?.border || 'rgba(0,0,0,0.1)';
  const [localChores, setLocalChores] = useState(chores);

  // Get today's day name
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Filter incomplete chores
  const incompleteChores = chores.filter(c => !c.completed);

  // Group by today vs rest of week
  const todayChores = incompleteChores.filter(c => c.dueDay === today);
  const otherChores = incompleteChores.filter(c => c.dueDay !== today);

  const handleToggle = async (choreId, currentlyCompleted) => {
    // Optimistic update
    setLocalChores(prev =>
      prev.map(c => c.id === choreId ? { ...c, completed: !currentlyCompleted } : c)
    );

    // Call parent handler
    await onToggle(choreId, !currentlyCompleted);
  };

  const ChoreItem = ({ chore }) => {
    const isCompleted = localChores.find(c => c.id === chore.id)?.completed || chore.completed;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: 12,
          borderRadius: 8,
          background: 'rgba(0,0,0,0.05)'
        }}
      >
        <button
          onClick={() => handleToggle(chore.id, isCompleted)}
          style={{
            flexShrink: 0,
            width: 20,
            height: 20,
            borderRadius: 4,
            border: `2px solid ${isCompleted ? '#22c55e' : 'rgba(0,0,0,0.2)'}`,
            background: isCompleted ? '#22c55e' : 'transparent',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isCompleted && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              margin: 0,
              color: textColor,
              opacity: isCompleted ? 0.6 : 1,
              textDecoration: isCompleted ? 'line-through' : 'none'
            }}
          >
            {chore.title}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{chore.dueDay}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>•</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{chore.assignedTo}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        background: cardBg,
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: `1px solid ${borderColor}`,
        padding: '1.5rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: textColor }}>Upcoming Chores</h2>
        <span style={{ fontSize: '0.875rem', color: textColor, opacity: 0.8 }}>
          {incompleteChores.length} to do
        </span>
      </div>

      {incompleteChores.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎉</div>
          <p style={{ fontWeight: 500, color: textColor }}>All caught up!</p>
          <p style={{ fontSize: '0.875rem', marginTop: 4, opacity: 0.7 }}>No pending chores</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {todayChores.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: textColor }}>
                <span>🔥</span>
                <span>Today ({today})</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todayChores.map(chore => (
                  <ChoreItem key={chore.id} chore={chore} />
                ))}
              </div>
            </div>
          )}

          {otherChores.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: textColor }}>
                <span>📅</span>
                <span>This Week</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {otherChores.slice(0, 5).map(chore => (
                  <ChoreItem key={chore.id} chore={chore} />
                ))}
                {otherChores.length > 5 && (
                  <div style={{ textAlign: 'center', padding: 8 }}>
                    <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                      +{otherChores.length - 5} more chores
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
