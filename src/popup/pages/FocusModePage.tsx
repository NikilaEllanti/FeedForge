import React from 'react';
import type { UserProfile } from '../../shared/types';

interface Props {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

async function sendMessage(type: string, payload?: unknown) {
  return chrome.runtime.sendMessage({ type, payload });
}

export default function FocusModePage({ profile, onUpdate }: Props) {
  const isFocusActive = profile.settings.focusModeEnabled;
  const activeGoals = profile.goals.filter(g => g.isActive);

  async function toggleFocusMode() {
    const newSettings = {
      ...profile.settings,
      focusModeEnabled: !isFocusActive,
    };
    await sendMessage('UPDATE_SETTINGS', newSettings);
    onUpdate({ ...profile, settings: newSettings });
  }

  async function toggleAutoScroll() {
    const newSettings = {
      ...profile.settings,
      autoScrollEnabled: !profile.settings.autoScrollEnabled,
    };
    await sendMessage('UPDATE_SETTINGS', newSettings);
    onUpdate({ ...profile, settings: newSettings });
  }

  return (
    <>
      {/* Hero */}
      <div className="ff-focus-hero">
        <span className="ff-focus-icon">{isFocusActive ? '🧘' : '📱'}</span>
        <h2 className="ff-focus-title">
          {isFocusActive ? 'Focus Mode Active' : 'Focus Mode'}
        </h2>
        <p className="ff-focus-desc">
          {isFocusActive
            ? `Optimizing for ${activeGoals.length} goal${activeGoals.length !== 1 ? 's' : ''}. Distracting content is filtered.`
            : 'Enable Focus Mode to filter out distracting content and focus only on your goals.'}
        </p>
      </div>

      {/* Focus Toggle */}
      <button
        id="ff-focus-toggle"
        className={`ff-focus-toggle-large ${isFocusActive ? 'active' : ''}`}
        onClick={toggleFocusMode}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: isFocusActive ? 'var(--ff-purple-light)' : 'var(--ff-text-primary)' }}>
            {isFocusActive ? '✅ Focus Mode On' : '○ Enable Focus Mode'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginTop: 2 }}>
            Filters low-relevance posts from feed
          </div>
        </div>
        <label className="ff-toggle" onClick={e => e.stopPropagation()}>
          <input type="checkbox" checked={isFocusActive} onChange={toggleFocusMode} />
          <div className="ff-toggle-track"><div className="ff-toggle-thumb" /></div>
        </label>
      </button>

      {/* Active Goals Summary */}
      {activeGoals.length > 0 && (
        <div>
          <p className="ff-section-title">Optimizing For</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {activeGoals.map(goal => (
              <div
                key={goal.id}
                className="ff-card"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}
              >
                <span style={{ fontSize: 13, color: 'var(--ff-text-primary)' }}>{goal.name}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 100,
                    background: 'var(--ff-purple-dim)',
                    color: 'var(--ff-purple-light)',
                  }}
                >
                  {goal.weight}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeGoals.length === 0 && (
        <div className="ff-empty">
          <div className="ff-empty-icon">🎯</div>
          <p className="ff-empty-text">Add goals on the Goals tab to use Focus Mode.</p>
        </div>
      )}

      {/* Auto Scroll */}
      <div className="ff-card" style={{ padding: '8px 12px' }}>
        <div className="ff-setting-row" style={{ borderBottom: 'none', padding: 0 }}>
          <div className="ff-setting-info">
            <div className="ff-setting-label">🖱 Smart Auto-Scroll</div>
            <div className="ff-setting-desc">Auto-scrolls and pauses on high-value posts</div>
          </div>
          <label className="ff-toggle" style={{ flexShrink: 0, marginLeft: 12 }}>
            <input
              id="ff-auto-scroll"
              type="checkbox"
              checked={profile.settings.autoScrollEnabled}
              onChange={toggleAutoScroll}
            />
            <div className="ff-toggle-track"><div className="ff-toggle-thumb" /></div>
          </label>
        </div>
      </div>

      {/* Tips */}
      <div className="ff-card" style={{ background: 'var(--ff-purple-dim)', borderColor: 'rgba(99,102,241,0.2)' }}>
        <p style={{ fontSize: 12, color: 'var(--ff-purple-light)', fontWeight: 600, marginBottom: 6 }}>
          💡 Focus Mode Tips
        </p>
        <ul style={{ paddingLeft: 16, fontSize: 11, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
          <li>Set your goals first with appropriate weights</li>
          <li>High-value posts are highlighted with a glow</li>
          <li>Low-value posts are dimmed or hidden</li>
          <li>Adjust thresholds in Settings</li>
        </ul>
      </div>
    </>
  );
}
