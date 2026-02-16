'use client';

import Link from 'next/link';
import {
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  PlusCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function QuickActions() {
  const actions = [
    {
      name: 'View Calendar',
      href: '/schedule-viewer',
      icon: CalendarDaysIcon,
      description: 'Browse your weekly schedule',
      color: 'blue'
    },
    {
      name: 'Manage Chores',
      href: '/chores',
      icon: ClipboardDocumentCheckIcon,
      description: 'View and update chores',
      color: 'green'
    },
    {
      name: 'Add Event',
      href: '/schedule-viewer',
      icon: PlusCircleIcon,
      description: 'Create a new event',
      color: 'purple'
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: ChartBarIcon,
      description: 'View activity reports',
      color: 'orange'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    orange: 'bg-orange-500 hover:bg-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.name}
              href={action.href}
              className="group relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-md"
            >
              <div className="p-4">
                <div
                  className={`w-12 h-12 rounded-lg ${colorClasses[action.color]} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {action.name}
                </h3>
                <p className="text-xs text-gray-600">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
