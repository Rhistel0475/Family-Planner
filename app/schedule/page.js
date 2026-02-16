'use client';

import { useEffect, useMemo, useState } from 'react';

const CATEGORY_OPTIONS = [
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

function toLocalInputValue(date) {
  // date -> "YYYY-MM-DDTHH:mm"
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SchedulePage() {
  const [events, setEvents] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    category: 'Doctor Appointment',
    title: '',
    location: '',
    startsAt: toLocalInputValue(new Date()),
    endsAt: '',
    description: ''
  });

  const fetchEvents = async () => {
    try {
      setListLoading(true);
      const res = await fetch('/api/schedule');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load events');
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', text: e.message || 'Failed to load events' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const upcoming = useMemo(() => {
    const now = Date.now();
    const sorted = [...events].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    return sorted.filter((e) => new Date(e.startsAt).getTime() >= now).slice(0, 50);
  }, [events]);

  const formatRange = (evt) => {
    const s = new Date(evt.startsAt);
    const e = evt.endsAt ? new Date(evt.endsAt) : null;

    const datePart = s.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const startTime = s.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

    if (!e) return `${datePart} • ${startTime}`;

    const endTime = e.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${datePart} • ${startTime}–${endTime}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!form.title.trim()) throw new Error('Event title is required.');
      if (!form.startsAt) throw new Error('Start date/time is required.');

      const payload = {
        category: form.category,
        title: form.title.trim(),
        location: form.location?.trim() || null,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        description: form.description?.trim() || null
      };

      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save event');

      setToast({ type: 'success', text: '✓ Event added.' });
      setTimeout(() => setToast(null), 2000);

      setForm((prev) => ({
        ...prev,
        title: '',
        location: '',
        endsAt: '',
        description: ''
      }));

      fetchEvents();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', text: err.message || 'Failed to save event' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (evt) => {
    if (!confirm(`Delete "${evt.title}"?`)) return;

    try {
      const res = await fetch(`/api/schedule?id=${evt.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to delete');

      setEvents((prev) => prev.filter((x) => x.id !== evt.id));
      setToast({ type: 'success', text: 'Deleted.' });
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', text: e.message || 'Failed to delete' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <main style={styles.main}>
      <section style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Calendar</h1>
            <p style={styles.subtitle}>Events only. Work hours will live on the Members page.</p>
          </div>
          <button type="button" style={styles.smallButton} onClick={fetchEvents} disabled={listLoading}>
            {listLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {toast && (
          <div style={toast.type === 'success' ? styles.success : styles.error}>
            {toast.text}
          </div>
        )}

        <div style={styles.listBox}>
          <div style={styles.listHeader}>
            <h2 style={styles.listTitle}>Upcoming</h2>
            <span style={styles.listMeta}>{upcoming.length} item(s)</span>
          </div>

          {listLoading ? (
            <div style={styles.listEmpty}>Loading…</div>
          ) : upcoming.length === 0 ? (
            <div style={styles.listEmpty}>No upcoming events yet.</div>
          ) : (
            <ul style={styles.list}>
              {upcoming.map((evt) => (
                <li key={evt.id} style={styles.listItem}>
                  <div style={styles.itemMain}>
                    <div style={styles.itemTopRow}>
                      <strong style={styles.itemTitle}>{evt.title}</strong>
                      <span style={styles.itemTime}>{formatRange(evt)}</span>
                    </div>
                    <div style={styles.itemDesc}>
                      {evt.category ? `${evt.category}` : 'Event'}
                      {evt.location ? ` • ${evt.location}` : ''}
                    </div>
                  </div>

                  <div style={styles.itemActions}>
                    <button type="button" style={styles.dangerButton} onClick={() => deleteEvent(evt)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={styles.formDivider} />

        <h2 style={styles.formTitle}>Add Event</h2>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Category</label>
          <select
            style={styles.input}
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label style={styles.label}>Event Name</label>
          <input
            style={styles.input}
            placeholder="Ex: Noah - Dentist"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />

          <label style={styles.label}>Start</label>
          <input
            type="datetime-local"
            style={styles.input}
            value={form.startsAt}
            onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
          />

          <label style={styles.label}>End (optional)</label>
          <input
            type="datetime-local"
            style={styles.input}
            value={form.endsAt}
            onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))}
          />

          <label style={styles.label}>Location (optional)</label>
          <input
            style={styles.input}
            placeholder="Ex: Rome Family Dental"
            value={form.location}
            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
          />

          <label style={styles.label}>Notes (optional)</label>
          <textarea
            style={{ ...styles.input, minHeight: 90 }}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />

          <button type="submit" style={styles.button} disabled={saving}>
            {saving ? 'Saving…' : 'Save Event'}
          </button>
        </form>
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
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  title: { margin: 0, marginBottom: '0.35rem' },
  subtitle: { margin: 0, opacity: 0.9 },
  smallButton: {
    borderRadius: 9999,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    padding: '0.45rem 0.7rem',
    background: 'rgba(255,255,255,0.5)',
    color: '#4b2f17',
    fontWeight: 900,
    cursor: 'pointer'
  },
  success: {
    marginTop: '0.8rem',
    marginBottom: '0.8rem',
    padding: '0.5rem 0.6rem',
    borderRadius: 6,
    background: 'rgba(63, 152, 76, 0.15)',
    border: '1px solid rgba(44, 121, 57, 0.35)',
    color: '#1f602a',
    fontWeight: 800
  },
  error: {
    marginTop: '0.8rem',
    marginBottom: '0.8rem',
    padding: '0.5rem 0.6rem',
    borderRadius: 6,
    background: 'rgba(186, 62, 62, 0.12)',
    border: '1px solid rgba(186, 62, 62, 0.35)',
    color: '#8b1f1f',
    fontWeight: 800
  },
  listBox: {
    marginTop: '1rem',
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.22)',
    background: 'rgba(255,255,255,0.35)',
    padding: '0.85rem'
  },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem' },
  listTitle: { margin: 0, fontSize: '1.05rem' },
  listMeta: { opacity: 0.8, fontWeight: 900 },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.55rem' },
  listEmpty: { opacity: 0.85, padding: '0.35rem 0.1rem', fontWeight: 800 },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.85rem',
    alignItems: 'flex-start',
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.18)',
    background: 'rgba(255,255,255,0.75)',
    padding: '0.65rem 0.7rem'
  },
  itemMain: { flex: 1, minWidth: 0 },
  itemTopRow: { display: 'flex', justifyContent: 'space-between', gap: '0.75rem' },
  itemTitle: { fontSize: '1rem' },
  itemTime: { whiteSpace: 'nowrap', fontWeight: 900, opacity: 0.85 },
  itemDesc: { marginTop: '0.2rem', opacity: 0.9 },
  itemActions: { flexShrink: 0 },
  dangerButton: {
    borderRadius: 9999,
    border: '1px solid rgba(186, 62, 62, 0.55)',
    padding: '0.45rem 0.75rem',
    background: 'rgba(186, 62, 62, 0.14)',
    color: '#8b1f1f',
    fontWeight: 900,
    cursor: 'pointer'
  },
  formDivider: { height: 1, background: 'rgba(98, 73, 24, 0.2)', margin: '1rem 0' },
  formTitle: { margin: 0, marginBottom: '0.6rem' },
  label: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.28rem',
    display: 'block',
    fontWeight: 800
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
  button: {
    width: '100%',
    borderRadius: 9999,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    padding: '0.6rem 0.75rem',
    background: '#fff4cf',
    color: '#4b2f17',
    fontWeight: 900,
    cursor: 'pointer'
  }
};
