# FeedForge

**Local-first AI browser extension that personalizes your social media feeds based on YOUR goals — not platform engagement algorithms.**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome)](/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](/)
[![Local AI](https://img.shields.io/badge/AI-Local--first-purple)](/)
[![PRD](https://img.shields.io/badge/PRD-v1.0-blue)](./docs/PRD.md)

---

## What is FeedForge?

FeedForge is a Chrome browser extension that acts as a **personal AI ranking layer** for social media feeds. Instead of optimizing for platform engagement, it re-ranks, highlights, and filters content based on goals you define — like "Learn SQL", "Prepare for System Design Interviews", or "Reduce Entertainment".

All AI inference runs **100% locally in your browser** using Transformers.js + ONNX Runtime. No data ever leaves your device.

## Features

- 🎯 **Multi-goal ranking** with configurable weights (e.g., SQL 40%, System Design 30%)
- 🧠 **Local semantic embeddings** via `Xenova/all-MiniLM-L6-v2` (22MB ONNX)
- 📊 **Explainable recommendations** ("Why this post?" overlay)
- 🧘 **Focus Mode** to filter out distracting content
- 📈 **Personal analytics dashboard** (posts ranked, goal ratio, topics)
- 🔄 **Adaptive preference learning** from your feedback
- 🔍 **Topic and keyword filtering**
- ⏱ **Reading time estimation**
- 📤 **Export/Import** user profile as JSON
- 🔒 **100% privacy-first** — no external API calls

## Platform Support

| Platform | Status |
|---|---|
| Instagram | ✅ Phase 1 — Active |
| Reddit | 🔜 Phase 2 |
| LinkedIn | 🔜 Phase 3 |
| YouTube | 🔜 Phase 4 |

## Quick Start

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Development (watch mode)
npm run dev
```

Then load the `dist/` folder as an **unpacked extension** in Chrome:
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for full setup guide.

## Architecture

```
Browser Extension (Manifest V3)
  → Platform Adapter (Instagram/Reddit/LinkedIn/YouTube)
  → Feed Object Model (normalized post data)
  → Feature Extraction (text, images, hashtags)
  → Local Embedding Engine (Transformers.js)
  → Goal-Based Ranking Engine (scoring formula)
  → Explainability Engine ("why this post?")
  → DOM Renderer (reorder, highlight, annotate)
  → Optional Sync Layer (user preferences only)
```

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for details.

## Legal

FeedForge only modifies the user's local browser view after content has been rendered. It does NOT:
- Call private APIs
- Automate user interactions (likes, follows, DMs)
- Scrape or redistribute platform content
- Store platform content

See [docs/LEGAL.md](./docs/LEGAL.md) for full compliance analysis.

---

*Built as a local-first AI tool that gives users sovereignty over their feeds.*