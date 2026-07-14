// ============================================================
// FeedForge — Feature Extractor
// ============================================================
// Extracts text features from DOM elements for a platform-
// agnostic post. Used by platform adapters.
// ============================================================

import type { FeedPost } from '../../shared/types';

/** Extract all visible text from an element */
export function extractTextFromElement(element: HTMLElement): string {
  const texts: string[] = [];

  // Walk the DOM tree collecting text nodes
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        // Skip hidden elements
        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip script and style tags
        const tag = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript'].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  let node: Node | null;
  while ((node = walker.nextNode()) !== null) {
    const text = node.textContent?.trim();
    if (text && text.length > 0) {
      texts.push(text);
    }
  }

  return texts.join(' ').replace(/\s+/g, ' ').trim();
}

/** Extract all image alt texts from an element */
export function extractImageAlts(element: HTMLElement): string[] {
  const imgs = Array.from(element.querySelectorAll('img[alt]'));
  return imgs
    .map(img => (img as HTMLImageElement).alt.trim())
    .filter(alt => alt.length > 3); // Filter out very short alts
}

/** Try multiple CSS selectors and return first match */
export function queryFirst(
  container: HTMLElement | Document,
  selectors: readonly string[],
): HTMLElement | null {
  for (const selector of selectors) {
    try {
      const el = container.querySelector(selector);
      if (el) return el as HTMLElement;
    } catch {
      // Invalid selector — skip
    }
  }
  return null;
}

/** Try multiple CSS selectors and return all matches */
export function queryAll(
  container: HTMLElement | Document,
  selectors: readonly string[],
): HTMLElement[] {
  for (const selector of selectors) {
    try {
      const els = Array.from(container.querySelectorAll(selector));
      if (els.length > 0) return els as HTMLElement[];
    } catch {
      // Invalid selector — skip
    }
  }
  return [];
}

/** Check if an element is visible in the viewport */
export function isVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/** Categorize post content into a topic */
export function categorizeContent(post: FeedPost): string {
  const text = (post.text + ' ' + post.hashtags.join(' ')).toLowerCase();

  const categories: [string, string[]][] = [
    ['Technology', ['code', 'programming', 'software', 'tech', 'ai', 'machine learning', 'javascript', 'python']],
    ['Career', ['job', 'career', 'interview', 'resume', 'linkedin', 'hiring', 'salary']],
    ['Education', ['learn', 'tutorial', 'course', 'study', 'education', 'lesson', 'book']],
    ['Science', ['research', 'science', 'study', 'paper', 'data', 'analysis', 'experiment']],
    ['Business', ['startup', 'business', 'entrepreneur', 'founder', 'product', 'company']],
    ['Health', ['fitness', 'health', 'workout', 'nutrition', 'mental health', 'wellness']],
    ['Entertainment', ['funny', 'meme', 'music', 'movie', 'gaming', 'sports', 'art']],
  ];

  for (const [category, keywords] of categories) {
    if (keywords.some(kw => text.includes(kw))) {
      return category;
    }
  }

  return 'General';
}
