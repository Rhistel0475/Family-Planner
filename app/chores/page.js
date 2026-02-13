'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChoresPage({ searchParams }) {
  const router = useRouter();
  const [frequency, setFrequency] = useState('ONCE');
  const [assignmentScope, setAssignmentScope] = useState('all');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [eligibleMemberIds, setEligibleMemberIds] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const saved = searchParams?.saved === '1';
  const error = searchParams?.error === '1';

  // Fetch templates and family members on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingTemplates(true);
        
        // Fetch templates
        const templatesRes = await fetch('/api/chore-templates');
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);

        // Fetch family members
        const membersRes = await fetch('/api/family-members');
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);

        // Set default template
        if (templatesData.templates && templatesData.templates.length > 0) {
          setSelectedTemplate(templatesData.templates[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch templates/members:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchData();
  }, []);

  const systemTemplates = useMemo(() => 
    templates.filter(t => t.isSystem),
    [templates]
  );

  const customTemplates = useMemo(() => 
    templates.filter(t => !t.isSystem),
    [templates]
  );

  const toggleEligibleMember = (memberId) => {
    setEligibleMemberIds(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.target);
      const templateId = formData.get('choreTemplate');
      const customTitle = (formData.get('title') || '').trim();
      
      // Validate template selection
      if (!templateId || templateId === '') {
        alert('Please select a chore template');
        setLoading(false);
        return;
      }

      // Get template info
      const template = templates.find(t => t.id === templateId);
      const title = templateId === 'CUSTOM' ? customTitle : (template?.name || customTitle);

      // Validate custom title
      if (templateId === 'CUSTOM' && !customTitle) {
        alert('Please enter a custom chore title');
        setLoading(false);
        return;
      }

      // Validate assignment scope
      if (assignmentScope === 'one' && !formData.get('assignedTo')) {
        alert('Please select a member to assign to');
        setLoading(false);
        return;
      }

      // Validate eligibility
      if (assignmentScope === 'eligible' && eligibleMemberIds.length === 0) {
        alert('Please select at least one eligible member');
        setLoading(false);
        return;
      }

      const data = {
        title,
        choreTemplateId: templateId !== 'CUSTOM' ? templateId : null,
        assignedTo: assignmentScope === 'all' ? 'All Members' : formData.get('assignedTo'),
        dueDay: formData.get('dueDay'),
        frequency: frequency.toLowerCase(),
        eligibleMemberIds: assignmentScope === 'eligible' ? eligibleMemberIds : null,
        isRecurring: frequency !== 'ONCE',
        recurrencePattern: frequency !== 'ONCE' ? frequency : null,
        recurrenceInterval: frequency !== 'ONCE' ? parseInt(formData.get('interval')) || 1 : null,
        recurrenceEndDate: frequency !== 'ONCE' && formData.get('endDate') ? formData.get('endDate') : null
      };

      const res = await fetch('/api/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (res.ok) {
        router.push('/chores?saved=1');
        e.target.reset();
        setFrequency('ONCE');
        setAssignmentScope('all');
        setEligibleMemberIds([]);
      } else {
        console.error('Error response:', result);
        router.push('/chores?error=1');
      }
    } catch (err) {
      console.error('Request error:', err);
      router.push('/chores?error=1');
    } finally {
      setLoading(false);
    }
  };

  if (loadingTemplates) {
    return (
      <main style={styles.main}>
        <section style={styles.card}>
          <h1 style={styles.title}>Add Chore</h1>
          <p>Loading templates...</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <section style={styles.card}>
        <h1 style={styles.title}>Add Chore</h1>
        <p style={styles.subtitle}>Capture chores so your family task plan stays organized.</p>
        {saved && <p style={styles.success}>✓ Chore saved.</p>}
        {error && <p style={styles.error}>Please complete all fields.</p>}

        <form onSubmit={handleSubmit}>
          {/* Template Selection */}
          <label style={styles.label}>Standard Chore</label>
          <select 
            name="choreTemplate" 
            style={styles.input} 
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            <option value="">-- Select a chore --</option>
            
            {systemTemplates.length > 0 && (
              <optgroup label="System Templates">
                {systemTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </optgroup>
            )}
            
            {customTemplates.length > 0 && (
              <optgroup label="Custom Templates">
                {customTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </optgroup>
            )}
            
            <option value="CUSTOM">→ Create custom chore...</option>
          </select>

          {/* Custom Chore */}
          {selectedTemplate === 'CUSTOM' && (
            <>
              <label style={styles.label}>Custom Chore Title</label>
              <input 
                name="title" 
                style={styles.input} 
                placeholder="Enter custom chore name"
                required
              />
            </>
          )}

          {/* Assignment Scope */}
          <label style={styles.label}>Assignment</label>
          <select
            style={styles.input}
            value={assignmentScope}
            onChange={(e) => setAssignmentScope(e.target.value)}
          >
            <option value="all">Available to all members</option>
            <option value="one">Assign to one specific member</option>
            <option value="eligible">Eligible members only</option>
          </select>

          {/* Assign To One */}
          {assignmentScope === 'one' && (
            <>
              <label style={styles.label}>Assigned To</label>
              <select name="assignedTo" style={styles.input} required>
                <option value="">-- Select member --</option>
                {members.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* Eligible Members Multi-Select */}
          {assignmentScope === 'eligible' && (
            <>
              <label style={styles.label}>Eligible Members</label>
              <div style={styles.membersList}>
                {members.map((member) => (
                  <label key={member.id} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={eligibleMemberIds.includes(member.id)}
                      onChange={() => toggleEligibleMember(member.id)}
                      style={styles.checkbox}
                    />
                    <span>{member.name}</span>
                  </label>
                ))}
              </div>
              <input 
                name="assignedTo" 
                type="hidden"
                value={eligibleMemberIds[0] || ''}
              />
            </>
          )}

          {/* Due Day */}
          <label style={styles.label}>Due Day</label>
          <select name="dueDay" style={styles.input} defaultValue="Friday">
            <option>Monday</option>
            <option>Tuesday</option>
            <option>Wednesday</option>
            <option>Thursday</option>
            <option>Friday</option>
            <option>Saturday</option>
            <option>Sunday</option>
          </select>

          {/* Frequency */}
          <label style={styles.label}>Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            style={styles.input}
          >
            <option value="ONCE">One-time</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>

          {/* Recurrence Options */}
          {frequency !== 'ONCE' && (
            <div style={styles.recurringSection}>
              <label style={styles.label}>Every</label>
              <input
                name="interval"
                type="number"
                min="1"
                defaultValue="1"
                style={styles.input}
              />
              <span style={styles.intervalText}>
                {frequency === 'DAILY' && 'day(s)'}
                {frequency === 'WEEKLY' && 'week(s)'}
                {frequency === 'MONTHLY' && 'month(s)'}
                {frequency === 'YEARLY' && 'year(s)'}
              </span>

              <label style={styles.label}>End Date (Optional)</label>
              <input
                name="endDate"
                type="date"
                style={styles.input}
              />
            </div>
          )}

          <button type="submit" style={styles.button} disabled={loading || !selectedTemplate || selectedTemplate === ''}>
            {loading ? 'Saving...' : 'Save Chore'}
          </button>
        </form>
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
    background: '#c9f7a5',
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
  success: {
    marginBottom: '0.8rem',
    padding: '0.5rem 0.6rem',
    borderRadius: 6,
    background: 'rgba(63, 152, 76, 0.15)',
    border: '1px solid rgba(44, 121, 57, 0.35)',
    color: '#1f602a'
  },
  error: {
    marginBottom: '0.8rem',
    padding: '0.5rem 0.6rem',
    borderRadius: 6,
    background: 'rgba(186, 62, 62, 0.12)',
    border: '1px solid rgba(186, 62, 62, 0.35)',
    color: '#8b1f1f'
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
    color: '#3f2d1d',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    borderRadius: 9999,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    padding: '0.6rem 0.75rem',
    background: '#e9ffd7',
    color: '#2b4d1f',
    fontWeight: 700,
    cursor: 'pointer'
  },
  recurringSection: {
    background: 'rgba(255,255,255,0.4)',
    padding: '0.8rem',
    borderRadius: 6,
    marginBottom: '0.8rem',
    border: '1px dashed rgba(98, 73, 24, 0.2)'
  },
  intervalText: {
    fontSize: '0.85rem',
    color: '#3f2d1d',
    marginLeft: '0.3rem'
  },
  membersList: {
    background: 'rgba(255,255,255,0.4)',
    padding: '0.8rem',
    borderRadius: 6,
    marginBottom: '0.8rem',
    border: '1px solid rgba(98, 73, 24, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  checkbox: {
    cursor: 'pointer',
    width: '18px',
    height: '18px'
  }
};
