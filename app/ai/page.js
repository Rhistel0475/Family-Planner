'use client';

import { useState, useEffect } from 'react';
import HamburgerMenu from '../components/HamburgerMenu';
import Button from '../components/Button';
import { useTheme } from '../providers/ThemeProvider';
import { MAIN_PADDING_WITH_NAV, CONTENT_WIDTH_FORM } from '../../lib/layout';

export default function AIAssistantPage() {
  const { theme } = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applyAllLoading, setApplyAllLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // 'success', 'error', 'info'
  const [selectedTab, setSelectedTab] = useState('chores');

  const [weeklyResult, setWeeklyResult] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (message && messageType === 'success') {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, messageType]);

  async function generateChoreAssignments() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/ai/chores');
      const data = await res.json();
      
      if (data.error) {
        setMessage(data.error);
        setMessageType('error');
      } else if (data.message) {
        setMessage(data.message);
        setMessageType('info');
      }
      
      setSuggestions(data.suggestions || []);
      if (data.suggestions && data.suggestions.length === 0) {
        setMessage('No unassigned chores found. All chores are already assigned!');
        setMessageType('info');
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      setMessage('Failed to connect to AI service');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  async function applyAllSuggestions() {
    setApplyAllLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/ai/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyAll: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply');
      setSuggestions([]);
      setMessage(data.message || 'All chores assigned successfully!');
      setMessageType('success');
    } catch (err) {
      setMessage(err.message || 'Failed to apply all');
      setMessageType('error');
    } finally {
      setApplyAllLoading(false);
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
        setMessage('Chore assigned successfully!');
        setMessageType('success');
      }
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      setMessage('Failed to assign chore');
      setMessageType('error');
    }
  }

  async function generateWeeklyChores() {
    setWeeklyLoading(true);
    setMessage('');
    setWeeklyResult(null);
    try {
      const res = await fetch('/api/ai/generate-weekly-chores', { method: 'POST' });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
        setMessageType('error');
      } else {
        setWeeklyResult(data);
        setMessage(data.message || `Created ${data.created?.length || 0} chore instances.`);
        setMessageType('success');
      }
    } catch (error) {
      console.error('Failed to generate weekly chores:', error);
      setMessage('Failed to generate weekly chores');
      setMessageType('error');
    } finally {
      setWeeklyLoading(false);
    }
  }

  const heroBg = theme.hero?.bg || '#ffef7d';
  const heroText = theme.hero?.text || '#3f2d1d';
  const heroBorder = theme.hero?.border || 'rgba(105, 67, 16, 0.18)';
  const cardBg1 = theme.card?.bg?.[0] || '#fff59d';
  const cardBg2 = theme.card?.bg?.[1] || '#ffd9a8';
  const cardBg3 = theme.card?.bg?.[2] || '#c9f7a5';
  const cardText = theme.card?.text || '#3f2d1d';
  const cardBorder = theme.card?.border || 'rgba(98, 73, 24, 0.2)';
  const cardShadow = theme.card?.shadow || 'rgba(70, 45, 11, 0.2)';
  const buttonPrimary = theme.button?.primary || '#c9f7a5';
  const buttonPrimaryText = theme.button?.primaryText || '#2b4d1f';
  const toastSuccess = theme.toast?.success || { bg: 'rgba(63, 152, 76, 0.95)', border: '#2c7939' };
  const toastError = theme.toast?.error || { bg: 'rgba(186, 62, 62, 0.95)', border: '#8b1f1f' };
  const toastInfo = theme.toast?.info || { bg: 'rgba(52, 120, 186, 0.95)', border: '#2b5f99' };

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: MAIN_PADDING_WITH_NAV,
        backgroundColor: theme.pageBackground,
        backgroundImage: theme.pageGradient || undefined,
        color: cardText
      }}
    >
      <HamburgerMenu />

      {/* Message Banner */}
      {message && (
        <div
          style={{
            maxWidth: CONTENT_WIDTH_FORM,
            margin: '0 auto 1.5rem auto',
            padding: '1rem 1.25rem',
            borderRadius: 8,
            background: messageType === 'success' ? toastSuccess.bg : messageType === 'error' ? toastError.bg : toastInfo.bg,
            border: `1px solid ${messageType === 'success' ? toastSuccess.border : messageType === 'error' ? toastError.border : toastInfo.border}`,
            color: 'white',
            fontSize: '0.95rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: `0 2px 8px ${cardShadow}`,
            position: 'relative'
          }}
          className="fade-in"
        >
          <span style={{ fontSize: '1.25rem' }}>
            {messageType === 'success' ? '✅' : messageType === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          <span style={{ flex: 1 }}>{message}</span>
          <button
            onClick={() => setMessage('')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              lineHeight: 1
            }}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section
        style={{
          maxWidth: CONTENT_WIDTH_FORM,
          margin: '0 auto 2rem auto',
          background: heroBg,
          border: `1px solid ${heroBorder}`,
          borderRadius: 12,
          padding: '2rem 1.5rem',
          boxShadow: `0 4px 16px ${cardShadow}`,
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🤖</div>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            margin: '0 0 0.5rem 0',
            color: heroText
          }}
        >
          AI Concierge
        </h1>
        <p
          style={{
            fontSize: '1.05rem',
            margin: 0,
            color: heroText,
            opacity: 0.85,
            lineHeight: 1.5
          }}
        >
          Let AI help assign chores and plan your family schedule intelligently.
        </p>
      </section>

      {/* Tabs */}
      <div
        style={{
          maxWidth: CONTENT_WIDTH_FORM,
          margin: '0 auto 1.5rem auto',
          display: 'flex',
          gap: '0.75rem',
          background: 'rgba(255,255,255,0.3)',
          padding: '0.5rem',
          borderRadius: 10,
          border: `1px solid ${cardBorder}`
        }}
      >
        <button
          onClick={() => setSelectedTab('chores')}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 8,
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: selectedTab === 'chores' ? buttonPrimary : 'transparent',
            color: selectedTab === 'chores' ? buttonPrimaryText : cardText,
            boxShadow: selectedTab === 'chores' ? `0 2px 8px ${cardShadow}` : 'none',
            transform: selectedTab === 'chores' ? 'translateY(-1px)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (selectedTab !== 'chores') {
              e.target.style.background = 'rgba(255,255,255,0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedTab !== 'chores') {
              e.target.style.background = 'transparent';
            }
          }}
        >
          🤖 Smart Chore Assignments
        </button>
        <button
          onClick={() => setSelectedTab('meals')}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 8,
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: selectedTab === 'meals' ? buttonPrimary : 'transparent',
            color: selectedTab === 'meals' ? buttonPrimaryText : cardText,
            boxShadow: selectedTab === 'meals' ? `0 2px 8px ${cardShadow}` : 'none',
            transform: selectedTab === 'meals' ? 'translateY(-1px)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (selectedTab !== 'meals') {
              e.target.style.background = 'rgba(255,255,255,0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedTab !== 'meals') {
              e.target.style.background = 'transparent';
            }
          }}
        >
          🍽️ Meal Planning
        </button>
      </div>

      {selectedTab === 'chores' && (
        <div style={{ maxWidth: CONTENT_WIDTH_FORM, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Chore Assignments Card */}
          <div
            style={{
              background: cardBg1,
              border: `1px solid ${cardBorder}`,
              borderRadius: 12,
              padding: '1.5rem',
              boxShadow: `0 2px 8px ${cardShadow}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>✨</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: cardText }}>
                Smart Chore Assignments
              </h2>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.6)',
                border: `1px solid ${cardBorder}`,
                borderRadius: 8,
                padding: '1rem',
                marginBottom: '1.25rem',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: cardText
              }}
            >
              <span style={{ fontSize: '1.1rem', marginRight: '0.5rem' }}>💡</span>
              AI will analyze your family and suggest fair chore assignments based on roles and balance.
            </div>

            <Button
              variant="primary"
              onClick={generateChoreAssignments}
              disabled={loading}
              style={{
                width: '100%',
                marginBottom: '1.25rem',
                position: 'relative',
                minHeight: '44px'
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="spin-animation" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  Generating...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span>✨</span>
                  Generate Chore Assignments
                </span>
              )}
            </Button>

            {/* Loading Skeletons */}
            {loading && suggestions.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="pulse-animation"
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      border: `1px solid ${cardBorder}`,
                      borderRadius: 8,
                      padding: '1rem'
                    }}
                  >
                    <div style={{ height: '20px', background: 'rgba(0,0,0,0.1)', borderRadius: 4, marginBottom: '0.5rem', width: '60%' }} />
                    <div style={{ height: '16px', background: 'rgba(0,0,0,0.08)', borderRadius: 4, width: '40%' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && suggestions.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  background: 'rgba(255,255,255,0.4)',
                  borderRadius: 8,
                  border: `1px dashed ${cardBorder}`
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: cardText }}>
                  Ready to generate suggestions
                </p>
                <p style={{ fontSize: '0.9rem', opacity: 0.7, color: cardText }}>
                  Click the button above to get AI-powered chore assignment suggestions
                </p>
              </div>
            )}

            {/* Suggestions List */}
            {suggestions.length > 0 && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: cardText }}>
                    Suggestions ({suggestions.length})
                  </h3>
                  <button
                    onClick={applyAllSuggestions}
                    disabled={applyAllLoading}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 6,
                      border: `1px solid ${cardBorder}`,
                      background: applyAllLoading ? 'rgba(0,0,0,0.1)' : buttonPrimary,
                      color: applyAllLoading ? cardText : buttonPrimaryText,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: applyAllLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: applyAllLoading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!applyAllLoading) {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = `0 2px 4px ${cardShadow}`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'none';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {applyAllLoading ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="spin-animation" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                        Applying...
                      </span>
                    ) : (
                      '✓ Accept All'
                    )}
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.choreId}
                      style={{
                        background: theme.card?.bg?.[index % 3] || cardBg2,
                        border: `1px solid ${cardBorder}`,
                        borderRadius: 10,
                        padding: '1.25rem',
                        boxShadow: `0 1px 4px ${cardShadow}`,
                        transition: 'all 0.2s ease',
                        cursor: 'default'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 4px 12px ${cardShadow}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = `0 1px 4px ${cardShadow}`;
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>📋</span>
                        <div style={{ flex: 1 }}>
                          <h4
                            style={{
                              fontWeight: 700,
                              margin: '0 0 0.5rem 0',
                              fontSize: '1rem',
                              color: cardText
                            }}
                          >
                            {suggestion.choreTitle}
                          </h4>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.25rem 0.75rem',
                              background: 'rgba(255,255,255,0.6)',
                              borderRadius: 6,
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: cardText,
                              marginBottom: '0.75rem'
                            }}
                          >
                            <span>👤</span>
                            <span>Suggested for: <strong>{suggestion.suggestedAssignee}</strong></span>
                          </div>
                        </div>
                      </div>
                      {suggestion.reasoning && (
                        <p
                          style={{
                            fontSize: '0.85rem',
                            fontStyle: 'italic',
                            opacity: 0.8,
                            margin: '0 0 1rem 0',
                            paddingLeft: '2rem',
                            color: cardText,
                            lineHeight: 1.5
                          }}
                        >
                          {suggestion.reasoning}
                        </p>
                      )}
                      <Button
                        variant="primary"
                        onClick={() => applySuggestion(suggestion.choreId, suggestion.suggestedAssignee)}
                        style={{
                          width: '100%',
                          fontSize: '0.9rem'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <span>✓</span>
                          Accept & Assign
                        </span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Weekly Chores Generation Card */}
          <div
            style={{
              background: cardBg3,
              border: `1px solid ${cardBorder}`,
              borderRadius: 12,
              padding: '1.5rem',
              boxShadow: `0 2px 8px ${cardShadow}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📅</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: cardText }}>
                Weekly Chore Generation
              </h2>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.6)',
                border: `1px solid ${cardBorder}`,
                borderRadius: 8,
                padding: '1rem',
                marginBottom: '1.25rem',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: cardText
              }}
            >
              <span style={{ fontSize: '1.1rem', marginRight: '0.5rem' }}>💡</span>
              Generate a full week of chores based on your board settings. Each chore with "days per week" configured will be created and assigned automatically.
            </div>

            <Button
              variant="secondary"
              onClick={generateWeeklyChores}
              disabled={weeklyLoading}
              style={{
                width: '100%',
                marginBottom: '1.25rem',
                minHeight: '44px'
              }}
            >
              {weeklyLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="spin-animation" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  Generating Weekly Chores...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span>📅</span>
                  Generate Weekly Chores
                </span>
              )}
            </Button>

            {/* Weekly Results */}
            {weeklyResult && weeklyResult.assignments && weeklyResult.assignments.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: cardText }}>
                  Weekly Assignments ({weeklyResult.assignments.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {weeklyResult.assignments.map((a, i) => (
                    <div
                      key={a.choreId || i}
                      style={{
                        background: 'rgba(255,255,255,0.7)',
                        border: `1px solid ${cardBorder}`,
                        borderRadius: 8,
                        padding: '1rem',
                        boxShadow: `0 1px 3px ${cardShadow}`
                      }}
                    >
                      <h4 style={{ fontWeight: 600, margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: cardText }}>
                        {a.choreTitle}
                      </h4>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.25rem 0.75rem',
                          background: 'rgba(255,255,255,0.8)',
                          borderRadius: 6,
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          color: cardText
                        }}
                      >
                        <span>👤</span>
                        <span>Assigned to: <strong>{a.suggestedAssignee}</strong></span>
                      </div>
                      {a.reasoning && (
                        <p style={{ fontSize: '0.85rem', fontStyle: 'italic', opacity: 0.75, margin: '0.5rem 0 0 0', color: cardText }}>
                          {a.reasoning}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State for Weekly */}
            {!weeklyLoading && (!weeklyResult || !weeklyResult.assignments || weeklyResult.assignments.length === 0) && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem 1rem',
                  background: 'rgba(255,255,255,0.4)',
                  borderRadius: 8,
                  border: `1px dashed ${cardBorder}`
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
                <p style={{ fontWeight: 500, fontSize: '0.9rem', opacity: 0.8, color: cardText }}>
                  Weekly chores will appear here after generation
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'meals' && (
        <div
          style={{
            maxWidth: CONTENT_WIDTH_FORM,
            margin: '0 auto',
            background: cardBg2,
            border: `1px solid ${cardBorder}`,
            borderRadius: 12,
            padding: '3rem 1.5rem',
            boxShadow: `0 2px 8px ${cardShadow}`,
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍽️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: cardText }}>
            Meal Planning Coming Soon
          </h2>
          <p style={{ fontSize: '1rem', opacity: 0.8, color: cardText, lineHeight: 1.6 }}>
            AI-powered meal planning and grocery list generation will be available soon!
          </p>
        </div>
      )}

    </main>
  );
}
