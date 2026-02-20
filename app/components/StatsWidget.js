'use client';

import { useTheme } from '../providers/ThemeProvider';
import { getAvatarStyle } from '../../lib/avatarUtils';
import MemberAvatar from './MemberAvatar';

export default function StatsWidget({ stats, isExpanded, onToggle }) {
  const { theme } = useTheme();

  // If not expanded, show compact toggle button
  if (!isExpanded) {
    return (
      <button
        onClick={onToggle}
        style={{
          ...styles.toggleBtn,
          background: theme.controls.bg,
          border: `1px solid ${theme.controls.border}`,
          color: theme.card.text
        }}
      >
        <span style={styles.toggleIcon}>📊</span>
        <span>Show Detailed Stats</span>
        <span style={styles.expandIcon}>▼</span>
      </button>
    );
  }

  // Expanded view with full statistics
  return (
    <div
      style={{
        ...styles.container,
        background: theme.controls.bg,
        border: `1px solid ${theme.controls.border}`
      }}
    >
      {/* Header with collapse button */}
      <div style={styles.header}>
        <h3 style={{...styles.title, color: theme.card.text}}>
          📊 Weekly Statistics
        </h3>
        <button
          onClick={onToggle}
          style={{...styles.collapseBtn, color: theme.card.text}}
          aria-label="Collapse statistics"
        >
          ▲
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div style={styles.grid}>
        {/* Weekly Completion Card */}
        <div
          style={{
            ...styles.card,
            background: theme.card.bg[2],
            border: `1px solid ${theme.card.border}`,
            boxShadow: `0 4px 12px ${theme.card.shadow}`
          }}
        >
          <div style={{...styles.statLabel, color: theme.card.text}}>Weekly Progress</div>
          <div style={{...styles.statValue, color: theme.card.text}}>
            {stats.weeklyCompletion}%
          </div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${stats.weeklyCompletion}%`,
                background: stats.weeklyCompletion >= 75
                  ? theme.toast.success.bg
                  : stats.weeklyCompletion >= 50
                  ? theme.toast.info.bg
                  : theme.toast.error.bg
              }}
            />
          </div>
          <div style={{...styles.statSubtext, color: theme.card.text}}>
            {stats.completedChores}/{stats.totalChores} chores done
          </div>
        </div>

        {/* Top Performer Card */}
        {stats.topPerformer ? (
          <div
            style={{
              ...styles.card,
              background: theme.card.bg[0],
              border: `1px solid ${theme.card.border}`,
              boxShadow: `0 4px 12px ${theme.card.shadow}`
            }}
          >
            <div style={{...styles.statLabel, color: theme.card.text}}>🏆 Top Performer</div>
            <div style={{...styles.statValue, color: theme.card.text, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <MemberAvatar
                name={stats.topPerformer.name}
                color={stats.topPerformer.color}
                style={getAvatarStyle(stats.topPerformer.avatar)}
                size="sm"
              />
              {stats.topPerformer.name}
            </div>
            <div style={{...styles.statSubtext, color: theme.card.text}}>
              {stats.topPerformer.percentage}% complete
            </div>
            <div style={{...styles.statSubtext, color: theme.card.text}}>
              ({stats.topPerformer.completed}/{stats.topPerformer.total} done)
            </div>
          </div>
        ) : (
          <div
            style={{
              ...styles.card,
              background: theme.card.bg[0],
              border: `1px solid ${theme.card.border}`,
              boxShadow: `0 4px 12px ${theme.card.shadow}`
            }}
          >
            <div style={{...styles.statLabel, color: theme.card.text}}>🏆 Top Performer</div>
            <div style={{...styles.statValue, color: theme.card.text}}>—</div>
            <div style={{...styles.statSubtext, color: theme.card.text}}>
              No chores assigned yet
            </div>
          </div>
        )}

        {/* Pending Count Card */}
        <div
          style={{
            ...styles.card,
            background: theme.card.bg[1],
            border: `1px solid ${theme.card.border}`,
            boxShadow: `0 4px 12px ${theme.card.shadow}`
          }}
        >
          <div style={{...styles.statLabel, color: theme.card.text}}>⏳ Pending</div>
          <div style={{...styles.statValue, color: theme.card.text}}>
            {stats.pendingCount}
          </div>
          <div style={{...styles.statSubtext, color: theme.card.text}}>
            {stats.pendingCount === 1 ? 'chore to do' : 'chores to do'}
          </div>
        </div>

        {/* Days on Track Card */}
        <div
          style={{
            ...styles.card,
            background: theme.card.bg[3],
            border: `1px solid ${theme.card.border}`,
            boxShadow: `0 4px 12px ${theme.card.shadow}`
          }}
        >
          <div style={{...styles.statLabel, color: theme.card.text}}>✅ Days on Track</div>
          <div style={{...styles.statValue, color: theme.card.text}}>
            {stats.daysOnTrack}/7
          </div>
          <div style={{...styles.statSubtext, color: theme.card.text}}>
            {stats.daysOnTrack === 7
              ? 'Perfect week!'
              : stats.daysOnTrack >= 5
              ? 'Great job!'
              : 'Keep it up!'}
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      {stats.memberStats && stats.memberStats.length > 0 && (
        <div
          style={{
            ...styles.leaderboard,
            background: theme.button.secondary,
            border: `1px solid ${theme.card.border}`,
            boxShadow: `0 2px 8px ${theme.card.shadow}`
          }}
        >
          <h4 style={{...styles.leaderboardTitle, color: theme.card.text}}>
            🏅 Leaderboard
          </h4>
          <div style={styles.leaderboardList}>
            {stats.memberStats.map((member, index) => (
              <div
                key={member.id}
                style={{
                  ...styles.leaderboardItem,
                  background: index === 0 ? theme.card.bg[0] : 'transparent',
                  border: `1px solid ${index === 0 ? theme.card.border : 'transparent'}`
                }}
              >
                <span style={{...styles.rank, color: theme.card.text}}>
                  {index + 1}.
                </span>
                <MemberAvatar
                  name={member.name}
                  color={member.color}
                  style={getAvatarStyle(member.avatar)}
                  size="sm"
                />
                <span style={{...styles.name, color: theme.card.text}}>
                  {member.name}
                </span>
                <div style={styles.statsCol}>
                  <span style={{...styles.percentage, color: theme.card.text}}>
                    {member.percentage}%
                  </span>
                  <div style={styles.miniBar}>
                    <div
                      style={{
                        ...styles.miniBarFill,
                        width: `${member.percentage}%`,
                        background: member.color || theme.toast.success.bg
                      }}
                    />
                  </div>
                </div>
                <span style={{...styles.choreCount, color: theme.card.text}}>
                  {member.completed}/{member.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  // Toggle button (collapsed state)
  toggleBtn: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease'
  },
  toggleIcon: {
    fontSize: '1.2rem'
  },
  expandIcon: {
    fontSize: '0.8rem',
    marginLeft: '0.25rem'
  },

  // Container (expanded state)
  container: {
    width: '100%',
    borderRadius: 10,
    padding: '1rem',
    marginTop: '0.5rem'
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  title: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 700
  },
  collapseBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    opacity: 0.7,
    transition: 'opacity 0.2s ease'
  },

  // Stats Cards Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1rem'
  },

  // Stat Card
  card: {
    padding: '1rem',
    borderRadius: 8,
    textAlign: 'center'
  },
  statLabel: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 700,
    marginBottom: '0.5rem',
    opacity: 0.85
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: '0.5rem'
  },
  statSubtext: {
    fontSize: '0.75rem',
    opacity: 0.8,
    marginTop: '0.25rem'
  },

  // Progress Bar
  progressBar: {
    width: '100%',
    height: '8px',
    background: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: '0.5rem'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.5s ease'
  },

  // Leaderboard
  leaderboard: {
    borderRadius: 8,
    padding: '1rem',
    marginTop: '0.5rem'
  },
  leaderboardTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '1rem',
    fontWeight: 700
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  leaderboardItem: {
    display: 'grid',
    gridTemplateColumns: '30px 30px 1fr auto 60px',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: 6,
    transition: 'all 0.2s ease'
  },
  rank: {
    fontSize: '0.9rem',
    fontWeight: 700
  },
  avatar: {
    fontSize: '1.2rem'
  },
  name: {
    fontSize: '0.9rem',
    fontWeight: 600
  },
  statsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: '60px'
  },
  percentage: {
    fontSize: '0.85rem',
    fontWeight: 700,
    textAlign: 'right'
  },
  miniBar: {
    width: '100%',
    height: '4px',
    background: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.5s ease'
  },
  choreCount: {
    fontSize: '0.75rem',
    opacity: 0.8,
    textAlign: 'right'
  }
};
