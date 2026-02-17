'use client';

import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import QuickAddButton from '../components/QuickAddButton';

import { MemberCardSkeleton } from '../components/LoadingSkeleton';
import { useSaveStatus, InlineSaveIndicator } from '../components/SaveIndicator';
import { useToastQueue, ToastContainer } from '../components/EnhancedToast';

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

const WORKING_HOURS_PRESETS = [
  'Off',
  '7:00 AM - 3:00 PM',
  '8:00 AM - 4:00 PM',
  '9:00 AM - 5:00 PM',
  '10:00 AM - 6:00 PM',
  '11:00 AM - 7:00 PM',
  'Custom…'
];

export default function FamilyPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    color: PRESET_COLORS[0].value,
    avatar: AVATAR_EMOJIS[0],
    workingHours: ''
  });

  // Inline edit state (optional but handy)
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineWorkingHours, setInlineWorkingHours] = useState('');

  const { status: saveStatus, save } = useSaveStatus();
  const { toasts, success, error, removeToast } = useToastQueue();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      setLoading(true);

      try {
        const res = await Promise.race([
          fetch('/api/family-members'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
        ]);

        if (!mounted) return;

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted) {
          setMembers(Array.isArray(data.members) ? data.members : []);
        }
      } catch (err) {
        console.error('Fetch failed:', err);
        if (mounted) {
          setMembers([]);
          error('Failed to load family members');
        }
      } finally {
        if (mounted) setLoading(false);
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
      } else {
        error('Failed to load family members');
      }
    } catch (err) {
      console.error(err);
      error('Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      color: PRESET_COLORS[0].value,
      avatar: AVATAR_EMOJIS[0],
      workingHours: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      color: member.color || PRESET_COLORS[0].value,
      avatar: member.avatar || AVATAR_EMOJIS[0],
      workingHours: member.workingHours || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      error('Please enter a name');
      return;
    }

    try {
      await save(async () => {
        const url = '/api/family-members';
        const method = editingMember ? 'PATCH' : 'POST';
        const payload = editingMember
          ? { id: editingMember.id, ...formData }
          : formData;

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save member');

        await fetchMembers();
      });

      success(editingMember ? 'Member updated!' : 'Member added!');
      setModalOpen(false);
    } catch (err) {
      error(err.message || 'Failed to save member');
    }
  };

  const startInlineEdit = (member) => {
    setInlineEditingId(member.id);
    setInlineWorkingHours(member.workingHours || '');
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineWorkingHours('');
  };

  const saveInlineEdit = async (member) => {
    try {
      await save(async () => {
        const res = await fetch('/api/family-members', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: member.id, workingHours: inlineWorkingHours })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update working hours');

        setMembers((prev) =>
          prev.map((m) =>
            m.id === member.id ? { ...m, workingHours: inlineWorkingHours } : m
          )
        );
      });

      success('Working hours updated!');
      cancelInlineEdit();
    } catch (err) {
      error(err.message || 'Failed to update working hours');
    }
  };

  const handleDelete = async (member) => {
    if (!confirm(`Delete ${member.name}? You can undo within 5 seconds.`)) return;

    const memberToRestore = {
      name: member.name,
      color: member.color,
      avatar: member.avatar,
      workingHours: member.workingHours || ''
    };

    try {
      const res = await fetch(`/api/family-members?id=${member.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete member');
      }

      success(`Deleted ${member.name}`, {
        onUndo: async () => {
          const restoreRes = await fetch('/api/family-members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberToRestore)
          });

          if (restoreRes.ok) {
            fetchMembers();
            success(`Restored ${member.name}`);
          } else {
            const errorData = await restoreRes.json();
            console.error('Restore error:', errorData);
            error('Failed to restore member');
          }
        },
        duration: 5000
      });

      fetchMembers();
    } catch (err) {
      error(err.message || 'Failed to delete member');
    }
  };

  return (
    <main style={styles.main}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Family Members</h1>
        <p style={styles.subtitle}>
          Manage family members and set their working hours (so Schedule stays focused on events).
        </p>

        <div style={styles.addButtonContainer}>
          <QuickAddButton onClick={openAddModal} icon="+" label="Add Member" color="#c9f7a5" />
        </div>
      </section>

      {loading ? (
        <section style={styles.grid}>
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
        </section>
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

                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Working hours:</span>

                  {inlineEditingId === member.id ? (
                    <div style={styles.inlineEditRow}>
                      <input
                        style={styles.inlineInput}
                        value={inlineWorkingHours}
                        onChange={(e) => setInlineWorkingHours(e.target.value)}
                        placeholder="e.g., 9:00 AM - 5:00 PM"
                      />
                      <button style={styles.inlineSaveBtn} onClick={() => saveInlineEdit(member)}>
                        Save <InlineSaveIndicator status={saveStatus} />
                      </button>
                      <button style={styles.inlineCancelBtn} onClick={cancelInlineEdit}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={styles.metaValueRow}>
                      <span style={styles.metaValue}>
                        {member.workingHours?.trim() ? member.workingHours : 'Not set'}
                      </span>
                      <button style={styles.linkBtn} onClick={() => startInlineEdit(member)}>
                        Edit
                      </button>
                    </div>
                  )}
                </div>

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
                <button onClick={() => openEditModal(member)} style={styles.editBtn}>
                  Edit Profile
                </button>
                <button onClick={() => handleDelete(member)} style={styles.deleteBtn}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

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

            <label style={styles.modalLabel}>Working Hours</label>
            <select
              style={styles.modalInput}
              value={
                WORKING_HOURS_PRESETS.includes(formData.workingHours || '')
                  ? (formData.workingHours || '')
                  : 'Custom…'
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'Custom…') {
                  setFormData({ ...formData, workingHours: formData.workingHours || '' });
                } else {
                  setFormData({ ...formData, workingHours: v === 'Off' ? '' : v });
                }
              }}
            >
              {WORKING_HOURS_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <input
              style={styles.modalInput}
              placeholder='Custom working hours (e.g., "Tue/Thu 10-2")'
              value={formData.workingHours || ''}
              onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
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
                  type="button"
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
                  type="button"
                />
              ))}
            </div>

            <button onClick={handleSubmit} style={styles.modalButton} type="button">
              {editingMember ? 'Update Member' : 'Add Member'}
              <InlineSaveIndicator status={saveStatus} />
            </button>
          </div>
        </Modal>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} position="bottom-right" />
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
  emptyState: {
    maxWidth: 500,
    margin: '3rem auto',
    textAlign: 'center',
    padding: '3rem 2rem',
    background: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    border: '2px dashed rgba(98, 73, 24, 0.3)'
  },
  emptyIcon: { fontSize: '4rem', margin: '0 0 1rem 0' },
  emptyText: { fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' },
  emptySubtext: { fontSize: '1rem', opacity: 0.8, margin: 0 },

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
    overflow: 'hidden'
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
  cardBody: { padding: '1.5rem', textAlign: 'center' },
  memberName: { margin: '0 0 0.75rem 0', fontSize: '1.5rem' },

  metaRow: {
    background: 'rgba(255,255,255,0.55)',
    border: '1px solid rgba(98, 73, 24, 0.16)',
    borderRadius: 10,
    padding: '0.7rem 0.75rem',
    marginBottom: '0.9rem',
    textAlign: 'left'
  },
  metaLabel: { fontSize: '0.85rem', fontWeight: 900, opacity: 0.9, display: 'block', marginBottom: '0.3rem' },
  metaValueRow: { display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' },
  metaValue: { fontWeight: 800 },

  linkBtn: {
    border: 'none',
    background: 'transparent',
    color: '#3b82f6',
    fontWeight: 900,
    cursor: 'pointer',
    textDecoration: 'underline'
  },

  inlineEditRow: { display: 'grid', gap: '0.5rem' },
  inlineInput: {
    width: '100%',
    padding: '0.6rem',
    borderRadius: 8,
    border: '1px solid rgba(98, 73, 24, 0.22)',
    background: 'rgba(255,255,255,0.9)'
  },
  inlineSaveBtn: {
    width: '100%',
    padding: '0.65rem',
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.26)',
    background: '#c9f7a5',
    color: '#2b4d1f',
    fontWeight: 900,
    cursor: 'pointer'
  },
  inlineCancelBtn: {
    width: '100%',
    padding: '0.6rem',
    borderRadius: 10,
    border: '1px solid rgba(98, 73, 24, 0.16)',
    background: 'rgba(255,255,255,0.6)',
    color: '#3f2d1d',
    fontWeight: 900,
    cursor: 'pointer'
  },

  colorPreview: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' },
  colorLabel: { fontSize: '0.9rem', opacity: 0.8 },
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
    fontWeight: 900,
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  deleteBtn: {
    flex: 1,
    padding: '0.75rem',
    border: 'none',
    background: 'transparent',
    color: '#ba3e3e',
    fontWeight: 900,
    cursor: 'pointer',
    fontSize: '0.9rem'
  },

  modalForm: { display: 'grid', gap: '0.75rem' },
  modalLabel: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 900,
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
  avatarGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' },
  avatarOption: {
    padding: '0.75rem',
    fontSize: '2rem',
    borderRadius: 8,
    background: 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer'
  },
  colorGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' },
  colorOption: { width: '100%', height: '50px', borderRadius: 8, cursor: 'pointer' },

  modalButton: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 8,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    background: '#c9f7a5',
    color: '#2b4d1f',
    fontWeight: 900,
    cursor: 'pointer',
    fontSize: '0.95rem',
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  }
};
