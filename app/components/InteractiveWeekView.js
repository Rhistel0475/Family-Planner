'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { DAY_NAMES } from '../../lib/constants';
import { useTheme } from '../providers/ThemeProvider';
import { calculateWeeklyStats } from '../../lib/statsUtils';
import { applyAllFilters } from '../../lib/filterUtils';
import { createSmartTaskInstances } from '../../lib/smartAssignment';
import Toast from './Toast';
import Modal from './Modal';
import QuickAddButton from './QuickAddButton';
import DraggableItem from './DraggableItem';
import DroppableDay from './DroppableDay';
import StatsWidget from './StatsWidget';
import FilterBar from './FilterBar';
import SmartTaskModal from './SmartTaskModal';

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
  const [newItem, setNewItem] = useState({ title: '', assignedTo: '', day: 'Monday', type: 'EVENT' });
  const [activeItem, setActiveItem] = useState(null);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    searchQuery: '',
    statusFilter: 'all',
    typeFilter: 'all'
  });

  const noteColors = theme.card.bg;
  const noteRotations = ['rotate(-1deg)', 'rotate(0.8deg)', 'rotate(-0.6deg)', 'rotate(0.6deg)'];

  // Configure drag & drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5
      }
    }),
    useSensor(KeyboardSensor)
  );

  const getWeekDates = useCallback((offset = 0) => {
    const now = new Date();
    const currentDay = now.getDay();
    const daysFromMonday = (currentDay + 6) % 7;

    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - daysFromMonday + (offset * 7));

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const weekDates = getWeekDates(weekOffset);
      const weekStart = new Date(weekDates[0].date);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekDates[6].date);
      weekEnd.setHours(23, 59, 59, 999);

      const [eventsRes, choresRes, membersRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/chores'),
        fetch('/api/family-members')
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const filteredEvents = (eventsData.events || []).filter(e => {
          const eventDate = new Date(e.startsAt);
          return eventDate >= weekStart && eventDate <= weekEnd;
        });
        setEvents(filteredEvents);
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
  }, [weekOffset, getWeekDates]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (message, type = 'success', action = null) => {
    setToast({ message, type, action });
  };

  const showToastWithUndo = (message, undoAction) => {
    setToast({
      message,
      type: 'success',
      action: {
        label: 'Undo',
        onClick: undoAction
      }
    });
  };

  const getMemberColor = (assignedTo) => {
    const member = members.find(m => m.name === assignedTo);
    return member ? member.color : '#94a3b8';
  };

  const toggleChoreCompletion = async (chore) => {
    const newCompleted = !chore.completed;

    // Optimistic update
    setChores(chores.map(c =>
      c.id === chore.id ? { ...c, completed: newCompleted, completedAt: newCompleted ? new Date() : null } : c
    ));

    try {
      const res = await fetch('/api/chores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chore.id, completed: newCompleted })
      });

      if (!res.ok) throw new Error('Failed to update chore');

      showToast(newCompleted ? '✓ Chore completed!' : 'Chore unmarked');
    } catch (error) {
      // Revert on error
      setChores(chores.map(c =>
        c.id === chore.id ? chore : c
      ));
      showToast('Failed to update chore', 'error');
    }
  };

  const deleteChore = async (choreId) => {
    if (!confirm('Delete this chore?')) return;

    try {
      const res = await fetch(`/api/chores?id=${choreId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      setChores(chores.filter(c => c.id !== choreId));
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

      setEvents(events.filter(e => e.id !== eventId));
      showToast('Event deleted');
    } catch (error) {
      showToast('Failed to delete event', 'error');
    }
  };

  const handleQuickAdd = async () => {
    if (!newItem.title.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }

    try {
      const endpoint = quickAddModal === 'chore' ? '/api/chores' : '/api/schedule';
      const payload = quickAddModal === 'chore'
        ? { title: newItem.title, assignedTo: newItem.assignedTo || 'Unassigned', dueDay: newItem.day }
        : { title: newItem.title, type: newItem.type, startsAt: new Date(), day: newItem.day, event: newItem.title };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create');

      showToast(`${quickAddModal === 'chore' ? 'Chore' : 'Event'} added!`);
      setQuickAddModal(null);
      setNewItem({ title: '', assignedTo: '', day: 'Monday', type: 'EVENT' });
      fetchData();
    } catch (error) {
      showToast(`Failed to add ${quickAddModal}`, 'error');
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

  const handleEventEdit = async () => {
    if (!editModal || !editModal.title.trim()) {
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
          type: editModal.type,
          description: editModal.description
        })
      });

      if (!res.ok) throw new Error('Failed to update');

      showToast('Event updated!');
      setEditModal(null);
      fetchData();
    } catch (error) {
      showToast('Failed to update event', 'error');
    }
  };

  // Drag & Drop Handlers
  const vibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
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
    } else if (item.type === 'event' || item.type === 'work') {
      await handleEventDrop(item.id, newDay, item.originalEvent);
    }
  };

  const handleChoreDrop = async (choreId, newDay, originalChore) => {
    const originalDay = originalChore.dueDay;

    setChores(chores.map(c =>
      c.id === choreId ? { ...c, dueDay: newDay } : c
    ));

    try {
      const res = await fetch('/api/chores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: choreId, dueDay: newDay })
      });

      if (!res.ok) throw new Error('Update failed');

      showToastWithUndo(
        `Chore moved to ${newDay}`,
        async () => {
          setChores(chores.map(c =>
            c.id === choreId ? { ...c, dueDay: originalDay } : c
          ));

          await fetch('/api/chores', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: choreId, dueDay: originalDay })
          });

          showToast('Move undone', 'info');
        }
      );
    } catch (error) {
      setChores(chores.map(c =>
        c.id === choreId ? originalChore : c
      ));
      showToast('Failed to move chore', 'error');
    }
  };

  const handleEventDrop = async (eventId, newDay, originalEvent) => {
    const weekDates = getWeekDates(weekOffset);
    const newDayData = weekDates.find(d => d.day === newDay);

    if (!newDayData) return;

    const oldDate = new Date(originalEvent.startsAt);
    const newDate = new Date(newDayData.date);
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);

    setEvents(events.map(e =>
      e.id === eventId ? { ...e, startsAt: newDate } : e
    ));

    try {
      const res = await fetch('/api/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId, startsAt: newDate.toISOString() })
      });

      if (!res.ok) throw new Error('Update failed');

      showToastWithUndo(
        `Event moved to ${newDay}`,
        async () => {
          setEvents(events.map(e =>
            e.id === eventId ? { ...e, startsAt: originalEvent.startsAt } : e
          ));

          await fetch('/api/schedule', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: eventId, startsAt: originalEvent.startsAt })
          });

          showToast('Move undone', 'info');
        }
      );
    } catch (error) {
      setEvents(events.map(e =>
        e.id === eventId ? originalEvent : e
      ));
      showToast('Failed to move event', 'error');
    }
  };

  const weekDates = getWeekDates(weekOffset);
  const toDayName = (date) => {
    const dayIndex = new Date(date).getDay();
    return DAY_NAMES[(dayIndex + 6) % 7];
  };

  // Apply member filter first
  const memberFilteredChores = selectedMember
    ? chores.filter(c => c.assignedTo === selectedMember)
    : chores;

  // Apply search and filter logic
  const { chores: filteredChores, events: filteredEvents } = useMemo(() => {
    return applyAllFilters({
      chores: memberFilteredChores,
      events: events,
      searchQuery: filters.searchQuery,
      statusFilter: filters.statusFilter,
      typeFilter: filters.typeFilter
    });
  }, [memberFilteredChores, events, filters]);

  const boardDays = weekDates.map((day) => {
    const dayEvents = filteredEvents.filter((item) => toDayName(item.startsAt) === day.day);
    const dayChores = filteredChores.filter((item) => item.dueDay === day.day);
    const workItems = dayEvents.filter((item) => item.type === 'WORK');
    const eventItems = dayEvents.filter((item) => item.type === 'EVENT');

    const completedCount = dayChores.filter(c => c.completed).length;
    const totalCount = dayChores.length;

    return {
      day: day.day,
      date: day.dateLabel,
      workEvents: workItems,
      events: eventItems,
      chores: dayChores,
      progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      completedCount,
      totalCount
    };
  });

  // Calculate member statistics
  const memberStats = members.map(member => {
    const memberChores = chores.filter(c => c.assignedTo === member.name);
    const completed = memberChores.filter(c => c.completed).length;
    const total = memberChores.length;
    return {
      ...member,
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });

  // Calculate weekly stats for StatsWidget
  const weeklyStats = useMemo(() => {
    const weekDates = getWeekDates(weekOffset);
    return calculateWeeklyStats(filteredChores, members, weekDates);
  }, [filteredChores, members, weekOffset, getWeekDates]);

  const isCurrentWeek = weekOffset === 0;
  const weekLabel = weekOffset === 0 ? 'This Week' :
    weekOffset === 1 ? 'Next Week' :
    weekOffset === -1 ? 'Last Week' :
    weekOffset > 0 ? `${weekOffset} weeks ahead` : `${Math.abs(weekOffset)} weeks ago`;

  return (
    <main style={{...styles.main, color: theme.card.text, padding: '1rem 1rem 4rem 1rem', minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
      {/* Compact Header: Week Nav + Add Button */}
      <div style={{...styles.compactHeader, background: theme.controls.bg, border: `1px solid ${theme.controls.border}`}}>
        <button onClick={() => setWeekOffset(weekOffset - 1)} style={{...styles.navButtonCompact, background: theme.card.bg[0], color: theme.card.text, border: `1px solid ${theme.card.border}`}}>
          ←
        </button>
        <span style={{...styles.weekLabelCompact, color: theme.card.text}}>{weekLabel}</span>
        <button onClick={() => setWeekOffset(weekOffset + 1)} style={{...styles.navButtonCompact, background: theme.card.bg[0], color: theme.card.text, border: `1px solid ${theme.card.border}`}}>
          →
        </button>
        <div style={{width: '1px', height: '24px', background: theme.card.border, margin: '0 0.5rem'}} />
        <QuickAddButton
          onClick={() => setQuickAddModal('unified')}
          icon="+"
          label="Add Task"
          color={theme.button.primary}
        />
      </div>

      {/* Member Filter - Compact */}
      {members.length > 0 && (
        <div style={{...styles.memberFilterCompact, background: theme.controls.bg, border: `1px solid ${theme.controls.border}`}}>
          <button
            onClick={() => setSelectedMember(null)}
            style={{
              ...styles.memberFilterBtnCompact,
              background: !selectedMember ? theme.card.text : theme.button.secondary,
              color: !selectedMember ? theme.main : theme.card.text
            }}
          >
            All
          </button>
          {members.map(member => (
            <button
              key={member.id}
              onClick={() => setSelectedMember(member.name)}
              style={{
                ...styles.memberFilterBtnCompact,
                background: selectedMember === member.name ? member.color : theme.button.secondary,
                color: selectedMember === member.name ? 'white' : theme.card.text,
                border: `2px solid ${member.color}`
              }}
            >
              {member.avatar}
            </button>
          ))}
          <div style={{marginLeft: 'auto', display: 'flex', gap: '0.25rem'}}>
            <button
              onClick={() => setStatsExpanded(!statsExpanded)}
              style={{...styles.iconBtn, background: theme.button.secondary, color: theme.card.text}}
              title="Toggle Stats"
            >
              📊
            </button>
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              style={{...styles.iconBtn, background: theme.button.secondary, color: theme.card.text}}
              title="Toggle Filters"
            >
              🔍
            </button>
          </div>
        </div>
      )}

        {/* Stats Widget - Collapsible */}
        {statsExpanded && members.length > 0 && !selectedMember && (
          <div style={{marginTop: '0.5rem'}}>
            <StatsWidget
              stats={weeklyStats}
              isExpanded={true}
              onToggle={() => setStatsExpanded(false)}
            />
          </div>
        )}

        {/* Filter Bar - Collapsible */}
        {filtersExpanded && (
          <div style={{marginTop: '0.5rem'}}>
            <FilterBar
              onFilterChange={setFilters}
              initialFilters={filters}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div style={{...styles.loading, color: theme.loading.text}}>Loading...</div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <section style={{...styles.weekWrapper, flex: 1, overflowY: 'auto', overflowX: 'auto', paddingBottom: '0'}}>
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

                  <div style={styles.sectionBlock}>
                    <p style={styles.label}>Work</p>
                    {day.workEvents.length > 0 ? (
                      <ul style={styles.eventList}>
                        {day.workEvents.map((work) => (
                          <DraggableItem
                            key={work.id}
                            id={work.id}
                            type="work"
                            data={{
                              originalDay: day.day,
                              originalEvent: work
                            }}
                            style={styles.eventItem}
                          >
                            <div style={styles.eventContent}>
                              <span>{work.title}</span>
                              <button
                                onClick={() => deleteEvent(work.id)}
                                style={styles.miniDeleteBtn}
                              >
                                ×
                              </button>
                            </div>
                          </DraggableItem>
                        ))}
                      </ul>
                    ) : (
                      <p style={styles.noItems}>Not set</p>
                    )}
                  </div>

                  <div style={styles.sectionBlock}>
                    <p style={styles.label}>Events</p>
                    {day.events.length > 0 ? (
                      <ul style={styles.eventList}>
                        {day.events.map((event) => (
                          <DraggableItem
                            key={event.id}
                            id={event.id}
                            type="event"
                            data={{
                              originalDay: day.day,
                              originalEvent: event
                            }}
                            style={styles.eventItem}
                          >
                            <div style={styles.eventContent}>
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
                        ))}
                      </ul>
                    ) : (
                      <p style={styles.noItems}>No events</p>
                    )}
                  </div>

                  <div style={styles.sectionBlock}>
                    <p style={styles.label}>Chores ({day.chores.length})</p>
                    {day.chores.length > 0 ? (
                      <ul style={styles.choreList}>
                        {day.chores.map((chore) => (
                          <DraggableItem
                            key={chore.id}
                            id={chore.id}
                            type="chore"
                            data={{
                              originalDay: day.day,
                              originalChore: chore
                            }}
                            style={styles.choreItem}
                          >
                            <label style={styles.choreLabel}>
                              <input
                                type="checkbox"
                                checked={chore.completed}
                                onChange={() => toggleChoreCompletion(chore)}
                                style={styles.checkbox}
                              />
                              <span style={{
                                ...styles.choreText,
                                textDecoration: chore.completed ? 'line-through' : 'none',
                                opacity: chore.completed ? 0.6 : 1
                              }}>
                                {chore.title}
                              </span>
                            </label>
                            <div style={styles.choreActions}>
                              <span
                                style={{
                                  ...styles.assignee,
                                  background: `${getMemberColor(chore.assignedTo)}33`,
                                  color: getMemberColor(chore.assignedTo),
                                  border: `1px solid ${getMemberColor(chore.assignedTo)}`,
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: 4,
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
                        ))}
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
              <div style={{
                ...styles.card,
                background: noteColors[0],
                transform: 'rotate(2deg)',
                opacity: 0.9,
                cursor: 'grabbing',
                boxShadow: '0 20px 40px rgba(70, 45, 11, 0.4)',
                padding: '0.75rem',
                minHeight: 'auto'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {activeItem.originalChore?.title || activeItem.originalEvent?.title || 'Moving...'}
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Smart Task Modal */}
      {quickAddModal === 'unified' && (
        <SmartTaskModal
          isOpen={true}
          onClose={() => setQuickAddModal(null)}
          onSubmit={handleSmartTaskSubmit}
          members={members}
        />
      )}

      {/* Legacy Quick Add Modal (for backward compatibility) */}
      {quickAddModal && quickAddModal !== 'unified' && (
        <Modal
          isOpen={true}
          onClose={() => setQuickAddModal(null)}
          title={`Quick Add ${quickAddModal === 'chore' ? 'Chore' : 'Event'}`}
          size="small"
        >
          <div style={styles.modalForm}>
            <label style={{...styles.modalLabel, color: theme.card.text}}>
              {quickAddModal === 'chore' ? 'Chore' : 'Event'} Title
            </label>
            <input
              style={{...styles.modalInput, background: theme.input.bg, color: theme.input.text, border: `1px solid ${theme.input.border}`}}
              placeholder={`Enter ${quickAddModal} title...`}
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              autoFocus
            />

            {quickAddModal === 'chore' && (
              <>
                <label style={{...styles.modalLabel, color: theme.card.text}}>Assign To</label>
                {members.length > 0 ? (
                  <select
                    style={{...styles.modalInput, background: theme.input.bg, color: theme.input.text, border: `1px solid ${theme.input.border}`}}
                    value={newItem.assignedTo}
                    onChange={(e) => setNewItem({ ...newItem, assignedTo: e.target.value })}
                  >
                    <option value="">Select member...</option>
                    {members.map(member => (
                      <option key={member.id} value={member.name}>
                        {member.avatar} {member.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    style={{...styles.modalInput, background: theme.input.bg, color: theme.input.text, border: `1px solid ${theme.input.border}`}}
                    placeholder="Name"
                    value={newItem.assignedTo}
                    onChange={(e) => setNewItem({ ...newItem, assignedTo: e.target.value })}
                  />
                )}
              </>
            )}

            {quickAddModal === 'event' && (
              <>
                <label style={{...styles.modalLabel, color: theme.card.text}}>Event Type</label>
                <select
                  style={{...styles.modalInput, background: theme.input.bg, color: theme.input.text, border: `1px solid ${theme.input.border}`}}
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                >
                  <option value="EVENT">Personal Event</option>
                  <option value="WORK">Work</option>
                </select>
              </>
            )}

            <label style={{...styles.modalLabel, color: theme.card.text}}>Day</label>
            <select
              style={{...styles.modalInput, background: theme.input.bg, color: theme.input.text, border: `1px solid ${theme.input.border}`}}
              value={newItem.day}
              onChange={(e) => setNewItem({ ...newItem, day: e.target.value })}
            >
              {DAY_NAMES.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>

            <button onClick={handleQuickAdd} style={{...styles.modalButton, background: theme.button.primary, color: theme.button.primaryText, border: `1px solid ${theme.card.border}`}}>
              Add {quickAddModal === 'chore' ? 'Chore' : 'Event'}
            </button>
          </div>
        </Modal>
      )}

      {/* Event Edit Modal */}
      {editModal && (
        <Modal
          isOpen={true}
          onClose={() => setEditModal(null)}
          title="Edit Event"
          size="small"
        >
          <div style={styles.modalForm}>
            <label style={{...styles.modalLabel, color: theme.card.text}}>Event Title</label>
            <input
              style={{...styles.modalInput, background: theme.input.bg, color: theme.input.text, border: `1px solid ${theme.input.border}`}}
              value={editModal.title}
              onChange={(e) => setEditModal({ ...editModal, title: e.target.value })}
            />

            <label style={{...styles.modalLabel, color: theme.card.text}}>Type</label>
            <select
              style={{...styles.modalInput, background: theme.input.bg, color: theme.input.text, border: `1px solid ${theme.input.border}`}}
              value={editModal.type}
              onChange={(e) => setEditModal({ ...editModal, type: e.target.value })}
            >
              <option value="EVENT">Personal Event</option>
              <option value="WORK">Work</option>
            </select>

            <label style={{...styles.modalLabel, color: theme.card.text}}>Description</label>
            <textarea
              style={{...styles.modalInput, minHeight: '80px', background: theme.input.bg, color: theme.input.text, border: `1px solid ${theme.input.border}`}}
              value={editModal.description || ''}
              onChange={(e) => setEditModal({ ...editModal, description: e.target.value })}
              placeholder="Optional description..."
            />

            <button onClick={handleEventEdit} style={{...styles.modalButton, background: theme.button.primary, color: theme.button.primaryText, border: `1px solid ${theme.card.border}`}}>
              Update Event
            </button>
          </div>
        </Modal>
      )}

      {/* Toast Notification */}
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
  main: {
    minHeight: '100vh',
    padding: '3rem 1.5rem 5rem 1.5rem',
    backgroundColor: '#f4e3bf',
    backgroundImage:
      'radial-gradient(circle at 25% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.22), transparent 45%)',
    color: '#3f2d1d'
  },
  hero: {
    maxWidth: 780,
    margin: '0 auto 2rem auto',
    textAlign: 'center',
    background: '#ffef7d',
    padding: '1.5rem 1.25rem',
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
  title: {
    margin: 0,
    fontSize: 'clamp(2rem, 7vw, 3rem)',
    letterSpacing: '0.01em'
  },
  subtitle: {
    marginTop: '0.75rem',
    lineHeight: 1.5,
    maxWidth: 620,
    marginInline: 'auto'
  },
  controls: {
    maxWidth: 980,
    margin: '0 auto 1.5rem auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
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
  weekLabel: {
    fontWeight: 700,
    fontSize: '1.1rem',
    minWidth: '150px',
    textAlign: 'center'
  },
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
  eventTitle: {
    flex: 1,
    cursor: 'pointer',
    textDecoration: 'underline',
    textDecorationStyle: 'dotted'
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
    borderRadius: 4,
    padding: '0.4rem 0.5rem',
    fontSize: '0.85rem'
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
