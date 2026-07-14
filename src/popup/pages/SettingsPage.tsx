import React, { useState } from 'react';
import type { UserProfile, ExtensionSettings, Platform } from '../../shared/types';

interface Props {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

async function sendMessage(type: string, payload?: unknown) {
  return chrome.runtime.sendMessage({ type, payload });
}

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: '📸 Instagram',
  reddit: '🤖 Reddit',
  linkedin: '💼 LinkedIn',
  youtube: '▶ YouTube',
};

const PLATFORM_STATUS: Record<Platform, string> = {
  instagram: 'Active',
  reddit: 'Phase 2',
  linkedin: 'Phase 3',
  youtube: 'Phase 4',
};

export default function SettingsPage({ profile, onUpdate }: Props) {
  const { settings } = profile;
  const [importing, setImporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  async function updateSetting<K extends keyof ExtensionSettings>(
    key: K,
    value: ExtensionSettings[K],
  ) {
    const newSettings = { ...settings, [key]: value };
    await sendMessage('UPDATE_SETTINGS', newSettings);
    onUpdate({ ...profile, settings: newSettings });
  }

  async function handlePlatformToggle(platform: Platform) {
    const newPlatforms = { ...settings.platforms, [platform]: !settings.platforms[platform] };
    await updateSetting('platforms', newPlatforms);
  }

  async function handleExport() {
    const res = await sendMessage('EXPORT_PROFILE');
    if (res?.success && res.data) {
      const blob = new Blob([res.data as string], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedforge-profile-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 2000);
    }
  }

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const res = await sendMessage('IMPORT_PROFILE', text);
        if (res?.success) {
          onUpdate(res.data as UserProfile);
        }
      } catch (err) {
        console.error('Import failed:', err);
      } finally {
        setImporting(false);
      }
    };
    input.click();
  }

  async function handleReset() {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }
    const res = await sendMessage('RESET_PROFILE');
    if (res?.success) {
      onUpdate(res.data as UserProfile);
      setResetConfirm(false);
    }
  }

  const SettingRow = ({
    label,
    desc,
    checked,
    onChange,
    id,
  }: {
    label: string;
    desc?: string;
    checked: boolean;
    onChange: () => void;
    id: string;
  }) => (
    <div className="ff-setting-row">
      <div className="ff-setting-info">
        <div className="ff-setting-label">{label}</div>
        {desc && <div className="ff-setting-desc">{desc}</div>}
      </div>
      <label className="ff-toggle" style={{ flexShrink: 0, marginLeft: 12 }}>
        <input id={id} type="checkbox" checked={checked} onChange={onChange} />
        <div className="ff-toggle-track"><div className="ff-toggle-thumb" /></div>
      </label>
    </div>
  );

  return (
    <>
      {/* Visual Settings */}
      <div>
        <p className="ff-section-title">Display</p>
        <div className="ff-card" style={{ padding: '4px 12px' }}>
          <SettingRow
            id="ff-setting-badges"
            label="Score Badges"
            desc="Show relevance score on each post"
            checked={settings.showScoreBadges}
            onChange={() => updateSetting('showScoreBadges', !settings.showScoreBadges)}
          />
          <SettingRow
            id="ff-setting-explain"
            label="Explainability"
            desc={'"Why this post?" tooltip on badges'}
            checked={settings.showExplainability}
            onChange={() => updateSetting('showExplainability', !settings.showExplainability)}
          />
          <SettingRow
            id="ff-setting-highlight"
            label="Highlight High-Value"
            desc="Outline top posts with a glow"
            checked={settings.highlightHighValue}
            onChange={() => updateSetting('highlightHighValue', !settings.highlightHighValue)}
          />
          <SettingRow
            id="ff-setting-hide"
            label="Hide Distracting Content"
            desc="Remove low-score posts from view"
            checked={settings.hideDistractingContent}
            onChange={() => updateSetting('hideDistractingContent', !settings.hideDistractingContent)}
          />
        </div>
      </div>

      {/* Thresholds */}
      <div>
        <p className="ff-section-title">Thresholds</p>
        <div className="ff-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ff-text-secondary)', marginBottom: 4 }}>
                <span>High-Value Threshold</span>
                <span style={{ color: 'var(--ff-green)' }}>{settings.highValueThreshold}</span>
              </div>
              <input
                type="range"
                className="ff-slider"
                min={50}
                max={95}
                value={settings.highValueThreshold}
                onChange={e => updateSetting('highValueThreshold', Number(e.target.value))}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ff-text-secondary)', marginBottom: 4 }}>
                <span>Distraction Threshold</span>
                <span style={{ color: 'var(--ff-amber)' }}>{settings.distractionThreshold}</span>
              </div>
              <input
                type="range"
                className="ff-slider"
                min={5}
                max={50}
                value={settings.distractionThreshold}
                onChange={e => updateSetting('distractionThreshold', Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Platforms */}
      <div>
        <p className="ff-section-title">Platforms</p>
        <div className="ff-platform-grid">
          {(Object.entries(PLATFORM_LABELS) as [Platform, string][]).map(([platform, label]) => (
            <button
              key={platform}
              id={`ff-platform-${platform}`}
              className={`ff-platform-btn ${settings.platforms[platform] ? 'active' : ''}`}
              onClick={() => handlePlatformToggle(platform)}
              title={PLATFORM_STATUS[platform]}
            >
              <span>{label}</span>
              <span style={{ fontSize: 9, color: 'var(--ff-text-muted)', marginLeft: 'auto' }}>
                {PLATFORM_STATUS[platform]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Export / Import */}
      <div>
        <p className="ff-section-title">Profile</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button id="ff-export-btn" className="ff-btn ff-btn-ghost ff-btn-full" onClick={handleExport}>
            {exportDone ? '✅ Exported!' : '⬇ Export Profile'}
          </button>
          <button id="ff-import-btn" className="ff-btn ff-btn-ghost ff-btn-full" onClick={handleImport} disabled={importing}>
            {importing ? '⏳ Importing...' : '⬆ Import Profile'}
          </button>
          <button
            id="ff-reset-btn"
            className={`ff-btn ff-btn-full ${resetConfirm ? 'ff-btn-danger' : 'ff-btn-ghost'}`}
            onClick={handleReset}
          >
            {resetConfirm ? '⚠ Click again to confirm reset' : '↺ Reset to Defaults'}
          </button>
        </div>
      </div>

      {/* Version */}
      <div style={{ textAlign: 'center', color: 'var(--ff-text-muted)', fontSize: 10, paddingBottom: 4 }}>
        FeedForge v{profile.version} · Local-first · No data leaves your device
      </div>
    </>
  );
}
