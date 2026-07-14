// ============================================================
// FeedForge — Base Platform Adapter
// ============================================================
// Abstract class that all platform adapters must extend.
// ============================================================

import type { FeedPost, Platform } from '../../shared/types';

export abstract class BaseAdapter {
  abstract platform: Platform;

  /** Extract all currently rendered posts from the page */
  abstract extractPosts(): FeedPost[];

  /** Start observing the feed for new posts (infinite scroll) */
  abstract observeFeed(callback: (newPosts: FeedPost[]) => void): () => void;

  /** Get the root feed container element */
  abstract getFeedContainer(): HTMLElement | null;

  /** Check if the adapter can run on the current page */
  abstract canRun(): boolean;

  /** Optional: extract a timestamp string from a post element */
  extractTimestamp(element: HTMLElement): string | undefined {
    const timeEl = element.querySelector('time');
    if (timeEl) {
      return timeEl.getAttribute('datetime') ?? timeEl.textContent ?? undefined;
    }
    return undefined;
  }

  /** Log with platform prefix */
  protected log(message: string, ...args: unknown[]): void {
    console.log(`[FeedForge:${this.platform}] ${message}`, ...args);
  }

  protected warn(message: string, ...args: unknown[]): void {
    console.warn(`[FeedForge:${this.platform}] ${message}`, ...args);
  }
}
