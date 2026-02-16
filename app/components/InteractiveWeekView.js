'use client';

import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { DAY_NAMES } from '../../lib/constants';
import Toast from './Toast';
import Modal from './Modal';
import QuickAddButton from './QuickAddButton';
import DraggableItem from './DraggableItem';
import DroppableDay from './DroppableDay';
import StatsWidget from './StatsWidget';
import FilterBar from './FilterBar';
import SmartTaskModal from './SmartTaskModal';
import DateTimePicker from './DateTimePicker';
import CategorySelector from './CategorySelector';
import { getEventCategory } from '../../lib/eventConfig';

const EVENT_CATEGORIES = [
  'Doctor Appointment',
  'Dentist Appointment',
  'School Event',
  'Church',
  'Family Event',
  'Birthday',
  'Sports / Practice',
  'Meeting',
  'Other'
];

function pad(n) {
  return String(n).padStart(2, '0');
}

function timeToMinutes(t) {
  // "HH:MM" -> minutes
  if (!t) return null;
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatTimeRange(startsAt, endsAt) {
  const s = new Date(startsAt);
  const startStr = s.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (!endsAt) return startStr;
  const e = new Date(endsAt);
  const endStr = e.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${startStr}–${endStr}`;
}

// Parse working hours string (e.g., "9:00 AM - 5:00 PM") and return simplified display
function parseWorkingHours(workingHoursStr) {
  if (!workingHoursStr || !workingHoursStr.trim()) return null;

  // Already formatted (e.g., "9:00 AM - 5:00 PM")
  if (workingHoursStr.includes(' - ')) {
    return workingHoursStr;
  }

  // Simple format (e.g., "9-5")
  const match = workingHoursStr.match(/(\d+)-(\d+)/);
  if (match) {
    return `${match[1]}:00 - ${match[2]}:00`;
  }

  return workingHoursStr;
}

export default function InteractiveWeekView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState([]);
  const [chores, setChores] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [quickAddModal, setQuickAddModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [newItem, setNewItem] = useState({
    title: '',
    assignedTo: '',
    day: 'Monday',
    type: 'PERSONAL',
    startsAt: new Date()
  });
  const [activeItem, setActiveItem] = useState(null);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    searchQuery: '',
    statusFilter: 'all',
    typeFilter: 'all'
  });

  const defaultChoreTemplates = [
    'Clean Bedroom',
    'Clean Kitchen',
    'Clean Living Room',
    'Take Out Trash',
    'Do Laundry',
    'Wash Dishes',
    'Vacuum Floors'
  ];

  const noteColors = ['#fff59d', '#ffd9a8', '#c9f7a5', '#ffd6e7'];
  const noteRotations = ['rotate(-1deg)', 'rotate(0.8deg)', 'rotate(-0.6deg)', 'rotate(0.6deg)'];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const getWeekDates = useCallback((offset = 0) => {
    const now = new Date();
    const currentDay = now.getDay();
    const daysFromMonday = (currentDay + 6) % 7;

    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - daysFromMonday + offset * 7);

    return DAY_NAMES.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        day,
        dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date
      };
    });
  }, []);

  const showToast = useCallback((message, type = 'success', action = null) => {
    setToast({ message, type, action });
  }, []);

  const showToastWithUndo = useCallback((message, undoAction) => {
    setToast({
      message,
      type: 'success',
      action: { label: 'Undo', onClick: undoAction }
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const weekDates = getWeekDates(weekOffset);
      const weekStart = new Date(weekDates[0].date);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekDates[6].date);
      weekEnd.setHours(23, 59, 59, 999);

      // Format dates for API query params (YYYY-MM-DD)
      const startParam = weekStart.toISOString().split('T')[0];
      const endParam = weekEnd.toISOString().split('T')[0];

      const [eventsRes, choresRes, membersRes] = await Promise.all([
        fetch(`/api/schedule?start=${startParam}&end=${endParam}`),
        fetch('/api/chores'),
        fetch('/api/family-members')
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        // API now filters by date range - no client-side filtering needed
        setEvents(eventsData.events || []);
      }

      if (choresRes.ok) {
        const choresData = await choresRes.json();
        setChores(choresData.chores || []);
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [weekOffset, getWeekDates, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getMemberColor = (assignedTo) => {
    const member = members.find((m) => m.name === assignedTo);
    return member ? member.color : '#94a3b8';
  };

  const toggleChoreCompletion = async (chore) => {
    const newCompleted = !chore.completed;

    setChores(
      chores.map((c) =>
        c.id === chore.id ? { ...c, completed: newCompleted, completedAt: newCompleted ? new Date() : null } : c
      )
    );

    try {
      const res = await fetch('/api/chores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chore.id, completed: newCompleted })
      });

      if (!res.ok) throw new Error('Failed to update chore');

      showToast(newCompleted ? '✓ Chore completed!' : 'Chore unmarked');
    } catch (error) {
      setChores(chores.map((c) => (c.id === chore.id ? chore : c)));
      showToast('Failed to update chore', 'error');
    }
  };

  const deleteChore = async (choreId) => {
    if (!confirm('Delete this chore?')) return;

    try {
      const res = await fetch(`/api/chores?id=${choreId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      setChores(chores.filter((c) => c.id !== choreId));
      showToast('Chore deleted');
    } catch (error) {
      showToast('Failed to delete chore', 'error');
    }
  };

  const deleteEvent = async (eventId) => {
    if (!confirm('Delete this event?')) return;

    try {
      const res = await fetch(`/api/schedule?id=${eventId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      setEvents(events.filter((e) => e.id !== eventId));
      showToast('Event deleted');
    } catch (error) {
      showToast('Failed to delete event', 'error');
    }
  };


  const handleSmartTaskSubmit = async (taskData) => {
    try {
      // Create smart task instances using AI assignment
      const taskInstances = createSmartTaskInstances(taskData, members, chores);

      if (taskInstances.length === 0) {
        showToast('No tasks created', 'error');
        return;
      }

      // Create all instances
      const promises = taskInstances.map(async (instance) => {
        if (taskData.type === 'CHORE' || instance.type === 'CHORE') {
          return fetch('/api/chores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(instance)
          });
        } else {
          // For events/work
          const startsAt = new Date();
          // Find the next occurrence of the dueDay
          const dayIndex = DAY_NAMES.indexOf(instance.dueDay);
          const today = startsAt.getDay();
          const daysUntil = (dayIndex + 6 - today) % 7;
          startsAt.setDate(startsAt.getDate() + daysUntil);

          return fetch('/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: instance.title,
              type: instance.type || 'EVENT',
              startsAt: startsAt.toISOString(),
              event: instance.title
            })
          });
        }
      });

      await Promise.all(promises);

      showToast(
        `✨ ${taskInstances.length} smart task${taskInstances.length > 1 ? 's' : ''} created!`,
        'success'
      );
      setQuickAddModal(null);
      fetchData();
    } catch (error) {
      console.error('Failed to create smart tasks:', error);
      showToast('Failed to create tasks', 'error');
    }
  };

  const toDayName = (date) => {
    const dayIndex = new Date(date).getDay();
    return DAY_NAMES[(dayIndex + 6) % 7];
  };

  const vibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
  };

  const handleDragStart = (event) => {
    vibrate();
    setActiveItem(event.active.data.current);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    vibrate();
    setActiveItem(null);

    if (!over) return;

    const item = active.data.current;
    const newDay = over.id;

    if (item.originalDay === newDay) return;

    if (item.type === 'chore') {
      await handleChoreDrop(item.id, newDay, item.originalChore);
    } else if (item.type === 'event') {
      await handleEventDrop(item.id, newDay, item.originalEvent);
    }
  };

  const handleChoreDrop = async (choreId, newDay, originalChore) => {
    const originalDay = originalChore.dueDay;

    setChores(chores.map((c) => (c.id === choreId ? { ...c, dueDay: newDay } : c)));

    try {
      const res = await fetch('/api/chores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: choreId, dueDay: newDay })
      });

      if (!res.ok) throw new Error('Update failed');

      showToastWithUndo(`Chore moved to ${newDay}`, async () => {
        setChores(chores.map((c) => (c.id === choreId ? { ...c, dueDay: originalDay } : c)));

        await fetch('/api/chores', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: choreId, dueDay: originalDay })
        });

        showToast('Move undone', 'info');
      });
    } catch (error) {
      setChores(chores.map((c) => (c.id === choreId ? originalChore : c)));
      showToast('Failed to move chore', 'error');
    }
  };

  const handleEventDrop = async (eventId, newDay, originalEvent) => {
    const weekDates = getWeekDates(weekOffset);
    const newDayData = weekDates.find((d) => d.day === newDay);
    if (!newDayData) return;

    const oldStart = new Date(originalEvent.startsAt);
    const oldEnd = originalEvent.endsAt ? new Date(originalEvent.endsAt) : null;

    const newStart = new Date(newDayData.date);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);

    let newEnd = null;
    if (oldEnd) {
      // preserve duration
      const durationMs = oldEnd.getTime() - oldStart.getTime();
      newEnd = new Date(newStart.getTime() + durationMs);
    }

    setEvents(events.map((e) => (e.id === eventId ? { ...e, startsAt: newStart, endsAt: newEnd } : e)));

    try {
      const res = await fetch('/api/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          startsAt: newStart.toISOString(),
          endsAt: newEnd ? newEnd.toISOString() : null
        })
      });

      if (!res.ok) throw new Error('Update failed');

      showToastWithUndo(`Event moved to ${newDay}`, async () => {
        setEvents(events.map((e) => (e.id === eventId ? originalEvent : e)));

        await fetch('/api/schedule', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: eventId,
            startsAt: new Date(originalEvent.startsAt).toISOString(),
            endsAt: originalEvent.endsAt ? new Date(originalEvent.endsAt).toISOString() : null
          })
        });

        showToast('Move undone', 'info');
      });
    } catch (error) {
      setEvents(events.map((e) => (e.id === eventId ? originalEvent : e)));
      showToast('Failed to move event', 'error');
    }
  };

  const handleQuickAdd = async () => {
    if (quickAddModal === 'chore') {
      const choreTitle = newItem.choreTemplate === 'CUSTOM' ? newItem.title.trim() : newItem.choreTemplate;
      if (!choreTitle) {
        showToast('Please enter a title', 'error');
        return;
      }

      try {
        const chorePayload = {
          title: choreTitle,
          assignedTo: newItem.availableToAll ? 'All Members' : newItem.assignedTo || 'Unassigned',
          dueDay: newItem.day,
          isRecurring: newItem.frequency !== 'ONCE',
          recurrencePattern: newItem.frequency !== 'ONCE' ? newItem.frequency : null,
          recurrenceInterval: newItem.frequency !== 'ONCE' ? 1 : null
        };

        const res = await fetch('/api/chores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chorePayload)
        });

        if (!res.ok) throw new Error('Failed to create chore');

        showToast('Chore added!');
        setQuickAddModal(null);
        setNewItem((p) => ({
          ...p,
          title: '',
          assignedTo: '',
          day: 'Monday',
          choreTemplate: 'Clean Bedroom',
          availableToAll: true,
          frequency: 'ONCE'
        }));
        fetchData();
      } catch (error) {
        showToast('Failed to add chore', 'error');
      }
      return;
    }

    // Event quick add
    const title = newItem.title.trim();
    if (!title) {
      showToast('Please enter an event name', 'error');
      return;
    }

    const weekDates = getWeekDates(weekOffset);
    const dayData = weekDates.find((d) => d.day === newItem.day);
    if (!dayData) {
      showToast('Invalid day selected', 'error');
      return;
    }

    const startMin = timeToMinutes(newItem.startTime);
    if (startMin === null) {
      showToast('Start time is required', 'error');
      return;
    }

    const startsAt = new Date(dayData.date);
    startsAt.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);

    let endsAt = null;
    const endMin = timeToMinutes(newItem.endTime);
    if (endMin !== null) {
      endsAt = new Date(dayData.date);
      endsAt.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
      if (endsAt <= startsAt) {
        showToast('End time must be after start time', 'error');
        return;
      }
    }

    try {
      const payload = {
        type: 'EVENT',
        category: newItem.category,
        title,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt ? endsAt.toISOString() : null,
        location: newItem.location?.trim() || null,
        description: newItem.description?.trim() || null
      };

      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create event');

      showToast('Event added!');
      setQuickAddModal(null);
      setNewItem((p) => ({
        ...p,
        title: '',
        day: 'Monday',
        category: EVENT_CATEGORIES[0],
        startTime: '09:00',
        endTime: '',
        location: '',
        description: ''
      }));
      fetchData();
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Failed to add event', 'error');
    }
  };

  const handleEventEdit = async () => {
    if (!editModal?.title?.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }

    try {
      const res = await fetch('/api/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editModal.id,
          title: editModal.title,
          category: editModal.category ?? null,
          location: editModal.location ?? null,
          description: editModal.description ?? null,
          startsAt: editModal.startsAt ? new Date(editModal.startsAt).toISOString() : undefined,
          endsAt: editModal.endsAt ? new Date(editModal.endsAt).toISOString() : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update');

      showToast('Event updated!');
      setEditModal(null);
      fetchData();
    } catch (error) {
      showToast(error.message || 'Failed to update event', 'error');
    }
  };

  // Filter chores by selected member
  const filteredChores = selectedMember ? chores.filter((c) => c.assignedTo === selectedMember) : chores;

  const weekDates = getWeekDates(weekOffset);

  const boardDays = weekDates.map((day) => {
    const dayEvents = events.filter((item) => toDayName(item.startsAt) === day.day);
    const dayChores = filteredChores.filter((item) => item.dueDay === day.day);

    const completedCount = dayChores.filter((c) => c.completed).length;
    const totalCount = dayChores.length;

    return {
      day: day.day,
      date: day.dateLabel,
      events: dayEvents,
      chores: dayChores,
      progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      completedCount,
      totalCount
    };
  });

  // Member stats
  const memberStats = members.map((member) => {
    const memberChores = chores.filter((c) => c.assignedTo === member.name);
    const completed = memberChores.filter((c) => c.completed).length;
    const total = memberChores.length;
    return { ...member, completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  });

  const weekLabel =
    weekOffset === 0
      ? 'This Week'
      : weekOffset === 1
      ? 'Next Week'
      : weekOffset === -1
      ? 'Last Week'
      : weekOffset > 0
      ? `${weekOffset} weeks ahead`
      : `${Math.abs(weekOffset)} weeks ago`;

  return (
    <main style={styles.main}>
      <section style={styles.hero}>
        <p style={styles.badge}>Deployed with Vercel</p>
        <h1 style={styles.title}>Family Planner</h1>
        <p style={styles.subtitle}>Track chores and events in one place.</p>
      </section>

      <section style={styles.controls}>
        <div style={styles.weekNav}>
          <button onClick={() => setWeekOffset(weekOffset - 1)} style={styles.navButton}>
            ← Previous
          </button>
          <span style={styles.weekLabel}>{weekLabel}</span>
          <button onClick={() => setWeekOffset(weekOffset + 1)} style={styles.navButton}>
            Next →
          </button>
        </div>

        {members.length > 0 && (
          <div style={styles.memberFilter}>
            <button
              onClick={() => setSelectedMember(null)}
              style={{
                ...styles.memberFilterBtn,
                background: !selectedMember ? '#3f2d1d' : 'rgba(255, 255, 255, 0.6)',
                color: !selectedMember ? 'white' : '#3f2d1d'
              }}
            >
              All
            </button>
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member.name)}
                style={{
                  ...styles.memberFilterBtn,
                  background: selectedMember === member.name ? member.color : 'rgba(255, 255, 255, 0.6)',
                  color: selectedMember === member.name ? 'white' : '#3f2d1d',
                  border: `2px solid ${member.color}`
                }}
              >
                {member.avatar} {member.name}
              </button>
            ))}
          </div>
        )}

        {members.length > 0 && !selectedMember && (
          <div style={styles.statsGrid}>
            {memberStats.map((stat) => (
              <div key={stat.id} style={styles.statCard}>
                <div style={{ ...styles.statAvatar, background: stat.color }}>{stat.avatar}</div>
                <div style={styles.statInfo}>
                  <div style={styles.statName}>{stat.name}</div>
                  <div style={styles.statProgress}>
                    {stat.completed}/{stat.total} done ({stat.percentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.quickActions}>
          <QuickAddButton onClick={() => setQuickAddModal('chore')} icon="+" label="Add Chore" color="#c9f7a5" />
          <QuickAddButton onClick={() => setQuickAddModal('event')} icon="+" label="Add Event" color="#ffd9a8" />
        </div>
      </section>

      {loading && <div style={styles.loading}>Loading...</div>}

      {!loading && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <section style={styles.weekWrapper}>
            <div style={styles.weekGrid} className="week-grid">
              {boardDays.map((day, index) => (
                <DroppableDay
                  key={day.day}
                  id={day.day}
                  style={{
                    ...styles.card,
                    background: noteColors[index % noteColors.length],
                    transform: noteRotations[index % noteRotations.length]
                  }}
                >
                  <div style={styles.dayHeader}>
                    <h2 style={styles.dayTitle}>{day.day}</h2>
                    <p style={styles.dayDate}>{day.date}</p>
                    {day.totalCount > 0 && (
                      <div style={styles.progressBadge}>
                        {day.completedCount}/{day.totalCount} done
                      </div>
                    )}
                  </div>

                  {/* Work Hours Section */}
                  {members.some(m => m.workingHours && m.workingHours.trim()) && (
                    <div style={styles.sectionBlock}>
                      <p style={styles.label}>🕐 Work Hours</p>
                      <div style={styles.workHoursList}>
                        {members
                          .filter(m => m.workingHours && m.workingHours.trim())
                          .map(member => {
                            const workHours = parseWorkingHours(member.workingHours);
                            if (!workHours) return null;
                            return (
                              <div
                                key={member.id}
                                style={{
                                  ...styles.workHourBlock,
                                  borderLeft: `3px solid ${member.color || '#888'}`,
                                  background: `${member.color || '#888'}15`
                                }}
                              >
                                <span style={styles.workHourAvatar}>{member.avatar}</span>
                                <div style={styles.workHourInfo}>
                                  <span style={styles.workHourName}>{member.name}</span>
                                  <span style={styles.workHourTime}>{workHours}</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  <div style={styles.sectionBlock}>
                    <p style={styles.label}>Events</p>
                    {day.events.length > 0 ? (
                      <ul style={styles.eventList}>
                        {day.events.map((event) => {
                          const category = getEventCategory(event.type || 'PERSONAL');
                          return (
                            <DraggableItem
                              key={event.id}
                              id={event.id}
                              type="event"
                              data={{
                                originalDay: day.day,
                                originalEvent: event
                              }}
                              style={{
                                ...styles.eventItem,
                                background: `linear-gradient(135deg, ${category.lightColor} 0%, ${category.lightColor}dd 100%)`,
                                borderLeft: `4px solid ${category.darkColor}`
                              }}
                            >
                              <div style={styles.eventContent}>
                                <div style={styles.eventHeader}>
                                  <span style={styles.eventIcon}>{category.icon}</span>
                                  <span
                                    style={styles.eventTitle}
                                    onClick={() => setEditModal(event)}
                                  >
                                    {event.title}
                                  </span>
                                  <button
                                    onClick={() => deleteEvent(event.id)}
                                    style={styles.miniDeleteBtn}
                                  >
                                    ×
                                  </button>
                                </div>
                                {event.startsAt && (
                                  <div style={styles.eventMeta}>
                                    <span style={styles.eventTime}>
                                      {formatTimeRange(event.startsAt, event.endsAt)}
                                    </span>
                                    {event.category && (
                                      <span style={styles.eventBadge}>{event.category}</span>
                                    )}
                                  </div>
                                )}
                                {event.location && (
                                  <div style={styles.eventLocation}>
                                    📍 {event.location}
                                  </div>
                                )}
                              </div>
                            </DraggableItem>
                          );
                        })}
                      </ul>
                    ) : (
                      <p style={styles.noItems}>No events</p>
                    )}
                  </div>

                  <div style={styles.sectionBlock}>
                    <p style={styles.label}>Chores ({day.chores.length})</p>
                    {day.chores.length > 0 ? (
                      <ul style={styles.choreList}>
                        {day.chores.map((chore) => {
                          const memberColor = getMemberColor(chore.assignedTo);
                          return (
                            <DraggableItem
                              key={chore.id}
                              id={chore.id}
                              type="chore"
                              data={{
                                originalDay: day.day,
                                originalChore: chore
                              }}
                              style={{
                                ...styles.choreItem,
                                background: chore.completed
                                  ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9dd 100%)'
                                  : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.5) 100%)',
                                borderLeft: `4px solid ${chore.completed ? '#66bb6a' : memberColor}`,
                                opacity: chore.completed ? 0.85 : 1
                              }}
                            >
                              <label style={styles.choreLabel}>
                                <input
                                  type="checkbox"
                                  checked={chore.completed}
                                  onChange={() => toggleChoreCompletion(chore)}
                                  style={styles.checkbox}
                                />
                                <span style={styles.choreIcon}>
                                  {chore.completed ? '✓' : '○'}
                                </span>
                                <span style={{
                                  ...styles.choreText,
                                  textDecoration: chore.completed ? 'line-through' : 'none',
                                  opacity: chore.completed ? 0.7 : 1,
                                  fontWeight: chore.completed ? 400 : 600
                                }}>
                                  {chore.title}
                                </span>
                              </label>
                              <div style={styles.choreActions}>
                                <span
                                  style={{
                                    ...styles.assignee,
                                    background: `${memberColor}22`,
                                    color: memberColor,
                                    border: `1.5px solid ${memberColor}`,
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: 6,
                                    fontSize: '0.7rem',
                                    fontWeight: 700
                                  }}
                                >
                                  {chore.assignedTo}
                                </span>
                                <button
                                  onClick={() => deleteChore(chore.id)}
                                  style={styles.deleteBtn}
                                  aria-label="Delete chore"
                                >
                                  ×
                                </button>
                              </div>
                            </DraggableItem>
                          );
                        })}
                      </ul>
                    ) : (
                      <p style={styles.noChores}>No chores</p>
                    )}
                  </div>
                </DroppableDay>
              ))}
            </div>
          </section>

          <DragOverlay>
            {activeItem && (
              <div
                style={{
                  ...styles.card,
                  background: noteColors[0],
                  transform: 'rotate(2deg)',
                  opacity: 0.9,
                  cursor: 'grabbing',
                  boxShadow: '0 20px 40px rgba(70, 45, 11, 0.4)',
                  padding: '0.75rem',
                  minHeight: 'auto'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {activeItem.originalChore?.title || activeItem.originalEvent?.title || 'Moving...'}
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {quickAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setQuickAddModal(null)}
          title={`Quick Add ${quickAddModal === 'chore' ? 'Chore' : 'Event'}`}
          size="small"
        >
          <div style={styles.modalForm}>
            {quickAddModal === 'chore' ? (
              <>
                <label style={styles.modalLabel}>Standard Chore</label>
                <select
                  style={styles.modalInput}
                  value={newItem.choreTemplate}
                  onChange={(e) => setNewItem({ ...newItem, choreTemplate: e.target.value })}
                >
                  {defaultChoreTemplates.map((chore) => (
                    <option key={chore} value={chore}>
                      {chore}
                    </option>
                  ))}
                  <option value="CUSTOM">Custom chore...</option>
                </select>

                {newItem.choreTemplate === 'CUSTOM' && (
                  <>
                    <label style={styles.modalLabel}>Custom Chore Title</label>
                    <input
                      style={styles.modalInput}
                      placeholder="Enter custom chore title..."
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      autoFocus
                    />
                  </>
                )}

                <label style={styles.modalLabel}>Availability</label>
                <select
                  style={styles.modalInput}
                  value={newItem.availableToAll ? 'all' : 'one'}
                  onChange={(e) => setNewItem({ ...newItem, availableToAll: e.target.value === 'all' })}
                >
                  <option value="all">Available to all members</option>
                  <option value="one">Assign to one member</option>
                </select>

                {!newItem.availableToAll && (
                  <>
                    <label style={styles.modalLabel}>Assign To</label>
                    {members.length > 0 ? (
                      <select
                        style={styles.modalInput}
                        value={newItem.assignedTo}
                        onChange={(e) => setNewItem({ ...newItem, assignedTo: e.target.value })}
                      >
                        <option value="">Select member...</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.name}>
                            {member.avatar} {member.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        style={styles.modalInput}
                        placeholder="Name"
                        value={newItem.assignedTo}
                        onChange={(e) => setNewItem({ ...newItem, assignedTo: e.target.value })}
                      />
                    )}
                  </>
                )}

                <label style={styles.modalLabel}>Frequency</label>
                <select
                  style={styles.modalInput}
                  value={newItem.frequency}
                  onChange={(e) => setNewItem({ ...newItem, frequency: e.target.value })}
                >
                  <option value="ONCE">One-time</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </>
            ) : (
              <>
                <label style={styles.modalLabel}>Category</label>
                <select
                  style={styles.modalInput}
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <label style={styles.modalLabel}>Event Name</label>
                <input
                  style={styles.modalInput}
                  placeholder="Ex: Noah - Dentist"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  autoFocus
                />

                <label style={styles.modalLabel}>Start Time</label>
                <input
                  type="time"
                  style={styles.modalInput}
                  value={newItem.startTime}
                  onChange={(e) => setNewItem({ ...newItem, startTime: e.target.value })}
                />

                <label style={styles.modalLabel}>End Time (optional)</label>
                <input
                  type="time"
                  style={styles.modalInput}
                  value={newItem.endTime}
                  onChange={(e) => setNewItem({ ...newItem, endTime: e.target.value })}
                />

                <label style={styles.modalLabel}>Location (optional)</label>
                <input
                  style={styles.modalInput}
                  placeholder="Ex: Rome Family Dental"
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                />

                <label style={styles.modalLabel}>Notes (optional)</label>
                <textarea
                  style={{ ...styles.modalInput, minHeight: 80 }}
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
              </>
            )}

            <label style={styles.modalLabel}>Day</label>
            <select
              style={styles.modalInput}
              value={newItem.day}
              onChange={(e) => setNewItem({ ...newItem, day: e.target.value })}
            >
              {DAY_NAMES.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>

            <button onClick={handleQuickAdd} style={styles.modalButton}>
              Add {quickAddModal === 'chore' ? 'Chore' : 'Event'}
            </button>
          </div>
        </Modal>
      )}

      {editModal && (
        <Modal isOpen={true} onClose={() => setEditModal(null)} title="Edit Event" size="small">
          <div style={styles.modalForm}>
            <label style={styles.modalLabel}>Category</label>
            <select
              style={styles.modalInput}
              value={editModal.category || EVENT_CATEGORIES[0]}
              onChange={(e) => setEditModal({ ...editModal, category: e.target.value })}
            >
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label style={styles.modalLabel}>Event Name</label>
            <input
              style={styles.modalInput}
              value={editModal.title}
              onChange={(e) => setEditModal({ ...editModal, title: e.target.value })}
              placeholder="Enter event title..."
              autoFocus
            />

            <label style={styles.modalLabel}>Start</label>
            <input
              type="datetime-local"
              style={styles.modalInput}
              value={(() => {
                const d = new Date(editModal.startsAt);
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
              })()}
              onChange={(e) => setEditModal({ ...editModal, startsAt: e.target.value })}
            />

            <label style={styles.modalLabel}>End (optional)</label>
            <input
              type="datetime-local"
              style={styles.modalInput}
              value={
                editModal.endsAt
                  ? (() => {
                      const d = new Date(editModal.endsAt);
                      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                    })()
                  : ''
              }
              onChange={(e) => setEditModal({ ...editModal, endsAt: e.target.value })}
            />

            <label style={styles.modalLabel}>Location (optional)</label>
            <input
              style={styles.modalInput}
              value={editModal.location || ''}
              onChange={(e) => setEditModal({ ...editModal, location: e.target.value })}
            />

            <label style={styles.modalLabel}>Notes (optional)</label>
            <textarea
              style={{ ...styles.modalInput, minHeight: '80px' }}
              value={editModal.description || ''}
              onChange={(e) => setEditModal({ ...editModal, description: e.target.value })}
            />

            <button onClick={handleEventEdit} style={styles.modalButton}>
              Update Event
            </button>

            <button
              onClick={() => deleteEvent(editModal.id)}
              style={{ ...styles.modalButton, background: 'rgba(186, 62, 62, 0.14)', color: '#8b1f1f', border: '1px solid rgba(186, 62, 62, 0.55)' }}
            >
              Delete Event
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onClose={() => setToast(null)}
          duration={toast.action ? 5000 : 3000}
        />
      )}
    </main>
  );
}

const styles = {
  // keep your existing styles, with only event UI tweaks added:
  main: {
    height: '100vh',
    padding: '1.5rem 1.5rem 1rem 1.5rem',
    overflow: 'auto',
    backgroundColor: '#f4e3bf',
    backgroundImage:
      'radial-gradient(circle at 25% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.22), transparent 45%)',
    color: '#3f2d1d'
  },
  hero: {
    maxWidth: 780,
    margin: '0 auto 1rem auto',
    textAlign: 'center',
    background: '#ffef7d',
    padding: '1rem 1rem',
    borderRadius: 10,
    boxShadow: '0 14px 24px rgba(102, 68, 18, 0.2)',
    border: '1px solid rgba(105, 67, 16, 0.18)',
    transform: 'rotate(-1deg)'
  },
  badge: {
    display: 'inline-block',
    marginBottom: '0.5rem',
    padding: '0.25rem 0.75rem',
    borderRadius: 9999,
    background: 'rgba(132, 94, 42, 0.16)',
    color: '#52351d',
    fontSize: '0.85rem'
  },
  title: { margin: 0, fontSize: 'clamp(1.4rem, 5vw, 2rem)', letterSpacing: '0.01em' },
  subtitle: { marginTop: '0.4rem', lineHeight: 1.5, maxWidth: 620, marginInline: 'auto' },

  controls: { maxWidth: 980, margin: '0 auto 0.75rem auto', display: 'flex', flexDirection: 'column', gap: '1rem' },
  weekNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    background: 'rgba(255, 255, 255, 0.6)',
    padding: '0.75rem 1rem',
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.2)'
  },
  navButton: {
    padding: '0.5rem 1rem',
    borderRadius: 6,
    border: '1px solid rgba(98, 73, 24, 0.24)',
    background: '#fff59d',
    color: '#3f2d1d',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  weekLabel: { fontWeight: 700, fontSize: '1.1rem', minWidth: '150px', textAlign: 'center' },

  memberFilter: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.2)'
  },
  memberFilterBtn: {
    padding: '0.5rem 1rem',
    borderRadius: 9999,
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    transition: 'all 0.2s ease'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.75rem',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.2)'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 8,
    border: '1px solid rgba(98, 73, 24, 0.15)'
  },
  statAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    border: '2px solid rgba(255, 255, 255, 0.8)'
  },
  statInfo: {
    flex: 1
  },
  statName: {
    fontWeight: 700,
    fontSize: '0.9rem',
    marginBottom: '0.2rem'
  },
  statProgress: {
    fontSize: '0.75rem',
    opacity: 0.8
  },
  quickActions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  weekWrapper: {
    maxWidth: 980,
    margin: '0 auto',
    overflowX: 'auto',
    paddingBottom: '0.5rem'
  },
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(180px, 1fr))',
    gap: '1rem',
    minWidth: 1280
  },
  card: {
    padding: '0.75rem',
    borderRadius: 6,
    border: '1px solid rgba(98, 73, 24, 0.2)',
    boxShadow: '0 10px 20px rgba(70, 45, 11, 0.2)',
    transition: 'transform 120ms ease',
    transformOrigin: 'center top',
    minHeight: 'auto',
    height: 'fit-content'
  },
  dayHeader: {
    marginBottom: '0.85rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px dashed rgba(98, 73, 24, 0.4)'
  },
  dayTitle: {
    margin: 0,
    fontSize: '1.15rem'
  },
  dayDate: {
    fontSize: '0.85rem',
    opacity: 0.8,
    margin: '0.2rem 0'
  },
  progressBadge: {
    fontSize: '0.75rem',
    background: 'rgba(63, 152, 76, 0.2)',
    padding: '0.25rem 0.5rem',
    borderRadius: 4,
    display: 'inline-block',
    marginTop: '0.3rem',
    fontWeight: 700
  },
  sectionBlock: {
    marginBottom: '0.9rem'
  },
  label: {
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.3rem',
    fontWeight: 700
  },
  workHoursList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    marginBottom: '0.5rem'
  },
  workHourBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.6rem',
    borderRadius: 6,
    fontSize: '0.8rem',
    opacity: 0.85
  },
  workHourAvatar: {
    fontSize: '1.2rem',
    flexShrink: 0
  },
  workHourInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
    flex: 1
  },
  workHourName: {
    fontWeight: 700,
    fontSize: '0.8rem'
  },
  workHourTime: {
    fontSize: '0.7rem',
    opacity: 0.8,
    fontStyle: 'italic'
  },
  eventList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'grid',
    gap: '0.5rem'
  },
  eventItem: {
    background: 'rgba(255,255,255,0.45)',
    border: '1px solid rgba(98, 73, 24, 0.18)',
    borderRadius: 4,
    padding: '0.45rem 0.5rem',
    fontSize: '0.92rem'
  },
  eventContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem'
  },
  eventHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem'
  },
  eventIcon: {
    fontSize: '1.1rem',
    marginRight: '0.25rem',
    flexShrink: 0
  },
  eventTitle: {
    flex: 1,
    cursor: 'pointer',
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
    fontWeight: 600
  },
  eventMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    fontSize: '0.75rem',
    opacity: 0.9
  },
  eventTime: {
    fontWeight: 700,
    whiteSpace: 'nowrap'
  },
  eventBadge: {
    background: 'rgba(0,0,0,0.08)',
    borderRadius: 4,
    padding: '0.15rem 0.35rem',
    fontSize: '0.7rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.02em'
  },
  eventLocation: {
    fontSize: '0.75rem',
    opacity: 0.85,
    fontStyle: 'italic'
  },
  miniDeleteBtn: {
    background: 'rgba(186, 62, 62, 0.15)',
    border: '1px solid rgba(186, 62, 62, 0.3)',
    borderRadius: 3,
    color: '#8b1f1f',
    cursor: 'pointer',
    fontSize: '1rem',
    lineHeight: 1,
    padding: '0 0.25rem',
    width: '18px',
    height: '18px'
  },
  noItems: {
    fontSize: '0.85rem',
    opacity: 0.6,
    fontStyle: 'italic',
    margin: 0
  },
  choreList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'grid',
    gap: '0.4rem'
  },
  choreItem: {
    background: 'rgba(255,255,255,0.5)',
    border: '1px solid rgba(98, 73, 24, 0.18)',
    borderRadius: 8,
    padding: '0.6rem 0.7rem',
    fontSize: '0.85rem',
    transition: 'all 0.2s ease'
  },
  choreLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    marginBottom: '0.2rem'
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer'
  },
  choreIcon: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#66bb6a',
    marginLeft: '-0.2rem'
  },
  choreText: {
    flex: 1,
    fontSize: '0.9rem'
  },
  choreActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '0.2rem',
    paddingLeft: '1.5rem',
    gap: '0.5rem'
  },
  assignee: {
    fontSize: '0.7rem',
    fontWeight: 700
  },
  deleteBtn: {
    background: 'rgba(186, 62, 62, 0.15)',
    border: '1px solid rgba(186, 62, 62, 0.3)',
    borderRadius: 3,
    color: '#8b1f1f',
    cursor: 'pointer',
    fontSize: '1.2rem',
    lineHeight: 1,
    padding: '0 0.3rem',
    width: '20px',
    height: '20px'
  },
  noChores: {
    fontSize: '0.85rem',
    opacity: 0.6,
    fontStyle: 'italic',
    margin: 0
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1.2rem',
    color: '#5b4228'
  },
  modalForm: {
    display: 'grid',
    gap: '0.75rem'
  },
  modalLabel: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 700,
    color: '#3f2d1d'
  },
  modalInput: {
    width: '100%',
    padding: '0.7rem',
    borderRadius: 6,
    border: '1px solid rgba(98, 73, 24, 0.24)',
    background: 'rgba(255,255,255,0.9)',
    color: '#3f2d1d',
    fontSize: '0.95rem'
  },
  modalButton: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 8,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    background: '#c9f7a5',
    color: '#2b4d1f',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.95rem',
    marginTop: '0.5rem'
  },
  // Compact layout styles
  compactHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: 8,
    marginBottom: '0.5rem'
  },
  navButtonCompact: {
    padding: '0.4rem 0.75rem',
    borderRadius: 6,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '1rem',
    minWidth: '36px'
  },
  weekLabelCompact: {
    fontWeight: 700,
    fontSize: '0.95rem',
    flex: 1,
    textAlign: 'center'
  },
  memberFilterCompact: {
    display: 'flex',
    gap: '0.4rem',
    padding: '0.5rem 0.75rem',
    borderRadius: 8,
    marginBottom: '0.5rem',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  memberFilterBtnCompact: {
    padding: '0.35rem 0.6rem',
    borderRadius: 9999,
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.2s ease'
  },
  iconBtn: {
    padding: '0.35rem 0.6rem',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease'
  }
};
