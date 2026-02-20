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
import { createSmartTaskInstances } from '../../lib/smartAssignment';
import { PREDEFINED_CHORES } from '../../lib/boardChores';
import { parseWorkingHours, format24hTo12h } from '../../lib/workingHoursUtils';
import { getInitials, getAvatarStyle } from '../../lib/avatarUtils';
import MemberAvatar from './MemberAvatar';
import { useTheme } from '../providers/ThemeProvider';

// Must match Prisma EventCategory enum: GENERAL, FAMILY, CHURCH, SCHOOL, SPORTS, BIRTHDAY, APPOINTMENT
const EVENT_CATEGORIES = [
  { label: 'Doctor/Dentist Appointment', value: 'APPOINTMENT' },
  { label: 'School Event', value: 'SCHOOL' },
  { label: 'Church', value: 'CHURCH' },
  { label: 'Family Event', value: 'FAMILY' },
  { label: 'Birthday', value: 'BIRTHDAY' },
  { label: 'Sports / Practice', value: 'SPORTS' },
  { label: 'Meeting / Other', value: 'GENERAL' }
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

export default function InteractiveWeekView() {
  const { theme } = useTheme();
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState([]);
  const [chores, setChores] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [quickAddModal, setQuickAddModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    searchQuery: '',
    statusFilter: 'all',
    typeFilter: 'all'
  });

  const [newItem, setNewItem] = useState({
    // For chores:
    title: '',
    assignedTo: '',
    day: 'Monday',
    choreTemplate: '',
    choreDescription: '',
    availableToAll: true,
    frequency: 'ONCE',

    // For events:
    category: EVENT_CATEGORIES[0].value,
    startTime: '09:00',
    endTime: '',
    location: '',
    description: ''
  });
  const [activeItem, setActiveItem] = useState(null);
  const [editingChoreId, setEditingChoreId] = useState(null);
  const [boardSettings, setBoardSettings] = useState([]);

  const choreTemplates = boardSettings.length > 0
    ? boardSettings.map((s) => s.title)
    : PREDEFINED_CHORES.map((c) => c.title);

  const noteColors = theme?.card?.bg?.length ? theme.card.bg : ['#fff59d', '#ffd9a8', '#c9f7a5', '#ffd6e7', '#b3e5fc', '#e1bee7', '#ffeaa7'];
  const noteRotations = ['rotate(-1.5deg)', 'rotate(1deg)', 'rotate(-0.8deg)', 'rotate(1.2deg)', 'rotate(-0.5deg)', 'rotate(0.9deg)', 'rotate(-1.1deg)'];
  const pinColors = ['pin-red', 'pin-blue', 'pin-green', 'pin-orange', 'pin-purple', 'pin-teal', 'pin-amber'];

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

      const [eventsRes, choresRes, membersRes, boardRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/chores'),
        fetch('/api/family-members'),
        fetch('/api/chore-board')
      ]);

      if (boardRes.ok) {
        const boardData = await boardRes.json();
        setBoardSettings(Array.isArray(boardData.settings) ? boardData.settings : []);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const filtered = (eventsData.events || []).filter((e) => {
          const d = new Date(e.startsAt);
          return d >= weekStart && d <= weekEnd;
        });

        // Sort by startsAt
        filtered.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
        setEvents(filtered);
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
      setEditingChoreId((id) => (id === choreId ? null : id));
      showToast('Chore deleted');
    } catch (error) {
      showToast('Failed to delete chore', 'error');
    }
  };

  const updateChoreTitle = async (choreId, newTitle) => {
    const t = newTitle?.trim();
    if (!t) return;
    const chore = chores.find((c) => c.id === choreId);
    if (!chore || chore.title === t) {
      setEditingChoreId(null);
      return;
    }
    try {
      const res = await fetch('/api/chores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: choreId, title: t })
      });
      if (!res.ok) throw new Error('Failed to update');
      setChores(chores.map((c) => (c.id === choreId ? { ...c, title: t } : c)));
      showToast('Chore updated');
    } catch (error) {
      showToast('Failed to update chore', 'error');
    } finally {
      setEditingChoreId(null);
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

  const [planWeekLoading, setPlanWeekLoading] = useState(false);

  const handlePlanThisWeek = async () => {
    setPlanWeekLoading(true);
    try {
      const res = await fetch('/api/ai/generate-weekly-chores', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate weekly chores');
      const count = data.created?.length ?? 0;
      showToast(count > 0 ? `Created ${count} chores and assigned them` : data.message || 'Weekly chores generated');
      fetchData();
    } catch (error) {
      showToast(error.message || 'Failed to plan week', 'error');
    } finally {
      setPlanWeekLoading(false);
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
          description: newItem.choreDescription?.trim() || null,
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
          choreTemplate: choreTemplates[0] || 'Clean Bedroom',
          choreDescription: '',
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
        category: EVENT_CATEGORIES[0].value,
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

    const workEvents = dayEvents.filter((e) => e.type === 'WORK');
    const nonWorkEvents = dayEvents.filter((e) => e.type !== 'WORK');

    const dayKey = day.day.toLowerCase();
    const isWeekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(dayKey);
    const syntheticWork = [];
    for (const member of members) {
      const avail = member.availability || {};
      const dayData = avail[dayKey];
      if (dayData?.available === false) continue;
      let times = null;
      if (dayData?.from && dayData?.to) {
        times = { from: dayData.from, to: dayData.to };
      } else {
        const parsed = parseWorkingHours(member.workingHours);
        if (!parsed || !isWeekday) continue;
        times = parsed;
      }
      syntheticWork.push({
        id: `synth-${member.id}-${day.day}`,
        title: `${member.name} - Work`,
        type: 'WORK',
        memberId: member.id,
        memberColor: member.color || '#3b82f6',
        from: times.from,
        to: times.to,
        day: day.day,
        date: day.dateLabel,
        dateObj: day.date,
        isSynthetic: true
      });
    }
    const mergedWorkEvents = [...workEvents, ...syntheticWork];

    const completedCount = dayChores.filter((c) => c.completed).length;
    const totalCount = dayChores.length;

    return {
      day: day.day,
      date: day.dateLabel,
      events: nonWorkEvents,
      workEvents: mergedWorkEvents,
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
    <main style={{ ...styles.main, color: theme?.card?.text ?? styles.main.color }} className="cork-board">
      <section style={{ ...styles.hero, background: theme?.hero?.bg, color: theme?.hero?.text, borderColor: theme?.hero?.border }} className="hero-tape handwritten">
        <h1 style={styles.title}>Family Planner</h1>
        <p style={styles.subtitle}>Track chores and events in one place.</p>
      </section>

      <section style={{ ...styles.controls, background: theme?.controls?.bg, borderColor: theme?.controls?.border }}>
        <div style={styles.weekNav}>
          <button onClick={() => setWeekOffset(weekOffset - 1)} style={{ ...styles.navButton, background: theme?.card?.bg?.[0] ?? theme?.button?.primary, color: theme?.button?.primaryText ?? theme?.card?.text, borderColor: theme?.card?.border }}>
            ← Previous
          </button>
          <span style={styles.weekLabel}>{weekLabel}</span>
          <button onClick={() => setWeekOffset(weekOffset + 1)} style={{ ...styles.navButton, background: theme?.card?.bg?.[0] ?? theme?.button?.primary, color: theme?.button?.primaryText ?? theme?.card?.text, borderColor: theme?.card?.border }}>
            Next →
          </button>
        </div>

        <div style={styles.quickActions}>
          <QuickAddButton
            onClick={handlePlanThisWeek}
            icon="📅"
            label={planWeekLoading ? 'Planning…' : 'Plan This Week'}
            color={theme?.card?.bg?.[1] ?? '#ffd9a8'}
            disabled={planWeekLoading}
          />
          <QuickAddButton onClick={() => setQuickAddModal('chore')} icon="+" label="Add Chore" color={theme?.button?.primary ?? theme?.card?.bg?.[2] ?? '#c9f7a5'} />
          <QuickAddButton onClick={() => setQuickAddModal('event')} icon="+" label="Add Event" color={theme?.card?.bg?.[1] ?? '#ffd9a8'} />
        </div>
      </section>

      {loading && <div style={{ ...styles.loading, color: theme?.loading?.text }}>Loading...</div>}

      {!loading && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <section style={styles.weekWrapper}>
            <div style={styles.weekGrid} className="week-grid">
              {boardDays.map((day, index) => (
                <DroppableDay
                  key={day.day}
                  id={day.day}
                  className={`day-card sticky-note-texture handwritten ${pinColors[index % pinColors.length]}`}
                  style={{
                    ...styles.card,
                    background: noteColors[index % noteColors.length],
                    borderColor: theme?.card?.border,
                    boxShadow: theme?.card?.shadow ? `2px 3px 8px ${theme.card.shadow}, 4px 6px 16px ${theme.card.shadow}` : undefined,
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

                  <div style={styles.sectionBlock}>
                    <p style={styles.label} className="washi-tape washi-work">Work</p>
                    {day.workEvents.length > 0 ? (
                      <ul style={styles.eventList}>
                        {day.workEvents.map((work) => {
                          const category = getEventCategory(work.type || 'WORK');
                          const timeStr = work.isSynthetic
                            ? `${format24hTo12h(work.from)}–${format24hTo12h(work.to)}`
                            : work.startsAt
                            ? formatTimeRange(work.startsAt, work.endsAt)
                            : '';
                          const titleContent = (
                            <>
                              {work.title}
                              {timeStr && (
                                <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: 4 }}>
                                  {timeStr}
                                </span>
                              )}
                            </>
                          );
                          if (work.isSynthetic) {
                            return (
                              <li
                                key={work.id}
                                style={{
                                  ...styles.eventItem,
                                  background: `linear-gradient(135deg, ${category.lightColor} 0%, ${category.lightColor}dd 100%)`,
                                  borderLeft: `4px solid ${work.memberColor || category.darkColor}`
                                }}
                                title="From family profile"
                              >
                                <div style={styles.eventContent}>
                                  <span style={styles.eventIcon}>{category.icon}</span>
                                  <span style={styles.eventTitle}>{titleContent}</span>
                                </div>
                              </li>
                            );
                          }
                          return (
                            <DraggableItem
                              key={work.id}
                              id={work.id}
                              type="work"
                              data={{
                                originalDay: day.day,
                                originalEvent: work
                              }}
                              style={{
                                ...styles.eventItem,
                                background: `linear-gradient(135deg, ${category.lightColor} 0%, ${category.lightColor}dd 100%)`,
                                borderLeft: `4px solid ${category.darkColor}`
                              }}
                            >
                              <div style={styles.eventContent}>
                                <span style={styles.eventIcon}>{category.icon}</span>
                                <span
                                  style={styles.eventTitle}
                                  onClick={() => setEditModal(work)}
                                >
                                  {titleContent}
                                </span>
                                <button
                                  onClick={() => deleteEvent(work.id)}
                                  style={styles.miniDeleteBtn}
                                >
                                  ×
                                </button>
                              </div>
                            </DraggableItem>
                          );
                        })}
                      </ul>
                    ) : (
                      <p style={styles.noItems}>Not set</p>
                    )}
                    {day.totalCount > 0 && <div style={styles.progressBadge}>{day.completedCount}/{day.totalCount} done</div>}
                  </div>

                  <div style={styles.sectionBlock}>
                    <p style={styles.label} className="washi-tape washi-events">Events</p>
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
                            </DraggableItem>
                          );
                        })}
                      </ul>
                    ) : (
                      <p style={styles.noItems}>No events</p>
                    )}
                  </div>

                  <div style={styles.sectionBlock}>
                    <p style={styles.label} className="washi-tape washi-chores">Chores ({day.chores.length})</p>
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
                              <div style={styles.choreRow}>
                                <button
                                  type="button"
                                  onClick={() => toggleChoreCompletion(chore)}
                                  style={{
                                    ...styles.choreIcon,
                                    cursor: 'pointer',
                                    background: 'none',
                                    border: 'none',
                                    padding: 0
                                  }}
                                  aria-label={chore.completed ? 'Mark incomplete' : 'Mark complete'}
                                >
                                  {chore.completed ? '✓' : '○'}
                                </button>
                                {editingChoreId === chore.id ? (
                                  <input
                                    type="text"
                                    defaultValue={chore.title}
                                    autoFocus
                                    onBlur={(e) => updateChoreTitle(chore.id, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.target.blur();
                                      } else if (e.key === 'Escape') {
                                        setEditingChoreId(null);
                                      }
                                    }}
                                    style={styles.choreEditInput}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <span
                                    style={{
                                      ...styles.choreText,
                                      textDecoration: chore.completed ? 'line-through' : 'none',
                                      opacity: chore.completed ? 0.7 : 1,
                                      fontWeight: chore.completed ? 400 : 600
                                    }}
                                    onClick={() => setEditingChoreId(chore.id)}
                                    title="Click to edit"
                                  >
                                    {chore.title}
                                  </span>
                                )}
                                <span style={{ opacity: 0.5, margin: '0 0.25rem' }}>·</span>
                                <span
                                  style={{
                                    ...styles.assignee,
                                    background: `${memberColor}22`,
                                    color: memberColor,
                                    border: `1px solid ${memberColor}`,
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: 4,
                                    fontSize: '0.65rem',
                                    fontWeight: 600
                                  }}
                                >
                                  {chore.assignedTo}
                                </span>
                                {editingChoreId !== chore.id && (
                                  <button
                                    onClick={() => setEditingChoreId(chore.id)}
                                    style={styles.editBtn}
                                    aria-label="Edit chore"
                                    title="Edit name"
                                  >
                                    ✎
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteChore(chore.id)}
                                  style={styles.deleteBtn}
                                  aria-label="Delete chore"
                                >
                                  ×
                                </button>
                              </div>
                              {chore.description && (
                                <div style={styles.choreDescription}>{chore.description}</div>
                              )}
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
                  borderColor: theme?.card?.border,
                  boxShadow: theme?.card?.shadow ? `0 20px 40px ${theme.card.shadow}` : '0 20px 40px rgba(70, 45, 11, 0.4)',
                  transform: 'rotate(2deg)',
                  opacity: 0.9,
                  cursor: 'grabbing',
                  padding: '0.75rem',
                  minHeight: 'auto'
                }}
              >
                <div style={{ fontWeight: 400, fontSize: '0.95rem', fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive" }}>
                  {activeItem.originalChore?.title || activeItem.originalEvent?.title || 'Moving...'}
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {members.length > 0 && (
        <section style={styles.bottomControls}>
          <div style={styles.memberFilter}>
            <button
              onClick={() => setSelectedMember(null)}
              style={{
                ...styles.memberFilterBtn,
                background: !selectedMember ? (theme?.nav?.text ?? '#3f2d1d') : (theme?.controls?.bg ?? 'rgba(255, 255, 255, 0.6)'),
                color: !selectedMember ? (theme?.nav?.bg ?? 'white') : (theme?.card?.text ?? '#3f2d1d')
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
                  background: selectedMember === member.name ? member.color : (theme?.controls?.bg ?? 'rgba(255, 255, 255, 0.6)'),
                  color: selectedMember === member.name ? 'white' : (theme?.card?.text ?? '#3f2d1d'),
                  border: `2px solid ${member.color}`
                }}
              >
                <MemberAvatar
                  name={member.name}
                  color={member.color}
                  style={getAvatarStyle(member.avatar)}
                  size="sm"
                />
                {member.name}
              </button>
            ))}
          </div>

          {!selectedMember && (
            <div style={{ ...styles.statsGrid, background: theme?.controls?.bg, borderColor: theme?.card?.border }}>
              {memberStats.map((stat) => (
                <div key={stat.id} style={{ ...styles.statCard, background: theme?.card?.bg?.[0], borderColor: theme?.card?.border }}>
                  <MemberAvatar
                    name={stat.name}
                    color={stat.color}
                    style={getAvatarStyle(stat.avatar)}
                    size="sm"
                  />
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
        </section>
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
                  value={newItem.choreTemplate || choreTemplates[0] || ''}
                  onChange={(e) => setNewItem({ ...newItem, choreTemplate: e.target.value })}
                >
                  {choreTemplates.map((chore) => (
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

                <label style={styles.modalLabel}>Description (optional)</label>
                <textarea
                  style={{ ...styles.modalInput, minHeight: 60 }}
                  placeholder="e.g. Wipe counters, dishes"
                  value={newItem.choreDescription}
                  onChange={(e) => setNewItem({ ...newItem, choreDescription: e.target.value })}
                  rows={2}
                />

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
                            {getInitials(member.name)} · {member.name}
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
                <CategorySelector
                  label="Event Category"
                  value={newItem.type}
                  onChange={(type) => setNewItem({ ...newItem, type })}
                  required
                />

                <DateTimePicker
                  label="Date & Time"
                  value={newItem.startsAt}
                  onChange={(startsAt) => setNewItem({ ...newItem, startsAt })}
                  includeTime={true}
                  required
                />
                <label style={styles.modalLabel}>Category</label>
                <select
                  style={styles.modalInput}
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
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
value={editModal.category || EVENT_CATEGORIES[0].value}
                  onChange={(e) => setEditModal({ ...editModal, category: e.target.value })}
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
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

            <CategorySelector
              label="Event Category"
              value={editModal.type || 'PERSONAL'}
              onChange={(type) => setEditModal({ ...editModal, type })}
              required
            />

            <DateTimePicker
              label="Date & Time"
              value={editModal.startsAt || new Date()}
              onChange={(startsAt) => setEditModal({ ...editModal, startsAt })}
              includeTime={true}
              required
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
    padding: '1rem 0.75rem 1rem 0.75rem',
    overflow: 'auto',
    color: '#3f2d1d'
  },
  hero: {
    maxWidth: 780,
    margin: '0.75rem auto 0.75rem auto',
    textAlign: 'center',
    background: '#ffef7d',
    padding: '1rem 1.25rem 0.75rem',
    borderRadius: 3,
    boxShadow: '2px 3px 8px rgba(102, 68, 18, 0.2), 4px 6px 16px rgba(102, 68, 18, 0.12)',
    border: '1px solid rgba(105, 67, 16, 0.15)',
    transform: 'rotate(-0.8deg)'
  },
  title: {
    margin: 0,
    fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
    letterSpacing: '0.02em',
    fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive",
    fontWeight: 400
  },
  subtitle: {
    marginTop: '0.3rem',
    lineHeight: 1.4,
    maxWidth: 620,
    marginInline: 'auto',
    fontSize: '0.95rem',
    fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive",
    fontWeight: 400
  },

  controls: { maxWidth: 780, margin: '0 auto 0.5rem auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  bottomControls: { maxWidth: 780, margin: '1rem auto 0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  weekNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    background: 'transparent',
    padding: '0.4rem 0',
    borderRadius: 0,
    border: 'none'
  },
  navButton: {
    padding: '0.4rem 0.9rem',
    borderRadius: 3,
    border: '1px solid rgba(98, 73, 24, 0.2)',
    background: '#fff59d',
    color: '#3f2d1d',
    fontWeight: 400,
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive",
    boxShadow: '1px 2px 4px rgba(70, 45, 11, 0.15)',
    transition: 'all 0.15s ease'
  },
  weekLabel: {
    fontWeight: 400,
    fontSize: '1.1rem',
    minWidth: '140px',
    textAlign: 'center',
    fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive"
  },

  memberFilter: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: '0.3rem 0',
    background: 'transparent',
    borderRadius: 0,
    border: 'none'
  },
  memberFilterBtn: {
    padding: '0.35rem 0.75rem',
    borderRadius: 9999,
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    transition: 'all 0.2s ease'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '0.5rem',
    padding: '0.5rem',
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    border: '1px solid rgba(98, 73, 24, 0.12)'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    background: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 6,
    border: '1px solid rgba(98, 73, 24, 0.1)'
  },
  statAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    border: '2px solid rgba(255, 255, 255, 0.8)'
  },
  statInfo: {
    flex: 1
  },
  statName: {
    fontWeight: 700,
    fontSize: '0.8rem',
    marginBottom: '0.1rem'
  },
  statProgress: {
    fontSize: '0.75rem',
    opacity: 0.8
  },
  quickActions: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
    padding: '0.2rem 0'
  },
  weekWrapper: {
    width: '100%',
    margin: '0 auto',
    paddingBottom: '0.5rem'
  },
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.6rem',
    paddingTop: '0.5rem'
  },
  card: {
    padding: '0.75rem 0.5rem 0.5rem 0.5rem',
    borderRadius: 3,
    border: '1px solid rgba(98, 73, 24, 0.15)',
    boxShadow: '2px 3px 8px rgba(70, 45, 11, 0.2), 4px 6px 16px rgba(70, 45, 11, 0.12)',
    transition: 'transform 120ms ease',
    transformOrigin: 'center top',
    minHeight: 'auto',
    height: 'fit-content',
    marginTop: '10px'
  },
  dayHeader: {
    marginBottom: '0.5rem',
    paddingBottom: '0.35rem',
    borderBottom: '2px dashed rgba(98, 73, 24, 0.25)'
  },
  dayTitle: {
    margin: 0,
    fontSize: '1.05rem',
    fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive",
    fontWeight: 400
  },
  dayDate: {
    fontSize: '0.78rem',
    opacity: 0.75,
    margin: '0.1rem 0',
    fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive",
    fontWeight: 400
  },
  progressBadge: {
    fontSize: '0.72rem',
    background: 'rgba(63, 152, 76, 0.2)',
    padding: '0.15rem 0.4rem',
    borderRadius: 4,
    display: 'inline-block',
    marginTop: '0.3rem',
    fontWeight: 400,
    fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive"
  },
  sectionBlock: {
    marginBottom: '0.6rem'
  },
  label: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.3rem',
    fontWeight: 400
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
    fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive",
    fontWeight: 400
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
    opacity: 0.5,
    fontStyle: 'italic',
    margin: 0,
    fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive",
    fontWeight: 400
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
    padding: '0.4rem 0.5rem',
    fontSize: '0.8rem',
    transition: 'all 0.2s ease'
  },
  choreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    flexWrap: 'wrap'
  },
  choreLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    marginBottom: '0.2rem'
  },
  choreIcon: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#66bb6a',
    marginLeft: '-0.1rem',
    flexShrink: 0
  },
  choreText: {
    flex: 1,
    minWidth: 0,
    fontSize: '0.8rem',
    fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive",
    fontWeight: 400,
    cursor: 'pointer'
  },
  choreEditInput: {
    flex: 1,
    minWidth: 80,
    fontSize: '0.8rem',
    padding: '0.15rem 0.3rem',
    border: '1px solid rgba(98, 73, 24, 0.3)',
    borderRadius: 4,
    fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive"
  },
  choreDescription: {
    fontSize: '0.7rem',
    opacity: 0.75,
    marginTop: '0.2rem',
    marginLeft: '1.2rem',
    fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive"
  },
  assignee: {
    fontSize: '0.65rem',
    fontWeight: 600,
    fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive",
    flexShrink: 0
  },
  editBtn: {
    background: 'rgba(98, 73, 24, 0.1)',
    border: '1px solid rgba(98, 73, 24, 0.2)',
    borderRadius: 3,
    color: '#5b4228',
    cursor: 'pointer',
    fontSize: '0.75rem',
    lineHeight: 1,
    padding: '0.15rem 0.3rem',
    flexShrink: 0
  },
  deleteBtn: {
    background: 'rgba(186, 62, 62, 0.15)',
    border: '1px solid rgba(186, 62, 62, 0.3)',
    borderRadius: 3,
    color: '#8b1f1f',
    cursor: 'pointer',
    fontSize: '1rem',
    lineHeight: 1,
    padding: '0.1rem 0.25rem',
    width: '18px',
    height: '18px',
    flexShrink: 0
  },
  noChores: {
    fontSize: '0.85rem',
    opacity: 0.5,
    fontStyle: 'italic',
    margin: 0,
    fontFamily: "var(--font-handwritten), 'Permanent Marker', cursive",
    fontWeight: 400
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
    fontSize: '0.95rem',
    fontFamily: "'Trebuchet MS', 'Segoe UI', Arial, sans-serif"
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
  },

};

