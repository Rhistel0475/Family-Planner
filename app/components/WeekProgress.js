'use client';

import { useTheme } from '../providers/ThemeProvider';

export default function WeekProgress({ events, chores }) {
  const { theme } = useTheme();
  const cardBg = theme.card?.bg?.[1] || theme.hero?.bg || 'rgba(255,255,255,0.95)';
  const textColor = theme.card?.text || '#3f2d1d';
  const borderColor = theme.card?.border || 'rgba(0,0,0,0.1)';
  // Get start and end of current week (Monday to Sunday)
  const getWeekBounds = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const daysFromMonday = (currentDay + 6) % 7;

    const monday = new Date(now);
    monday.setDate(now.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    return { start: monday, end: sunday };
  };

  const { start, end } = getWeekBounds();

  // Filter events and chores for this week
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startsAt);
    return eventDate >= start && eventDate < end;
  });

  // Get day names for current week (Mon-Sun)
  const weekDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekChores = chores.filter(chore => {
    const dueDay = chore.dueDay || '';
    return weekDayNames.includes(dueDay);
  });

  // Calculate stats
  const totalChores = weekChores.length;
  const completedChores = weekChores.filter(c => c.completed).length;
  const completionRate = totalChores > 0 ? (completedChores / totalChores) * 100 : 0;

  const totalEvents = weekEvents.length;
  const upcomingEvents = weekEvents.filter(e => new Date(e.startsAt) > new Date()).length;
  const pastEvents = totalEvents - upcomingEvents;

  // Category breakdown
  const eventsByCategory = weekEvents.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});

  const StatCard = ({ label, value, subtext, color = 'blue' }) => {
    const colorStyles = {
      blue: { bg: 'rgba(59,130,246,0.15)', color: '#1d4ed8', border: 'rgba(59,130,246,0.3)' },
      green: { bg: 'rgba(34,197,94,0.15)', color: '#15803d', border: 'rgba(34,197,94,0.3)' },
      purple: { bg: 'rgba(168,85,247,0.15)', color: '#6b21a8', border: 'rgba(168,85,247,0.3)' },
      orange: { bg: 'rgba(249,115,22,0.15)', color: '#c2410c', border: 'rgba(249,115,22,0.3)' }
    };
    const s = colorStyles[color] || colorStyles.blue;

    return (
      <div style={{ borderRadius: 8, border: `1px solid ${s.border}`, padding: 16, background: s.bg }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{value}</div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: 4, color: textColor }}>{label}</div>
        {subtext && (
          <div style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: 4, color: textColor }}>{subtext}</div>
        )}
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
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: textColor }}>This Week</h2>
        <div style={{ fontSize: '0.875rem', color: textColor, opacity: 0.8 }}>
          {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' - '}
          {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Progress Bar */}
      {totalChores > 0 ? (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 8 }}>
            <span style={{ fontWeight: 500, color: textColor }}>Chore Completion</span>
            <span style={{ color: textColor, opacity: 0.8 }}>
              {completedChores} of {totalChores} ({Math.round(completionRate)}%)
            </span>
          </div>
          <div 
            role="progressbar"
            aria-valuenow={completedChores}
            aria-valuemin={0}
            aria-valuemax={totalChores}
            aria-label={`Chore completion: ${completedChores} of ${totalChores} completed`}
            style={{ width: '100%', background: 'rgba(0,0,0,0.15)', borderRadius: 9999, height: 12, overflow: 'hidden' }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                borderRadius: 9999,
                width: `${completionRate}%`,
                transition: 'width 0.5s'
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 24, textAlign: 'center', padding: '1rem', opacity: 0.7 }}>
          <p style={{ fontSize: '0.875rem', color: textColor }}>
            💡 No chores scheduled this week. Add chores to track your progress!
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16 }}>
        <StatCard
          label="Total Events"
          value={totalEvents}
          subtext={`${upcomingEvents} upcoming`}
          color="blue"
        />
        <StatCard
          label="Chores Done"
          value={completedChores}
          subtext={`${totalChores - completedChores} remaining`}
          color="green"
        />
        <StatCard
          label="Past Events"
          value={pastEvents}
          subtext="This week"
          color="purple"
        />
        <StatCard
          label="Categories"
          value={Object.keys(eventsByCategory).length}
          subtext="Event types"
          color="orange"
        />
      </div>

      {/* Category Breakdown */}
      {Object.keys(eventsByCategory).length > 0 && (
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${borderColor}` }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 12, color: textColor }}>
            Events by Category
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {Object.entries(eventsByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div
                  key={category}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    background: 'rgba(0,0,0,0.05)',
                    borderRadius: 8,
                    padding: '8px 12px'
                  }}
                >
                  <span style={{ fontWeight: 500, color: textColor, textTransform: 'capitalize' }}>
                    {category.toLowerCase()}
                  </span>
                  <span style={{ fontWeight: 600, color: textColor }}>{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
