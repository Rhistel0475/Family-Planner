'use client';

import { useState } from 'react';

export default function UpcomingChores({ chores, onToggle }) {
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
      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
        <button
          onClick={() => handleToggle(chore.id, isCompleted)}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all ${
            isCompleted
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-green-500'
          }`}
        >
          {isCompleted && (
            <svg
              className="w-full h-full text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <h4
            className={`text-sm font-medium ${
              isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
            }`}
          >
            {chore.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{chore.dueDay}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{chore.assignedTo}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Upcoming Chores</h2>
        <span className="text-sm text-gray-500">
          {incompleteChores.length} to do
        </span>
      </div>

      {incompleteChores.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-gray-600 font-medium">All caught up!</p>
          <p className="text-sm text-gray-500 mt-1">No pending chores</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Today's Chores */}
          {todayChores.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>🔥</span>
                <span>Today ({today})</span>
              </h3>
              <div className="space-y-2">
                {todayChores.map(chore => (
                  <ChoreItem key={chore.id} chore={chore} />
                ))}
              </div>
            </div>
          )}

          {/* Rest of Week */}
          {otherChores.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>📅</span>
                <span>This Week</span>
              </h3>
              <div className="space-y-2">
                {otherChores.slice(0, 5).map(chore => (
                  <ChoreItem key={chore.id} chore={chore} />
                ))}
                {otherChores.length > 5 && (
                  <div className="text-center py-2">
                    <span className="text-sm text-gray-500">
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
