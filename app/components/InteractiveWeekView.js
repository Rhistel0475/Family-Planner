'use client';

import { useState, useEffect, useCallback } from 'react';
import { DAY_NAMES } from '../../lib/constants';
import Toast from './Toast';
import Modal from './Modal';
import QuickAddButton from './QuickAddButton';

export default function InteractiveWeekView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState([]);
  const [chores, setChores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [quickAddModal, setQuickAddModal] = useState(null);
  const [newItem, setNewItem] = useState({ title: '', assignedTo: '', day: 'Monday' });

  const noteColors = ['#fff59d', '#ffd9a8', '#c9f7a5', '#ffd6e7'];
  const noteRotations = ['rotate(-1deg)', 'rotate(0.8deg)', 'rotate(-0.6deg)', 'rotate(0.6deg)'];

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

      const [eventsRes, choresRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/chores')
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
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

  const handleQuickAdd = async () => {
    if (!newItem.title.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }

    try {
      const endpoint = quickAddModal === 'chore' ? '/api/chores' : '/api/schedule';
      const payload = quickAddModal === 'chore'
        ? { title: newItem.title, assignedTo: newItem.assignedTo || 'Unassigned', dueDay: newItem.day }
        : { title: newItem.title, type: 'EVENT', startsAt: new Date(), day: newItem.day };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create');

      showToast(`${quickAddModal === 'chore' ? 'Chore' : 'Event'} added!`);
      setQuickAddModal(null);
      setNewItem({ title: '', assignedTo: '', day: 'Monday' });
      fetchData();
    } catch (error) {
      showToast(`Failed to add ${quickAddModal}`, 'error');
    }
  };

  const weekDates = getWeekDates(weekOffset);
  const toDayName = (date) => {
    const dayIndex = new Date(date).getDay();
    return DAY_NAMES[(dayIndex + 6) % 7];
  };

  const boardDays = weekDates.map((day) => {
    const dayEvents = events.filter((item) => toDayName(item.startsAt) === day.day);
    const dayChores = chores.filter((item) => item.dueDay === day.day);
    const workItems = dayEvents.filter((item) => item.type === 'WORK').map((item) => item.title);
    const eventItems = dayEvents.filter((item) => item.type === 'EVENT').map((item) => item.title);

    const completedCount = dayChores.filter(c => c.completed).length;
    const totalCount = dayChores.length;

    return {
      day: day.day,
      date: day.dateLabel,
      workSchedule: workItems[0] || 'Not set',
      events: eventItems.length > 0 ? eventItems : ['No events'],
      chores: dayChores,
      progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      completedCount,
      totalCount
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

      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : (
        <section style={styles.weekWrapper}>
          <div style={styles.weekGrid}>
            {boardDays.map((day, index) => (
              <article
                key={day.day}
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
                  <p>{day.workSchedule}</p>
                </div>

                <div style={styles.sectionBlock}>
                  <p style={styles.label}>Events</p>
                  <ul style={styles.eventList}>
                    {day.events.map((event, i) => (
                      <li key={i} style={styles.eventItem}>
                        {event}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={styles.sectionBlock}>
                  <p style={styles.label}>Chores ({day.chores.length})</p>
                  {day.chores.length > 0 ? (
                    <ul style={styles.choreList}>
                      {day.chores.map((chore) => (
                        <li key={chore.id} style={styles.choreItem}>
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
                            <span style={styles.assignee}>{chore.assignedTo}</span>
                            <button
                              onClick={() => deleteChore(chore.id)}
                              style={styles.deleteBtn}
                              aria-label="Delete chore"
                            >
                              ×
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={styles.noChores}>No chores</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
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
            <label style={styles.modalLabel}>
              {quickAddModal === 'chore' ? 'Chore' : 'Event'} Title
            </label>
            <input
              style={styles.modalInput}
              placeholder={`Enter ${quickAddModal} title...`}
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              autoFocus
            />

            {quickAddModal === 'chore' && (
              <>
                <label style={styles.modalLabel}>Assigned To</label>
                <input
                  style={styles.modalInput}
                  placeholder="Name"
                  value={newItem.assignedTo}
                  onChange={(e) => setNewItem({ ...newItem, assignedTo: e.target.value })}
                />
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

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
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
    paddingLeft: '1.5rem'
  },
  assignee: {
    fontSize: '0.75rem',
    opacity: 0.7,
    fontStyle: 'italic'
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
    fontStyle: 'italic'
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
