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

function fmtDate(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return String(d);
  }
}

const CATEGORY_OPTIONS = [
  { value: 'DOCTOR', label: 'Doctor Appointment' },
  { value: 'DENTIST', label: 'Dentist Appointment' },
  { value: 'SCHOOL', label: 'School Event' },
  { value: 'FAMILY', label: 'Family Event' },
  { value: 'CHURCH', label: 'Church' },
  { value: 'OTHER', label: 'Other' }
];

export default function SchedulePage() {
  const formRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const [events, setEvents] = useState([]);

  // form state
  const [category, setCategory] = useState('DOCTOR');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const showToast = (type, text, ms = 2500) => {
    setToast({ type, text });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), ms);
  };

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
      showToast('error', e.message || 'Failed to load events', 3500);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const upcoming = useMemo(() => {
    const now = Date.now();
    const list = [...events].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    return {
      upcoming: list.filter((e) => new Date(e.startsAt).getTime() >= now).slice(0, 25),
      past: list.filter((e) => new Date(e.startsAt).getTime() < now).slice(-10).reverse()
    };
  }, [events]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      category,
      title: title.trim(),
      date,
      startTime,
      endTime: endTime.trim() || null,
      location: location.trim() || null,
      description: notes.trim() || null
    };

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || 'Unable to save. Please try again.');

      // reset key fields, keep category/date handy
      setTitle('');
      setEndTime('');
      setLocation('');
      setNotes('');

      showToast('success', '✓ Event saved.');
      await fetchEvents();
    } catch (err) {
      console.error(err);
      showToast('error', err.message || 'Network error. Please try again.', 3500);
    } finally {
      setLoading(false);
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
      showToast('success', 'Deleted.');
    } catch (e) {
      console.error(e);
      showToast('error', e.message || 'Failed to delete event', 3500);
    }
  };

  const categoryEmoji = (c) => {
    switch (c) {
      case 'DOCTOR': return '🩺';
      case 'DENTIST': return '🦷';
      case 'SCHOOL': return '🏫';
      case 'FAMILY': return '👨‍👩‍👧‍👦';
      case 'CHURCH': return '⛪';
      default: return '📌';
    }
  };

  return (
    <main style={styles.main}>
      <section style={styles.card}>
        {/* Header */}
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Schedule</h1>
            <p style={styles.subtitle}>Add family events with start/end times. Work hours will move to the Members page.</p>
          </div>

          <div style={styles.headerActions}>
            <button type="button" style={styles.smallButton} onClick={fetchEvents} disabled={listLoading}>
              {listLoading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button type="button" style={styles.smallButtonPrimary} onClick={scrollToForm}>
              + Add Event
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <p style={toast.type === 'success' ? styles.success : styles.error}>
            {toast.text}
          </p>
        )}

        {/* Upcoming list */}
        <div style={styles.listBox}>
          <div style={styles.listHeader}>
            <h2 style={styles.listTitle}>Upcoming</h2>
            <span style={styles.listMeta}>{upcoming.upcoming.length} item(s)</span>
          </div>

          {listLoading ? (
            <div style={styles.listEmpty}>Loading events…</div>
          ) : upcoming.upcoming.length === 0 ? (
            <div style={styles.listEmpty}>No upcoming events yet. Add one below.</div>
          ) : (
            <ul style={styles.list}>
              {upcoming.upcoming.map((evt) => (
                <li key={evt.id} style={styles.listItem}>
                  <div style={styles.itemMain}>
                    <div style={styles.itemTopRow}>
                      <strong style={styles.itemTitle}>
                        {categoryEmoji(evt.category)} {evt.title}
                      </strong>
                      <span style={styles.itemTime}>{fmtDateTime(evt.startsAt)}</span>
                    </div>

                    <div style={styles.itemDesc}>
                      {evt.endsAt ? `Ends: ${fmtDateTime(evt.endsAt)} • ` : ''}
                      {evt.location ? `📍 ${evt.location} • ` : ''}
                      {evt.category ? `Category: ${evt.category}` : ''}
                    </div>

                    {evt.description ? <div style={styles.itemNotes}>{evt.description}</div> : null}
                  </div>

                  <div style={styles.itemActions}>
                    <button
                      type="button"
                      style={styles.dangerButton}
                      onClick={() => deleteEvent(evt)}
                      aria-label={`Delete ${evt.title}`}
                    >
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
        <p style={styles.formSubtitle}>Choose a type, name it, set date + start/end time.</p>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Event Type</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.input}>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label style={styles.label}>Event Name</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
            placeholder="e.g., Noah – Dentist Checkup"
            required
          />

          <div style={styles.twoCol}>
            <div>
              <label style={styles.label}>Date</label>
              <input value={date} onChange={(e) => setDate(e.target.value)} type="date" style={styles.input} required />
            </div>
            <div>
              <label style={styles.label}>Location (optional)</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} style={styles.input} placeholder="Clinic / School / Church" />
            </div>
          </div>

          <div style={styles.twoCol}>
            <div>
              <label style={styles.label}>Start Time</label>
              <input value={startTime} onChange={(e) => setStartTime(e.target.value)} type="time" style={styles.input} required />
            </div>
            <div>
              <label style={styles.label}>End Time (optional)</label>
              <input value={endTime} onChange={(e) => setEndTime(e.target.value)} type="time" style={styles.input} />
            </div>
          </div>

          <label style={styles.label}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            style={styles.textarea}
            placeholder="Any details you want to remember…"
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Saving…' : 'Save Event'}
          </button>
        </form>

        {/* Recent past */}
        <div style={styles.pastBox}>
          <div style={styles.listHeader}>
            <h2 style={styles.listTitle}>Recent Past</h2>
            <span style={styles.listMeta}>{upcoming.past.length} item(s)</span>
          </div>

          {upcoming.past.length === 0 ? (
            <div style={styles.listEmpty}>No past events.</div>
          ) : (
            <ul style={styles.list}>
              {upcoming.past.map((evt) => (
                <li key={evt.id} style={styles.listItemCompact}>
                  <span>
                    {categoryEmoji(evt.category)} <strong>{evt.title}</strong> — {fmtDate(evt.startsAt)} ({fmtDateTime(evt.startsAt)})
                  </span>
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
    maxWidth: 820,
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
  headerActions: {
    display: 'flex',
    gap: '0.6rem',
    alignItems: 'center',
    flexShrink: 0
  },

  title: { margin: 0, marginBottom: '0.35rem' },
  subtitle: { margin: 0, marginBottom: '0.9rem' },

  success: {
    marginBottom: '0.8rem',
    padding: '0.5rem 0.6rem',
    borderRadius: 6,
    background: 'rgba(63, 152, 76, 0.15)',
    border: '1px solid rgba(44, 121, 57, 0.35)',
    color: '#1f602a',
    fontWeight: 800
  },
  error: {
    marginBottom: '0.8rem',
    padding: '0.5rem 0.6rem',
    borderRadius: 6,
    background: 'rgba(186, 62, 62, 0.12)',
    border: '1px solid rgba(186, 62, 62, 0.35)',
    color: '#8b1f1f',
    fontWeight: 800
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
  listMeta: { opacity: 0.85, fontWeight: 900 },

  list: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.55rem' },
  listEmpty: { opacity: 0.9, padding: '0.35rem 0.1rem', fontWeight: 800 },

  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.85rem',
    alignItems: 'flex-start',
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.18)',
    background: 'rgba(255,255,255,0.7)',
    padding: '0.75rem 0.8rem'
  },
  listItemCompact: {
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.14)',
    background: 'rgba(255,255,255,0.6)',
    padding: '0.55rem 0.65rem'
  },

  itemMain: { flex: 1, minWidth: 0 },
  itemTopRow: { display: 'flex', justifyContent: 'space-between', gap: '0.75rem' },
  itemTitle: { fontSize: '1rem' },
  itemTime: { whiteSpace: 'nowrap', fontWeight: 900, opacity: 0.9 },
  itemDesc: { marginTop: '0.2rem', opacity: 0.95, fontWeight: 700 },
  itemNotes: { marginTop: '0.35rem', opacity: 0.95 },

  itemActions: { display: 'flex', gap: '0.5rem', flexShrink: 0 },

  dangerButton: {
    borderRadius: 9999,
    border: '1px solid rgba(186, 62, 62, 0.45)',
    padding: '0.45rem 0.75rem',
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
    fontWeight: 900
  },
  input: {
    width: '100%',
    marginBottom: '0.8rem',
    borderRadius: 6,
    border: '1px solid rgba(98, 73, 24, 0.24)',
    padding: '0.55rem',
    background: 'rgba(255,255,255,0.78)',
    color: '#3f2d1d'
  },
  textarea: {
    width: '100%',
    marginBottom: '0.9rem',
    borderRadius: 6,
    border: '1px solid rgba(98, 73, 24, 0.24)',
    padding: '0.65rem',
    background: 'rgba(255,255,255,0.78)',
    color: '#3f2d1d',
    resize: 'vertical'
  },

  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.9rem'
  },

  button: {
    width: '100%',
    borderRadius: 9999,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    padding: '0.65rem 0.8rem',
    background: '#fff4cf',
    color: '#4b2f17',
    fontWeight: 900,
    cursor: 'pointer'
  },

  smallButton: {
    borderRadius: 9999,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    padding: '0.45rem 0.7rem',
    background: 'rgba(255,255,255,0.55)',
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
