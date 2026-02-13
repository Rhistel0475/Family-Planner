'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChoresPage({ searchParams }) {
  const router = useRouter();
  const [frequency, setFrequency] = useState('ONCE');
  const [assignmentScope, setAssignmentScope] = useState('all');
  const [loading, setLoading] = useState(false);

  const defaultChores = useMemo(() => ([
    'Clean Bedroom',
    'Clean Kitchen',
    'Clean Living Room',
    'Take Out Trash',
    'Wash Dishes',
    'Do Laundry',
    'Vacuum Floors',
    'Clean Bathroom',
    'Mop Floors'
  ]), []);
  const saved = searchParams?.saved === '1';
  const error = searchParams?.error === '1';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const selectedTemplate = formData.get('choreTemplate');
    const customTitle = (formData.get('title') || '').trim();
    const title = selectedTemplate === 'CUSTOM' ? customTitle : selectedTemplate;

    const data = {
      title,
      assignedTo: assignmentScope === 'all' ? 'All Members' : formData.get('assignedTo'),
      dueDay: formData.get('dueDay'),
      isRecurring: frequency !== 'ONCE',
      recurrencePattern: frequency !== 'ONCE' ? frequency : null,
      recurrenceInterval: frequency !== 'ONCE' ? parseInt(formData.get('interval')) || 1 : null,
      recurrenceEndDate: frequency !== 'ONCE' && formData.get('endDate') ? formData.get('endDate') : null
    };

    try {
      const res = await fetch('/api/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (res.ok) {
        router.push('/chores?saved=1');
        e.target.reset();
        setFrequency('ONCE');
        setAssignmentScope('all');
      } else {
        console.error('Error response:', result);
        router.push('/chores?error=1');
      }
    } catch (err) {
      console.error('Request error:', err);
      router.push('/chores?error=1');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      <section style={styles.card}>
        <h1 style={styles.title}>Add Chore</h1>
        <p style={styles.subtitle}>Capture chores so your family task plan stays organized.</p>
        {saved && <p style={styles.success}>✓ Chore saved.</p>}
        {error && <p style={styles.error}>Please complete all fields.</p>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Standard Chore</label>
          <select name="choreTemplate" style={styles.input} defaultValue="Clean Bedroom">
            {defaultChores.map((chore) => (
              <option key={chore} value={chore}>{chore}</option>
            ))}
            <option value="CUSTOM">Custom chore...</option>
          </select>

          <label style={styles.label}>Custom Chore (optional)</label>
          <input name="title" style={styles.input} placeholder="Enter custom chore only if needed" />

          <label style={styles.label}>Availability</label>
          <select
            style={styles.input}
            value={assignmentScope}
            onChange={(e) => setAssignmentScope(e.target.value)}
          >
            <option value="all">Available to all members</option>
            <option value="one">Assign to one member</option>
          </select>

          {assignmentScope === 'one' && (
            <>
              <label style={styles.label}>Assigned To</label>
              <input name="assignedTo" style={styles.input} placeholder="Alex" />
            </>
          )}

          <label style={styles.label}>Due Day</label>
          <select name="dueDay" style={styles.input} defaultValue="Friday">
            <option>Monday</option>
            <option>Tuesday</option>
            <option>Wednesday</option>
            <option>Thursday</option>
            <option>Friday</option>
            <option>Saturday</option>
            <option>Sunday</option>
          </select>

          <label style={styles.label}>Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            style={styles.input}
          >
            <option value="ONCE">One-time</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>

          {frequency !== 'ONCE' && (
            <div style={styles.recurringSection}>
              <label style={styles.label}>Every</label>
              <input
                name="interval"
                type="number"
                min="1"
                defaultValue="1"
                style={styles.input}
              />
              <span style={styles.intervalText}>
                {frequency === 'DAILY' && 'day(s)'}
                {frequency === 'WEEKLY' && 'week(s)'}
                {frequency === 'MONTHLY' && 'month(s)'}
                {frequency === 'YEARLY' && 'year(s)'}
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
            {loading ? 'Saving...' : 'Save Chore'}
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
    background: '#c9f7a5',
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
    background: '#e9ffd7',
    color: '#2b4d1f',
    fontWeight: 700,
    cursor: 'pointer'
  },
  recurringSection: {
    background: 'rgba(255,255,255,0.4)',
    padding: '0.8rem',
    borderRadius: 6,
    marginBottom: '0.8rem',
    border: '1px dashed rgba(98, 73, 24, 0.2)'
  },
  intervalText: {
    fontSize: '0.85rem',
    color: '#3f2d1d',
    marginLeft: '0.3rem'
  }
};
