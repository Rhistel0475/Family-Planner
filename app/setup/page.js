'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DAY_NAMES } from '../../lib/constants';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [familyName, setFamilyName] = useState('');
  const [members, setMembers] = useState([]);
  const [currentMember, setCurrentMember] = useState({ name: '', role: 'member' });
  const [workSchedules, setWorkSchedules] = useState({});
  const [loading, setLoading] = useState(false);

  const addMember = () => {
    if (currentMember.name.trim()) {
      setMembers([...members, { ...currentMember, id: Date.now() }]);
      setCurrentMember({ name: '', role: 'member' });
    }
  };

  const removeMember = (id) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleWorkHoursChange = (memberName, day, hours) => {
    setWorkSchedules({
      ...workSchedules,
      [memberName]: {
        ...workSchedules[memberName],
        [day]: hours
      }
    });
  };

  const handleNext = () => {
    if (step === 1 && !familyName.trim()) {
      alert('Please enter your family name');
      return;
    }
    if (step === 2 && members.length === 0) {
      alert('Please add at least one family member');
      return;
    }
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleComplete = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      if (members.length === 0) {
        alert('Please add at least one family member');
        setLoading(false);
        return;
      }
      
      // Save family members
      for (const member of members) {
        const res = await fetch('/api/family-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: member.name, role: member.role })
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(`Failed to save member: ${error.error || res.status}`);
        }
      }

      // Save work schedules
      for (const [memberName, schedule] of Object.entries(workSchedules)) {
        for (const [day, hours] of Object.entries(schedule)) {
          if (hours.trim()) {
            const res = await fetch('/api/schedule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                day,
                workHours: hours
              })
            });
            if (!res.ok) {
              const error = await res.json();
              throw new Error(`Failed to save schedule: ${error.error || res.status}`);
            }
          }
        }
      }

      // Mark setup as complete
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyName })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(`Failed to complete setup: ${error.error || res.status}`);
      }

      // Redirect to home
      window.location.href = '/?setupComplete=true';
    } catch (error) {
      console.error('Setup error:', error);
      alert(`Failed to complete setup: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      <section style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Family Planner Setup</h1>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progress, width: `${(step / 3) * 100}%` }} />
          </div>
          <p style={styles.stepCounter}>Step {step} of 3</p>
        </div>

        {/* Step 1: Family Name */}
        {step === 1 && (
          <div style={styles.stepContent}>
            <h2>Welcome to Family Planner</h2>
            <p style={styles.description}>Let's start by setting up your family.</p>

            <label style={styles.label}>Family Name</label>
            <input
              style={styles.input}
              placeholder="The Smith Family"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
            <p style={styles.hint}>This will be your family's name in the system.</p>
          </div>
        )}

        {/* Step 2: Add Family Members */}
        {step === 2 && (
          <div style={styles.stepContent}>
            <h2>Add Family Members</h2>
            <p style={styles.description}>Who's in your family? Add each member.</p>

            <div style={styles.formGroup}>
              <label style={styles.label}>Member Name</label>
              <input
                style={styles.input}
                placeholder="Alex"
                value={currentMember.name}
                onChange={(e) => setCurrentMember({ ...currentMember, name: e.target.value })}
              />

              <label style={styles.label}>Role</label>
              <select
                style={styles.input}
                value={currentMember.role}
                onChange={(e) => setCurrentMember({ ...currentMember, role: e.target.value })}
              >
                <option>member</option>
                <option>parent</option>
                <option>kid</option>
              </select>

              <button onClick={addMember} style={styles.addButton}>
                + Add Member
              </button>
            </div>

            {members.length > 0 && (
              <div style={styles.membersList}>
                <h3>Family Members ({members.length})</h3>
                {members.map((member) => (
                  <div key={member.id} style={styles.memberItem}>
                    <div>
                      <strong>{member.name}</strong>
                      <span style={styles.badge}>{member.role}</span>
                    </div>
                    <button
                      onClick={() => removeMember(member.id)}
                      style={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Work Schedule */}
        {step === 3 && (
          <div style={styles.stepContent}>
            <h2>Set Work Hours (Optional)</h2>
            <p style={styles.description}>
              Define typical work hours for each family member. You can skip this for now.
            </p>

            <div style={styles.scheduleGrid}>
              {members.map((member) => (
                <div key={member.id} style={styles.scheduleCard}>
                  <h4>{member.name}</h4>
                  {DAY_NAMES.map((day) => (
                    <div key={day} style={styles.dayInput}>
                      <label style={styles.dayLabel}>{day}</label>
                      <input
                        style={styles.smallInput}
                        placeholder="e.g., 9:00 AM - 5:00 PM"
                        value={workSchedules[member.name]?.[day] || ''}
                        onChange={(e) =>
                          handleWorkHoursChange(member.name, day, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={styles.footer}>
          {step > 1 && (
            <button onClick={handlePrevious} style={styles.secondaryButton}>
              ← Previous
            </button>
          )}
          {step < 3 ? (
            <button onClick={handleNext} style={styles.primaryButton}>
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={loading}
              style={{...styles.primaryButton, opacity: loading ? 0.6 : 1}}
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    padding: '2rem 1.5rem',
    backgroundColor: '#f4e3bf',
    backgroundImage:
      'radial-gradient(circle at 25% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.22), transparent 45%)',
    color: '#3f2d1d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    maxWidth: 700,
    width: '100%',
    background: '#ffef7d',
    borderRadius: 12,
    border: '1px solid rgba(98, 73, 24, 0.24)',
    boxShadow: '0 14px 24px rgba(70, 45, 11, 0.2)',
    padding: '2rem'
  },
  header: {
    marginBottom: '2rem'
  },
  title: {
    margin: '0 0 1rem 0',
    fontSize: '1.8rem'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: 'rgba(98, 73, 24, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: '0.5rem'
  },
  progress: {
    height: '100%',
    background: '#3f2d1d',
    transition: 'width 0.3s ease'
  },
  stepCounter: {
    fontSize: '0.85rem',
    opacity: 0.7,
    margin: '0.5rem 0 0 0'
  },
  stepContent: {
    marginBottom: '2rem'
  },
  description: {
    color: '#5b4228',
    marginBottom: '1.5rem'
  },
  label: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.4rem',
    display: 'block',
    fontWeight: 700
  },
  input: {
    width: '100%',
    marginBottom: '0.8rem',
    borderRadius: 6,
    border: '1px solid rgba(98, 73, 24, 0.24)',
    padding: '0.7rem',
    background: 'rgba(255,255,255,0.85)',
    color: '#3f2d1d',
    fontSize: '0.95rem'
  },
  hint: {
    fontSize: '0.85rem',
    color: '#665533',
    marginTop: '-0.6rem',
    marginBottom: '1.2rem'
  },
  formGroup: {
    marginBottom: '1.5rem'
  },
  addButton: {
    width: '100%',
    padding: '0.7rem',
    borderRadius: 8,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    background: '#fff8bf',
    color: '#4b2f17',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.95rem'
  },
  membersList: {
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(98, 73, 24, 0.2)',
    borderRadius: 8,
    padding: '1rem',
    marginTop: '1rem'
  },
  memberItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.6rem 0.8rem',
    background: 'rgba(255,255,255,0.8)',
    borderRadius: 6,
    marginBottom: '0.5rem',
    border: '1px solid rgba(98, 73, 24, 0.15)'
  },
  badge: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    background: 'rgba(98, 73, 24, 0.15)',
    padding: '0.3rem 0.6rem',
    borderRadius: 4,
    marginLeft: '0.5rem'
  },
  removeButton: {
    padding: '0.4rem 0.8rem',
    borderRadius: 4,
    border: '1px solid rgba(186, 62, 62, 0.35)',
    background: 'rgba(186, 62, 62, 0.12)',
    color: '#8b1f1f',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 700
  },
  scheduleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  scheduleCard: {
    background: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(98, 73, 24, 0.2)',
    borderRadius: 8,
    padding: '1rem'
  },
  dayInput: {
    marginBottom: '0.7rem'
  },
  dayLabel: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    fontWeight: 700,
    marginBottom: '0.2rem',
    display: 'block',
    color: '#4b2f17'
  },
  smallInput: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: 4,
    border: '1px solid rgba(98, 73, 24, 0.2)',
    background: 'rgba(255,255,255,0.9)',
    color: '#3f2d1d',
    fontSize: '0.85rem'
  },
  footer: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'space-between'
  },
  primaryButton: {
    flex: 1,
    padding: '0.8rem',
    borderRadius: 8,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    background: '#fff4cf',
    color: '#4b2f17',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.95rem'
  },
  secondaryButton: {
    flex: 1,
    padding: '0.8rem',
    borderRadius: 8,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    background: 'rgba(255,255,255,0.6)',
    color: '#4b2f17',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.95rem'
  }
};
