// ============================================================
// FeedForge — Background Service Worker (Manifest V3)
// ============================================================

import type { ExtensionMessage, ExtensionResponse } from '../shared/types';
import {
  getUserProfile,
  setUserProfile,
  exportProfile,
  importProfile,
  resetProfile,
  saveSettings,
  saveGoals,
} from '../storage/chrome-storage';

// ─── Extension Install / Update ──────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[FeedForge] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // Initialize default profile on first install
    await getUserProfile(); // Creates default profile if missing
    console.log('[FeedForge] Default profile created');
  }
});

// ─── Message Handler ─────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse) => void,
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch(err => {
        console.error('[FeedForge] Message handler error:', err);
        sendResponse({ success: false, error: String(err) });
      });

    return true; // Keep async channel open
  },
);

async function handleMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  switch (message.type) {
    case 'GET_PROFILE': {
      const profile = await getUserProfile();
      return { success: true, data: profile };
    }

    case 'SET_PROFILE': {
      await setUserProfile(message.payload as never);
      return { success: true };
    }

    case 'UPDATE_SETTINGS': {
      const settings = message.payload as never;
      await saveSettings(settings);
      // Broadcast to active tabs
      await broadcastToContentScripts({ type: 'UPDATE_SETTINGS', payload: settings });
      return { success: true };
    }

    case 'UPDATE_GOALS': {
      const goals = message.payload as never;
      await saveGoals(goals);
      await broadcastToContentScripts({ type: 'UPDATE_GOALS', payload: goals });
      return { success: true };
    }

    case 'GET_ANALYTICS': {
      const profile = await getUserProfile();
      return { success: true, data: profile.analytics };
    }

    case 'EXPORT_PROFILE': {
      const json = await exportProfile();
      return { success: true, data: json };
    }

    case 'IMPORT_PROFILE': {
      const imported = await importProfile(message.payload as string);
      return { success: true, data: imported };
    }

    case 'RESET_PROFILE': {
      const fresh = await resetProfile();
      return { success: true, data: fresh };
    }

    default:
      return { success: false, error: `Unknown message type: ${message.type}` };
  }
}

// ─── Broadcast to Content Scripts ────────────────────────────

async function broadcastToContentScripts(message: ExtensionMessage): Promise<void> {
  const tabs = await chrome.tabs.query({ active: true });
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {
        // Content script may not be loaded on this tab — ignore
      });
    }
  }
}
