'use client';

export default function WeekProgress({ events, chores }) {
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

  const weekChores = chores.filter(chore => {
    const choreDate = new Date(chore.createdAt);
    return choreDate >= start && choreDate < end;
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
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200'
    };

    return (
      <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm font-medium mt-1">{label}</div>
        {subtext && (
          <div className="text-xs opacity-75 mt-1">{subtext}</div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">This Week</h2>
        <div className="text-sm text-gray-500">
          {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' - '}
          {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Progress Bar */}
      {totalChores > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Chore Completion</span>
            <span className="text-gray-600">
              {completedChores} of {totalChores} ({Math.round(completionRate)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 rounded-full"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Events by Category
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(eventsByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
                >
                  <span className="font-medium text-gray-700 capitalize">
                    {category.toLowerCase()}
                  </span>
                  <span className="text-gray-600 font-semibold">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
