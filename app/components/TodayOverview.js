'use client';

import { useTheme } from '../providers/ThemeProvider';
import { EVENT_CATEGORIES } from '../../lib/eventConfig';

export default function TodayOverview({ events }) {
  const { theme } = useTheme();
  const cardBg = theme.card?.bg?.[0] || theme.hero?.bg || 'rgba(255,255,255,0.95)';
  const textColor = theme.card?.text || '#3f2d1d';
  const borderColor = theme.card?.border || 'rgba(0,0,0,0.1)';
  // Get today's events
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.startsAt);
    return eventDate >= today && eventDate < tomorrow;
  }).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  const groupEventsByTimeOfDay = (events) => {
    const groups = {
      morning: [],   // 5am - 12pm
      afternoon: [], // 12pm - 5pm
      evening: []    // 5pm - 5am
    };

    events.forEach(event => {
      const hour = new Date(event.startsAt).getHours();
      if (hour >= 5 && hour < 12) {
        groups.morning.push(event);
      } else if (hour >= 12 && hour < 17) {
        groups.afternoon.push(event);
      } else {
        groups.evening.push(event);
      }
    });

    return groups;
  };

  const eventGroups = groupEventsByTimeOfDay(todayEvents);

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const EventCard = ({ event }) => {
    const category = EVENT_CATEGORIES[event.type] || EVENT_CATEGORIES.PERSONAL;

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
        <div
          style={{
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            background: `${category.lightColor}40`
          }}
        >
          {category.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: '0.875rem', opacity: 0.8, fontWeight: 500 }}>
              {formatTime(event.startsAt)}
            </span>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textColor }}>
              {event.title}
            </h4>
          </div>
          {event.description && (
            <p style={{ fontSize: '0.75rem', marginTop: 4, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  const TimeSection = ({ title, events, emoji }) => {
    if (events.length === 0) return null;

    return (
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: textColor }}>
          <span>{emoji}</span>
          <span>{title}</span>
          <span style={{ fontWeight: 400, opacity: 0.7 }}>({events.length})</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
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
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: textColor }}>Today's Schedule</h2>
        <div style={{ fontSize: '0.875rem', color: textColor, opacity: 0.8 }}>
          {today.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      </div>

      {todayEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📅</div>
          <p style={{ fontWeight: 500, color: textColor, opacity: 0.9 }}>No events scheduled for today</p>
          <p style={{ fontSize: '0.875rem', marginTop: 4, opacity: 0.7 }}>Enjoy your free time!</p>
          <p style={{ fontSize: '0.75rem', marginTop: 12, opacity: 0.6 }}>
            💡 Tip: Use the Quick Actions above or visit the calendar to add events
          </p>
        </div>
      ) : (
        <div>
          <TimeSection
            title="Morning"
            events={eventGroups.morning}
            emoji="🌅"
          />
          <TimeSection
            title="Afternoon"
            events={eventGroups.afternoon}
            emoji="☀️"
          />
          <TimeSection
            title="Evening"
            events={eventGroups.evening}
            emoji="🌙"
          />
        </div>
      )}
    </div>
  );
}
