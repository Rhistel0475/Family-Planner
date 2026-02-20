'use client';

import { useEffect, useState } from 'react';
import { getRotationAngle, getStatusString } from '../../lib/boardChores';
import { useTheme } from '../providers/ThemeProvider';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { Label, Input, Select } from '../components/form';
import styles from './chores.module.css';

const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Biweekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'CUSTOM', label: 'Custom (every N days)' }
];

const DUE_DAY_OPTIONS = [
  { value: 'SUN', label: 'Sunday' },
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' },
  { value: 'SAT', label: 'Saturday' }
];

const formGroupStyle = { marginBottom: '1.25rem' };

export default function ChoresPage() {
  const { theme } = useTheme();
  const [settings, setSettings] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const [message, setMessage] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [setDueDayChecked, setSetDueDayChecked] = useState(false);

  useEffect(() => {
    fetchBoardSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBoardSettings = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/chore-board');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.error && !data.settings) throw new Error(data.error);

      setSettings(Array.isArray(data.settings) ? data.settings : []);
      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch (error) {
      console.error('Failed to fetch chore board:', error);
      setMessage({ type: 'error', text: 'Failed to load chore board' });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (templateKey, updates) => {
    setSettings((prev) =>
      prev.map((s) => (s.templateKey === templateKey ? { ...s, ...updates } : s))
    );
  };

  const handleFrequencyChange = (templateKey, frequencyType) => {
    const updates = { frequencyType };
    if (frequencyType !== 'CUSTOM') updates.customEveryDays = null;
    if (frequencyType !== 'WEEKLY') updates.daysPerWeek = null;
    if (frequencyType === 'WEEKLY') {
      const current = settings.find(s => s.templateKey === templateKey);
      updates.daysPerWeek = current?.daysPerWeek ?? 1;
    }
    handleSettingChange(templateKey, updates);
  };

  const handleEligibilityModeChange = (templateKey, mode) => {
    const updates = { eligibilityMode: mode };
    if (mode === 'ALL') updates.eligibleMemberIds = [];
    handleSettingChange(templateKey, updates);
  };

  const handleToggleMember = (templateKey, memberId) => {
    setSettings((prev) =>
      prev.map((s) => {
        if (s.templateKey !== templateKey) return s;
        const current = s.eligibleMemberIds || [];
        const next = current.includes(memberId)
          ? current.filter((id) => id !== memberId)
          : [...current, memberId];
        return { ...s, eligibleMemberIds: next };
      })
    );
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);

      // Validate settings before saving
      for (const setting of settings) {
        // If not recurring, force ONE_TIME
        if (!setting.isRecurring && setting.frequencyType !== 'ONE_TIME') {
          setMessage({ type: 'error', text: `${setting.title}: Disable recurring to use One-time` });
          return;
        }

        if (setting.frequencyType === 'CUSTOM' && (!setting.customEveryDays || setting.customEveryDays < 1)) {
          setMessage({ type: 'error', text: `${setting.title}: Custom frequency requires a valid day count` });
          return;
        }

        if (setting.eligibilityMode === 'SELECTED' && (!setting.eligibleMemberIds || setting.eligibleMemberIds.length === 0)) {
          setMessage({ type: 'error', text: `${setting.title}: SELECTED mode requires at least 1 member` });
          return;
        }
      }

      const res = await fetch('/api/chore-board', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      setMessage({ type: 'success', text: `Saved ${data.updated} chore${data.updated !== 1 ? 's' : ''}` });
      setExpandedKey(null);

      setTimeout(() => {
        fetchBoardSettings();
        setMessage(null);
      }, 1000);
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddChore = async (e) => {
    e.preventDefault();
    setAddLoading(true);

    try {
      const formData = new FormData(e.target);

      const title = (formData.get('title') || '').toString().trim();
      const assignedMemberId = (formData.get('assignedTo') || '').toString() || null;

      // You capture these for UI now; if you want persistence, add fields to schema + API
      const setDueDay = formData.get('setDueDay') === 'on';
      const dueDay = setDueDay ? (formData.get('dueDay') || '').toString() : null;

      if (!title) {
        setMessage({ type: 'error', text: 'Please enter a chore title' });
        setAddLoading(false);
        return;
      }

      const templateKey =
        'custom_' +
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '') +
        '_' +
        Date.now();

      console.log('🔵 Adding custom chore:', title);
      console.log('🔵 Generated templateKey:', templateKey);
      console.log('🔵 Set Due Day:', setDueDay, 'Due Day:', dueDay);

      const boardRes = await fetch('/api/chore-board', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            {
              templateKey,
              title,
              isRecurring: false,
              frequencyType: 'ONE_TIME',
              customEveryDays: null,
              eligibilityMode: 'ALL',
              eligibleMemberIds: [],
              defaultAssigneeMemberId: assignedMemberId
            }
          ]
        })
      });

      const boardData = await boardRes.json();
      if (!boardRes.ok) throw new Error(boardData.error || 'Failed to add chore to board');

      setMessage({ type: 'success', text: '✓ Chore added to board. Use "Smart Chore Assignment" to schedule it.' });
      setShowAddModal(false);
      setSetDueDayChecked(false);
      e.target.reset();

      setTimeout(() => {
        fetchBoardSettings();
        setMessage(null);
      }, 1500);
    } catch (error) {
      console.error('Add chore error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save chore' });
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading chore board...</div>;
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>Chores</h1>
          <p>Configure your chore board, assignments, and schedules.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setShowAddModal(true)}
            aria-label="Add chore"
            title="Add chore"
          >
            +
          </button>

          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSaveAll}
            disabled={saving}
            title="Save all changes"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={[
            styles.message,
            message.type === 'success' ? styles.message_success : styles.message_error
          ].join(' ')}
        >
          {message.text}
        </div>
      )}

      {/* BOARD */}
      <div className={styles.board}>
        {settings.map((setting) => (
          <ChoreCard
            key={setting.templateKey}
            setting={setting}
            members={members}
            expanded={expandedKey === setting.templateKey}
            onToggleExpand={() =>
              setExpandedKey(expandedKey === setting.templateKey ? null : setting.templateKey)
            }
            onChange={(updates) => handleSettingChange(setting.templateKey, updates)}
            onFrequencyChange={(freq) => handleFrequencyChange(setting.templateKey, freq)}
            onEligibilityModeChange={(mode) => handleEligibilityModeChange(setting.templateKey, mode)}
            onToggleMember={(memberId) => handleToggleMember(setting.templateKey, memberId)}
          />
        ))}
      </div>

      {/* FOOTER (optional extra save button at bottom for long pages) */}
      <div className={styles.footer}>
        <button type="button" className={styles.saveButton} onClick={handleSaveAll} disabled={saving}>
          {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>

      {/* ADD CHORE MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSetDueDayChecked(false);
        }}
        title="Add a chore"
        size="small"
      >
        <form onSubmit={handleAddChore}>
          <div style={formGroupStyle}>
            <Label>Chore Title</Label>
            <Input name="title" placeholder="e.g., Take out trash" />
          </div>

          <div style={formGroupStyle}>
            <Label>Assign To (optional)</Label>
            <Select name="assignedTo" defaultValue="">
              <option value="">No default assignee</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>

          <div style={formGroupStyle}>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: theme.card.text, fontWeight: 600 }}>
              <input
                type="checkbox"
                name="setDueDay"
                checked={setDueDayChecked}
                onChange={(e) => setSetDueDayChecked(e.target.checked)}
              />
              Set Due Day
            </label>

            {setDueDayChecked && (
              <div style={{ marginTop: '0.75rem' }}>
                <Label>Due Day</Label>
                <Select name="dueDay" defaultValue="MON">
                  {DUE_DAY_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: `1px solid ${theme.card.border}` }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                setSetDueDayChecked(false);
              }}
              disabled={addLoading}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={addLoading} style={{ flex: 1 }}>
              {addLoading ? 'Adding…' : 'Add Chore'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ChoreCard({
  setting,
  members,
  expanded,
  onToggleExpand,
  onChange,
  onFrequencyChange,
  onEligibilityModeChange,
  onToggleMember
}) {
  const rotation = getRotationAngle(setting.templateKey);
  const statusStr = getStatusString(setting);

  const cardClass = expanded ? `${styles.card} ${styles.expanded}` : styles.card;

  return (
    <div
      className={cardClass}
      style={{ '--rotation': rotation }}
      onClick={onToggleExpand}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onToggleExpand();
      }}
    >
      <div className={styles.cardHeader}>
        <h3>{setting.title}</h3>
        <div className={styles.status}>{statusStr}</div>
        <div className={styles.expandIcon}>{expanded ? '−' : '+'}</div>
      </div>

      {expanded && (
        <div className={styles.cardContent} onClick={(e) => e.stopPropagation()}>
          {/* Recurring */}
          <div className={styles.section}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!setting.isRecurring}
                onChange={(e) => {
                  const isRecurring = e.target.checked;
                  onChange({
                    isRecurring,
                    frequencyType: isRecurring ? 'WEEKLY' : 'ONE_TIME',
                    customEveryDays: isRecurring ? setting.customEveryDays : null,
                    daysPerWeek: isRecurring ? (setting.daysPerWeek ?? 1) : null
                  });
                }}
              />
              Recurring
            </label>
            <small>If unchecked, this becomes One-time and AI can schedule it when requested.</small>

            {setting.isRecurring && (
              <div className={styles.frequencyGroup}>
                <label>Frequency</label>
                <select
                  value={setting.frequencyType || 'WEEKLY'}
                  onChange={(e) => onFrequencyChange(e.target.value)}
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {setting.frequencyType === 'CUSTOM' && (
                  <div className={styles.customDays}>
                    <label>Every</label>
                    <input
                      type="number"
                      min={1}
                      value={setting.customEveryDays ?? 1}
                      onChange={(e) =>
                        onChange({ customEveryDays: parseInt(e.target.value, 10) || 1 })
                      }
                    />
                    <span>days</span>
                  </div>
                )}

                {setting.frequencyType === 'WEEKLY' && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div className={styles.customDays}>
                      <label>Days per week</label>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        value={setting.daysPerWeek ?? 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            onChange({ daysPerWeek: Math.min(7, Math.max(1, val)) });
                          }
                        }}
                      />
                    </div>
                    <small style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.35rem' }}>
                      How many days this week the chore should be done. AI will distribute and assign.
                    </small>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Default Assignee */}
          <div className={styles.section}>
            <label>Default Assignee</label>
            <select
              value={setting.defaultAssigneeMemberId || ''}
              onChange={(e) => onChange({ defaultAssigneeMemberId: e.target.value || null })}
            >
              <option value="">No default (AI decides)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <small>AI can still rotate or reassign based on eligibility and workload.</small>
          </div>

          {/* Eligibility */}
          <div className={styles.section}>
            <label>Eligible Members</label>

            <div className={styles.eligibilityMode}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name={`elig-${setting.templateKey}`}
                  checked={setting.eligibilityMode !== 'SELECTED'}
                  onChange={() => onEligibilityModeChange('ALL')}
                />
                All members
              </label>

              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name={`elig-${setting.templateKey}`}
                  checked={setting.eligibilityMode === 'SELECTED'}
                  onChange={() => onEligibilityModeChange('SELECTED')}
                />
                Selected only
              </label>
            </div>

            {setting.eligibilityMode === 'SELECTED' && (
              <div className={styles.memberCheckboxes}>
                {members.map((m) => (
                  <label key={m.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={(setting.eligibleMemberIds || []).includes(m.id)}
                      onChange={() => onToggleMember(m.id)}
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            )}

            <small>
              Use SELECTED if you only want certain people eligible for this chore.
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
