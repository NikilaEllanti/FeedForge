// ============================================================
// FeedForge — Goal-Based Ranking Engine
// ============================================================
// Scoring formula (from PRD):
// Score = GoalAlignment + SemanticSimilarity + UserPreference
//       + Freshness + Diversity - DistractionScore
// ============================================================

import type {
  FeedPost,
  Goal,
  RankingScore,
  GoalScore,
  UserPreference,
  TopicPreference,
} from '../shared/types';
import { RANKING_WEIGHTS, DISTRACTION_KEYWORDS } from '../shared/constants';
import { clamp, calculateFreshness, extractHashtags } from '../shared/utils';
import { embedText, computeSemanticSimilarity } from './embedding';
import { getWeightMap } from './goal-manager';

// ─── Main Scoring Function ───────────────────────────────────

export async function rankPost(
  post: FeedPost,
  goals: Goal[],
  authorPreferences: UserPreference[],
  topicPreferences: TopicPreference[],
  seenTopics: Set<string>,
): Promise<RankingScore> {
  const activeGoals = goals.filter(g => g.isActive);
  const weightMap = getWeightMap(activeGoals);

  // 1. Get or compute post embedding
  const postText = [post.text, ...post.imageAlt].join(' ').slice(0, 512);
  const postEmbedding = await embedText(postText);

  // 2. Goal Alignment — keyword matching
  const goalBreakdown: GoalScore[] = [];
  let goalAlignmentScore = 0;

  for (const goal of activeGoals) {
    const weight = weightMap.get(goal.id) ?? 0;
    const { score, matchedKeywords } = computeKeywordAlignment(
      post.text + ' ' + post.imageAlt.join(' '),
      post.hashtags,
      goal.keywords,
    );

    goalBreakdown.push({
      goalId: goal.id,
      goalName: goal.name,
      score: score * 100,
      matchedKeywords,
    });

    goalAlignmentScore += score * weight;
  }

  // 3. Semantic similarity (averaged across goals)
  let semanticSimilarityScore = 0;
  for (const goal of activeGoals) {
    const weight = weightMap.get(goal.id) ?? 0;
    const sim = await computeSemanticSimilarity(postEmbedding, goal.keywords);
    semanticSimilarityScore += sim * weight;
  }

  // 4. User Preference Score
  const userPreferenceScore = computeUserPreference(
    post,
    authorPreferences,
    topicPreferences,
  );

  // 5. Freshness Score
  const freshnessScore = calculateFreshness(post.timestamp);

  // 6. Diversity Score (penalize if topic already seen a lot)
  const diversityScore = computeDiversityScore(post.hashtags, seenTopics);

  // 7. Distraction Score
  const distractionScore = computeDistractionScore(post.text);

  // ─── Combine Scores ───────────────────────────────────────
  const rawScore =
    goalAlignmentScore * RANKING_WEIGHTS.GOAL_ALIGNMENT * 100 +
    semanticSimilarityScore * RANKING_WEIGHTS.SEMANTIC_SIMILARITY * 100 +
    userPreferenceScore * RANKING_WEIGHTS.USER_PREFERENCE * 100 +
    freshnessScore * RANKING_WEIGHTS.FRESHNESS * 100 +
    diversityScore * RANKING_WEIGHTS.DIVERSITY * 100 -
    distractionScore * 20;

  const totalScore = clamp(rawScore, 0, 100);

  return {
    postId: post.id,
    totalScore,
    goalAlignmentScore: goalAlignmentScore * 100,
    semanticSimilarityScore: semanticSimilarityScore * 100,
    userPreferenceScore: userPreferenceScore * 100,
    freshnessScore: freshnessScore * 100,
    diversityScore: diversityScore * 100,
    distractionScore: distractionScore * 100,
    goalBreakdown,
  };
}

// ─── Batch Ranking ───────────────────────────────────────────

export async function rankPosts(
  posts: FeedPost[],
  goals: Goal[],
  authorPreferences: UserPreference[],
  topicPreferences: TopicPreference[],
): Promise<RankingScore[]> {
  const seenTopics = new Set<string>();
  const scores: RankingScore[] = [];

  for (const post of posts) {
    const score = await rankPost(
      post,
      goals,
      authorPreferences,
      topicPreferences,
      seenTopics,
    );
    scores.push(score);

    // Track seen topics for diversity
    for (const tag of post.hashtags) {
      seenTopics.add(tag);
    }
  }

  return scores;
}

/** Sort posts by their ranking scores (highest first) */
export function sortByScore(
  posts: FeedPost[],
  scores: RankingScore[],
): FeedPost[] {
  const scoreMap = new Map(scores.map(s => [s.postId, s.totalScore]));
  return [...posts].sort((a, b) => {
    const scoreA = scoreMap.get(a.id) ?? 0;
    const scoreB = scoreMap.get(b.id) ?? 0;
    return scoreB - scoreA;
  });
}

// ─── Sub-Scorers ─────────────────────────────────────────────

function computeKeywordAlignment(
  text: string,
  hashtags: string[],
  keywords: string[],
): { score: number; matchedKeywords: string[] } {
  const lowerText = text.toLowerCase();
  const matchedKeywords: string[] = [];

  for (const kw of keywords) {
    const lower = kw.toLowerCase();
    if (lowerText.includes(lower) || hashtags.some(h => h.includes(lower))) {
      matchedKeywords.push(kw);
    }
  }

  const score = keywords.length > 0
    ? matchedKeywords.length / keywords.length
    : 0;

  return { score, matchedKeywords };
}

function computeUserPreference(
  post: FeedPost,
  authorPreferences: UserPreference[],
  topicPreferences: TopicPreference[],
): number {
  let score = 0.5; // Neutral baseline

  // Check author preference
  const authorPref = authorPreferences.find(
    p => p.authorHandle === post.authorHandle && p.platform === post.platform,
  );
  if (authorPref) {
    score += authorPref.preferenceScore * 0.3;
  }

  // Check topic/hashtag preferences
  const hashtags = post.hashtags;
  let topicScore = 0;
  let topicCount = 0;

  for (const tag of hashtags) {
    const pref = topicPreferences.find(p => p.topic === tag);
    if (pref) {
      topicScore += pref.preferenceScore;
      topicCount++;
    }
  }

  if (topicCount > 0) {
    score += (topicScore / topicCount) * 0.2;
  }

  return clamp(score, 0, 1);
}

function computeDiversityScore(hashtags: string[], seenTopics: Set<string>): number {
  if (hashtags.length === 0) return 0.5;

  const overlapCount = hashtags.filter(h => seenTopics.has(h)).length;
  const overlapRatio = overlapCount / hashtags.length;

  // High overlap = low diversity score
  return clamp(1 - overlapRatio, 0, 1);
}

function computeDistractionScore(text: string): number {
  const lower = text.toLowerCase();
  const matches = DISTRACTION_KEYWORDS.filter(kw => lower.includes(kw));
  return clamp(matches.length / DISTRACTION_KEYWORDS.length, 0, 1);
}
