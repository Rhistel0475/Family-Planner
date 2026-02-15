'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function fmtDateTime(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return String(d);
  }
}

export default function SchedulePage({ searchParams }) {
  const formRef = useRef(null);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('WEEKLY');

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const [events, setEvents] = useState([]);

  const initialToast = useMemo(() => {
    const saved = searchParams?.saved === '1';
    const error = searchParams?.error === '1';
    if (saved) return { type: 'success', text: '✓ Saved to schedule.' };
    if (error) return { type: 'error', text: 'Please choose a day and enter an event.' };
    return null;
  }, [searchParams]);

  useEffect(() => {
    if (initialToast) {
      setToast(initialToast);
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [initialToast]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fetchEvents = async () => {
    try {
      setListLoading(true);
      const res = await fetch('/api/schedule', { method: 'GET' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load events');
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', text: e.message || 'Failed to load events' });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const data = {
      day: formData.get('day'),
      event: formData.get('event'),
      eventTime: formData.get('eventTime'), // "HH:MM"
      isRecurring,
      recurrencePattern: isRecurring ? recurrencePattern : null,
      recurrenceInterval: isRecurring ? parseInt(formData.get('interval'), 10) || 1 : null,
      recurrenceEndDate: isRecurring && formData.get('endDate') ? formData.get('endDate') : null
    };

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || 'Unable to save. Please try again.');

      e.target.reset();
      setIsRecurring(false);
      setRecurrencePattern('WEEKLY');

      setToast({ type: 'success', text: result?.message || '✓ Saved to schedule.' });
      setTimeout(() => setToast(null), 2500);

      fetchEvents();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', text: err.message || 'Network error. Please try again.' });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttended = async (evt) => {
    try {
      const res = await fetch('/api/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: evt.id, attended: !evt.attended })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update event');

      setEvents((prev) =>
        prev.map((x) => (x.id === evt.id ? { ...x, attended: !evt.attended } : x))
      );

      setToast({ type: 'success', text: !evt.attended ? 'Marked attended.' : 'Marked not attended.' });
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', text: e.message || 'Failed to update event' });
      setTimeout(() => setToast(null), 3500);
    }
  };

  const deleteEvent = async (evt) => {
    try {
      const res = await fetch('/api/schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: evt.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to delete event');

      setEvents((prev) => prev.filter((x) => x.id !== evt.id));
      setToast({ type: 'success', text: 'Deleted.' });
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', text: e.message || 'Failed to delete event' });
      setTimeout(() => setToast(null), 3500);
    }
  };

  const buckets = useMemo(() => {
    const now = Date.now();
    const list = [...events].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    return {
      upcoming: list.filter((e) => new Date(e.startsAt).getTime() >= now).slice(0, 25),
      past: list.filter((e) => new Date(e.startsAt).getTime() < now).slice(-15).reverse()
    };
  }, [events]);

  return (
    <main style={styles.main}>
      <section style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Calendar</h1>
            <p style={styles.subtitle}>Add events — and see what’s coming up.</p>
          </div>

          <div style={styles.headerActions}>
            <button type="button" style={styles.smallButton} onClick={fetchEvents} disabled={listLoading}>
              {listLoading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button type="button" style={styles.smallButtonPrimary} onClick={scrollToForm}>
              + Add
            </button>
          </div>
        </div>

        {toast && <p style={toast.type === 'success' ? styles.success : styles.error}>{toast.text}</p>}

        {/* Upcoming */}
        <div style={styles.listBox}>
          <div style={styles.listHeader}>
            <h2 style={styles.listTitle}>Upcoming</h2>
            <span style={styles.listMeta}>{buckets.upcoming.length} item(s)</span>
          </div>

          {listLoading ? (
            <div style={styles.listEmpty}>Loading events…</div>
          ) : buckets.upcoming.length === 0 ? (
            <div style={styles.listEmpty}>No upcoming events yet. Add one below.</div>
          ) : (
            <ul style={styles.list}>
              {buckets.upcoming.map((evt) => (
                <li key={evt.id} style={styles.listItem}>
                  <div style={styles.itemMain}>
                    <div style={styles.itemTopRow}>
                      <strong style={styles.itemTitle}>
                        📌 {evt.title}
                      </strong>
                      <span style={styles.itemTime}>{fmtDateTime(evt.startsAt)}</span>
                    </div>
                    <div style={styles.itemDesc}>
                      {evt.description || ''}
                      {evt.attended ? ' • attended' : ''}
                    </div>
                  </div>

                  <div style={styles.itemActions}>
                    <button type="button" style={styles.actionButton} onClick={() => toggleAttended(evt)}>
                      {evt.attended ? 'Undo' : 'Attended'}
                    </button>
                    <button type="button" style={styles.dangerButton} onClick={() => deleteEvent(evt)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add form */}
        <div ref={formRef} />
        <div style={styles.formDivider} />

        <h2 style={styles.formTitle}>Add Event</h2>
        <p style={styles.formSubtitle}>Pick a day and time. (Work hours will move to Family Members.)</p>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Day</label>
          <select name="day" style={styles.input} defaultValue="Monday">
            <option>Monday</option>
            <option>Tuesday</option>
            <option>Wednesday</option>
            <option>Thursday</option>
            <option>Friday</option>
            <option>Saturday</option>
            <option>Sunday</option>
          </select>

          <label style={styles.label}>Event Time</label>
          <input name="eventTime" type="time" style={styles.input} defaultValue="17:00" />

          <label style={styles.label}>Event</label>
          <input name="event" style={styles.input} placeholder="Dentist appointment" />

          <div style={styles.checkboxContainer}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>🔄 Recurring Event</span>
            </label>
          </div>

          {isRecurring && (
            <div style={styles.recurringSection}>
              <label style={styles.label}>Repeat</label>
              <select
                name="pattern"
                value={recurrencePattern}
                onChange={(e) => setRecurrencePattern(e.target.value)}
                style={styles.input}
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>

              <label style={styles.label}>Every</label>
              <div style={styles.intervalRow}>
                <input
                  name="interval"
                  type="number"
                  min="1"
                  max="365"
                  defaultValue="1"
                  style={styles.inputNoMargin}
                  placeholder="1"
                />
                <span style={styles.intervalHint}>
                  {recurrencePattern === 'DAILY' && 'day(s)'}
                  {recurrencePattern === 'WEEKLY' && 'week(s)'}
                  {recurrencePattern === 'MONTHLY' && 'month(s)'}
                  {recurrencePattern === 'YEARLY' && 'year(s)'}
                </span>
              </div>

              <label style={styles.label}>End Date (Optional)</label>
              <input name="endDate" type="date" style={styles.input} />
            </div>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Saving…' : 'Save Event'}
          </button>
        </form>

        {/* Recent Past (NOW includes buttons) */}
        <div style={styles.pastBox}>
          <div style={styles.listHeader}>
            <h2 style={styles.listTitle}>Recent Past</h2>
            <span style={styles.listMeta}>{buckets.past.length} item(s)</span>
          </div>

          {buckets.past.length === 0 ? (
            <div style={styles.listEmpty}>No past events.</div>
          ) : (
            <ul style={styles.list}>
              {buckets.past.map((evt) => (
                <li key={evt.id} style={styles.listItem}>
                  <div style={styles.itemMain}>
                    <div style={styles.itemTopRow}>
                      <strong style={styles.itemTitle}>📌 {evt.title}</strong>
                      <span style={styles.itemTime}>{fmtDateTime(evt.startsAt)}</span>
                    </div>
                    <div style={styles.itemDesc}>
                      {evt.attended ? 'attended' : 'not attended'}
                    </div>
                  </div>

                  <div style={styles.itemActions}>
                    <button type="button" style={styles.actionButton} onClick={() => toggleAttended(evt)}>
                      {evt.attended ? 'Undo' : 'Attended'}
                    </button>
                    <button type="button" style={styles.dangerButton} onClick={() => deleteEvent(evt)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    padding: '5rem 1.5rem 2rem 1.5rem',
    backgroundColor: '#f4e3bf',
    backgroundImage:
      'radial-gradient(circle at 25% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.22), transparent 45%)',
    color: '#3f2d1d'
  },
  card: {
    maxWidth: 720,
    margin: '0 auto',
    background: '#fff59d',
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.24)',
    boxShadow: '0 14px 24px rgba(70, 45, 11, 0.2)',
    padding: '1.2rem'
  },

  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '0.6rem'
  },
  headerActions: { display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 },

  title: { margin: 0, marginBottom: '0.35rem' },
  subtitle: { margin: 0, marginBottom: '0.9rem' },

  success: {
    marginBottom: '0.8rem',
    padding: '0.5rem 0.6rem',
    borderRadius: 6,
    background: 'rgba(63, 152, 76, 0.15)',
    border: '1px solid rgba(44, 121, 57, 0.35)',
    color: '#1f602a'
  },
  error: {
    marginBottom: '0.8rem',
    padding: '0.5rem 0.6rem',
    borderRadius: 6,
    background: 'rgba(186, 62, 62, 0.12)',
    border: '1px solid rgba(186, 62, 62, 0.35)',
    color: '#8b1f1f'
  },

  listBox: {
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.22)',
    background: 'rgba(255,255,255,0.35)',
    padding: '0.85rem',
    marginBottom: '1rem'
  },
  pastBox: {
    marginTop: '1rem',
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.14)',
    background: 'rgba(255,255,255,0.22)',
    padding: '0.85rem'
  },

  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '1rem',
    marginBottom: '0.5rem'
  },
  listTitle: { margin: 0, fontSize: '1.05rem' },
  listMeta: { opacity: 0.8, fontWeight: 800 },

  list: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.55rem' },
  listEmpty: { opacity: 0.85, padding: '0.35rem 0.1rem', fontWeight: 700 },

  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.85rem',
    alignItems: 'flex-start',
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.18)',
    background: 'rgba(255,255,255,0.65)',
    padding: '0.65rem 0.7rem'
  },

  itemMain: { flex: 1, minWidth: 0 },
  itemTopRow: { display: 'flex', justifyContent: 'space-between', gap: '0.75rem' },
  itemTitle: { fontSize: '1rem' },
  itemTime: { whiteSpace: 'nowrap', fontWeight: 800, opacity: 0.85 },
  itemDesc: { marginTop: '0.2rem', opacity: 0.9 },

  itemActions: { display: 'flex', gap: '0.5rem', flexShrink: 0 },
  actionButton: {
    borderRadius: 9999,
    border: '1px solid rgba(98, 73, 24, 0.28)',
    padding: '0.35rem 0.6rem',
    background: 'rgba(255,255,255,0.75)',
    color: '#4b2f17',
    fontWeight: 900,
    cursor: 'pointer'
  },
  dangerButton: {
    borderRadius: 9999,
    border: '1px solid rgba(186, 62, 62, 0.45)',
    padding: '0.35rem 0.6rem',
    background: 'rgba(186, 62, 62, 0.12)',
    color: '#8b1f1f',
    fontWeight: 900,
    cursor: 'pointer'
  },

  formDivider: { height: 1, background: 'rgba(98, 73, 24, 0.2)', margin: '1rem 0' },
  formTitle: { margin: 0, marginBottom: '0.35rem' },
  formSubtitle: { marginTop: 0, marginBottom: '0.9rem' },

  label: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.28rem',
    display: 'block',
    fontWeight: 700
  },
  input: {
    width: '100%',
    marginBottom: '0.8rem',
    borderRadius: 6,
    border: '1px solid rgba(98, 73, 24, 0.24)',
    padding: '0.55rem',
    background: 'rgba(255,255,255,0.74)',
    color: '#3f2d1d'
  },

  checkboxContainer: { marginBottom: '0.9rem' },
  checkboxLabel: { display: 'flex', gap: '0.55rem', alignItems: 'center', fontWeight: 800 },
  checkbox: { transform: 'translateY(1px)' },
  checkboxText: { userSelect: 'none' },

  recurringSection: {
    padding: '0.85rem',
    borderRadius: 8,
    border: '1px solid rgba(98, 73, 24, 0.18)',
    background: 'rgba(255,255,255,0.35)',
    marginBottom: '0.9rem'
  },

  intervalRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' },
  inputNoMargin: {
    width: '140px',
    borderRadius: 6,
    border: '1px solid rgba(98, 73, 24, 0.24)',
    padding: '0.55rem',
    background: 'rgba(255,255,255,0.74)',
    color: '#3f2d1d'
  },
  intervalHint: { fontWeight: 800, opacity: 0.85 },

  button: {
    width: '100%',
    borderRadius: 9999,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    padding: '0.6rem 0.75rem',
    background: '#fff4cf',
    color: '#4b2f17',
    fontWeight: 700,
    cursor: 'pointer'
  },

  smallButton: {
    borderRadius: 9999,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    padding: '0.45rem 0.7rem',
    background: 'rgba(255,255,255,0.5)',
    color: '#4b2f17',
    fontWeight: 900,
    cursor: 'pointer'
  },
  smallButtonPrimary: {
    borderRadius: 9999,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    padding: '0.45rem 0.7rem',
    background: '#fff4cf',
    color: '#4b2f17',
    fontWeight: 900,
    cursor: 'pointer'
  }
};

