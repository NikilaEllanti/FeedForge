// FeedForge — LinkedIn Adapter (Stub — Phase 3)
import { BaseAdapter } from './base.adapter';
import type { FeedPost } from '../../shared/types';

export class LinkedInAdapter extends BaseAdapter {
  platform = 'linkedin' as const;
  canRun() { return window.location.hostname.includes('linkedin.com'); }
  getFeedContainer() { return document.querySelector('main') as HTMLElement | null; }
  extractPosts(): FeedPost[] { this.warn('LinkedIn adapter not yet implemented (Phase 3)'); return []; }
  observeFeed(_cb: (p: FeedPost[]) => void) { return () => {}; }
}
