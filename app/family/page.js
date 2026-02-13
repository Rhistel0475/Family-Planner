'use client';

import { useState, useEffect } from 'react';

export default function FamilyPage() {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const res = await fetch('/api/family/members');
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/family/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role })
      });

      if (res.ok) {
        setName('');
        fetchMembers();
      }
    } catch (error) {
      console.error('Failed to add member:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.main}>
      <section style={styles.card}>
        <h1 style={styles.title}>Family Members</h1>
        <p style={styles.subtitle}>Add family members to enable smart assignments.</p>

        <form onSubmit={handleAddMember} style={styles.form}>
          <label style={styles.label}>Name</label>
          <input
            name="name"
            style={styles.input}
            placeholder="Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label style={styles.label}>Role</label>
          <select
            name="role"
            style={styles.input}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option>member</option>
            <option>parent</option>
            <option>kid</option>
          </select>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </form>

        <div style={styles.membersList}>
          <h2 style={styles.subtitle}>Current Members</h2>
          {members.length === 0 ? (
            <p>No family members added yet.</p>
          ) : (
            <ul style={styles.list}>
              {members.map((member) => (
                <li key={member.id} style={styles.listItem}>
                  <strong>{member.name}</strong> <span style={styles.badge}>{member.role}</span>
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
    maxWidth: 560,
    margin: '0 auto',
    background: '#ffd6e7',
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
  form: {
    marginBottom: '1.5rem'
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
    background: '#ffe7f0',
    color: '#5f2b4b',
    fontWeight: 700,
    cursor: 'pointer'
  },
  membersList: {
    borderTop: '1px solid rgba(98, 73, 24, 0.2)',
    paddingTop: '1rem'
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  listItem: {
    background: 'rgba(255,255,255,0.5)',
    border: '1px solid rgba(98, 73, 24, 0.18)',
    borderRadius: 6,
    padding: '0.6rem 0.8rem',
    marginBottom: '0.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badge: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    background: 'rgba(98, 73, 24, 0.2)',
    padding: '0.2rem 0.5rem',
    borderRadius: 4
  }
};
