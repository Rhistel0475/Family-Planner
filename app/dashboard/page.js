'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TodayOverview from '../components/TodayOverview';
import WeekProgress from '../components/WeekProgress';
import QuickActions from '../components/QuickActions';
import UpcomingChores from '../components/UpcomingChores';

export default function DashboardPage() {
  const [events, setEvents] = useState([]);
  const [chores, setChores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsRes, choresRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/chores')
      ]);

      const eventsData = await eventsRes.json();
      const choresData = await choresRes.json();

      setEvents(eventsData.events || []);
      setChores(choresData.chores || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChoreToggle = async (choreId, completed) => {
    try {
      const response = await fetch('/api/chores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: choreId, completed })
      });

      if (response.ok) {
        await loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to toggle chore:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <QuickActions />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Today & Week Progress */}
        <div className="lg:col-span-2 space-y-6">
          <TodayOverview events={events} />
          <WeekProgress events={events} chores={chores} />
        </div>

        {/* Right Column - Upcoming Chores */}
        <div className="lg:col-span-1">
          <UpcomingChores chores={chores} onToggle={handleChoreToggle} />
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 flex gap-4 justify-center">
        <Link
          href="/schedule-viewer"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          View Full Calendar →
        </Link>
        <Link
          href="/chores"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Manage Chores →
        </Link>
      </div>
    </div>
  );
}
