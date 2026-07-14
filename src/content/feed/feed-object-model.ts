// ============================================================
// FeedForge — Feed Object Model
// ============================================================
// Normalized representation of a social media post,
// platform-agnostic.
// ============================================================

import type { FeedPost, Platform } from '../../shared/types';
import { extractHashtags, estimateReadTime, generateId } from '../../shared/utils';

export interface RawPostData {
  platform: Platform;
  author: string;
  authorHandle: string;
  text: string;
  imageAlts: string[];
  timestamp?: string;
  element: HTMLElement;
  originalIndex: number;
}

/** Create a normalized FeedPost from raw extracted data */
export function createFeedPost(raw: RawPostData): FeedPost {
  const fullText = [raw.text, ...raw.imageAlts].join(' ');
  const hashtags = extractHashtags(fullText);

  return {
    id: generatePostId(raw),
    platform: raw.platform,
    author: raw.author,
    authorHandle: raw.authorHandle,
    text: raw.text,
    imageAlt: raw.imageAlts,
    hashtags,
    timestamp: raw.timestamp,
    estimatedReadTime: estimateReadTime(fullText),
    element: raw.element,
    originalIndex: raw.originalIndex,
  };
}

/** Generate a stable ID for a post based on its content + position */
function generatePostId(raw: RawPostData): string {
  const base = `${raw.platform}_${raw.authorHandle}_${raw.originalIndex}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) - hash) + base.charCodeAt(i);
    hash = hash & hash;
  }
  return `post_${Math.abs(hash).toString(36)}`;
}
