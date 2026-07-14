# FeedForge - Product Requirements Document (PRD)
Version: 1.0

## Purpose
Define the architecture, features, scope, and legal boundaries for FeedForge, a local-first AI browser extension that personalizes a user's web feeds according to their own goals rather than platform engagement algorithms.

## Vision
FeedForge is a browser extension that acts as a personal AI ranking layer for supported websites. It analyzes only the content already rendered in the user's browser, computes local relevance scores, and visually reorders, highlights, filters, or annotates content according to user-defined goals such as 'Learn SQL', 'Prepare for system design interviews', or 'Reduce entertainment'.

## Problem Statement
Existing recommendation systems optimize for engagement and advertising revenue. FeedForge instead optimizes for user-defined objectives such as learning, productivity, and focus.

## Target Users
- Students
- Software Engineers
- AI/ML Engineers
- Researchers
- Founders
- Knowledge workers

## Non-Goals
- Not an Instagram client
- No private APIs
- No automation of likes, follows, comments, DMs or stories
- No large-scale scraping
- No redistribution of platform content

## Legal & Compliance
FeedForge only modifies the user's local browser view after content has been rendered. It does not bypass authentication, call unofficial APIs, automate platform interactions, or store unnecessary copies of platform content. It stores only user preferences, settings, derived embeddings, ranking metadata, and analytics needed for personalization. Compliance with each platform's Terms of Service should be reviewed before distribution.

## High-Level Architecture
```
Browser Extension (Manifest V3)
  → Platform Adapter (Instagram/Reddit/LinkedIn/YouTube)
  → Feed Object Model
  → Feature Extraction
  → Local Embedding Engine
  → Goal-Based Ranking Engine
  → Explainability Engine
  → DOM Renderer
  → Optional Sync Layer
```

## Core Features
- **Local-first AI ranking**: Runs ONNX model directly in-browser using Transformers.js.
- **Multiple simultaneous goals with configurable weights**: Users define active goals.
- **Goal modes**: Learning, Interview Prep, Research, Focus, Entertainment, Custom.
- **Semantic search over visible content**: Retrieve content similar to a query.
- **Explainable recommendations**: Tooltips explaining "Why this post?".
- **Topic filtering and keyword rules**: Filter out specific tags or keywords.
- **Focus mode**: Visual clean-up and high-value highlights.
- **Hands-free smart auto-scroll**: Pauses on high-value posts.
- **Reading-time estimation**: Displays estimated read time on posts.
- **Personal analytics dashboard**: Displays history and category statistics.
- **Adaptive preference learning**: Learns from explicit user feedback.
- **Export/Import user profile**: Export/import settings, goals, and analytics.

## Goal Optimization
Users can define multiple active goals, e.g.:
- SQL Interviews (40%)
- System Design (30%)
- AI Research (20%)
- Entertainment (10%)
The ranking engine combines these weights with semantic similarity and user preferences.

## Ranking Engine
Initial scoring:
`Score = Goal Alignment + Semantic Similarity + User Preference + Freshness + Diversity - Distraction Score`

## User Profile
Stores only user-owned data:
- Goals
- Topic weights
- Hidden topics
- Preferred creators
- Interaction statistics
- Embeddings of user interests
- Extension settings

## Cross-Platform Roadmap
- Phase 1: Instagram Web
- Phase 2: Reddit
- Phase 3: LinkedIn
- Phase 4: YouTube

## Technology Stack
- Frontend: React + TypeScript
- Extension: Chrome Manifest V3
- AI: Transformers.js / ONNX Runtime Web
- Storage: chrome.storage + IndexedDB
