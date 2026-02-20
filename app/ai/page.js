'use client';

import { useState, useEffect } from 'react';
import HamburgerMenu from '../components/HamburgerMenu';
import Button from '../components/Button';
import {
  AIAssistantAvatar,
  ChoresAvatar,
  MealsAvatar,
  CalendarAvatar,
  SuccessAvatar,
  WarningAvatar,
  InfoAvatar,
  EmptyStateAvatar,
  PersonAvatar
} from '../components/ConciergeAvatars';
import { useTheme } from '../providers/ThemeProvider';
import { MAIN_PADDING_WITH_NAV, CONTENT_WIDTH_FORM } from '../../lib/layout';

export default function AIAssistantPage() {
  const { theme } = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applyAllLoading, setApplyAllLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [selectedTab, setSelectedTab] = useState('chores');

  const [weeklyResult, setWeeklyResult] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

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

  // Theme colors with fallbacks
  const cardText = theme.card?.text || '#3f2d1d';
  const cardBorder = theme.card?.border || 'rgba(98, 73, 24, 0.2)';
  const cardShadow = theme.card?.shadow || 'rgba(70, 45, 11, 0.2)';
  const buttonPrimary = theme.button?.primary || '#c9f7a5';
  const buttonPrimaryText = theme.button?.primaryText || '#2b4d1f';
  const toastSuccess = theme.toast?.success || { bg: 'rgba(63, 152, 76, 0.95)', border: '#2c7939' };
  const toastError = theme.toast?.error || { bg: 'rgba(186, 62, 62, 0.95)', border: '#8b1f1f' };
  const toastInfo = theme.toast?.info || { bg: 'rgba(52, 120, 186, 0.95)', border: '#2b5f99' };

  // Premium shadow presets
  const shadowSmall = `0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)`;
  const shadowMedium = `0 8px 24px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)`;
  const shadowLarge = `0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.05)`;
  const shadowXLarge = `0 32px 80px rgba(0,0,0,0.18), 0 12px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)`;

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: MAIN_PADDING_WITH_NAV,
        backgroundColor: theme.pageBackground,
        backgroundImage: theme.pageGradient || undefined,
        color: cardText,
        position: 'relative'
      }}
    >
      <HamburgerMenu />

      {/* Premium Message Banner with Glassmorphism */}
      {message && (
        <div
          className="premium-message-slide"
          style={{
            maxWidth: CONTENT_WIDTH_FORM,
            margin: '0 auto 2rem auto',
            padding: '1.25rem 1.5rem',
            borderRadius: 16,
            background: messageType === 'success' 
              ? `linear-gradient(135deg, ${toastSuccess.bg} 0%, rgba(63, 152, 76, 0.9) 100%)`
              : messageType === 'error'
              ? `linear-gradient(135deg, ${toastError.bg} 0%, rgba(186, 62, 62, 0.9) 100%)`
              : `linear-gradient(135deg, ${toastInfo.bg} 0%, rgba(52, 120, 186, 0.9) 100%)`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${messageType === 'success' ? toastSuccess.border : messageType === 'error' ? toastError.border : toastInfo.border}`,
            color: 'white',
            fontSize: '1rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: shadowMedium,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
              pointerEvents: 'none'
            }}
          />
          <span style={{ fontSize: '1.5rem', zIndex: 1, display: 'flex', alignItems: 'center' }}>
            {messageType === 'success' ? <SuccessAvatar size={28} /> : messageType === 'error' ? <WarningAvatar size={28} /> : <InfoAvatar size={28} />}
          </span>
          <span style={{ flex: 1, zIndex: 1, lineHeight: 1.5 }}>{message}</span>
          <button
            onClick={() => setMessage('')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.125rem',
              lineHeight: 1,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 1
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.3)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'scale(1)';
            }}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {/* Premium Hero Section with Glassmorphism */}
      <section
        className="premium-hero"
        style={{
          maxWidth: CONTENT_WIDTH_FORM,
          margin: '0 auto 3rem auto',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          borderRadius: 24,
          padding: '3rem 2rem',
          boxShadow: shadowXLarge,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 20%, rgba(201, 247, 165, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255, 217, 168, 0.15) 0%, transparent 50%)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            marginBottom: '1rem',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
            position: 'relative',
            zIndex: 1
          }}
        >
          <AIAssistantAvatar size={72} fill={cardText} accent={buttonPrimary} />
        </div>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            margin: '0 0 0.75rem 0',
            color: cardText,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            position: 'relative',
            zIndex: 1
          }}
        >
          AI Concierge
        </h1>
        <p
          style={{
            fontSize: '1.125rem',
            margin: 0,
            color: cardText,
            opacity: 0.85,
            lineHeight: 1.6,
            fontWeight: 400,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            position: 'relative',
            zIndex: 1
          }}
        >
          Let AI help assign chores and plan your family schedule intelligently.
        </p>
      </section>

      {/* Premium Tab System with Glassmorphism */}
      <div
        style={{
          maxWidth: CONTENT_WIDTH_FORM,
          margin: '0 auto 2rem auto',
          display: 'flex',
          gap: '1rem',
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          padding: '0.75rem',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: shadowMedium
        }}
      >
        <button
          onClick={() => setSelectedTab('chores')}
          className="premium-tab"
          style={{
            flex: 1,
            padding: '1rem 1.5rem',
            borderRadius: 12,
            border: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: selectedTab === 'chores'
              ? `linear-gradient(135deg, ${buttonPrimary} 0%, rgba(201, 247, 165, 0.9) 100%)`
              : 'transparent',
            color: selectedTab === 'chores' ? buttonPrimaryText : cardText,
            boxShadow: selectedTab === 'chores' ? shadowMedium : 'none',
            transform: selectedTab === 'chores' ? 'translateY(-2px) scale(1.02)' : 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (selectedTab !== 'chores') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedTab !== 'chores') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'none';
            }
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ChoresAvatar size={28} fill={cardText} accent={buttonPrimary} />
            <span>Smart Chore Assignments</span>
          </span>
        </button>
        <button
          onClick={() => setSelectedTab('meals')}
          className="premium-tab"
          style={{
            flex: 1,
            padding: '1rem 1.5rem',
            borderRadius: 12,
            border: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: selectedTab === 'meals'
              ? `linear-gradient(135deg, ${buttonPrimary} 0%, rgba(201, 247, 165, 0.9) 100%)`
              : 'transparent',
            color: selectedTab === 'meals' ? buttonPrimaryText : cardText,
            boxShadow: selectedTab === 'meals' ? shadowMedium : 'none',
            transform: selectedTab === 'meals' ? 'translateY(-2px) scale(1.02)' : 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (selectedTab !== 'meals') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedTab !== 'meals') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'none';
            }
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <MealsAvatar size={28} fill={cardText} accent={buttonPrimary} />
            <span>Meal Planning</span>
          </span>
        </button>
      </div>

      {selectedTab === 'chores' && (
        <div style={{ maxWidth: CONTENT_WIDTH_FORM, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Premium Chore Assignments Card */}
          <div
            className="premium-card"
            style={{
              background: `linear-gradient(135deg, ${theme.card?.bg?.[0] || '#fff59d'} 0%, rgba(255, 245, 157, 0.95) 100%)`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 20,
              padding: '2rem',
              boxShadow: shadowLarge,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = shadowXLarge;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = shadowLarge;
            }}
          >
            {/* Decorative gradient overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
                pointerEvents: 'none'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
              <ChoresAvatar size={40} fill={cardText} accent={buttonPrimary} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: 0,
                  color: cardText,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2
                }}
              >
                Smart Chore Assignments
              </h2>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: 12,
                padding: '1.25rem',
                marginBottom: '1.5rem',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: cardText,
                boxShadow: shadowSmall,
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
            >
              <InfoAvatar size={28} fill={cardText} accent={toastInfo.border} style={{ flexShrink: 0 }} />
              <span>AI will analyze your family and suggest fair chore assignments based on roles and balance.</span>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <Button
                variant="primary"
                onClick={generateChoreAssignments}
                disabled={loading}
                style={{
                  width: '100%',
                  marginBottom: '1.5rem',
                  minHeight: '52px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  background: loading
                    ? `linear-gradient(135deg, ${buttonPrimary} 0%, rgba(201, 247, 165, 0.8) 100%)`
                    : `linear-gradient(135deg, ${buttonPrimary} 0%, rgba(201, 247, 165, 0.95) 100%)`,
                  boxShadow: shadowMedium,
                  border: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = shadowLarge;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = shadowMedium;
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    <span className="spin-animation" style={{ display: 'inline-block', width: '18px', height: '18px', border: '3px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    Generating...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    <ChoresAvatar size={28} fill={buttonPrimaryText} accent={buttonPrimary} />
                    Generate Chore Assignments
                  </span>
                )}
              </Button>

              {/* Premium Loading Skeletons with Shimmer */}
              {loading && suggestions.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="shimmer-skeleton"
                      style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        borderRadius: 12,
                        padding: '1.5rem',
                        boxShadow: shadowSmall
                      }}
                    >
                      <div style={{ height: '24px', background: 'rgba(0,0,0,0.08)', borderRadius: 6, marginBottom: '0.75rem', width: '65%' }} />
                      <div style={{ height: '20px', background: 'rgba(0,0,0,0.06)', borderRadius: 6, width: '45%' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Premium Empty State */}
              {!loading && suggestions.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    borderRadius: 16,
                    border: '2px dashed rgba(255, 255, 255, 0.6)',
                    boxShadow: shadowSmall,
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      marginBottom: '1.5rem',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <EmptyStateAvatar size={64} fill={cardText} accent={buttonPrimary} />
                  </div>
                  <h3
                    style={{
                      fontWeight: 700,
                      marginBottom: '0.75rem',
                      color: cardText,
                      fontSize: '1.25rem',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Ready to generate suggestions
                  </h3>
                  <p
                    style={{
                      fontSize: '1rem',
                      opacity: 0.75,
                      color: cardText,
                      lineHeight: 1.6,
                      maxWidth: '400px',
                      margin: '0 auto'
                    }}
                  >
                    Click the button above to get AI-powered chore assignment suggestions
                  </p>
                </div>
              )}

              {/* Premium Suggestions List */}
              {suggestions.length > 0 && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.5rem',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: cardText,
                        letterSpacing: '-0.01em'
                      }}
                    >
                      Suggestions ({suggestions.length})
                    </h3>
                    <button
                      onClick={applyAllSuggestions}
                      disabled={applyAllLoading}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: 10,
                        border: 'none',
                        background: applyAllLoading
                          ? 'rgba(0,0,0,0.1)'
                          : `linear-gradient(135deg, ${buttonPrimary} 0%, rgba(201, 247, 165, 0.9) 100%)`,
                        color: applyAllLoading ? cardText : buttonPrimaryText,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        cursor: applyAllLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: applyAllLoading ? 0.6 : 1,
                        boxShadow: shadowSmall
                      }}
                      onMouseEnter={(e) => {
                        if (!applyAllLoading) {
                          e.target.style.transform = 'translateY(-2px) scale(1.02)';
                          e.target.style.boxShadow = shadowMedium;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'none';
                        e.target.style.boxShadow = shadowSmall;
                      }}
                    >
                      {applyAllLoading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className="spin-animation" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                          Applying...
                        </span>
                      ) : (
                        '✓ Accept All'
                      )}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {suggestions.map((suggestion, index) => {
                      const cardBg = theme.card?.bg?.[index % 3] || (index % 3 === 0 ? '#fff59d' : index % 3 === 1 ? '#ffd9a8' : '#c9f7a5');
                      return (
                        <div
                          key={suggestion.choreId}
                          className="premium-suggestion-card"
                          style={{
                            background: `linear-gradient(135deg, ${cardBg} 0%, rgba(255, 255, 255, 0.8) 100%)`,
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            borderRadius: 16,
                            padding: '1.5rem',
                            boxShadow: shadowMedium,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'default',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = shadowLarge;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = shadowMedium;
                          }}
                        >
                          {/* Decorative accent */}
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '4px',
                              height: '100%',
                              background: `linear-gradient(180deg, ${buttonPrimary} 0%, transparent 100%)`,
                              borderRadius: '0 4px 4px 0'
                            }}
                          />
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem', paddingLeft: '1rem' }}>
                            <ChoresAvatar size={36} fill={cardText} accent={buttonPrimary} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                            <div style={{ flex: 1 }}>
                              <h4
                                style={{
                                  fontWeight: 700,
                                  margin: '0 0 0.75rem 0',
                                  fontSize: '1.125rem',
                                  color: cardText,
                                  letterSpacing: '-0.01em',
                                  lineHeight: 1.4
                                }}
                              >
                                {suggestion.choreTitle}
                              </h4>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  padding: '0.5rem 1rem',
                                  background: 'rgba(255, 255, 255, 0.7)',
                                  backdropFilter: 'blur(8px)',
                                  WebkitBackdropFilter: 'blur(8px)',
                                  borderRadius: 8,
                                  fontSize: '0.95rem',
                                  fontWeight: 600,
                                  color: cardText,
                                  marginBottom: '1rem',
                                  boxShadow: shadowSmall,
                                  border: '1px solid rgba(255, 255, 255, 0.5)'
                                }}
                              >
                                <PersonAvatar size={22} fill={cardText} />
                                <span>Suggested for: <strong>{suggestion.suggestedAssignee}</strong></span>
                              </div>
                            </div>
                          </div>
                          {suggestion.reasoning && (
                            <p
                              style={{
                                fontSize: '0.9rem',
                                fontStyle: 'italic',
                                opacity: 0.85,
                                margin: '0 0 1.25rem 0',
                                paddingLeft: '3.5rem',
                                color: cardText,
                                lineHeight: 1.6
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
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              letterSpacing: '0.02em',
                              background: `linear-gradient(135deg, ${buttonPrimary} 0%, rgba(201, 247, 165, 0.95) 100%)`,
                              boxShadow: shadowSmall,
                              border: 'none',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                              e.currentTarget.style.boxShadow = shadowMedium;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.boxShadow = shadowSmall;
                            }}
                            onMouseDown={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
                            }}
                            onMouseUp={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                              <span>✓</span>
                              Accept & Assign
                            </span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Premium Weekly Chores Generation Card */}
          <div
            className="premium-card"
            style={{
              background: `linear-gradient(135deg, ${theme.card?.bg?.[2] || '#c9f7a5'} 0%, rgba(201, 247, 165, 0.95) 100%)`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 20,
              padding: '2rem',
              boxShadow: shadowLarge,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = shadowXLarge;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = shadowLarge;
            }}
          >
            {/* Decorative gradient overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
                pointerEvents: 'none'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
              <CalendarAvatar size={40} fill={cardText} accent={buttonPrimary} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: 0,
                  color: cardText,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2
                }}
              >
                Weekly Chore Generation
              </h2>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: 12,
                padding: '1.25rem',
                marginBottom: '1.5rem',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: cardText,
                boxShadow: shadowSmall,
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
            >
              <InfoAvatar size={28} fill={cardText} accent={toastInfo.border} style={{ flexShrink: 0 }} />
              <span>Generate a full week of chores based on your board settings. Each chore with "days per week" configured will be created and assigned automatically.</span>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <Button
                variant="secondary"
                onClick={generateWeeklyChores}
                disabled={weeklyLoading}
                style={{
                  width: '100%',
                  marginBottom: '1.5rem',
                  minHeight: '52px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  background: weeklyLoading
                    ? 'rgba(255, 255, 255, 0.4)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: shadowMedium,
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  if (!weeklyLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = shadowLarge;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = shadowMedium;
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                }}
              >
                {weeklyLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    <span className="spin-animation" style={{ display: 'inline-block', width: '18px', height: '18px', border: '3px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    Generating Weekly Chores...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    <CalendarAvatar size={28} fill={buttonPrimaryText} accent={buttonPrimary} />
                    Generate Weekly Chores
                  </span>
                )}
              </Button>

              {/* Premium Weekly Results */}
              {weeklyResult && weeklyResult.assignments && weeklyResult.assignments.length > 0 && (
                <div>
                  <h3
                    style={{
                      margin: '0 0 1.5rem 0',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: cardText,
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Weekly Assignments ({weeklyResult.assignments.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {weeklyResult.assignments.map((a, i) => (
                      <div
                        key={a.choreId || i}
                        style={{
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.5)',
                          borderRadius: 12,
                          padding: '1.25rem',
                          boxShadow: shadowSmall,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = shadowMedium;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = shadowSmall;
                        }}
                      >
                        <h4
                          style={{
                            fontWeight: 600,
                            margin: '0 0 0.75rem 0',
                            fontSize: '1rem',
                            color: cardText,
                            letterSpacing: '-0.01em'
                          }}
                        >
                          {a.choreTitle}
                        </h4>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: 8,
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            color: cardText,
                            boxShadow: shadowSmall
                          }}
                        >
                          <PersonAvatar size={22} fill={cardText} />
                          <span>Assigned to: <strong>{a.suggestedAssignee}</strong></span>
                        </div>
                        {a.reasoning && (
                          <p
                            style={{
                              fontSize: '0.9rem',
                              fontStyle: 'italic',
                              opacity: 0.8,
                              margin: '0.75rem 0 0 0',
                              color: cardText,
                              lineHeight: 1.6
                            }}
                          >
                            {a.reasoning}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Premium Empty State for Weekly */}
              {!weeklyLoading && (!weeklyResult || !weeklyResult.assignments || weeklyResult.assignments.length === 0) && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    borderRadius: 16,
                    border: '2px dashed rgba(255, 255, 255, 0.6)',
                    boxShadow: shadowSmall
                  }}
                >
                  <div
                    style={{
                      marginBottom: '1.25rem',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <CalendarAvatar size={56} fill={cardText} accent={buttonPrimary} />
                  </div>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      opacity: 0.8,
                      color: cardText,
                      lineHeight: 1.6
                    }}
                  >
                    Weekly chores will appear here after generation
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'meals' && (
        <div
          className="premium-card"
          style={{
            maxWidth: CONTENT_WIDTH_FORM,
            margin: '0 auto',
            background: `linear-gradient(135deg, ${theme.card?.bg?.[1] || '#ffd9a8'} 0%, rgba(255, 217, 168, 0.95) 100%)`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 20,
            padding: '4rem 2rem',
            boxShadow: shadowLarge,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative gradient overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />
          <div
            style={{
              marginBottom: '1.5rem',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <MealsAvatar size={80} fill={cardText} accent={theme.card?.bg?.[1] || '#ffd9a8'} />
          </div>
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              margin: '0 0 1rem 0',
              color: cardText,
              letterSpacing: '-0.01em',
              position: 'relative',
              zIndex: 1
            }}
          >
            Meal Planning Coming Soon
          </h2>
          <p
            style={{
              fontSize: '1.125rem',
              opacity: 0.85,
              color: cardText,
              lineHeight: 1.6,
              maxWidth: '500px',
              margin: '0 auto',
              position: 'relative',
              zIndex: 1
            }}
          >
            AI-powered meal planning and grocery list generation will be available soon!
          </p>
        </div>
      )}
    </main>
  );
}
