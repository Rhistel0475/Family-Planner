'use client';

import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { DAY_NAMES } from '../../lib/constants';
import Toast from './Toast';
import Modal from './Modal';
import QuickAddButton from './QuickAddButton';
import DraggableItem from './DraggableItem';
import DroppableDay from './DroppableDay';

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
    type: 'EVENT',
    choreTemplate: 'Clean Bedroom',
    availableToAll: true,
    frequency: 'ONCE'
  });
  const [activeItem, setActiveItem] = useState(null);

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
    const choreTitle = newItem.choreTemplate === 'CUSTOM' ? newItem.title.trim() : newItem.choreTemplate;
    const itemTitle = quickAddModal === 'chore' ? choreTitle : newItem.title.trim();

    if (!itemTitle) {
      showToast('Please enter a title', 'error');
      return;
    }

    try {
      const endpoint = quickAddModal === 'chore' ? '/api/chores' : '/api/schedule';
      const chorePayload = {
        title: itemTitle,
        assignedTo: newItem.availableToAll ? 'All Members' : (newItem.assignedTo || 'Unassigned'),
        dueDay: newItem.day,
        isRecurring: newItem.frequency !== 'ONCE',
        recurrencePattern: newItem.frequency !== 'ONCE' ? newItem.frequency : null,
        recurrenceInterval: newItem.frequency !== 'ONCE' ? 1 : null
      };

      const payload = quickAddModal === 'chore'
        ? chorePayload
        : { title: itemTitle, type: newItem.type, startsAt: new Date(), day: newItem.day, event: itemTitle };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create');

      showToast(`${quickAddModal === 'chore' ? 'Chore' : 'Event'} added!`);
      setQuickAddModal(null);
      setNewItem({
        title: '',
        assignedTo: '',
        day: 'Monday',
        type: 'EVENT',
        choreTemplate: 'Clean Bedroom',
        availableToAll: true,
        frequency: 'ONCE'
      });
      fetchData();
    } catch (error) {
      showToast(`Failed to add ${quickAddModal}`, 'error');
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

  // Filter chores by selected member
  const filteredChores = selectedMember 
    ? chores.filter(c => c.assignedTo === selectedMember)
    : chores;

  const boardDays = weekDates.map((day) => {
    const dayEvents = events.filter((item) => toDayName(item.startsAt) === day.day);
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

  const isCurrentWeek = weekOffset === 0;
  const weekLabel = weekOffset === 0 ? 'This Week' :
    weekOffset === 1 ? 'Next Week' :
    weekOffset === -1 ? 'Last Week' :
    weekOffset > 0 ? `${weekOffset} weeks ahead` : `${Math.abs(weekOffset)} weeks ago`;

  return (
    <main style={styles.main}>
      <section style={styles.hero}>
        <p style={styles.badge}>Deployed with Vercel</p>
        <h1 style={styles.title}>Family Planner</h1>
        <p style={styles.subtitle}>
          Your smart family organizer - track chores, events, and schedules all in one place.
        </p>
      </section>

      {/* Week Navigation */}
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

        {/* Member Filter */}
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
            {members.map(member => (
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

        {/* Member Stats */}
        {members.length > 0 && !selectedMember && (
          <div style={styles.statsGrid}>
            {memberStats.map(stat => (
              <div key={stat.id} style={styles.statCard}>
                <div style={{...styles.statAvatar, background: stat.color}}>
                  {stat.avatar}
                </div>
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
          <QuickAddButton
            onClick={() => setQuickAddModal('chore')}
            icon="+"
            label="Add Chore"
            color="#c9f7a5"
          />
          <QuickAddButton
            onClick={() => setQuickAddModal('event')}
            icon="+"
            label="Add Event"
            color="#ffd9a8"
          />
        </div>
      </section>

      {loading && <div style={styles.loading}>Loading...</div>}

      {!loading && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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

      {/* Quick Add Modal */}
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
                    <option key={chore} value={chore}>{chore}</option>
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
                        {members.map(member => (
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
                <label style={styles.modalLabel}>Event Title</label>
                <input
                  style={styles.modalInput}
                  placeholder="Enter event title..."
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  autoFocus
                />
              </>
            )}

            {quickAddModal === 'event' && (
              <>
                <label style={styles.modalLabel}>Event Type</label>
                <select
                  style={styles.modalInput}
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                >
                  <option value="EVENT">Personal Event</option>
                  <option value="WORK">Work</option>
                </select>
              </>
            )}

            <label style={styles.modalLabel}>Day</label>
            <select
              style={styles.modalInput}
              value={newItem.day}
              onChange={(e) => setNewItem({ ...newItem, day: e.target.value })}
            >
              {DAY_NAMES.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>

            <button onClick={handleQuickAdd} style={styles.modalButton}>
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
            <label style={styles.modalLabel}>Event Title</label>
            <input
              style={styles.modalInput}
              value={editModal.title}
              onChange={(e) => setEditModal({ ...editModal, title: e.target.value })}
            />

            <label style={styles.modalLabel}>Type</label>
            <select
              style={styles.modalInput}
              value={editModal.type}
              onChange={(e) => setEditModal({ ...editModal, type: e.target.value })}
            >
              <option value="EVENT">Personal Event</option>
              <option value="WORK">Work</option>
            </select>

            <label style={styles.modalLabel}>Description</label>
            <textarea
              style={{...styles.modalInput, minHeight: '80px'}}
              value={editModal.description || ''}
              onChange={(e) => setEditModal({ ...editModal, description: e.target.value })}
              placeholder="Optional description..."
            />

            <button onClick={handleEventEdit} style={styles.modalButton}>
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
    padding: '1.2rem',
    borderRadius: 6,
    border: '1px solid rgba(98, 73, 24, 0.2)',
    boxShadow: '0 10px 20px rgba(70, 45, 11, 0.2)',
    transition: 'transform 120ms ease',
    transformOrigin: 'center top',
    minHeight: 380
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
  }
};
