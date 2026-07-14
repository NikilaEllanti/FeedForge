// ============================================================
// FeedForge — chrome.storage Typed Wrappers
// ============================================================

import type { UserProfile, ExtensionSettings, Goal } from '../shared/types';
import { STORAGE_KEYS } from '../shared/constants';
import { getDefaultProfile } from './profile';

/** Get a value from chrome.storage.local */
async function getLocal<T>(key: string): Promise<T | null> {
  return new Promise(resolve => {
    chrome.storage.local.get(key, result => {
      resolve(result[key] ?? null);
    });
  });
}

/** Set a value in chrome.storage.local */
async function setLocal<T>(key: string, value: T): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

/** Remove a value from chrome.storage.local */
async function removeLocal(key: string): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.remove(key, resolve);
  });
}

// ─── Profile ─────────────────────────────────────────────────

export async function getUserProfile(): Promise<UserProfile> {
  const profile = await getLocal<UserProfile>(STORAGE_KEYS.USER_PROFILE);
  if (!profile) {
    const defaultProfile = getDefaultProfile();
    await setUserProfile(defaultProfile);
    return defaultProfile;
  }
  return profile;
}

export async function setUserProfile(profile: UserProfile): Promise<void> {
  profile.updatedAt = Date.now();
  await setLocal(STORAGE_KEYS.USER_PROFILE, profile);
}

export async function updateUserProfile(
  partial: Partial<UserProfile>,
): Promise<UserProfile> {
  const profile = await getUserProfile();
  const updated = { ...profile, ...partial, updatedAt: Date.now() };
  await setUserProfile(updated);
  return updated;
}

// ─── Goals ───────────────────────────────────────────────────

export async function getGoals(): Promise<Goal[]> {
  const profile = await getUserProfile();
  return profile.goals;
}

export async function saveGoals(goals: Goal[]): Promise<void> {
  await updateUserProfile({ goals });
}

// ─── Settings ────────────────────────────────────────────────

export async function getSettings(): Promise<ExtensionSettings> {
  const profile = await getUserProfile();
  return profile.settings;
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await updateUserProfile({ settings });
}

// ─── Export / Import ─────────────────────────────────────────

export async function exportProfile(): Promise<string> {
  const profile = await getUserProfile();
  // Remove DOM references before export
  const clean = JSON.parse(JSON.stringify(profile));
  return JSON.stringify(clean, null, 2);
}

export async function importProfile(jsonStr: string): Promise<UserProfile> {
  const imported = JSON.parse(jsonStr) as UserProfile;
  // Validate basic structure
  if (!imported.goals || !imported.settings) {
    throw new Error('Invalid profile format');
  }
  await setUserProfile(imported);
  return imported;
}

export async function resetProfile(): Promise<UserProfile> {
  const fresh = getDefaultProfile();
  await setUserProfile(fresh);
  return fresh;
}
