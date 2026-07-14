// ============================================================
// FeedForge — Shared TypeScript Types
// ============================================================

/** Supported social media platforms */
export type Platform = 'instagram' | 'reddit' | 'linkedin' | 'youtube';

/** Predefined goal modes */
export type GoalMode =
  | 'learning'
  | 'interview_prep'
  | 'research'
  | 'focus'
  | 'entertainment'
  | 'custom';

// ─── Goals ────────────────────────────────────────────────────

export interface Goal {
  id: string;
  name: string;
  description: string;
  mode: GoalMode;
  weight: number; // 0–100
  keywords: string[];
  isActive: boolean;
  createdAt: number;
}

// ─── Feed Post ────────────────────────────────────────────────

export interface FeedPost {
  id: string;
  platform: Platform;
  author: string;
  authorHandle: string;
  text: string;           // Full extracted text
  imageAlt: string[];     // Alt text from images
  hashtags: string[];
  timestamp?: string;
  estimatedReadTime: number; // seconds
  element: HTMLElement;   // Reference to DOM element
  originalIndex: number;  // Position in original feed
  embedding?: number[];   // Cached local embedding
}

// ─── Ranking ─────────────────────────────────────────────────

export interface RankingScore {
  postId: string;
  totalScore: number;
  goalAlignmentScore: number;
  semanticSimilarityScore: number;
  userPreferenceScore: number;
  freshnessScore: number;
  diversityScore: number;
  distractionScore: number;
  goalBreakdown: GoalScore[];
}

export interface GoalScore {
  goalId: string;
  goalName: string;
  score: number;
  matchedKeywords: string[];
}

// ─── Explainability ──────────────────────────────────────────

export interface ExplainabilityNote {
  postId: string;
  reason: string;
  topGoal: string;
  matchedKeywords: string[];
  score: number;
  isHighValue: boolean;
}

// ─── User Preferences ────────────────────────────────────────

export interface UserPreference {
  authorHandle: string;
  platform: Platform;
  preferenceScore: number; // -1 to 1
  interactionCount: number;
  lastInteracted: number;
}

export interface TopicPreference {
  topic: string;
  preferenceScore: number; // -1 to 1
  interactionCount: number;
}

export type FeedbackType = 'like' | 'dislike' | 'save' | 'skip' | 'hide';

export interface FeedbackEvent {
  postId: string;
  authorHandle: string;
  platform: Platform;
  feedbackType: FeedbackType;
  hashtags: string[];
  goalScores: GoalScore[];
  timestamp: number;
}

// ─── User Profile ────────────────────────────────────────────

export interface UserProfile {
  version: string;
  goals: Goal[];
  hiddenTopics: string[];
  hiddenAuthors: string[];
  preferredAuthors: string[];
  authorPreferences: UserPreference[];
  topicPreferences: TopicPreference[];
  feedbackHistory: FeedbackEvent[];
  settings: ExtensionSettings;
  analytics: UserAnalytics;
  createdAt: number;
  updatedAt: number;
}

// ─── Settings ────────────────────────────────────────────────

export interface ExtensionSettings {
  enabled: boolean;
  showScoreBadges: boolean;
  showExplainability: boolean;
  focusModeEnabled: boolean;
  autoScrollEnabled: boolean;
  pauseOnHighValue: boolean;   // Pause auto-scroll on high-value posts
  highlightHighValue: boolean;
  hideDistractingContent: boolean;
  distractionThreshold: number; // 0–100
  highValueThreshold: number;   // 0–100
  platforms: Record<Platform, boolean>;
}

// ─── Analytics ───────────────────────────────────────────────

export interface UserAnalytics {
  totalPostsRanked: number;
  goalAlignedPostsConsumed: number;
  lowValuePostsHidden: number;
  sessionHistory: SessionRecord[];
  topicsBreakdown: Record<string, number>;
  timeSpentByGoal: Record<string, number>;
}

export interface SessionRecord {
  date: string;
  platform: Platform;
  postsRanked: number;
  highValueSeen: number;
  lowValueHidden: number;
  duration: number; // seconds
}

// ─── Extension Messages ──────────────────────────────────────

export type MessageType =
  | 'GET_PROFILE'
  | 'SET_PROFILE'
  | 'UPDATE_SETTINGS'
  | 'UPDATE_GOALS'
  | 'FEEDBACK_EVENT'
  | 'GET_ANALYTICS'
  | 'RESET_PROFILE'
  | 'EXPORT_PROFILE'
  | 'IMPORT_PROFILE';

export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}

export interface ExtensionResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}
