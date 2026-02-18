'use client';

import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import QuickAddButton from '../components/QuickAddButton';
import { MemberCardSkeleton } from '../components/LoadingSkeleton';
import { useSaveStatus, InlineSaveIndicator } from '../components/SaveIndicator';
import { useToastQueue, ToastContainer } from '../components/EnhancedToast';
import {
  ABILITY_OPTIONS,
  DIETARY_OPTIONS,
  RELATIONSHIP_OPTIONS,
  ROLE_OPTIONS,
  CHORE_PREFERENCE_OPTIONS,
  AVAILABILITY_DAYS
} from '../../lib/memberConstants';
import { AVATAR_STYLES, getInitials, getAvatarStyle } from '../../lib/avatarUtils';
import MemberAvatar from '../components/MemberAvatar';

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

const WORKING_HOURS_PRESETS = [
  'Off',
  '6:00 AM - 2:00 PM',
  '6:00 AM - 3:00 PM',
  '7:00 AM - 3:00 PM',
  '8:00 AM - 4:00 PM',
  '9:00 AM - 5:00 PM',
  '10:00 AM - 6:00 PM',
  '11:00 AM - 7:00 PM',
  '12:00 PM - 8:00 PM',
  '1:00 PM - 9:00 PM',
  'Custom…'
];

const TABS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'health', label: 'Health & Diet' }
];

const DEFAULT_AVAILABILITY = {};
AVAILABILITY_DAYS.forEach(day => {
  DEFAULT_AVAILABILITY[day] = { available: true, from: '', to: '' };
});

function buildDefaultFormData() {
  return {
    name: '',
    age: '',
    role: 'member',
    relationship: '',
    color: PRESET_COLORS[0].value,
    avatar: 'circle',
    workingHours: '',
    availability: { ...DEFAULT_AVAILABILITY },
    activities: '',
    abilities: [],
    chorePreferences: { likes: [], dislikes: [] },
    restrictions: '',
    dietaryRestrictions: []
  };
}

function TagPicker({ options, selected, onToggle, onAddCustom, color }) {
  const [custom, setCustom] = useState('');
  const accentBg = color || 'rgba(59, 130, 246, 0.15)';
  const accentBorder = color ? color.replace('0.15', '0.4') : 'rgba(59, 130, 246, 0.4)';

  return (
    <div>
      <div style={s.tagGrid}>
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              style={{
                ...s.tag,
                background: active ? accentBg : 'rgba(255,255,255,0.5)',
                border: active ? `2px solid ${accentBorder}` : '1px solid rgba(98,73,24,0.15)',
                fontWeight: active ? 700 : 400
              }}
            >
              {active && '✓ '}{opt}
            </button>
          );
        })}
        {selected.filter(v => !options.includes(v)).map(custom => (
          <button
            key={custom}
            type="button"
            onClick={() => onToggle(custom)}
            style={{
              ...s.tag,
              background: accentBg,
              border: `2px solid ${accentBorder}`,
              fontWeight: 700
            }}
          >
            ✓ {custom} ✕
          </button>
        ))}
      </div>
      {onAddCustom && (
        <div style={s.customTagRow}>
          <input
            style={s.customTagInput}
            placeholder="Add custom..."
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && custom.trim()) {
                e.preventDefault();
                onAddCustom(custom.trim());
                setCustom('');
              }
            }}
          />
          <button
            type="button"
            style={s.customTagBtn}
            onClick={() => {
              if (custom.trim()) {
                onAddCustom(custom.trim());
                setCustom('');
              }
            }}
          >+</button>
        </div>
      )}
    </div>
  );
}

export default function FamilyPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState(buildDefaultFormData());

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
        if (mounted) setMembers(Array.isArray(data.members) ? data.members : []);
      } catch (err) {
        console.error('Fetch failed:', err);
        if (mounted) { setMembers([]); error('Failed to load family members'); }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
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
    setFormData(buildDefaultFormData());
    setActiveTab('basic');
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      age: member.age !== null && member.age !== undefined ? String(member.age) : '',
      role: member.role || 'member',
      relationship: member.relationship || '',
      color: member.color || PRESET_COLORS[0].value,
      avatar: getAvatarStyle(member.avatar),
      workingHours: member.workingHours || '',
      availability: member.availability || { ...DEFAULT_AVAILABILITY },
      activities: member.activities || '',
      abilities: member.abilities || [],
      chorePreferences: member.chorePreferences || { likes: [], dislikes: [] },
      restrictions: member.restrictions || '',
      dietaryRestrictions: member.dietaryRestrictions || []
    });
    setActiveTab('basic');
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { error('Please enter a name'); return; }

    try {
      await save(async () => {
        const url = '/api/family-members';
        const method = editingMember ? 'PATCH' : 'POST';
        const payload = {
          ...(editingMember ? { id: editingMember.id } : {}),
          name: formData.name,
          age: formData.age !== '' ? parseInt(formData.age, 10) : null,
          role: formData.role,
          relationship: formData.relationship || null,
          color: formData.color,
          avatar: formData.avatar,
          workingHours: formData.workingHours,
          availability: formData.availability,
          activities: formData.activities,
          abilities: formData.abilities,
          chorePreferences: formData.chorePreferences,
          restrictions: formData.restrictions,
          dietaryRestrictions: formData.dietaryRestrictions
        };

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

  const handleDelete = async (member) => {
    if (!confirm(`Delete ${member.name}?`)) return;
    try {
      const res = await fetch(`/api/family-members?id=${member.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete member');
      success(`Deleted ${member.name}`);
      fetchMembers();
    } catch (err) {
      error(err.message || 'Failed to delete member');
    }
  };

  const toggleArrayItem = (arr, item) =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];

  const updateForm = (patch) => setFormData(prev => ({ ...prev, ...patch }));

  const availDaysSummary = (avail) => {
    if (!avail) return null;
    const count = AVAILABILITY_DAYS.filter(d => avail[d]?.available !== false).length;
    return `${count}/7 days`;
  };

  const renderBasicTab = () => (
    <div style={s.tabContent}>
      <label style={s.label}>Name</label>
      <input
        style={s.input}
        placeholder="Enter name..."
        value={formData.name}
        onChange={e => updateForm({ name: e.target.value })}
        autoFocus
      />

      <div style={s.row2}>
        <div style={s.col}>
          <label style={s.label}>Age</label>
          <input
            style={s.input}
            type="number"
            min="0"
            max="120"
            placeholder="Age"
            value={formData.age}
            onChange={e => updateForm({ age: e.target.value })}
          />
        </div>
        <div style={s.col}>
          <label style={s.label}>Role</label>
          <select
            style={s.input}
            value={formData.role}
            onChange={e => updateForm({ role: e.target.value })}
          >
            {ROLE_OPTIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <label style={s.label}>Relationship</label>
      <select
        style={s.input}
        value={formData.relationship}
        onChange={e => updateForm({ relationship: e.target.value })}
      >
        <option value="">-- Select --</option>
        {RELATIONSHIP_OPTIONS.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <label style={s.label}>Avatar style</label>
      <div style={s.avatarGrid}>
        {AVATAR_STYLES.map(style => (
          <button
            key={style.id}
            onClick={() => updateForm({ avatar: style.id })}
            style={{
              ...s.avatarOption,
              border: formData.avatar === style.id ? '3px solid #3b82f6' : '1px solid rgba(98,73,24,0.2)'
            }}
            type="button"
          >
            <MemberAvatar
              name="AB"
              color={formData.color}
              style={style.id}
              size="sm"
            />
          </button>
        ))}
      </div>

      <label style={s.label}>Color</label>
      <div style={s.colorGrid}>
        {PRESET_COLORS.map(c => (
          <button
            key={c.value}
            onClick={() => updateForm({ color: c.value })}
            style={{
              ...s.colorOption,
              background: c.value,
              border: formData.color === c.value ? '3px solid #3f2d1d' : 'none'
            }}
            title={c.name}
            type="button"
          />
        ))}
      </div>
    </div>
  );

  const renderScheduleTab = () => (
    <div style={s.tabContent}>
      <label style={s.label}>Working Hours</label>
      <select
        style={s.input}
        value={
          !formData.workingHours?.trim()
            ? 'Off'
            : WORKING_HOURS_PRESETS.includes(formData.workingHours)
              ? formData.workingHours
              : 'Custom…'
        }
        onChange={e => {
          const v = e.target.value;
          if (v === 'Custom…') {
            updateForm({ workingHours: formData.workingHours || '' });
          } else {
            updateForm({ workingHours: v === 'Off' ? '' : v });
          }
        }}
      >
        {WORKING_HOURS_PRESETS.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <input
        style={s.input}
        placeholder='Custom (e.g., "Tue/Thu 10-2")'
        value={formData.workingHours || ''}
        onChange={e => updateForm({ workingHours: e.target.value })}
      />

      <label style={{ ...s.label, marginTop: '0.75rem' }}>Weekly Availability</label>
      <p style={s.hint}>Toggle days this person is available for chores/events, and optionally set time windows.</p>
      <div style={s.availGrid}>
        {AVAILABILITY_DAYS.map(day => {
          const dayData = formData.availability?.[day] || { available: true, from: '', to: '' };
          const cap = day.charAt(0).toUpperCase() + day.slice(1, 3);
          return (
            <div key={day} style={{
              ...s.availDay,
              background: dayData.available !== false ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.08)',
              border: dayData.available !== false ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.2)'
            }}>
              <button
                type="button"
                onClick={() => {
                  const newAvail = { ...formData.availability };
                  newAvail[day] = { ...dayData, available: dayData.available === false ? true : false };
                  updateForm({ availability: newAvail });
                }}
                style={{
                  ...s.availToggle,
                  background: dayData.available !== false ? '#22c55e' : '#ef4444',
                  color: '#fff'
                }}
              >
                {cap}
              </button>
              {dayData.available !== false && (
                <div style={s.availTimes}>
                  <input
                    type="time"
                    style={s.timeInput}
                    value={dayData.from || ''}
                    onChange={e => {
                      const newAvail = { ...formData.availability };
                      newAvail[day] = { ...dayData, from: e.target.value };
                      updateForm({ availability: newAvail });
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>to</span>
                  <input
                    type="time"
                    style={s.timeInput}
                    value={dayData.to || ''}
                    onChange={e => {
                      const newAvail = { ...formData.availability };
                      newAvail[day] = { ...dayData, to: e.target.value };
                      updateForm({ availability: newAvail });
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <label style={{ ...s.label, marginTop: '0.75rem' }}>Activities & Commitments</label>
      <textarea
        style={{ ...s.input, minHeight: 70, resize: 'vertical' }}
        placeholder="School Mon-Fri 8am-3pm. Soccer practice Tue/Thu 4-6pm..."
        value={formData.activities}
        onChange={e => updateForm({ activities: e.target.value })}
      />
    </div>
  );

  const renderAbilitiesTab = () => (
    <div style={s.tabContent}>
      <label style={s.label}>What can this person do?</label>
      <p style={s.hint}>Select abilities or add custom ones. The AI uses these to assign age-appropriate tasks.</p>
      <TagPicker
        options={ABILITY_OPTIONS}
        selected={formData.abilities}
        onToggle={item => updateForm({ abilities: toggleArrayItem(formData.abilities, item) })}
        onAddCustom={item => {
          if (!formData.abilities.includes(item)) {
            updateForm({ abilities: [...formData.abilities, item] });
          }
        }}
        color="rgba(34,197,94,0.15)"
      />
    </div>
  );

  const renderPreferencesTab = () => (
    <div style={s.tabContent}>
      <label style={s.label}>Chores They Enjoy</label>
      <p style={s.hint}>AI will try to assign preferred chores when possible.</p>
      <TagPicker
        options={CHORE_PREFERENCE_OPTIONS}
        selected={formData.chorePreferences?.likes || []}
        onToggle={item => updateForm({
          chorePreferences: {
            ...formData.chorePreferences,
            likes: toggleArrayItem(formData.chorePreferences?.likes || [], item)
          }
        })}
        onAddCustom={item => {
          const likes = formData.chorePreferences?.likes || [];
          if (!likes.includes(item)) {
            updateForm({ chorePreferences: { ...formData.chorePreferences, likes: [...likes, item] } });
          }
        }}
        color="rgba(34,197,94,0.15)"
      />

      <label style={{ ...s.label, marginTop: '1rem' }}>Chores They Dislike</label>
      <p style={s.hint}>AI will try to minimize assigning these, but may still need to for fairness.</p>
      <TagPicker
        options={CHORE_PREFERENCE_OPTIONS}
        selected={formData.chorePreferences?.dislikes || []}
        onToggle={item => updateForm({
          chorePreferences: {
            ...formData.chorePreferences,
            dislikes: toggleArrayItem(formData.chorePreferences?.dislikes || [], item)
          }
        })}
        onAddCustom={item => {
          const dislikes = formData.chorePreferences?.dislikes || [];
          if (!dislikes.includes(item)) {
            updateForm({ chorePreferences: { ...formData.chorePreferences, dislikes: [...dislikes, item] } });
          }
        }}
        color="rgba(239,68,68,0.12)"
      />
    </div>
  );

  const renderHealthTab = () => (
    <div style={s.tabContent}>
      <label style={s.label}>Dietary Restrictions</label>
      <p style={s.hint}>Used by AI for meal planning.</p>
      <TagPicker
        options={DIETARY_OPTIONS}
        selected={formData.dietaryRestrictions}
        onToggle={item => updateForm({ dietaryRestrictions: toggleArrayItem(formData.dietaryRestrictions, item) })}
        onAddCustom={item => {
          if (!formData.dietaryRestrictions.includes(item)) {
            updateForm({ dietaryRestrictions: [...formData.dietaryRestrictions, item] });
          }
        }}
        color="rgba(249,115,22,0.15)"
      />

      <label style={{ ...s.label, marginTop: '1rem' }}>Physical Restrictions / Notes</label>
      <p style={s.hint}>Limitations the AI should consider (e.g., bad knee, can't reach high shelves).</p>
      <textarea
        style={{ ...s.input, minHeight: 70, resize: 'vertical' }}
        placeholder="Bad knee - no heavy lifting. Allergic to cleaning chemicals..."
        value={formData.restrictions}
        onChange={e => updateForm({ restrictions: e.target.value })}
      />
    </div>
  );

  return (
    <main style={s.main}>
      <section style={s.hero}>
        <h1 style={s.title}>Family Members</h1>
        <p style={s.subtitle}>
          Build rich profiles so the AI can make smarter assignments for chores, meals, and schedules.
        </p>
        <div style={s.addButtonContainer}>
          <QuickAddButton onClick={openAddModal} icon="+" label="Add Member" color="#c9f7a5" />
        </div>
      </section>

      {loading ? (
        <section style={s.grid}>
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
        </section>
      ) : members.length === 0 ? (
        <section style={s.emptyState}>
          <p style={s.emptyIcon}>👥</p>
          <p style={s.emptyText}>No family members yet</p>
          <p style={s.emptySubtext}>Add your first family member to get started!</p>
        </section>
      ) : (
        <section style={s.grid}>
          {members.map(member => (
            <article key={member.id} style={s.card}>
              <div style={s.cardHeader}>
                <MemberAvatar
                  name={member.name}
                  color={member.color || PRESET_COLORS[0].value}
                  style={getAvatarStyle(member.avatar)}
                  size="lg"
                />
              </div>

              <div style={s.cardBody}>
                <h2 style={s.memberName}>{member.name}</h2>

                <div style={s.badgeRow}>
                  {member.relationship && (
                    <span style={s.badge}>{member.relationship}</span>
                  )}
                  {member.age !== null && member.age !== undefined && (
                    <span style={s.badge}>Age {member.age}</span>
                  )}
                  {member.role && member.role !== 'member' && (
                    <span style={{ ...s.badge, background: 'rgba(168,85,247,0.15)' }}>
                      {member.role}
                    </span>
                  )}
                </div>

                <div style={s.infoGrid}>
                  <div style={s.infoItem}>
                    <span style={s.infoIcon}>🕐</span>
                    <span style={s.infoText}>{member.workingHours?.trim() || 'Off'}</span>
                  </div>

                  {member.abilities && member.abilities.length > 0 && (
                    <div style={s.infoItem}>
                      <span style={s.infoIcon}>💪</span>
                      <span style={s.infoText}>{member.abilities.length} abilities</span>
                    </div>
                  )}

                  {member.dietaryRestrictions && member.dietaryRestrictions.length > 0 && (
                    <div style={s.infoItem}>
                      <span style={s.infoIcon}>🥗</span>
                      <span style={s.infoText}>{member.dietaryRestrictions.join(', ')}</span>
                    </div>
                  )}

                  {member.availability && (
                    <div style={s.infoItem}>
                      <span style={s.infoIcon}>📅</span>
                      <span style={s.infoText}>{availDaysSummary(member.availability)}</span>
                    </div>
                  )}

                  {member.activities && (
                    <div style={s.infoItem}>
                      <span style={s.infoIcon}>⚽</span>
                      <span style={s.infoText}>{member.activities.length > 40 ? member.activities.slice(0, 40) + '...' : member.activities}</span>
                    </div>
                  )}

                  {member.restrictions && (
                    <div style={s.infoItem}>
                      <span style={s.infoIcon}>⚠️</span>
                      <span style={s.infoText}>{member.restrictions.length > 40 ? member.restrictions.slice(0, 40) + '...' : member.restrictions}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={s.cardActions}>
                <button onClick={() => openEditModal(member)} style={s.editBtn}>Edit Profile</button>
                <button onClick={() => handleDelete(member)} style={s.deleteBtn}>Delete</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          title={editingMember ? `Edit ${formData.name || 'Member'}` : 'Add Member'}
          size="medium"
        >
          <div style={s.tabBar}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...s.tabBtn,
                  background: activeTab === tab.id ? '#fff59d' : 'rgba(255,255,255,0.4)',
                  fontWeight: activeTab === tab.id ? 700 : 400,
                  borderBottom: activeTab === tab.id ? '3px solid #eab308' : '3px solid transparent'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={s.tabBody}>
            {activeTab === 'basic' && renderBasicTab()}
            {activeTab === 'schedule' && renderScheduleTab()}
            {activeTab === 'abilities' && renderAbilitiesTab()}
            {activeTab === 'preferences' && renderPreferencesTab()}
            {activeTab === 'health' && renderHealthTab()}
          </div>

          <button onClick={handleSubmit} style={s.submitBtn} type="button">
            {editingMember ? 'Update Member' : 'Add Member'}
            <InlineSaveIndicator status={saveStatus} />
          </button>
        </Modal>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} position="bottom-right" />
    </main>
  );
}

const s = {
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
  title: { margin: 0, fontSize: 'clamp(2rem, 7vw, 2.5rem)', letterSpacing: '0.01em' },
  subtitle: { marginTop: '0.75rem', lineHeight: 1.5, maxWidth: 620, marginInline: 'auto' },
  addButtonContainer: { marginTop: '1.5rem', display: 'flex', justifyContent: 'center' },
  emptyState: {
    maxWidth: 500, margin: '3rem auto', textAlign: 'center',
    padding: '3rem 2rem', background: 'rgba(255,255,255,0.6)',
    borderRadius: 12, border: '2px dashed rgba(98,73,24,0.3)'
  },
  emptyIcon: { fontSize: '4rem', margin: '0 0 1rem 0' },
  emptyText: { fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' },
  emptySubtext: { fontSize: '1rem', opacity: 0.8, margin: 0 },

  grid: {
    maxWidth: 980, margin: '0 auto',
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem'
  },
  card: {
    background: '#fff59d', borderRadius: 10,
    border: '1px solid rgba(98,73,24,0.2)',
    boxShadow: '0 10px 20px rgba(70,45,11,0.2)', overflow: 'hidden'
  },
  cardHeader: {
    padding: '1.5rem', display: 'flex', justifyContent: 'center',
    background: 'rgba(255,255,255,0.4)'
  },
  avatar: {
    width: 80, height: 80, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '2.5rem', border: '3px solid rgba(255,255,255,0.8)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  },
  cardBody: { padding: '1rem 1.25rem', textAlign: 'center' },
  memberName: { margin: '0 0 0.4rem 0', fontSize: '1.4rem' },

  badgeRow: { display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' },
  badge: {
    fontSize: '0.72rem', fontWeight: 600,
    padding: '0.2rem 0.55rem', borderRadius: 9999,
    background: 'rgba(59,130,246,0.12)', color: '#3f2d1d'
  },

  infoGrid: { display: 'grid', gap: '0.4rem', textAlign: 'left' },
  infoItem: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    fontSize: '0.82rem', padding: '0.3rem 0.5rem',
    background: 'rgba(255,255,255,0.5)', borderRadius: 6
  },
  infoIcon: { fontSize: '0.85rem', flexShrink: 0 },
  infoText: { flex: 1, lineHeight: 1.3 },

  cardActions: {
    display: 'flex', borderTop: '1px solid rgba(98,73,24,0.2)',
    background: 'rgba(255,255,255,0.3)'
  },
  editBtn: {
    flex: 1, padding: '0.75rem', border: 'none',
    borderRight: '1px solid rgba(98,73,24,0.2)',
    background: 'transparent', color: '#3f2d1d', fontWeight: 700,
    cursor: 'pointer', fontSize: '0.9rem'
  },
  deleteBtn: {
    flex: 1, padding: '0.75rem', border: 'none',
    background: 'transparent', color: '#ba3e3e', fontWeight: 700,
    cursor: 'pointer', fontSize: '0.9rem'
  },

  tabBar: {
    display: 'flex', gap: '0.25rem', overflowX: 'auto',
    borderBottom: '1px solid rgba(98,73,24,0.15)',
    marginBottom: '0.75rem', paddingBottom: 0
  },
  tabBtn: {
    padding: '0.5rem 0.75rem', border: 'none', cursor: 'pointer',
    fontSize: '0.8rem', borderRadius: '6px 6px 0 0',
    color: '#3f2d1d', whiteSpace: 'nowrap', transition: 'all 0.15s ease'
  },
  tabBody: {
    maxHeight: '55vh', overflowY: 'auto', padding: '0.25rem 0.25rem 0.5rem'
  },
  tabContent: { display: 'grid', gap: '0.5rem' },

  label: {
    fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em',
    fontWeight: 700, color: '#3f2d1d', marginTop: '0.25rem'
  },
  hint: { fontSize: '0.75rem', opacity: 0.65, margin: '0 0 0.25rem 0', lineHeight: 1.35 },
  input: {
    width: '100%', padding: '0.6rem', borderRadius: 6,
    border: '1px solid rgba(98,73,24,0.24)',
    background: 'rgba(255,255,255,0.9)', color: '#3f2d1d', fontSize: '0.9rem'
  },

  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  col: { display: 'grid', gap: '0.25rem' },

  avatarGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' },
  avatarOption: {
    padding: '0.5rem', borderRadius: 8,
    background: 'rgba(255,255,255,0.6)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  colorGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' },
  colorOption: { width: '100%', height: 40, borderRadius: 8, cursor: 'pointer' },

  availGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.3rem'
  },
  availDay: {
    borderRadius: 6, padding: '0.3rem', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: '0.2rem'
  },
  availToggle: {
    width: '100%', padding: '0.3rem', border: 'none', borderRadius: 4,
    fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer'
  },
  availTimes: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem'
  },
  timeInput: {
    width: '100%', padding: '0.15rem', fontSize: '0.9rem',
    fontFamily: "'Trebuchet MS', 'Segoe UI', Arial, sans-serif",
    border: '1px solid rgba(98,73,24,0.15)', borderRadius: 3,
    background: 'rgba(255,255,255,0.8)'
  },

  tagGrid: {
    display: 'flex', flexWrap: 'wrap', gap: '0.35rem'
  },
  tag: {
    padding: '0.3rem 0.6rem', borderRadius: 9999, fontSize: '0.78rem',
    cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap'
  },
  customTagRow: { display: 'flex', gap: '0.35rem', marginTop: '0.4rem' },
  customTagInput: {
    flex: 1, padding: '0.4rem 0.6rem', borderRadius: 6,
    border: '1px solid rgba(98,73,24,0.2)',
    background: 'rgba(255,255,255,0.8)', fontSize: '0.82rem'
  },
  customTagBtn: {
    padding: '0.4rem 0.7rem', borderRadius: 6, border: 'none',
    background: '#22c55e', color: '#fff', fontWeight: 700,
    cursor: 'pointer', fontSize: '1rem'
  },

  submitBtn: {
    width: '100%', padding: '0.75rem', borderRadius: 8,
    border: '1px solid rgba(98,73,24,0.32)',
    background: '#c9f7a5', color: '#2b4d1f', fontWeight: 700,
    cursor: 'pointer', fontSize: '0.95rem', marginTop: '0.75rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
  }
};
