'use client';

import { useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import Modal from './Modal';
import { DAY_NAMES } from '../../lib/constants';
import { getInitials } from '../../lib/avatarUtils';

export default function SmartTaskModal({ isOpen, onClose, onSubmit, members }) {
  const { theme } = useTheme();
  const [taskData, setTaskData] = useState({
    title: '',
    type: 'CHORE',
    frequency: 'weekly',
    assignmentMode: 'ai', // 'specific', 'rotate', 'ai'
    assignedTo: '',
    days: ['Monday'], // For weekly recurring
    recurrenceInterval: 1
  });

  const handleSubmit = () => {
    if (!taskData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    // Validate assignment
    if (taskData.assignmentMode === 'specific' && !taskData.assignedTo) {
      alert('Please select who will do this task');
      return;
    }

    onSubmit(taskData);

    // Reset form
    setTaskData({
      title: '',
      type: 'CHORE',
      frequency: 'weekly',
      assignmentMode: 'ai',
      assignedTo: '',
      days: ['Monday'],
      recurrenceInterval: 1
    });
  };

  const toggleDay = (day) => {
    if (taskData.days.includes(day)) {
      setTaskData({
        ...taskData,
        days: taskData.days.filter(d => d !== day)
      });
    } else {
      setTaskData({
        ...taskData,
        days: [...taskData.days, day]
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="➕ Add Smart Task"
      size="medium"
    >
      <div style={styles.form}>
        {/* Task Title */}
        <div>
          <label style={{...styles.label, color: theme.card.text}}>Task Name</label>
          <input
            type="text"
            placeholder="e.g., Take out trash, Weekly meeting..."
            value={taskData.title}
            onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
            style={{
              ...styles.input,
              background: theme.input.bg,
              color: theme.input.text,
              border: `1px solid ${theme.input.border}`
            }}
            autoFocus
          />
        </div>

        {/* Type Selection */}
        <div>
          <label style={{...styles.label, color: theme.card.text}}>Type</label>
          <div style={styles.buttonGroup}>
            <button
              onClick={() => setTaskData({ ...taskData, type: 'CHORE' })}
              style={{
                ...styles.typeBtn,
                background: taskData.type === 'CHORE' ? theme.card.bg[2] : theme.button.secondary,
                color: theme.card.text,
                border: `2px solid ${taskData.type === 'CHORE' ? theme.card.border : 'transparent'}`
              }}
            >
              🧹 Chore
            </button>
            <button
              onClick={() => setTaskData({ ...taskData, type: 'EVENT' })}
              style={{
                ...styles.typeBtn,
                background: taskData.type === 'EVENT' ? theme.card.bg[3] : theme.button.secondary,
                color: theme.card.text,
                border: `2px solid ${taskData.type === 'EVENT' ? theme.card.border : 'transparent'}`
              }}
            >
              📅 Event
            </button>
            <button
              onClick={() => setTaskData({ ...taskData, type: 'WORK' })}
              style={{
                ...styles.typeBtn,
                background: taskData.type === 'WORK' ? theme.card.bg[1] : theme.button.secondary,
                color: theme.card.text,
                border: `2px solid ${taskData.type === 'WORK' ? theme.card.border : 'transparent'}`
              }}
            >
              💼 Work
            </button>
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label style={{...styles.label, color: theme.card.text}}>How Often?</label>
          <select
            value={taskData.frequency}
            onChange={(e) => setTaskData({ ...taskData, frequency: e.target.value })}
            style={{
              ...styles.input,
              background: theme.input.bg,
              color: theme.input.text,
              border: `1px solid ${theme.input.border}`
            }}
          >
            <option value="once">Once (one-time)</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Days of Week (for weekly) */}
        {taskData.frequency === 'weekly' && (
          <div>
            <label style={{...styles.label, color: theme.card.text}}>Which Days?</label>
            <div style={styles.daysGrid}>
              {DAY_NAMES.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  style={{
                    ...styles.dayBtn,
                    background: taskData.days.includes(day) ? theme.button.primary : theme.button.secondary,
                    color: taskData.days.includes(day) ? theme.button.primaryText : theme.card.text,
                    border: `1px solid ${theme.card.border}`
                  }}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Assignment Mode */}
        <div>
          <label style={{...styles.label, color: theme.card.text}}>Who Does It?</label>
          <div style={styles.assignmentOptions}>
            <button
              onClick={() => setTaskData({ ...taskData, assignmentMode: 'ai' })}
              style={{
                ...styles.assignBtn,
                background: taskData.assignmentMode === 'ai' ? theme.toast.success.bg : theme.button.secondary,
                color: taskData.assignmentMode === 'ai' ? 'white' : theme.card.text,
                border: `2px solid ${taskData.assignmentMode === 'ai' ? theme.toast.success.border : theme.card.border}`
              }}
            >
              <div style={styles.assignBtnContent}>
                <span style={styles.assignIcon}>🤖</span>
                <span style={styles.assignTitle}>AI Auto-Assign</span>
                <span style={styles.assignSubtitle}>Fair distribution</span>
              </div>
            </button>

            <button
              onClick={() => setTaskData({ ...taskData, assignmentMode: 'rotate' })}
              style={{
                ...styles.assignBtn,
                background: taskData.assignmentMode === 'rotate' ? theme.toast.info.bg : theme.button.secondary,
                color: taskData.assignmentMode === 'rotate' ? 'white' : theme.card.text,
                border: `2px solid ${taskData.assignmentMode === 'rotate' ? theme.toast.info.border : theme.card.border}`
              }}
            >
              <div style={styles.assignBtnContent}>
                <span style={styles.assignIcon}>🔄</span>
                <span style={styles.assignTitle}>Rotate Weekly</span>
                <span style={styles.assignSubtitle}>Everyone takes turns</span>
              </div>
            </button>

            <button
              onClick={() => setTaskData({ ...taskData, assignmentMode: 'specific' })}
              style={{
                ...styles.assignBtn,
                background: taskData.assignmentMode === 'specific' ? theme.card.bg[0] : theme.button.secondary,
                color: theme.card.text,
                border: `2px solid ${taskData.assignmentMode === 'specific' ? theme.card.border : theme.card.border}`
              }}
            >
              <div style={styles.assignBtnContent}>
                <span style={styles.assignIcon}>👤</span>
                <span style={styles.assignTitle}>Specific Person</span>
                <span style={styles.assignSubtitle}>Choose who</span>
              </div>
            </button>
          </div>
        </div>

        {/* Member Selection (if specific) */}
        {taskData.assignmentMode === 'specific' && (
          <div>
            <label style={{...styles.label, color: theme.card.text}}>Assign To</label>
            <select
              value={taskData.assignedTo}
              onChange={(e) => setTaskData({ ...taskData, assignedTo: e.target.value })}
              style={{
                ...styles.input,
                background: theme.input.bg,
                color: theme.input.text,
                border: `1px solid ${theme.input.border}`
              }}
            >
              <option value="">Select person...</option>
              {members.map(member => (
                <option key={member.id} value={member.name}>
                  {getInitials(member.name)} · {member.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          style={{
            ...styles.submitBtn,
            background: theme.button.primary,
            color: theme.button.primaryText,
            border: `1px solid ${theme.card.border}`
          }}
        >
          ✨ Create Smart Task
        </button>
      </div>
    </Modal>
  );
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.4rem'
  },
  input: {
    width: '100%',
    padding: '0.7rem',
    borderRadius: 6,
    fontSize: '0.95rem',
    outline: 'none'
  },
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem'
  },
  typeBtn: {
    padding: '0.75rem 0.5rem',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease'
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.4rem'
  },
  dayBtn: {
    padding: '0.6rem 0.25rem',
    borderRadius: 6,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.75rem',
    transition: 'all 0.2s ease'
  },
  assignmentOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.75rem'
  },
  assignBtn: {
    padding: '0.75rem',
    borderRadius: 10,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left'
  },
  assignBtnContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  assignIcon: {
    fontSize: '1.5rem',
    marginBottom: '0.25rem'
  },
  assignTitle: {
    fontSize: '0.85rem',
    fontWeight: 700
  },
  assignSubtitle: {
    fontSize: '0.7rem',
    opacity: 0.8
  },
  submitBtn: {
    width: '100%',
    padding: '0.9rem',
    borderRadius: 10,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '0.5rem',
    transition: 'all 0.2s ease'
  }
};
