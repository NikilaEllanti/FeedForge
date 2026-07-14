# FeedForge Development Guide

This document describes how to set up the development environment, build the extension, and test it locally.

## Prerequisite Setup

Ensure you have **Node.js (v18+)** and **npm** installed.

```bash
# Clone the repository and install dependencies
npm install
```

## Build Commands

- **Build in Watch Mode (Recommended for Dev)**
  ```bash
  npm run dev
  ```
  Vite will build the extension into the `dist/` directory and recompile automatically on file changes.

- **Production Build**
  ```bash
  npm run build
  ```
  Compiles and minimizes all assets, generating a production-ready `dist/` folder.

## Loading the Extension in Google Chrome

1. Open a new tab in Chrome and go to `chrome://extensions/`.
2. Enable the **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the **`dist`** directory inside the project root.
5. FeedForge will now appear in your list of extensions!

## Testing on Instagram Web

1. Open [Instagram](https://www.instagram.com/) in your browser.
2. Open the FeedForge extension popup from the extension toolbar.
3. Turn the extension toggle **ON**.
4. Set up one or two goals (e.g. "Learning" or "Interview Prep").
5. Refresh the page or start scrolling. You should see a score badge appear in the top-right corner of each post.
6. Click on the badge to check the explanation overlay showing which goal keywords triggered the score.
