'use client';

import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import QuickAddButton from '../components/QuickAddButton';

const PRESET_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' }
];

const AVATAR_EMOJIS = ['👨', '👩', '👦', '👧', '🧑', '👴', '👵', '👶'];

export default function FamilyPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: PRESET_COLORS[0].value, avatar: AVATAR_EMOJIS[0] });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      setLoading(true);
      
      try {
        const res = await Promise.race([
          fetch('/api/family-members'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
        
        if (!mounted) return;
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted) {
          setMembers(Array.isArray(data.members) ? data.members : []);
        }
      } catch (error) {
        console.error('Fetch failed:', error);
        if (mounted) {
          setMembers([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/family-members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      showToast('Failed to load family members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({ name: '', color: PRESET_COLORS[0].value, avatar: AVATAR_EMOJIS[0] });
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({ 
      name: member.name, 
      color: member.color || PRESET_COLORS[0].value,
      avatar: member.avatar || AVATAR_EMOJIS[0] 
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('Please enter a name', 'error');
      return;
    }

    try {
      const url = editingMember ? '/api/family-members' : '/api/family-members';
      const method = editingMember ? 'PATCH' : 'POST';
      const payload = editingMember ? { id: editingMember.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'Failed to save member';
        throw new Error(errorMsg);
      }

      showToast(editingMember ? 'Member updated!' : 'Member added!');
      setModalOpen(false);
      fetchMembers();
    } catch (error) {
      showToast(error.message || 'Failed to save member', 'error');
    }
  };

  const handleDelete = async (memberId) => {
    if (!confirm('Delete this family member? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/family-members?id=${memberId}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) {
        const errorMsg = data.error || 'Failed to delete member';
        throw new Error(errorMsg);
      }

      showToast('Member deleted');
      fetchMembers();
    } catch (error) {
      showToast(error.message || 'Failed to delete member', 'error');
    }
  };

  return (
    <main style={styles.main}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Family Members</h1>
        <p style={styles.subtitle}>
          Manage your family members to assign chores and track completion.
        </p>
        <div style={styles.addButtonContainer}>
          <QuickAddButton
            onClick={openAddModal}
            icon="+"
            label="Add Member"
            color="#c9f7a5"
          />
        </div>
      </section>

      {loading && members.length === 0 ? (
        <div style={styles.loading}>Loading family members...</div>
      ) : members.length === 0 ? (
        <section style={styles.emptyState}>
          <p style={styles.emptyIcon}>👥</p>
          <p style={styles.emptyText}>No family members yet</p>
          <p style={styles.emptySubtext}>Add your first family member to get started!</p>
        </section>
      ) : (
        <section style={styles.grid}>
          {members.map((member) => (
            <article key={member.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div
                  style={{
                    ...styles.avatar,
                    background: member.color || PRESET_COLORS[0].value
                  }}
                >
                  {member.avatar || AVATAR_EMOJIS[0]}
                </div>
              </div>
              <div style={styles.cardBody}>
                <h2 style={styles.memberName}>{member.name}</h2>
                <div style={styles.colorPreview}>
                  <span style={styles.colorLabel}>Color:</span>
                  <div
                    style={{
                      ...styles.colorSwatch,
                      background: member.color || PRESET_COLORS[0].value
                    }}
                  />
                </div>
              </div>
              <div style={styles.cardActions}>
                <button
                  onClick={() => openEditModal(member)}
                  style={styles.editBtn}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  style={styles.deleteBtn}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          title={editingMember ? 'Edit Member' : 'Add Member'}
          size="small"
        >
          <div style={styles.modalForm}>
            <label style={styles.modalLabel}>Name</label>
            <input
              style={styles.modalInput}
              placeholder="Enter name..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />

            <label style={styles.modalLabel}>Avatar</label>
            <div style={styles.avatarGrid}>
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setFormData({ ...formData, avatar: emoji })}
                  style={{
                    ...styles.avatarOption,
                    border: formData.avatar === emoji ? '3px solid #3b82f6' : '1px solid rgba(98, 73, 24, 0.2)'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <label style={styles.modalLabel}>Color</label>
            <div style={styles.colorGrid}>
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  style={{
                    ...styles.colorOption,
                    background: color.value,
                    border: formData.color === color.value ? '3px solid #3f2d1d' : 'none'
                  }}
                  title={color.name}
                />
              ))}
            </div>

            <button onClick={handleSubmit} style={styles.modalButton}>
              {editingMember ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
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
  title: {
    margin: 0,
    fontSize: 'clamp(2rem, 7vw, 2.5rem)',
    letterSpacing: '0.01em'
  },
  subtitle: {
    marginTop: '0.75rem',
    lineHeight: 1.5,
    maxWidth: 620,
    marginInline: 'auto'
  },
  addButtonContainer: {
    marginTop: '1.5rem',
    display: 'flex',
    justifyContent: 'center'
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1.2rem',
    color: '#5b4228'
  },
  emptyState: {
    maxWidth: 500,
    margin: '3rem auto',
    textAlign: 'center',
    padding: '3rem 2rem',
    background: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    border: '2px dashed rgba(98, 73, 24, 0.3)'
  },
  emptyIcon: {
    fontSize: '4rem',
    margin: '0 0 1rem 0'
  },
  emptyText: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: '0 0 0.5rem 0'
  },
  emptySubtext: {
    fontSize: '1rem',
    opacity: 0.8,
    margin: 0
  },
  grid: {
    maxWidth: 980,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    background: '#fff59d',
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.2)',
    boxShadow: '0 10px 20px rgba(70, 45, 11, 0.2)',
    overflow: 'hidden',
    transition: 'transform 0.2s ease'
  },
  cardHeader: {
    padding: '2rem',
    display: 'flex',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.4)'
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    border: '3px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  },
  cardBody: {
    padding: '1.5rem',
    textAlign: 'center'
  },
  memberName: {
    margin: '0 0 1rem 0',
    fontSize: '1.5rem'
  },
  colorPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  colorLabel: {
    fontSize: '0.9rem',
    opacity: 0.8
  },
  colorSwatch: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
  },
  cardActions: {
    display: 'flex',
    borderTop: '1px solid rgba(98, 73, 24, 0.2)',
    background: 'rgba(255, 255, 255, 0.3)'
  },
  editBtn: {
    flex: 1,
    padding: '0.75rem',
    border: 'none',
    borderRight: '1px solid rgba(98, 73, 24, 0.2)',
    background: 'transparent',
    color: '#3f2d1d',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  deleteBtn: {
    flex: 1,
    padding: '0.75rem',
    border: 'none',
    background: 'transparent',
    color: '#ba3e3e',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.9rem'
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
    color: '#3f2d1d',
    marginTop: '0.5rem'
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
  avatarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.5rem'
  },
  avatarOption: {
    padding: '0.75rem',
    fontSize: '2rem',
    borderRadius: 8,
    background: 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.5rem'
  },
  colorOption: {
    width: '100%',
    height: '50px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
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
