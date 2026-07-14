// ============================================================
// FeedForge — Adaptive Preference Learner
// ============================================================
// Learns from explicit user feedback (thumbs up/down, saves,
// skips) to continuously adapt ranking over time.
// ============================================================

import type {
  FeedbackEvent,
  FeedbackType,
  UserPreference,
  TopicPreference,
  UserProfile,
} from '../shared/types';
import { getUserProfile, setUserProfile } from '../storage/chrome-storage';
import { clamp, getTodayDate } from '../shared/utils';
import { generateId } from '../shared/utils';

// ─── Feedback Score Deltas ────────────────────────────────────

const FEEDBACK_DELTAS: Record<FeedbackType, number> = {
  like: +0.15,
  save: +0.20,
  dislike: -0.20,
  skip: -0.05,
  hide: -0.30,
};

// ─── Main Feedback Handler ────────────────────────────────────

export async function recordFeedback(event: FeedbackEvent): Promise<void> {
  const profile = await getUserProfile();
  const delta = FEEDBACK_DELTAS[event.feedbackType];

  // Update author preference
  profile.authorPreferences = updateAuthorPreference(
    profile.authorPreferences,
    event.authorHandle,
    event.platform,
    delta,
  );

  // Update topic preferences for each hashtag
  profile.topicPreferences = updateTopicPreferences(
    profile.topicPreferences,
    event.hashtags,
    delta,
  );

  // Add to history
  profile.feedbackHistory.push({
    ...event,
    timestamp: Date.now(),
  });

  // Update analytics
  if (delta > 0) {
    profile.analytics.goalAlignedPostsConsumed++;
  } else if (event.feedbackType === 'hide') {
    profile.analytics.lowValuePostsHidden++;
  }

  await setUserProfile(profile);
}

// ─── Hide Author ─────────────────────────────────────────────

export async function hideAuthor(authorHandle: string): Promise<void> {
  const profile = await getUserProfile();
  if (!profile.hiddenAuthors.includes(authorHandle)) {
    profile.hiddenAuthors.push(authorHandle);
    await setUserProfile(profile);
  }
}

export async function hideTopics(topics: string[]): Promise<void> {
  const profile = await getUserProfile();
  for (const topic of topics) {
    if (!profile.hiddenTopics.includes(topic)) {
      profile.hiddenTopics.push(topic);
    }
  }
  await setUserProfile(profile);
}

// ─── Analytics Tracker ───────────────────────────────────────

export async function recordSession(params: {
  platform: string;
  postsRanked: number;
  highValueSeen: number;
  lowValueHidden: number;
  duration: number;
}): Promise<void> {
  const profile = await getUserProfile();

  profile.analytics.totalPostsRanked += params.postsRanked;
  profile.analytics.sessionHistory.push({
    date: getTodayDate(),
    platform: params.platform as 'instagram',
    postsRanked: params.postsRanked,
    highValueSeen: params.highValueSeen,
    lowValueHidden: params.lowValueHidden,
    duration: params.duration,
  });

  // Keep only last 90 days of sessions
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0];
  profile.analytics.sessionHistory = profile.analytics.sessionHistory.filter(
    s => s.date >= cutoffDate,
  );

  await setUserProfile(profile);
}

// ─── Helpers ─────────────────────────────────────────────────

function updateAuthorPreference(
  preferences: UserPreference[],
  authorHandle: string,
  platform: UserPreference['platform'],
  delta: number,
): UserPreference[] {
  const existing = preferences.find(
    p => p.authorHandle === authorHandle && p.platform === platform,
  );

  if (existing) {
    existing.preferenceScore = clamp(existing.preferenceScore + delta, -1, 1);
    existing.interactionCount++;
    existing.lastInteracted = Date.now();
  } else {
    preferences.push({
      authorHandle,
      platform,
      preferenceScore: clamp(0.5 + delta, -1, 1),
      interactionCount: 1,
      lastInteracted: Date.now(),
    });
  }

  return preferences;
}

function updateTopicPreferences(
  preferences: TopicPreference[],
  hashtags: string[],
  delta: number,
): TopicPreference[] {
  for (const tag of hashtags) {
    const existing = preferences.find(p => p.topic === tag);
    if (existing) {
      existing.preferenceScore = clamp(existing.preferenceScore + delta * 0.5, -1, 1);
      existing.interactionCount++;
    } else {
      preferences.push({
        topic: tag,
        preferenceScore: clamp(0.5 + delta * 0.5, -1, 1),
        interactionCount: 1,
      });
    }
  }
  return preferences;
}
