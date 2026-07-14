// ============================================================
// FeedForge — User Profile Schema & Defaults
// ============================================================

import type { UserProfile, ExtensionSettings, UserAnalytics } from '../shared/types';
import { GOAL_PRESETS } from '../shared/constants';
import { generateId } from '../shared/utils';
import { APP_VERSION } from '../shared/constants';

export function getDefaultSettings(): ExtensionSettings {
  return {
    enabled: true,
    showScoreBadges: true,
    showExplainability: true,
    focusModeEnabled: false,
    autoScrollEnabled: false,
    pauseOnHighValue: true,
    highlightHighValue: true,
    hideDistractingContent: false,
    distractionThreshold: 30,
    highValueThreshold: 70,
    platforms: {
      instagram: true,
      reddit: true,
      linkedin: true,
      youtube: true,
    },
  };
}

export function getDefaultAnalytics(): UserAnalytics {
  return {
    totalPostsRanked: 0,
    goalAlignedPostsConsumed: 0,
    lowValuePostsHidden: 0,
    sessionHistory: [],
    topicsBreakdown: {},
    timeSpentByGoal: {},
  };
}

export function getDefaultProfile(): UserProfile {
  // Start with two default goals
  const defaultGoals = [
    {
      id: generateId(),
      name: GOAL_PRESETS[0].name,
      description: GOAL_PRESETS[0].description,
      mode: GOAL_PRESETS[0].mode,
      weight: 60,
      keywords: [...GOAL_PRESETS[0].keywords],
      isActive: true,
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      name: GOAL_PRESETS[1].name,
      description: GOAL_PRESETS[1].description,
      mode: GOAL_PRESETS[1].mode,
      weight: 40,
      keywords: [...GOAL_PRESETS[1].keywords],
      isActive: true,
      createdAt: Date.now(),
    },
  ];

  return {
    version: APP_VERSION,
    goals: defaultGoals,
    hiddenTopics: [],
    hiddenAuthors: [],
    preferredAuthors: [],
    authorPreferences: [],
    topicPreferences: [],
    feedbackHistory: [],
    settings: getDefaultSettings(),
    analytics: getDefaultAnalytics(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
