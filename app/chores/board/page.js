'use client';

import { useEffect, useState } from 'react';
import { getRotationAngle, getStatusString } from '../../../lib/boardChores';
import styles from './board.module.css';

export default function ChoreBoardPage() {
  const [settings, setSettings] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchBoardSettings();
  }, []);

  const fetchBoardSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chore-board');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSettings(data.settings || []);
      setMembers(data.members || []);
    } catch (error) {
      console.error('Failed to fetch board settings:', error);
      setMessage({ type: 'error', text: 'Failed to load chore board settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (templateKey, updates) => {
    setSettings(prev =>
      prev.map(s =>
        s.templateKey === templateKey ? { ...s, ...updates } : s
      )
    );
  };

  const handleFrequencyChange = (templateKey, frequencyType) => {
    const updates = { frequencyType };
    if (frequencyType !== 'CUSTOM') {
      updates.customEveryDays = null;
    }
    handleSettingChange(templateKey, updates);
  };

  const handleEligibilityModeChange = (templateKey, mode) => {
    const updates = { eligibilityMode: mode };
    if (mode === 'ALL') {
      updates.eligibleMemberIds = [];
    }
    handleSettingChange(templateKey, updates);
  };

  const handleToggleMember = (templateKey, memberId) => {
    setSettings(prev =>
      prev.map(s => {
        if (s.templateKey === templateKey) {
          const current = s.eligibleMemberIds || [];
          return {
            ...s,
            eligibleMemberIds: current.includes(memberId)
              ? current.filter(id => id !== memberId)
              : [...current, memberId]
          };
        }
        return s;
      })
    );
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);

      // Validate
      for (const setting of settings) {
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

      // Refetch to confirm
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

  if (loading) {
    return <div className={styles.loading}>Loading chore board...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Chore Board Setup</h1>
        <p>Configure your household chores, assignments, and schedules</p>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[`message_${message.type}`]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.board}>
        {settings.map(setting => (
          <ChoreCard
            key={setting.templateKey}
            setting={setting}
            members={members}
            expanded={expandedKey === setting.templateKey}
            onToggleExpand={() => setExpandedKey(expandedKey === setting.templateKey ? null : setting.templateKey)}
            onChange={(updates) => handleSettingChange(setting.templateKey, updates)}
            onFrequencyChange={(freq) => handleFrequencyChange(setting.templateKey, freq)}
            onEligibilityModeChange={(mode) => handleEligibilityModeChange(setting.templateKey, mode)}
            onToggleMember={(memberId) => handleToggleMember(setting.templateKey, memberId)}
          />
        ))}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.saveButton}
          onClick={handleSaveAll}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
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

  return (
    <div
      className={`${styles.card} ${expanded ? styles.expanded : ''}`}
      style={{ '--rotation': `${rotation}deg` }}
    >
      <div className={styles.cardHeader} onClick={onToggleExpand}>
        <h3>{setting.title}</h3>
        <div className={styles.status}>{statusStr}</div>
        <div className={styles.expandIcon}>{expanded ? '−' : '+'}</div>
      </div>

      {expanded && (
        <div className={styles.cardContent}>
          {/* Recurring Toggle & Frequency */}
          <div className={styles.section}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={setting.isRecurring}
                onChange={(e) => {
                  const isRec = e.target.checked;
                  onChange({
                    isRecurring: isRec,
                    frequencyType: isRec ? 'WEEKLY' : 'ONE_TIME'
                  });
                }}
              />
              Recurring
            </label>

            {setting.isRecurring && (
              <div className={styles.frequencyGroup}>
                <label>Frequency:</label>
                <select
                  value={setting.frequencyType}
                  onChange={(e) => onFrequencyChange(e.target.value)}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="BIWEEKLY">Biweekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="CUSTOM">Custom</option>
                </select>

                {setting.frequencyType === 'CUSTOM' && (
                  <div className={styles.customDays}>
                    <label>Every N days:</label>
                    <input
                      type="number"
                      min="1"
                      value={setting.customEveryDays || 1}
                      onChange={(e) => onChange({ customEveryDays: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Assignment: Default Assignee */}
          <div className={styles.section}>
            <label>Default Assignee:</label>
            <select
              value={setting.defaultAssigneeMemberId || ''}
              onChange={(e) => onChange({ defaultAssigneeMemberId: e.target.value || null })}
            >
              <option value="">—  No preference (AI decides)</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <small>AI is allowed to reassign later</small>
          </div>

          {/* Eligibility Mode */}
          <div className={styles.section}>
            <label>Eligible Members:</label>
            <div className={styles.eligibilityMode}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name={`eligibility_${setting.templateKey}`}
                  value="ALL"
                  checked={setting.eligibilityMode === 'ALL'}
                  onChange={() => onEligibilityModeChange('ALL')}
                />
                All members
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name={`eligibility_${setting.templateKey}`}
                  value="SELECTED"
                  checked={setting.eligibilityMode === 'SELECTED'}
                  onChange={() => onEligibilityModeChange('SELECTED')}
                />
                Selected only
              </label>
            </div>

            {setting.eligibilityMode === 'SELECTED' && (
              <div className={styles.memberCheckboxes}>
                {members.map(m => (
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
          </div>
        </div>
      )}
    </div>
  );
}
