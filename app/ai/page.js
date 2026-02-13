'use client';

import { useState } from 'react';

export default function AIAssistantPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('chores');

  async function generateChoreAssignments() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chores');
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function applySuggestion(choreId, assignedTo) {
    try {
      const res = await fetch('/api/ai/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choreId, assignedTo })
      });

      if (res.ok) {
        setSuggestions(suggestions.filter((s) => s.choreId !== choreId));
      }
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
    }
  }

  return (
    <main style={styles.main}>
      <section style={styles.card}>
        <h1 style={styles.title}>AI Assistant</h1>
        <p style={styles.subtitle}>Let AI help assign chores and plan meals fairly.</p>

        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tabButton,
              background: selectedTab === 'chores' ? '#e9ffd7' : '#fff8bf'
            }}
            onClick={() => setSelectedTab('chores')}
          >
            Smart Chore Assignments
          </button>
          <button
            style={{
              ...styles.tabButton,
              background: selectedTab === 'meals' ? '#ffeed8' : '#fff8bf'
            }}
            onClick={() => setSelectedTab('meals')}
          >
            Meal Planning
          </button>
        </div>

        {selectedTab === 'chores' && (
          <div style={styles.section}>
            <p style={styles.tip}>
              💡 AI will analyze your family and suggest fair chore assignments based on roles and balance.
            </p>

            <button
              onClick={generateChoreAssignments}
              disabled={loading}
              style={styles.generateButton}
            >
              {loading ? 'Generating...' : 'Generate Chore Assignments'}
            </button>

            {suggestions.length > 0 && (
              <div style={styles.suggestionsList}>
                <h3>Suggestions ({suggestions.length})</h3>
                {suggestions.map((suggestion) => (
                  <div key={suggestion.choreId} style={styles.suggestionCard}>
                    <p style={styles.suggestionTitle}>{suggestion.choreTitle}</p>
                    <p style={styles.suggestionText}>
                      Suggested for: <strong>{suggestion.suggestedAssignee}</strong>
                    </p>
                    <p style={styles.reasoning}>{suggestion.reasoning}</p>
                    <button
                      onClick={() =>
                        applySuggestion(suggestion.choreId, suggestion.suggestedAssignee)
                      }
                      style={styles.applyButton}
                    >
                      Accept & Assign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'meals' && (
          <div style={styles.section}>
            <p style={styles.tip}>
              🍽️ Coming soon: AI-powered meal planning and grocery list generation.
            </p>
          </div>
        )}
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
    maxWidth: 680,
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
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  tabButton: {
    flex: 1,
    padding: '0.6rem',
    borderRadius: 6,
    border: '1px solid rgba(98, 73, 24, 0.24)',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  section: {
    marginTop: '1rem'
  },
  tip: {
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(98, 73, 24, 0.2)',
    borderRadius: 6,
    padding: '0.8rem',
    marginBottom: '1rem',
    fontSize: '0.9rem'
  },
  generateButton: {
    width: '100%',
    padding: '0.8rem',
    borderRadius: 8,
    border: '1px solid rgba(98, 73, 24, 0.32)',
    background: '#e9ffd7',
    color: '#2b4d1f',
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: '1rem'
  },
  suggestionsList: {
    marginTop: '1rem'
  },
  suggestionCard: {
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(98, 73, 24, 0.2)',
    borderRadius: 6,
    padding: '0.8rem',
    marginBottom: '0.8rem'
  },
  suggestionTitle: {
    fontWeight: 700,
    marginBottom: '0.4rem'
  },
  suggestionText: {
    fontSize: '0.9rem',
    marginBottom: '0.3rem'
  },
  reasoning: {
    fontSize: '0.85rem',
    fontStyle: 'italic',
    opacity: 0.8,
    marginBottom: '0.6rem'
  },
  applyButton: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: 4,
    border: 'none',
    background: '#e9ffd7',
    color: '#2b4d1f',
    fontWeight: 700,
    cursor: 'pointer'
  }
};
