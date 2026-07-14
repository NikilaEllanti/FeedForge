// ============================================================
// FeedForge — Utility Functions
// ============================================================

import { v4 as uuidv4 } from 'uuid';

/** Generate a unique ID */
export function generateId(): string {
  return uuidv4();
}

/** Cosine similarity between two vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Normalize array of numbers to 0–1 range */
export function normalize(values: number[]): number[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map(v => (v - min) / (max - min));
}

/** Estimate reading time from text (seconds) */
export function estimateReadTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil((words / wordsPerMinute) * 60);
}

/** Extract hashtags from text */
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w]+/g) || [];
  return matches.map(h => h.toLowerCase().slice(1));
}

/** Extract mentions from text */
export function extractMentions(text: string): string[] {
  const matches = text.match(/@[\w.]+/g) || [];
  return matches.map(m => m.toLowerCase().slice(1));
}

/** Calculate how fresh content is (score 0–1) */
export function calculateFreshness(timestampStr?: string): number {
  if (!timestampStr) return 0.5;
  try {
    const timestamp = new Date(timestampStr).getTime();
    const now = Date.now();
    const ageHours = (now - timestamp) / (1000 * 60 * 60);
    // Content from last 2 hours = 1.0, decays to 0 over 7 days
    return Math.max(0, 1 - ageHours / (7 * 24));
  } catch {
    return 0.5;
  }
}

/** Debounce a function */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Deep clone an object */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Format a number as percentage */
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** Format duration in seconds to human readable */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

/** Get today's date as YYYY-MM-DD */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/** Safely parse JSON */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/** Sleep for ms milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
