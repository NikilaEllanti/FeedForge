import React, { useState, useEffect } from 'react';
import GoalsPage from './pages/GoalsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import FocusModePage from './pages/FocusModePage';
import type { UserProfile } from '../shared/types';

// Simple message sending helper (works from popup context)
async function sendMessage(type: string, payload?: unknown) {
  return chrome.runtime.sendMessage({ type, payload });
}

type Tab = 'goals' | 'analytics' | 'focus' | 'settings';

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'goals', label: 'Goals', icon: '🎯' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'focus', label: 'Focus', icon: '🧘' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('goals');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await sendMessage('GET_PROFILE');
      if (res?.success && res.data) {
        setProfile(res.data as UserProfile);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleEnabled() {
    if (!profile) return;
    const newSettings = { ...profile.settings, enabled: !profile.settings.enabled };
    await sendMessage('UPDATE_SETTINGS', newSettings);
    setProfile(p => p ? { ...p, settings: newSettings } : p);
  }

  async function handleProfileUpdate(updated: UserProfile) {
    setProfile(updated);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center', color: 'var(--ff-text-muted)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
          <div style={{ fontSize: 12 }}>Loading FeedForge...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="ff-header">
        <div className="ff-logo">
          <div className="ff-logo-icon">⚡</div>
          <span className="ff-logo-text">FeedForge</span>
        </div>
        <div className="ff-toggle-wrap">
          <span>{profile?.settings.enabled ? 'On' : 'Off'}</span>
          <label className="ff-toggle">
            <input
              type="checkbox"
              checked={profile?.settings.enabled ?? true}
              onChange={handleToggleEnabled}
            />
            <div className="ff-toggle-track">
              <div className="ff-toggle-thumb" />
            </div>
          </label>
        </div>
      </header>

      {/* Navigation */}
      <nav className="ff-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            id={`ff-nav-${item.id}`}
            className={`ff-nav-btn ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="ff-content ff-animate-in" key={activeTab}>
        {!profile ? (
          <div className="ff-empty">
            <div className="ff-empty-icon">⚠️</div>
            <p className="ff-empty-text">Failed to load profile. Try reloading.</p>
          </div>
        ) : (
          <>
            {activeTab === 'goals' && (
              <GoalsPage profile={profile} onUpdate={handleProfileUpdate} />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsPage profile={profile} />
            )}
            {activeTab === 'focus' && (
              <FocusModePage profile={profile} onUpdate={handleProfileUpdate} />
            )}
            {activeTab === 'settings' && (
              <SettingsPage profile={profile} onUpdate={handleProfileUpdate} />
            )}
          </>
        )}
      </main>
    </>
  );
}
