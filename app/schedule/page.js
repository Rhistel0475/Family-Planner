'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SchedulePage({ searchParams }) {
  const router = useRouter();
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('WEEKLY');
  const [loading, setLoading] = useState(false);
  const saved = searchParams?.saved === '1';
  const error = searchParams?.error === '1';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const data = {
      day: formData.get('day'),
      workHours: formData.get('workHours'),
      event: formData.get('event'),
      isRecurring,
      recurrencePattern: isRecurring ? recurrencePattern : null,
      recurrenceInterval: isRecurring ? parseInt(formData.get('interval')) || 1 : null,
      recurrenceEndDate: isRecurring && formData.get('endDate') ? formData.get('endDate') : null
    };

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (res.ok) {
        router.push('/schedule?saved=1');
        e.target.reset();
        setIsRecurring(false);
      } else {
        console.error('Error response:', result);
        router.push('/schedule?error=1');
      }
    } catch (err) {
      console.error('Request error:', err);
      router.push('/schedule?error=1');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      <section style={styles.card}>
        <h1 style={styles.title}>Add Schedule Info</h1>
        <p style={styles.subtitle}>Populate your weekly planner with work hours and events.</p>
        {saved && <p style={styles.success}>✓ Saved to schedule.</p>}
        {error && <p style={styles.error}>Please add a day and at least one field.</p>}

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

          <label style={styles.label}>Work Hours</label>
          <input name="workHours" style={styles.input} placeholder="9:00 AM - 5:00 PM" />

          <label style={styles.label}>Event</label>
          <input name="event" style={styles.input} placeholder="Dentist appointment 4:00 PM" />

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
              <input 
                name="interval" 
                type="number" 
                min="1" 
                max="365"
                defaultValue="1"
                style={styles.input} 
                placeholder="1"
              />
              <span style={styles.intervalHint}>
                {recurrencePattern === 'DAILY' && 'day(s)'}
                {recurrencePattern === 'WEEKLY' && 'week(s)'}
                {recurrencePattern === 'MONTHLY' && 'month(s)'}
                {recurrencePattern === 'YEARLY' && 'year(s)'}
              </span>

              <label style={styles.label}>End Date (Optional)</label>
              <input 
                name="endDate" 
                type="date"
                style={styles.input}
              />
            </div>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Saving...' : 'Save Schedule Item'}
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
    maxWidth: 560,
    margin: '0 auto',
    background: '#fff59d',
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.24)',
    boxShadow: '0 14px 24px rgba(70, 45, 11, 0.2)',
    padding: '1.2rem'
  },
  title: {
    marginBottom: '0.35rem'
  },
  subtitle: {
    marginBottom: '1rem'
  },
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
  button: {
    width: '100%',
    borderRadius: 9999,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    padding: '0.6rem 0.75rem',
    background: '#fff4cf',
    color: '#4b2f17',
    fontWeight: 700,
    cursor: 'pointer'
  }
};
