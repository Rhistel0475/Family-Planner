'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';

export default function ChoreBoardPage() {
  const { theme } = useTheme();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Default chore templates
  const defaultChores = [
    { templateKey: 'clean-kitchen', title: 'Clean Kitchen' },
    { templateKey: 'clean-bathroom', title: 'Clean Bathroom' },
    { templateKey: 'clean-bedroom', title: 'Clean Bedroom' },
    { templateKey: 'clean-living-room', title: 'Clean Living Room' },
    { templateKey: 'vacuum', title: 'Vacuum' },
    { templateKey: 'sweep-mop', title: 'Sweep/Mop' },
    { templateKey: 'dishes', title: 'Dishes' },
    { templateKey: 'laundry', title: 'Laundry' },
    { templateKey: 'dusting', title: 'Dusting' },
    { templateKey: 'take-out-trash', title: 'Take Out Trash' },
    { templateKey: 'wipe-counters', title: 'Wipe Counters' },
    { templateKey: 'organize-declutter', title: 'Organize/Declutter' }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/chore-board');
      const data = await res.json();

      if (res.ok) {
        // If no templates exist, create defaults
        if (data.templates.length === 0) {
          await initializeDefaultTemplates();
        } else {
          setTemplates(data.templates);
        }
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultTemplates = async () => {
    try {
      const newTemplates = [];

      for (const chore of defaultChores) {
        const res = await fetch('/api/chore-board', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateKey: chore.templateKey,
            title: chore.title,
            isRecurring: false,
            frequencyType: 'ONE_TIME',
            eligibilityMode: 'ALL',
            eligibleMemberIds: []
          })
        });

        const data = await res.json();
        if (data.template) {
          newTemplates.push(data.template);
        }
      }

      setTemplates(newTemplates);
    } catch (error) {
      console.error('Failed to initialize templates:', error);
    }
  };

  const addNewTemplate = async (templateData) => {
    try {
      const res = await fetch('/api/chore-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });

      const data = await res.json();

      if (res.ok && data.template) {
        setTemplates([...templates, data.template]);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Failed to add template:', error);
    }
  };

  const updateTemplate = async (id, updates) => {
    try {
      const res = await fetch('/api/chore-board', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });

      const data = await res.json();

      if (res.ok && data.template) {
        setTemplates(templates.map(t => t.id === id ? data.template : t));
      }
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const deleteTemplate = async (id) => {
    if (!confirm('Delete this chore template?')) return;

    try {
      const res = await fetch(`/api/chore-board?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setTemplates(templates.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const toggleChoreActive = async (template) => {
    const newActiveState = !template.isActive;
    await updateTemplate(template.id, { isActive: newActiveState });
  };

  const saveAllSettings = async () => {
    setSaving(true);
    // All changes are auto-saved, this is just for UX feedback
    setTimeout(() => {
      setSaving(false);
      alert('All settings saved! ✓');
    }, 500);
  };

  if (loading) {
    return (
      <div style={{...styles.container, background: theme.body.bg}}>
        <div style={{...styles.loading, color: theme.card.text}}>Loading chore board...</div>
      </div>
    );
  }

  return (
    <div style={{...styles.container, background: theme.body.bg}}>
      <div style={styles.header}>
        <div>
          <h1 style={{...styles.title, color: theme.card.text}}>Chore Board</h1>
          <p style={{...styles.subtitle, color: theme.card.subtext}}>
            {templates.filter(t => t.isActive).length} active chore{templates.filter(t => t.isActive).length !== 1 ? 's' : ''} •
            Click + to enable chores for AI assignment
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            ...styles.addButton,
            background: theme.button.primary,
            color: theme.button.primaryText
          }}
        >
          +
        </button>
      </div>

      <div style={styles.grid}>
        {templates.map(template => (
          <ChoreCard
            key={template.id}
            template={template}
            theme={theme}
            onToggle={() => toggleChoreActive(template)}
            onUpdate={(updates) => updateTemplate(template.id, updates)}
            onDelete={() => deleteTemplate(template.id)}
          />
        ))}
      </div>

      <button
        onClick={saveAllSettings}
        disabled={saving}
        style={{
          ...styles.saveButton,
          background: theme.button.primary,
          color: theme.button.primaryText
        }}
      >
        {saving ? 'Saving...' : 'Save All Settings'}
      </button>

      {showAddModal && (
        <AddChoreModal
          theme={theme}
          onClose={() => setShowAddModal(false)}
          onSave={addNewTemplate}
        />
      )}
    </div>
  );
}

function ChoreCard({ template, theme, onToggle, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const frequencyLabel = template.isRecurring
    ? `${template.frequencyType.charAt(0) + template.frequencyType.slice(1).toLowerCase()}`
    : 'One-time';

  const eligibilityLabel = template.eligibilityMode === 'ALL'
    ? 'All'
    : template.eligibilityMode === 'SELECTED'
    ? 'Selected'
    : 'Role-based';

  const isActive = template.isActive;

  return (
    <div
      style={{
        ...styles.card,
        background: isActive ? theme.card.bg[2] : theme.card.bg[0],
        border: `2px solid ${isActive ? theme.button.primary : theme.card.border}`,
        opacity: isActive ? 1 : 0.6
      }}
    >
      <div style={styles.cardHeader}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1}}>
          {isActive && <span style={{fontSize: '1.2rem'}}>✓</span>}
          <h3 style={{...styles.cardTitle, color: theme.card.text, margin: 0}}>{template.title}</h3>
        </div>
        <button
          onClick={onToggle}
          style={{
            ...styles.cardAddButton,
            background: isActive ? theme.toast.success.bg : theme.button.primary,
            color: isActive ? '#fff' : theme.button.primaryText,
            border: `2px solid ${isActive ? theme.toast.success.border : 'transparent'}`
          }}
        >
          {isActive ? '✓' : '+'}
        </button>
      </div>

      <div style={{...styles.cardMeta, color: theme.card.subtext}}>
        {frequencyLabel} • Eligible: {eligibilityLabel}
      </div>

      {expanded && (
        <div style={styles.cardDetails}>
          <button
            onClick={() => setExpanded(false)}
            style={{...styles.editButton, color: theme.card.text}}
          >
            ✏️ Edit
          </button>
          <button
            onClick={onDelete}
            style={{...styles.deleteButton, color: '#ff4444'}}
          >
            🗑️ Delete
          </button>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        style={{...styles.expandButton, color: theme.card.subtext}}
      >
        {expanded ? '▲' : '▼'}
      </button>
    </div>
  );
}

function AddChoreModal({ theme, onClose, onSave }) {
  const [formData, setFormData] = useState({
    templateKey: '',
    title: '',
    isRecurring: false,
    frequencyType: 'ONE_TIME',
    eligibilityMode: 'ALL',
    eligibleMemberIds: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a chore title');
      return;
    }

    // Generate templateKey from title
    const templateKey = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    onSave({
      ...formData,
      templateKey: templateKey || `chore-${Date.now()}`
    });
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={{
          ...styles.modal,
          background: theme.card.bg[0],
          border: `1px solid ${theme.card.border}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{...styles.modalTitle, color: theme.card.text}}>Add New Chore</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={{...styles.label, color: theme.card.text}}>Chore Name</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            style={{
              ...styles.input,
              background: theme.input.bg,
              color: theme.input.text,
              border: `1px solid ${theme.input.border}`
            }}
            placeholder="e.g., Water plants"
            autoFocus
          />

          <label style={{...styles.label, color: theme.card.text}}>Frequency</label>
          <select
            value={formData.frequencyType}
            onChange={(e) => setFormData({
              ...formData,
              frequencyType: e.target.value,
              isRecurring: e.target.value !== 'ONE_TIME'
            })}
            style={{
              ...styles.input,
              background: theme.input.bg,
              color: theme.input.text,
              border: `1px solid ${theme.input.border}`
            }}
          >
            <option value="ONE_TIME">One-time</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>

          <label style={{...styles.label, color: theme.card.text}}>Who can do it?</label>
          <select
            value={formData.eligibilityMode}
            onChange={(e) => setFormData({...formData, eligibilityMode: e.target.value})}
            style={{
              ...styles.input,
              background: theme.input.bg,
              color: theme.input.text,
              border: `1px solid ${theme.input.border}`
            }}
          >
            <option value="ALL">Anyone</option>
            <option value="SELECTED">Selected members</option>
            <option value="ROLE_BASED">Role-based</option>
          </select>

          <div style={styles.buttonRow}>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...styles.cancelButton,
                background: theme.button.secondary,
                color: theme.card.text
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.submitButton,
                background: theme.button.primary,
                color: theme.button.primaryText
              }}
            >
              Add Chore
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '5rem 1.5rem 2rem 1.5rem'
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1.1rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    maxWidth: '1200px',
    margin: '0 auto 2rem auto'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '0.5rem'
  },
  subtitle: {
    fontSize: '0.95rem',
    opacity: 0.8
  },
  addButton: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    fontWeight: 700,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'all 0.2s ease'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
    maxWidth: '1200px',
    margin: '0 auto 2rem auto'
  },
  card: {
    padding: '1.25rem',
    borderRadius: '12px',
    position: 'relative',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem'
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    flex: 1,
    marginRight: '0.5rem'
  },
  cardAddButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    fontWeight: 700,
    flexShrink: 0
  },
  cardMeta: {
    fontSize: '0.85rem',
    opacity: 0.7
  },
  cardDetails: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '0.5rem'
  },
  editButton: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid rgba(0,0,0,0.1)',
    background: 'transparent',
    fontSize: '0.85rem',
    cursor: 'pointer',
    flex: 1
  },
  deleteButton: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid rgba(255,68,68,0.3)',
    background: 'transparent',
    fontSize: '0.85rem',
    cursor: 'pointer'
  },
  expandButton: {
    position: 'absolute',
    bottom: '0.5rem',
    right: '0.5rem',
    background: 'transparent',
    border: 'none',
    fontSize: '0.75rem',
    cursor: 'pointer',
    opacity: 0.5
  },
  saveButton: {
    display: 'block',
    width: '100%',
    maxWidth: '400px',
    margin: '2rem auto',
    padding: '1rem',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    width: '90%',
    maxWidth: '500px',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1.5rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: '-0.5rem'
  },
  input: {
    padding: '0.75rem',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none'
  },
  buttonRow: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem'
  },
  cancelButton: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  submitButton: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer'
  }
};
