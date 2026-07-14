// ============================================================
// FeedForge — Content Script Entry Point
// ============================================================
// This script runs in the context of supported web pages.
// It coordinates the adapter, ranking engine, and renderer.
// ============================================================

import { InstagramAdapter } from './adapters/instagram.adapter';
import { RedditAdapter } from './adapters/reddit.adapter';
import { LinkedInAdapter } from './adapters/linkedin.adapter';
import { YouTubeAdapter } from './adapters/youtube.adapter';
import { rankPosts, sortByScore } from '../engine/ranking';
import { loadEmbeddingModel } from '../engine/embedding';
import {
  injectStyles,
  addScoreBadge,
  applyVisualStyling,
  reorderFeed,
  showFocusBanner,
  hideFocusBanner,
  cleanupRenderer,
} from './feed/dom-renderer';
import { getUserProfile, saveSettings } from '../storage/chrome-storage';
import { debounce } from '../shared/utils';
import type { FeedPost, RankingScore, ExtensionSettings } from '../shared/types';
import type { BaseAdapter } from './adapters/base.adapter';

// ─── Adapter Registry ────────────────────────────────────────

const adapters: BaseAdapter[] = [
  new InstagramAdapter(),
  new RedditAdapter(),
  new LinkedInAdapter(),
  new YouTubeAdapter(),
];

function getActiveAdapter(): BaseAdapter | null {
  return adapters.find(a => a.canRun()) ?? null;
}

// ─── Main Logic ──────────────────────────────────────────────

let isRunning = false;
let stopObserving: (() => void) | null = null;
let currentSettings: ExtensionSettings | null = null;

async function initialize(): Promise<void> {
  const profile = await getUserProfile();
  currentSettings = profile.settings;

  if (!currentSettings.enabled) {
    console.log('[FeedForge] Extension disabled');
    return;
  }

  const adapter = getActiveAdapter();
  if (!adapter) {
    console.log('[FeedForge] No adapter for this page');
    return;
  }

  console.log(`[FeedForge] Active on: ${adapter.platform}`);

  // Check if platform is enabled
  if (!currentSettings.platforms[adapter.platform]) {
    console.log(`[FeedForge] ${adapter.platform} is disabled`);
    return;
  }

  injectStyles();

  // Show focus mode banner if enabled
  if (currentSettings.focusModeEnabled) {
    showFocusBanner(profile.goals.filter(g => g.isActive).length, () => {
      saveSettings({ ...currentSettings!, focusModeEnabled: false });
    });
  }

  // Preload embedding model in background (non-blocking)
  loadEmbeddingModel().catch(err => {
    console.warn('[FeedForge] Model preload failed (will retry on first use):', err);
  });

  // Run initial ranking
  await runRanking(adapter, profile);

  // Observe for new posts (infinite scroll)
  stopObserving = adapter.observeFeed(
    debounce(async (newPosts: FeedPost[]) => {
      console.log(`[FeedForge] ${newPosts.length} new posts detected`);
      const freshProfile = await getUserProfile();
      await runRanking(adapter, freshProfile);
    }, 1500) as (newPosts: FeedPost[]) => void,
  );

  isRunning = true;
}

async function runRanking(adapter: BaseAdapter, profile: ReturnType<typeof Object.create>): Promise<void> {
  const posts = adapter.extractPosts();
  if (posts.length === 0) return;

  console.log(`[FeedForge] Ranking ${posts.length} posts`);

  try {
    const scores = await rankPosts(
      posts,
      profile.goals,
      profile.authorPreferences,
      profile.topicPreferences,
    );

    const scoreMap = new Map<string, RankingScore>(scores.map((s: RankingScore) => [s.postId, s]));

    // Apply visual styling and badges to each post
    for (const post of posts) {
      const score = scoreMap.get(post.id);
      if (!score || !currentSettings) continue;

      // Find top matching goal
      const topGoalScore = score.goalBreakdown.reduce(
        (best: typeof score.goalBreakdown[0], g: typeof score.goalBreakdown[0]) => g.score > best.score ? g : best,
        score.goalBreakdown[0] ?? { goalName: '', score: 0, matchedKeywords: [] }
      );

      const note = {
        postId: post.id,
        reason: topGoalScore?.matchedKeywords?.length > 0
          ? `Matches your ${topGoalScore.goalName} goal`
          : 'General content',
        topGoal: topGoalScore?.goalName ?? '',
        matchedKeywords: topGoalScore?.matchedKeywords ?? [],
        score: score.totalScore,
        isHighValue: score.totalScore >= (currentSettings.highValueThreshold),
      };

      applyVisualStyling(post, score, currentSettings);
      addScoreBadge(post, score, note, currentSettings);
    }

    // Reorder feed
    const sorted = sortByScore(posts, scores);
    const container = adapter.getFeedContainer();
    if (container) {
      reorderFeed(sorted, container);
    }

    console.log('[FeedForge] Feed ranked and reordered');
  } catch (err) {
    console.error('[FeedForge] Ranking error:', err);
  }
}

// ─── Message Listener ────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    const { type, payload } = message;

    switch (type) {
      case 'UPDATE_SETTINGS': {
        currentSettings = payload as ExtensionSettings;
        if (!currentSettings.enabled) {
          cleanupRenderer();
          stopObserving?.();
          isRunning = false;
        } else if (!isRunning) {
          await initialize();
        }
        if (currentSettings.focusModeEnabled) {
          const profile = await getUserProfile();
          showFocusBanner(profile.goals.filter((g: { isActive: boolean }) => g.isActive).length, () => {
            saveSettings({ ...currentSettings!, focusModeEnabled: false });
          });
        } else {
          hideFocusBanner();
        }
        sendResponse({ success: true });
        break;
      }

      case 'UPDATE_GOALS': {
        const profile = await getUserProfile();
        const adapter = getActiveAdapter();
        if (adapter && profile.settings.enabled) {
          await runRanking(adapter, profile);
        }
        sendResponse({ success: true });
        break;
      }

      default:
        sendResponse({ success: false, error: `Unknown message type: ${type}` });
    }
  })();

  return true; // Keep message channel open for async response
});

// ─── SPA Navigation Watcher ──────────────────────────────────
let lastPath = window.location.pathname;

function watchUrlChanges(): void {
  setInterval(async () => {
    const currentPath = window.location.pathname;
    if (currentPath === lastPath) return;

    lastPath = currentPath;
    console.log('[FeedForge] Path changed:', currentPath);

    const adapter = getActiveAdapter();
    const profile = await getUserProfile();

    if (adapter && adapter.canRun() && profile.settings.enabled) {
      if (!isRunning) {
        await initialize();
      } else {
        // Restart feed observer and rerun ranking for new view
        stopObserving?.();
        cleanupRenderer();
        injectStyles();

        if (profile.settings.focusModeEnabled) {
          showFocusBanner(profile.goals.filter(g => g.isActive).length, () => {
            saveSettings({ ...profile.settings, focusModeEnabled: false });
          });
        }

        await runRanking(adapter, profile);

        stopObserving = adapter.observeFeed(
          debounce(async (newPosts: FeedPost[]) => {
            console.log(`[FeedForge] ${newPosts.length} new posts detected`);
            const freshProfile = await getUserProfile();
            await runRanking(adapter, freshProfile);
          }, 1500) as (newPosts: FeedPost[]) => void,
        );
      }
    } else {
      if (isRunning) {
        console.log('[FeedForge] Left feed page, stopping observer');
        cleanupRenderer();
        stopObserving?.();
        isRunning = false;
      }
    }
  }, 2000);
}

// ─── Boot ────────────────────────────────────────────────────

// Wait for page to be reasonably loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      initialize();
      watchUrlChanges();
    }, 1500);
  });
} else {
  setTimeout(() => {
    initialize();
    watchUrlChanges();
  }, 1500);
}
