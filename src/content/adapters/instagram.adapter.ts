// ============================================================
// FeedForge — Instagram Feed Adapter
// ============================================================
// Reads ALREADY-RENDERED content from Instagram's DOM.
// Does NOT call any private APIs or automate any interactions.
// Uses multi-selector fallback strategy for DOM stability.
// ============================================================

import { BaseAdapter } from './base.adapter';
import { createFeedPost } from '../feed/feed-object-model';
import {
  extractTextFromElement,
  extractImageAlts,
  queryFirst,
  queryAll,
} from '../feed/feature-extractor';
import type { FeedPost } from '../../shared/types';

// ─── Selector Strategy ────────────────────────────────────────
// Multiple selector options ordered by stability.
// Falls back gracefully if Instagram updates their DOM.

const FEED_CONTAINER_SELECTORS = [
  'main[role="main"]',
  'main',
  '[role="main"]',
  'body', // Ultimate fallback
] as const;

const POST_SELECTORS = [
  'article[role="presentation"]',
  'article',
  '[data-testid="post-container"]',
  'div[style*="padding-bottom"]',  // Heuristic fallback
] as const;

const AUTHOR_SELECTORS = [
  'header a[role="link"] span',
  'header span[dir="auto"]',
  'header a span',
  'a[href*="/"] span:first-child',
] as const;

const CAPTION_SELECTORS = [
  'h1 ~ div span[dir="auto"]',
  '[data-testid="post-comment-root"] span',
  'span[dir="auto"]',
  'span._aacl',
  'div._a9zs span',
] as const;

// ─── Instagram Adapter ───────────────────────────────────────

export class InstagramAdapter extends BaseAdapter {
  platform = 'instagram' as const;

  private seenPostIds = new Set<string>();
  private observer: MutationObserver | null = null;

  /** Check if we're on Instagram's main feed page */
  canRun(): boolean {
    return (
      window.location.hostname === 'www.instagram.com' ||
      window.location.hostname === 'instagram.com'
    );
  }

  /** Get the main feed container */
  getFeedContainer(): HTMLElement | null {
    return queryFirst(document, FEED_CONTAINER_SELECTORS);
  }

  /** Extract all currently visible posts */
  extractPosts(): FeedPost[] {
    const container = this.getFeedContainer();
    if (!container) {
      this.warn('Could not find feed container');
      return [];
    }

    const articleElements = queryAll(container, POST_SELECTORS);

    if (articleElements.length === 0) {
      this.warn('No post elements found — Instagram may have updated their DOM');
      // Heuristic fallback: try to find substantial div blocks
      return this.heuristicExtract(container);
    }

    this.log(`Found ${articleElements.length} posts`);

    const posts: FeedPost[] = [];
    articleElements.forEach((el, index) => {
      const post = this.extractSinglePost(el, index);
      if (post) {
        // Skip ads
        if (!this.isAd(el)) {
          posts.push(post);
        }
      }
    });

    return posts;
  }

  /** Extract a single post from an article element */
  private extractSinglePost(
    element: HTMLElement,
    originalIndex: number,
  ): FeedPost | null {
    try {
      const author = this.extractAuthor(element);
      const text = this.extractCaption(element);
      const imageAlts = extractImageAlts(element);
      const timestamp = this.extractTimestamp(element);

      // Skip posts with no meaningful content
      if (!text && imageAlts.length === 0) return null;

      return createFeedPost({
        platform: 'instagram',
        author,
        authorHandle: author.replace('@', '').toLowerCase(),
        text,
        imageAlts,
        timestamp,
        element,
        originalIndex,
      });
    } catch (err) {
      this.warn('Error extracting post:', err);
      return null;
    }
  }

  /** Extract author name from post element */
  private extractAuthor(element: HTMLElement): string {
    const el = queryFirst(element, AUTHOR_SELECTORS);
    if (el?.textContent?.trim()) return el.textContent.trim();

    // Fallback: look for any link with a username-like href
    const links = Array.from(element.querySelectorAll('a[href]'));
    for (const link of links) {
      const href = (link as HTMLAnchorElement).href;
      const match = href.match(/instagram\.com\/([^/?]+)/);
      if (match && !['p', 'stories', 'reels', 'explore'].includes(match[1])) {
        return match[1];
      }
    }

    return 'Unknown';
  }

  /** Extract caption text from post element */
  private extractCaption(element: HTMLElement): string {
    // Try structured selectors first
    const captionEl = queryFirst(element, CAPTION_SELECTORS);
    if (captionEl?.textContent?.trim()) {
      return captionEl.textContent.trim();
    }

    // Fallback: extract all text from the element
    const fullText = extractTextFromElement(element);
    // Remove UI strings we don't care about
    return fullText
      .replace(/^\d+\s+likes?/i, '')
      .replace(/\d+\s+comments?/gi, '')
      .replace(/View all \d+ comments?/gi, '')
      .trim();
  }

  /** Detect if a post is a paid advertisement */
  private isAd(element: HTMLElement): boolean {
    const text = element.textContent?.toLowerCase() ?? '';
    return (
      text.includes('sponsored') ||
      text.includes('promoted') ||
      !!element.querySelector('[aria-label*="Sponsored"]') ||
      !!element.querySelector('[data-testid*="ad"]')
    );
  }

  /** Heuristic extraction fallback when structured selectors fail */
  private heuristicExtract(container: HTMLElement): FeedPost[] {
    this.warn('Using heuristic extraction fallback');

    // Look for large div blocks that likely contain posts
    const divs = Array.from(container.querySelectorAll('div'))
      .filter(div => {
        const rect = div.getBoundingClientRect();
        // Posts are typically large blocks
        return rect.width > 400 && rect.height > 200;
      }) as HTMLElement[];

    return divs.slice(0, 20).map((div, index) => {
      const text = extractTextFromElement(div);
      const imageAlts = extractImageAlts(div);

      return createFeedPost({
        platform: 'instagram',
        author: 'Unknown',
        authorHandle: 'unknown',
        text,
        imageAlts,
        timestamp: undefined,
        element: div,
        originalIndex: index,
      });
    }).filter(p => p.text.length > 10 || p.imageAlt.length > 0);
  }

  /** Observe feed for new posts (infinite scroll) */
  observeFeed(callback: (newPosts: FeedPost[]) => void): () => void {
    const container = this.getFeedContainer();
    if (!container) return () => {};

    this.observer = new MutationObserver(() => {
      const allPosts = this.extractPosts();
      const newPosts = allPosts.filter(p => !this.seenPostIds.has(p.id));

      if (newPosts.length > 0) {
        newPosts.forEach(p => this.seenPostIds.add(p.id));
        callback(newPosts);
      }
    });

    this.observer.observe(container, {
      childList: true,
      subtree: true,
    });

    this.log('Feed observer started');

    return () => {
      this.observer?.disconnect();
      this.observer = null;
    };
  }
}
