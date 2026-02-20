'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import Button from '../components/Button';
import { Label, Input, Select } from '../components/form';
import { MAIN_PADDING_WITH_NAV, CONTENT_WIDTH_FORM } from '../../lib/layout';

const EVENT_PRESETS = [
  { value: 'DOCTOR', label: 'Doctor Appointment', icon: '🩺' },
  { value: 'DENTIST', label: 'Dentist Appointment', icon: '🦷' },
  { value: 'SCHOOL', label: 'School Event', icon: '🏫' },
  { value: 'CHURCH', label: 'Church', icon: '⛪' },
  { value: 'FAMILY', label: 'Family Event', icon: '👨‍👩‍👧‍👦' },
  { value: 'SPORTS', label: 'Sports', icon: '🏅' },
  { value: 'BIRTHDAY', label: 'Birthday', icon: '🎂' },
  { value: 'GENERAL', label: 'General', icon: '📌' }
];

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

function toLocalInputValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function SchedulePage({ searchParams }) {
  const { theme } = useTheme();
  const formRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const [events, setEvents] = useState([]);

  // Form state
  const [preset, setPreset] = useState('GENERAL');
  const [title, setTitle] = useState('');
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [dateMode, setDateMode] = useState('DAY'); // DAY or DATE
  const [dateValue, setDateValue] = useState(() => {
    // default to today local yyyy-mm-dd
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const initialToast = useMemo(() => {
    const saved = searchParams?.saved === '1';
    const error = searchParams?.error === '1';
    if (saved) return { type: 'success', text: '✓ Saved.' };
    if (error) return { type: 'error', text: 'Please fill in the required fields.' };
    return null;
  }, [searchParams]);

  useEffect(() => {
    if (initialToast) {
      setToast(initialToast);
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [initialToast]);

  const showToast = (type, text, ms = 3000) => {
    setToast({ type, text });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), ms);
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

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const buildDateFromDayName = (dayName) => {
    // Monday-based week, similar to your API helper
    const now = new Date();
    const currentDay = now.getDay(); // Sun=0
    const daysFromMonday = (currentDay + 6) % 7;

    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - daysFromMonday);

    const map = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 };
    const d = new Date(monday);
    d.setDate(monday.getDate() + (map[dayName] ?? 0));
    return d;
  };

  const computeStartsEnds = () => {
    // If DATE mode: use dateValue; if DAY mode: compute this week's date for that day
    let base;
    if (dateMode === 'DATE') {
      base = new Date(`${dateValue}T00:00:00`);
    } else {
      base = buildDateFromDayName(day);
    }

    const [sh, sm] = String(startTime || '09:00').split(':').map((x) => parseInt(x, 10));
    const [eh, em] = String(endTime || '10:00').split(':').map((x) => parseInt(x, 10));

    const startsAt = new Date(base);
    startsAt.setHours(sh || 0, sm || 0, 0, 0);

    const endsAt = new Date(base);
    endsAt.setHours(eh || 0, em || 0, 0, 0);

    // If end is earlier than start, roll to next day
    if (endsAt.getTime() <= startsAt.getTime()) {
      endsAt.setDate(endsAt.getDate() + 1);
    }

    return { startsAt, endsAt };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const chosen = EVENT_PRESETS.find((p) => p.value === preset) || EVENT_PRESETS[EVENT_PRESETS.length - 1];
      const name = title.trim() || chosen.label;

      const { startsAt, endsAt } = computeStartsEnds();

      // API expects: day, event, isRecurring..., plus anything extra we include
      const payload = {
        day,
        event: `${chosen.icon} ${name}`.trim(),
        // new fields for PATCH/DB (your prisma supports endsAt already)
        type: 'EVENT',
        category: preset, // maps to EventCategory enum (GENERAL, SPORTS, BIRTHDAY, APPOINTMENT)
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        isRecurring: false,
        recurrencePattern: null,
        recurrenceInterval: null,
        recurrenceEndDate: null
      };

      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Unable to save');

      showToast('success', data?.message || '✓ Saved.');
      setTitle('');
      setPreset('GENERAL');

      await fetchEvents();
    } catch (err) {
      console.error(err);
      showToast('error', err.message || 'Failed to save', 3500);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (evt) => {
    if (!confirm('Delete this event?')) return;

    // Your week view uses DELETE /api/schedule?id=...
    try {
      const res = await fetch(`/api/schedule?id=${encodeURIComponent(evt.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to delete');

      setEvents((prev) => prev.filter((x) => x.id !== evt.id));
      showToast('success', 'Deleted.', 2000);
    } catch (e) {
      console.error(e);
      showToast('error', e.message || 'Failed to delete', 3500);
    }
  };

  const upcoming = useMemo(() => {
    const now = Date.now();
    const list = [...events].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    return {
      upcoming: list.filter((e) => new Date(e.startsAt).getTime() >= now).slice(0, 50),
      past: list.filter((e) => new Date(e.startsAt).getTime() < now).slice(-15).reverse()
    };
  }, [events]);

  return (
    <main
      style={{
        ...styles.main,
        backgroundColor: theme.pageBackground,
        backgroundImage: theme.pageGradient || undefined,
        color: theme.card.text
      }}
    >
      <section style={{ ...styles.card, background: theme.card.bg[0], border: `1px solid ${theme.card.border}` }}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Schedule</h1>
            <p style={styles.subtitle}>Add events with a start and end time.</p>
          </div>

          <div style={styles.headerActions}>
            <Button type="button" variant="secondary" onClick={fetchEvents} disabled={listLoading}>
              {listLoading ? 'Refreshing…' : 'Refresh'}
            </Button>
            <Button type="button" variant="primary" onClick={scrollToForm}>
              + Add Event
            </Button>
          </div>
        </div>

        {toast && (
          <p style={toast.type === 'success' ? styles.success : styles.error}>
            {toast.text}
          </p>
        )}

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
                      <strong style={styles.itemTitle}>{evt.title}</strong>
                      <span style={styles.itemTime}>
                        {fmtDateTime(evt.startsAt)}
                        {evt.endsAt ? ` → ${fmtDateTime(evt.endsAt)}` : ''}
                      </span>
                    </div>
                    <div style={styles.itemDesc}>
                      {evt.category ? `Category: ${evt.category}` : ''}
                      {evt.location ? ` • ${evt.location}` : ''}
                    </div>
                  </div>

                  <div style={styles.itemActions}>
                    <Button type="button" variant="danger" onClick={() => deleteEvent(evt)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div ref={formRef} />
        <div style={styles.formDivider} />

        <h2 style={styles.formTitle}>Add Event</h2>

        <form onSubmit={handleSubmit}>
          <Label>Preset</Label>
          <Select value={preset} onChange={(e) => setPreset(e.target.value)} style={styles.inputSpacing}>
            {EVENT_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.icon} {p.label}
              </option>
            ))}
          </Select>

          <Label>Event Name</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional (ex: Noah - Dentist)"
            style={styles.inputSpacing}
          />
          <small style={styles.helpText}>If you leave this blank, we’ll use the preset name.</small>

          <div style={styles.modeRow}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="dateMode"
                checked={dateMode === 'DAY'}
                onChange={() => setDateMode('DAY')}
              />
              Use day of week
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="dateMode"
                checked={dateMode === 'DATE'}
                onChange={() => setDateMode('DATE')}
              />
              Pick a date
            </label>
          </div>

          {dateMode === 'DAY' ? (
            <>
              <Label>Day</Label>
              <Select value={day} onChange={(e) => setDay(e.target.value)} style={styles.inputSpacing}>
                <option>Monday</option>
                <option>Tuesday</option>
                <option>Wednesday</option>
                <option>Thursday</option>
                <option>Friday</option>
                <option>Saturday</option>
                <option>Sunday</option>
              </Select>
            </>
          ) : (
            <>
              <Label>Date</Label>
              <Input type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} style={styles.inputSpacing} />
            </>
          )}

          <div style={styles.timeGrid}>
            <div>
              <Label>Start</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={styles.inputSpacing} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={styles.inputSpacing} />
            </div>
          </div>

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save Event'}
          </Button>
        </form>

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
                    <strong>{evt.title}</strong> — {fmtDateTime(evt.startsAt)}
                    {evt.endsAt ? ` → ${fmtDateTime(evt.endsAt)}` : ''}
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
    padding: MAIN_PADDING_WITH_NAV
  },
  card: {
    maxWidth: CONTENT_WIDTH_FORM,
    margin: '0 auto',
    borderRadius: 10,
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
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem' },
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
  listItemCompact: {
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.14)',
    background: 'rgba(255,255,255,0.55)',
    padding: '0.55rem 0.65rem'
  },

  itemMain: { flex: 1, minWidth: 0 },
  itemTopRow: { display: 'flex', justifyContent: 'space-between', gap: '0.75rem' },
  itemTitle: { fontSize: '1rem' },
  itemTime: { whiteSpace: 'nowrap', fontWeight: 800, opacity: 0.85 },
  itemDesc: { marginTop: '0.2rem', opacity: 0.9 },

  itemActions: { display: 'flex', gap: '0.5rem', flexShrink: 0 },

  formDivider: { height: 1, background: 'rgba(98, 73, 24, 0.2)', margin: '1rem 0' },
  formTitle: { margin: 0, marginBottom: '0.65rem' },
  inputSpacing: { marginBottom: '0.8rem' },
  helpText: { display: 'block', marginTop: '-0.5rem', marginBottom: '0.8rem', opacity: 0.85, fontWeight: 700 },

  modeRow: { display: 'flex', gap: '1rem', marginBottom: '0.8rem', flexWrap: 'wrap' },
  radioLabel: { display: 'flex', gap: '0.45rem', alignItems: 'center', fontWeight: 800 },

  timeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }
};
