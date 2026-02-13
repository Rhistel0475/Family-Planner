'use client';

import { useState, useEffect } from 'react';
import HamburgerMenu from '../components/HamburgerMenu';

export default function FamilyPage() {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  const [workingHours, setWorkingHours] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const res = await fetch('/api/family-members');
      const data = await res.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setMessage('');
    try {
      const isEditing = !!editingId;
      const endpoint = '/api/family-members';
      const method = isEditing ? 'PATCH' : 'POST';
      const body = isEditing 
        ? { id: editingId, name, role, workingHours }
        : { name, role, workingHours };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setName('');
        setRole('member');
        setWorkingHours('');
        setEditingId(null);
        setMessage(isEditing ? 'Member updated!' : 'Member added!');
        await fetchMembers();
      } else {
        setMessage('Failed to save member');
      }
    } catch (error) {
      console.error('Failed to save member:', error);
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(member) {
    setName(member.name);
    setRole(member.role);
    setWorkingHours(member.workingHours || '');
    setEditingId(member.id);
    setMessage('');
  }

  function cancelEdit() {
    setName('');
    setRole('member');
    setWorkingHours('');
    setEditingId(null);
    setMessage('');
  }

  async function handleDelete(id) {
    console.log('Delete clicked for ID:', id);
    if (!confirm('Remove this family member?')) {
      console.log('User cancelled delete');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/family-members?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setMessage('Member removed!');
        await fetchMembers();
      } else {
        const data = await res.json();
        console.error('Delete failed:', data);
        setMessage('Failed to remove member');
      }
    } catch (error) {
      console.error('Failed to delete member:', error);
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.main}>
      <HamburgerMenu />
      <section style={styles.card}>
        <h1 style={styles.title}>👨‍👩‍👧‍👦 Family Members</h1>
        <p style={styles.subtitle}>Add family members and their working hours to help the AI planner optimize your schedule.</p>

        {message && (
          <div style={{
            padding: '0.8rem',
            marginBottom: '1rem',
            borderRadius: 6,
            background: message.includes('!') ? 'rgba(40,167,69,0.2)' : 'rgba(220,53,69,0.2)',
            border: `1px solid ${message.includes('!') ? 'rgba(40,167,69,0.4)' : 'rgba(220,53,69,0.4)'}`,
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleAddMember} style={styles.form}>
          <label style={styles.label}>Name *</label>
          <input
            name="name"
            style={styles.input}
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label style={styles.label}>Role</label>
          <select
            name="role"
            style={styles.input}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="parent">👨‍👩‍ Parent</option>
            <option value="kid">🧒 Kid</option>
            <option value="member">👤 Member</option>
          </select>

          <label style={styles.label}>Working Hours (optional)</label>
          <input
            name="workingHours"
            style={styles.input}
            placeholder="e.g., 9-5, 8am-4pm, or Not working"
            value={workingHours}
            onChange={(e) => setWorkingHours(e.target.value)}
          />
          <small style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.75rem', color: '#5f2b4b' }}>
            For kids or non-working members, leave blank or write "Not working"
          </small>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Member' : 'Add Member'}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={cancelEdit}
                style={{...styles.button, background: '#ddd', color: '#333', flex: '0 0 auto'}}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div style={styles.membersList}>
          <h2 style={styles.subtitle}>Current Members</h2>
          {members.length === 0 ? (
            <p>No family members added yet.</p>
          ) : (
            <ul style={styles.list}>
              {members.map((member) => (
                <li key={member.id} style={styles.listItem}>
                  <div>
                    <div>
                      <strong>{member.name}</strong> <span style={styles.badge}>{member.role}</span>
                    </div>
                    {member.workingHours && (
                      <div style={{ fontSize: '0.8rem', color: '#5f2b4b', marginTop: '0.2rem' }}>
                        ⏰ {member.workingHours}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(member)}
                      style={{...styles.actionButton, background: '#ffc107', color: '#000'}}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(member.id)}
                      style={{...styles.actionButton, background: '#dc3545', color: '#fff'}}
                    >
                      🗑️
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
  },
  actionButton: {
    border: 'none',
    borderRadius: 4,
    padding: '0.4rem 0.6rem',
    cursor: 'pointer',
    fontSize: '0.9rem'
  }
};
