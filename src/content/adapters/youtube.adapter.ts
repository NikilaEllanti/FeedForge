// FeedForge — YouTube Adapter (Stub — Phase 4)
import { BaseAdapter } from './base.adapter';
import type { FeedPost } from '../../shared/types';

export class YouTubeAdapter extends BaseAdapter {
  platform = 'youtube' as const;
  canRun() { return window.location.hostname.includes('youtube.com'); }
  getFeedContainer() { return document.querySelector('#contents') as HTMLElement | null; }
  extractPosts(): FeedPost[] { this.warn('YouTube adapter not yet implemented (Phase 4)'); return []; }
  observeFeed(_cb: (p: FeedPost[]) => void) { return () => {}; }
}
