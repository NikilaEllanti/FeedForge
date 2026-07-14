// ============================================================
// FeedForge — DOM Renderer
// ============================================================
// Reorders, highlights, annotates, and optionally hides posts
// in the DOM based on ranking scores. All DOM manipulation is
// purely visual on the user's own browser view.
// ============================================================

import type { FeedPost, RankingScore, ExplainabilityNote, ExtensionSettings } from '../../shared/types';
import {
  HIGH_VALUE_THRESHOLD,
  DISTRACTION_THRESHOLD,
  SCORE_BADGE_CLASS,
  HIGHLIGHT_CLASS,
  DIMMED_CLASS,
  HIDDEN_CLASS,
} from '../../shared/constants';

// ─── Inject Global Styles ────────────────────────────────────

export function injectStyles(): void {
  if (document.getElementById('ff-styles')) return;

  const style = document.createElement('style');
  style.id = 'ff-styles';
  style.textContent = `
    /* FeedForge Styles */
    .${SCORE_BADGE_CLASS} {
      position: absolute;
      top: 8px;
      right: 8px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      z-index: 9999;
      font-family: 'Inter', -apple-system, sans-serif;
      box-shadow: 0 2px 8px rgba(99,102,241,0.4);
      cursor: pointer;
      user-select: none;
      transition: transform 0.15s ease;
    }
    .${SCORE_BADGE_CLASS}:hover {
      transform: scale(1.05);
    }
    .${SCORE_BADGE_CLASS}.high-value {
      background: linear-gradient(135deg, #10b981, #059669);
      box-shadow: 0 2px 8px rgba(16,185,129,0.4);
    }
    .${SCORE_BADGE_CLASS}.low-value {
      background: linear-gradient(135deg, #6b7280, #4b5563);
      box-shadow: none;
    }
    .${HIGHLIGHT_CLASS} {
      outline: 2px solid rgba(99,102,241,0.5) !important;
      outline-offset: 2px;
      border-radius: 12px;
      transition: outline 0.3s ease;
    }
    .${DIMMED_CLASS} {
      opacity: 0.45 !important;
      transition: opacity 0.4s ease;
    }
    .${DIMMED_CLASS}:hover {
      opacity: 1 !important;
    }
    .${HIDDEN_CLASS} {
      display: none !important;
    }
    .ff-reordered {
      transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
    }
    .ff-explainer {
      position: absolute;
      z-index: 10000;
      background: rgba(15,15,25,0.97);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(99,102,241,0.3);
      border-radius: 12px;
      padding: 12px 16px;
      color: #e2e8f0;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 13px;
      max-width: 280px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      animation: ff-slide-in 0.2s ease;
    }
    .ff-explainer h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #818cf8;
    }
    .ff-explainer .ff-keyword-chip {
      display: inline-block;
      background: rgba(99,102,241,0.2);
      color: #a5b4fc;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 11px;
      margin: 2px;
    }
    @keyframes ff-slide-in {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .ff-focus-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 99999;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 2px 16px rgba(79,70,229,0.5);
    }
    .ff-focus-banner button {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 4px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
    }
  `;
  document.head.appendChild(style);
}

// ─── Score Badges ────────────────────────────────────────────

export function addScoreBadge(
  post: FeedPost,
  score: RankingScore,
  note: ExplainabilityNote,
  settings: ExtensionSettings,
): void {
  if (!settings.showScoreBadges) return;

  // Remove existing badge
  const existing = post.element.querySelector(`.${SCORE_BADGE_CLASS}`);
  if (existing) existing.remove();

  // Make element positioned for absolute badge
  const currentPos = window.getComputedStyle(post.element).position;
  if (currentPos === 'static') {
    post.element.style.position = 'relative';
  }

  const badge = document.createElement('div');
  badge.className = SCORE_BADGE_CLASS;

  const scoreInt = Math.round(score.totalScore);
  badge.textContent = `⚡ ${scoreInt}`;

  if (score.totalScore >= HIGH_VALUE_THRESHOLD) {
    badge.classList.add('high-value');
    badge.textContent = `✦ ${scoreInt}`;
  } else if (score.totalScore <= DISTRACTION_THRESHOLD) {
    badge.classList.add('low-value');
    badge.textContent = `${scoreInt}`;
  }

  // Explainability tooltip on click
  if (settings.showExplainability) {
    badge.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showExplainer(badge, note);
    });
  }

  post.element.appendChild(badge);
}

// ─── Highlight / Dim / Hide ──────────────────────────────────

export function applyVisualStyling(
  post: FeedPost,
  score: RankingScore,
  settings: ExtensionSettings,
): void {
  // Reset classes
  post.element.classList.remove(HIGHLIGHT_CLASS, DIMMED_CLASS, HIDDEN_CLASS);

  if (score.totalScore >= settings.highValueThreshold && settings.highlightHighValue) {
    post.element.classList.add(HIGHLIGHT_CLASS);
  } else if (
    score.totalScore <= settings.distractionThreshold &&
    settings.hideDistractingContent
  ) {
    post.element.classList.add(HIDDEN_CLASS);
  } else if (score.totalScore <= settings.distractionThreshold) {
    post.element.classList.add(DIMMED_CLASS);
  }
}

// ─── Feed Reordering ─────────────────────────────────────────

export function reorderFeed(
  sortedPosts: FeedPost[],
  container: HTMLElement,
): void {
  // Move posts to their new positions without cloning
  // This preserves all event listeners attached by the platform
  for (const post of sortedPosts) {
    container.appendChild(post.element);
  }
}

// ─── Explainer Overlay ───────────────────────────────────────

let activeExplainer: HTMLElement | null = null;

export function showExplainer(
  anchor: HTMLElement,
  note: ExplainabilityNote,
): void {
  // Remove any existing explainer
  closeExplainer();

  const explainer = document.createElement('div');
  explainer.className = 'ff-explainer';

  const topGoalText = note.topGoal ? `Matches goal: <strong>${note.topGoal}</strong>` : 'Low relevance to your goals';
  const keywords = note.matchedKeywords.slice(0, 5)
    .map(k => `<span class="ff-keyword-chip">${k}</span>`)
    .join('');

  explainer.innerHTML = `
    <h4>🧠 Why this post?</h4>
    <p style="margin:0 0 8px 0;color:#94a3b8">${topGoalText}</p>
    ${keywords ? `<div style="margin-bottom:8px">${keywords}</div>` : ''}
    <p style="margin:0;font-size:11px;color:#64748b">Score: ${Math.round(note.score)}/100</p>
  `;

  document.body.appendChild(explainer);
  activeExplainer = explainer;

  // Position relative to badge
  const rect = anchor.getBoundingClientRect();
  explainer.style.top = `${rect.bottom + window.scrollY + 4}px`;
  explainer.style.left = `${Math.max(8, rect.left - 100)}px`;

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', closeExplainer, { once: true });
  }, 100);
}

export function closeExplainer(): void {
  if (activeExplainer) {
    activeExplainer.remove();
    activeExplainer = null;
  }
}

// ─── Focus Mode Banner ───────────────────────────────────────

let focusBanner: HTMLElement | null = null;

export function showFocusBanner(
  activeGoalsCount: number,
  onDisable: () => void,
): void {
  if (focusBanner) return;

  const banner = document.createElement('div');
  banner.className = 'ff-focus-banner';
  banner.innerHTML = `
    <span>🎯 FeedForge Focus Mode — Optimizing for ${activeGoalsCount} goal${activeGoalsCount !== 1 ? 's' : ''}</span>
    <button id="ff-disable-focus">Exit Focus</button>
  `;

  document.body.prepend(banner);
  focusBanner = banner;

  banner.querySelector('#ff-disable-focus')?.addEventListener('click', () => {
    hideFocusBanner();
    onDisable();
  });
}

export function hideFocusBanner(): void {
  focusBanner?.remove();
  focusBanner = null;
}

// ─── Cleanup ─────────────────────────────────────────────────

export function cleanupRenderer(): void {
  // Remove all FeedForge DOM modifications
  document.querySelectorAll(`.${SCORE_BADGE_CLASS}`).forEach(el => el.remove());
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach(el => {
    el.classList.remove(HIGHLIGHT_CLASS);
  });
  document.querySelectorAll(`.${DIMMED_CLASS}`).forEach(el => {
    el.classList.remove(DIMMED_CLASS);
  });
  document.querySelectorAll(`.${HIDDEN_CLASS}`).forEach(el => {
    el.classList.remove(HIDDEN_CLASS);
  });
  closeExplainer();
  hideFocusBanner();
  document.getElementById('ff-styles')?.remove();
}
