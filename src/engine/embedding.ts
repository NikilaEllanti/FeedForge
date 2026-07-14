// ============================================================
// FeedForge — Local Embedding Engine (Transformers.js)
// ============================================================
// Uses Xenova/all-MiniLM-L6-v2 (22MB ONNX) for fully local
// semantic embeddings — no external API calls ever made.
// ============================================================

import { pipeline, env } from '@xenova/transformers';
import { EMBEDDING_MODEL } from '../shared/constants';
import { getEmbedding, saveEmbedding } from '../storage/indexeddb';
import { cosineSimilarity } from '../shared/utils';

// Configure Transformers.js to use local cache
env.allowRemoteModels = true;
env.useBrowserCache = true;

type PipelineFunction = (texts: string[], options: { pooling: string; normalize: boolean }) => Promise<{ data: Float32Array }>;

let embeddingPipeline: PipelineFunction | null = null;
let isLoading = false;
let loadPromise: Promise<PipelineFunction> | null = null;

// ─── Model Loading ───────────────────────────────────────────

export async function loadEmbeddingModel(): Promise<PipelineFunction> {
  if (embeddingPipeline) return embeddingPipeline;
  if (loadPromise) return loadPromise;

  isLoading = true;
  loadPromise = pipeline('feature-extraction', EMBEDDING_MODEL).then(p => {
    embeddingPipeline = p as unknown as PipelineFunction;
    isLoading = false;
    console.log('[FeedForge] Embedding model loaded:', EMBEDDING_MODEL);
    return embeddingPipeline;
  }).catch(err => {
    isLoading = false;
    loadPromise = null;
    console.error('[FeedForge] Failed to load embedding model:', err);
    throw err;
  });

  return loadPromise;
}

export function isModelLoading(): boolean {
  return isLoading;
}

export function isModelReady(): boolean {
  return embeddingPipeline !== null;
}

// ─── Embed Text ──────────────────────────────────────────────

/**
 * Compute a semantic embedding for a text string.
 * Results are cached in IndexedDB by a hash of the text.
 */
export async function embedText(text: string): Promise<number[]> {
  // Create a simple hash for cache key
  const cacheKey = hashText(text);

  // Check cache first
  const cached = await getEmbedding(cacheKey);
  if (cached) return cached;

  // Load model if needed
  const model = await loadEmbeddingModel();

  // Compute embedding
  const truncated = text.slice(0, 512); // Model max length
  const output = await model([truncated], {
    pooling: 'mean',
    normalize: true,
  });

  const embedding = Array.from(output.data) as number[];

  // Cache the result
  await saveEmbedding(cacheKey, text, embedding);

  return embedding;
}

/**
 * Compute embeddings for multiple goal keyword sets.
 */
export async function embedGoalKeywords(keywords: string[]): Promise<number[]> {
  const combined = keywords.join('. ');
  return embedText(combined);
}

/**
 * Calculate semantic similarity between a post and a goal.
 * Returns a score from 0 to 1.
 */
export async function computeSemanticSimilarity(
  postEmbedding: number[],
  goalKeywords: string[],
): Promise<number> {
  const goalEmbedding = await embedGoalKeywords(goalKeywords);
  const similarity = cosineSimilarity(postEmbedding, goalEmbedding);
  // Convert from -1..1 to 0..1
  return (similarity + 1) / 2;
}

// ─── Utilities ───────────────────────────────────────────────

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return `emb_${Math.abs(hash).toString(36)}`;
}
