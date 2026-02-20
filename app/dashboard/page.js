'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TodayOverview from '../components/TodayOverview';
import WeekProgress from '../components/WeekProgress';
import QuickActions from '../components/QuickActions';
import UpcomingChores from '../components/UpcomingChores';
import { useTheme } from '../providers/ThemeProvider';

export default function DashboardPage() {
  const { theme } = useTheme();
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

  const textColor = theme.card?.text || '#3f2d1d';
  const isDark = theme.main && theme.main.includes('1a1a1a');
  const mutedColor = isDark ? 'rgba(255,255,255,0.7)' : '#6b7280';

  if (loading) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ opacity: 0.7 }}>
          <div style={{ height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 4, width: '25%', marginBottom: 32 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            <div style={{ gridColumn: 'span 2', height: 256, background: 'rgba(255,255,255,0.2)', borderRadius: 8 }} />
            <div style={{ height: 256, background: 'rgba(255,255,255,0.2)', borderRadius: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1rem', color: textColor }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, color: textColor }}>Dashboard</h1>
        <p style={{ marginTop: 4, color: mutedColor }}>
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <QuickActions />
      </div>

      {/* Main Content Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 24
        }}
        className="dashboard-grid"
      >
        {/* Left Column - Today & Week Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <TodayOverview events={events} />
          <WeekProgress events={events} chores={chores} />
        </div>

        {/* Right Column - Upcoming Chores */}
        <div>
          <UpcomingChores chores={chores} onToggle={handleChoreToggle} />
        </div>
      </div>

      {/* Navigation Footer */}
      <div style={{ marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center' }}>
        <Link
          href="/"
          style={{ color: '#3b82f6', fontWeight: 500, textDecoration: 'none' }}
        >
          View Full Calendar →
        </Link>
        <Link
          href="/chores"
          style={{ color: '#3b82f6', fontWeight: 500, textDecoration: 'none' }}
        >
          Manage Chores →
        </Link>
      </div>
    </div>
  );
}
