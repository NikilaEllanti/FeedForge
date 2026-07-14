import React, { useState } from 'react';
import type { UserProfile, Goal, GoalMode } from '../../shared/types';
import { GOAL_PRESETS } from '../../shared/constants';

interface Props {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

async function sendMessage(type: string, payload?: unknown) {
  return chrome.runtime.sendMessage({ type, payload });
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const MODE_ICONS: Record<GoalMode, string> = {
  learning: '📚',
  interview_prep: '💼',
  research: '🔬',
  focus: '🧘',
  entertainment: '🎭',
  custom: '✨',
};

export default function GoalsPage({ profile, onUpdate }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalMode, setNewGoalMode] = useState<GoalMode>('learning');
  const [newGoalKeywords, setNewGoalKeywords] = useState('');
  const [newGoalWeight, setNewGoalWeight] = useState(50);
  const [keywordInput, setKeywordInput] = useState('');

  async function handleWeightChange(goalId: string, weight: number) {
    const updated = {
      ...profile,
      goals: profile.goals.map(g => g.id === goalId ? { ...g, weight } : g),
    };
    await sendMessage('UPDATE_GOALS', updated.goals);
    onUpdate(updated);
  }

  async function handleToggleGoal(goalId: string) {
    const updated = {
      ...profile,
      goals: profile.goals.map(g => g.id === goalId ? { ...g, isActive: !g.isActive } : g),
    };
    await sendMessage('UPDATE_GOALS', updated.goals);
    onUpdate(updated);
  }

  async function handleDeleteGoal(goalId: string) {
    const updated = {
      ...profile,
      goals: profile.goals.filter(g => g.id !== goalId),
    };
    await sendMessage('UPDATE_GOALS', updated.goals);
    onUpdate(updated);
  }

  async function handleAddGoal() {
    if (!newGoalName.trim()) return;

    const preset = GOAL_PRESETS.find(p => p.mode === newGoalMode);
    const keywords = newGoalKeywords
      ? newGoalKeywords.split(',').map(k => k.trim()).filter(Boolean)
      : (preset?.keywords ? [...preset.keywords] : []);

    const newGoal: Goal = {
      id: generateId(),
      name: newGoalName.trim(),
      description: preset?.description ?? '',
      mode: newGoalMode,
      weight: newGoalWeight,
      keywords,
      isActive: true,
      createdAt: Date.now(),
    };

    const updated = { ...profile, goals: [...profile.goals, newGoal] };
    await sendMessage('UPDATE_GOALS', updated.goals);
    onUpdate(updated);

    setShowAddModal(false);
    setNewGoalName('');
    setNewGoalKeywords('');
    setNewGoalWeight(50);
  }

  function handlePresetSelect(mode: GoalMode) {
    const preset = GOAL_PRESETS.find(p => p.mode === mode);
    if (preset) {
      setNewGoalName(preset.name);
      setNewGoalMode(mode);
      setNewGoalKeywords(preset.keywords.join(', '));
    }
  }

  const activeGoals = profile.goals.filter(g => g.isActive);
  const totalWeight = activeGoals.reduce((s, g) => s + g.weight, 0);

  return (
    <>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p className="ff-section-title">Active Goals</p>
          <p style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginTop: 2 }}>
            {activeGoals.length} active · {totalWeight}% total weight
          </p>
        </div>
        <button
          id="ff-add-goal-btn"
          className="ff-btn ff-btn-primary ff-btn-sm"
          onClick={() => setShowAddModal(true)}
        >
          + Add Goal
        </button>
      </div>

      {/* Goal List */}
      {profile.goals.length === 0 ? (
        <div className="ff-empty">
          <div className="ff-empty-icon">🎯</div>
          <p className="ff-empty-text">No goals yet. Add your first goal!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {profile.goals.map(goal => (
            <div
              key={goal.id}
              className="ff-goal-item"
              style={{ opacity: goal.isActive ? 1 : 0.5 }}
            >
              <div className="ff-goal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{MODE_ICONS[goal.mode]}</span>
                  <span className="ff-goal-name">{goal.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className={`ff-btn ff-btn-icon ff-btn-sm ${goal.isActive ? 'ff-btn-ghost' : 'ff-btn-primary'}`}
                    onClick={() => handleToggleGoal(goal.id)}
                    data-tooltip={goal.isActive ? 'Pause' : 'Activate'}
                    title={goal.isActive ? 'Pause' : 'Activate'}
                  >
                    {goal.isActive ? '⏸' : '▶'}
                  </button>
                  <button
                    className="ff-btn ff-btn-icon ff-btn-sm ff-btn-danger"
                    onClick={() => handleDeleteGoal(goal.id)}
                    title="Delete goal"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {goal.description && (
                <p className="ff-goal-desc">{goal.description}</p>
              )}

              {/* Keywords */}
              {goal.keywords.length > 0 && (
                <div className="ff-tags" style={{ marginBottom: 8 }}>
                  {goal.keywords.slice(0, 5).map(k => (
                    <span key={k} className="ff-tag">{k}</span>
                  ))}
                  {goal.keywords.length > 5 && (
                    <span className="ff-tag">+{goal.keywords.length - 5}</span>
                  )}
                </div>
              )}

              {/* Weight Slider */}
              {goal.isActive && (
                <div className="ff-goal-weight-row">
                  <span className="ff-goal-weight-label">Weight: {goal.weight}%</span>
                  <div className="ff-slider-wrap">
                    <input
                      type="range"
                      className="ff-slider"
                      min={0}
                      max={100}
                      value={goal.weight}
                      onChange={e => handleWeightChange(goal.id, Number(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Presets Section */}
      <div>
        <p className="ff-section-title" style={{ marginBottom: 8 }}>Quick Presets</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {GOAL_PRESETS.map(preset => (
            <button
              key={preset.mode}
              className="ff-btn ff-btn-ghost ff-btn-sm"
              style={{ justifyContent: 'flex-start', gap: 6 }}
              onClick={() => {
                handlePresetSelect(preset.mode);
                setShowAddModal(true);
              }}
            >
              <span>{MODE_ICONS[preset.mode]}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="ff-modal-overlay" onClick={e => {
          if (e.target === e.currentTarget) setShowAddModal(false);
        }}>
          <div className="ff-modal">
            <p className="ff-modal-title">✨ New Goal</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="ff-form-group">
                <label className="ff-label">Goal Name</label>
                <input
                  id="ff-new-goal-name"
                  className="ff-input"
                  placeholder="e.g., Learn SQL"
                  value={newGoalName}
                  onChange={e => setNewGoalName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="ff-form-group">
                <label className="ff-label">Goal Type</label>
                <select
                  className="ff-select"
                  value={newGoalMode}
                  onChange={e => handlePresetSelect(e.target.value as GoalMode)}
                >
                  {GOAL_PRESETS.map(p => (
                    <option key={p.mode} value={p.mode}>
                      {MODE_ICONS[p.mode]} {p.name}
                    </option>
                  ))}
                  <option value="custom">✨ Custom</option>
                </select>
              </div>

              <div className="ff-form-group">
                <label className="ff-label">Keywords (comma-separated)</label>
                <input
                  className="ff-input"
                  placeholder="sql, database, query, joins..."
                  value={newGoalKeywords}
                  onChange={e => setNewGoalKeywords(e.target.value)}
                />
              </div>

              <div className="ff-form-group">
                <label className="ff-label">Initial Weight: {newGoalWeight}%</label>
                <input
                  type="range"
                  className="ff-slider"
                  min={10}
                  max={100}
                  value={newGoalWeight}
                  onChange={e => setNewGoalWeight(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="ff-btn ff-btn-ghost" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button
                  id="ff-confirm-add-goal"
                  className="ff-btn ff-btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleAddGoal}
                >
                  Add Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
