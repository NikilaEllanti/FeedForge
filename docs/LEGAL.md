# FeedForge Legal & Compliance

FeedForge has been built from the ground up to respect platform integrity, legal guidelines, and user privacy.

## Compliance Breakdown

### 1. No Automated Platform Interactions
FeedForge behaves strictly as a local visual overlay. It does **NOT** automate likes, follows, comments, DMs, story views, or page actions. It does not perform any activity on behalf of the user that could trigger anti-bot algorithms.

### 2. Respect for Access Boundaries
The extension does **NOT** access, bypass, or call any private platform API endpoints. It operates entirely on content that has **already been fully loaded and rendered** by the official client inside the browser viewport.

### 3. Local-First Processing
All feature extraction, sentence embedding computation, ranking, and preferences modeling happen **locally inside the user's browser**. FeedForge does **NOT** upload post contents, user feeds, handles, or credentials to any remote server.

### 4. No Data Scraping or Redistribution
FeedForge is designed for personalized consumption. It does **NOT** scrape platform contents for archiving, data selling, aggregation, or indexing. The only data persistent in IndexedDB is local text-to-embedding caches to improve local processing latency.

### 5. Terms of Service Alignment
By only reordering and styling local DOM nodes (similar to adblockers, accessibility screen-readers, or dark-mode extensions), FeedForge functions strictly as a custom browser stylesheet/interface wrapper under the user's sovereign control.
