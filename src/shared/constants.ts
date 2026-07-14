// ============================================================
// FeedForge — App Constants
// ============================================================

export const APP_NAME = 'FeedForge';
export const APP_VERSION = '1.0.0';

// ─── Storage Keys ────────────────────────────────────────────
export const STORAGE_KEYS = {
  USER_PROFILE: 'feedforge_user_profile',
  SETTINGS: 'feedforge_settings',
  ANALYTICS: 'feedforge_analytics',
  GOALS: 'feedforge_goals',
} as const;

// ─── IndexedDB ───────────────────────────────────────────────
export const IDB_NAME = 'FeedForgeDB';
export const IDB_VERSION = 1;
export const IDB_STORES = {
  EMBEDDINGS: 'embeddings',
  POST_CACHE: 'post_cache',
} as const;

// ─── Ranking Weights ─────────────────────────────────────────
export const RANKING_WEIGHTS = {
  GOAL_ALIGNMENT: 0.40,
  SEMANTIC_SIMILARITY: 0.25,
  USER_PREFERENCE: 0.20,
  FRESHNESS: 0.10,
  DIVERSITY: 0.05,
} as const;

// ─── Thresholds ──────────────────────────────────────────────
export const HIGH_VALUE_THRESHOLD = 70;
export const DISTRACTION_THRESHOLD = 30;
export const AUTO_SCROLL_PAUSE_MS = 3000;

// ─── Goal Presets ────────────────────────────────────────────
export const GOAL_PRESETS = [
  {
    mode: 'learning' as const,
    name: 'Learning',
    description: 'Prioritize educational and tutorial content',
    keywords: ['tutorial', 'learn', 'course', 'explain', 'how to', 'guide', 'lesson', 'study', 'knowledge', 'skill'],
  },
  {
    mode: 'interview_prep' as const,
    name: 'Interview Prep',
    description: 'Focus on coding interviews, system design, and career tips',
    keywords: ['interview', 'leetcode', 'system design', 'algorithms', 'data structures', 'SQL', 'coding', 'FAANG', 'job', 'career'],
  },
  {
    mode: 'research' as const,
    name: 'Research',
    description: 'Surface papers, studies, and in-depth analysis',
    keywords: ['research', 'paper', 'study', 'analysis', 'findings', 'data', 'experiment', 'published', 'academic', 'arxiv'],
  },
  {
    mode: 'focus' as const,
    name: 'Deep Focus',
    description: 'Filter out entertainment and low-signal content',
    keywords: ['productivity', 'focus', 'deep work', 'strategy', 'framework', 'process', 'workflow'],
  },
  {
    mode: 'entertainment' as const,
    name: 'Entertainment',
    description: 'Enjoy casual, fun, and creative content',
    keywords: ['funny', 'meme', 'entertainment', 'art', 'music', 'travel', 'food', 'sports', 'gaming', 'movie'],
  },
] as const;

// ─── Platform Selectors ──────────────────────────────────────
// Instagram feed post selectors — ordered by priority (most stable first)
export const INSTAGRAM_SELECTORS = {
  // Primary: article elements in main feed
  POST_ARTICLE: [
    'article[role="presentation"]',
    'article',
    'div[data-testid="post-container"]',
  ],
  // Caption text selectors
  CAPTION: [
    'div[data-testid="post-comment-root"] span',
    'h1 ~ div span',
    '_aacl _aaco _aacu _aacx _aad7 _aade',
    'span[dir="auto"]',
  ],
  // Author selectors
  AUTHOR: [
    'header a[role="link"]',
    'a[role="link"] span',
    'header span._aap6',
  ],
  // Image alt text
  IMG: ['img[alt]'],
  // Feed container
  FEED: [
    'main[role="main"]',
    'div[role="main"]',
    'main',
  ],
} as const;

// ─── Distraction Topics ──────────────────────────────────────
export const DISTRACTION_KEYWORDS = [
  'celebrity gossip', 'viral drama', 'clickbait',
  'challenge', 'prank', 'shocking', 'you won\'t believe',
];

// ─── Embedding Model ─────────────────────────────────────────
export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
export const EMBEDDING_DIMENSIONS = 384;

// ─── UI Constants ────────────────────────────────────────────
export const SCORE_BADGE_CLASS = 'ff-score-badge';
export const HIGHLIGHT_CLASS = 'ff-highlight';
export const DIMMED_CLASS = 'ff-dimmed';
export const HIDDEN_CLASS = 'ff-hidden';
export const OVERLAY_CLASS = 'ff-overlay';
