// ============================================================
// FeedForge — Reddit Adapter (Stub — Phase 2)
// ============================================================

import { BaseAdapter } from './base.adapter';
import type { FeedPost } from '../../shared/types';

export class RedditAdapter extends BaseAdapter {
  platform = 'reddit' as const;

  canRun(): boolean {
    return window.location.hostname.includes('reddit.com');
  }

  getFeedContainer(): HTMLElement | null {
    return document.querySelector('main') as HTMLElement | null;
  }

  extractPosts(): FeedPost[] {
    this.warn('Reddit adapter not yet implemented (Phase 2)');
    return [];
  }

  observeFeed(_callback: (newPosts: FeedPost[]) => void): () => void {
    return () => {};
  }
}
