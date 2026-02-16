'use client';

import { EVENT_CATEGORIES } from '../../lib/eventConfig';

export default function TodayOverview({ events }) {
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
      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ backgroundColor: `${category.lightColor}40` }}
        >
          {category.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-gray-500 font-medium">
              {formatTime(event.startsAt)}
            </span>
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {event.title}
            </h4>
          </div>
          {event.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-1">
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
      <div className="mb-4 last:mb-0">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span>{emoji}</span>
          <span>{title}</span>
          <span className="text-gray-400 font-normal">({events.length})</span>
        </h3>
        <div className="space-y-2">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
        <div className="text-sm text-gray-500">
          {today.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      </div>

      {todayEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-gray-600 font-medium">No events scheduled for today</p>
          <p className="text-sm text-gray-500 mt-1">Enjoy your free time!</p>
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
