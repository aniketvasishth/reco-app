import { CostcoReceipt } from '../types';
import {
  getCachedAccessToken,
  saveBackupToGoogleDrive,
  googleSignIn,
} from './googleDriveService';

export const AUTO_SYNC_ENABLED_KEY = 'reco_auto_sync_enabled';
export const LAST_SYNC_TIMESTAMP_KEY = 'reco_last_sync_timestamp';
export const FIRST_LAUNCH_PROMPTED_KEY = 'reco_first_launch_sync_prompted';

export interface AutoSyncStatus {
  isEnabled: boolean;
  lastSyncTime: string | null;
  nextScheduledTime: string;
}

/**
 * Calculates the exact millisecond delay until the next 3:00 AM in the user's local timezone.
 */
export function getMsUntilNext3AM(): number {
  const now = new Date();
  const next3AM = new Date(now);

  next3AM.setHours(3, 0, 0, 0);

  // If current local time is past 3:00 AM today, schedule for 3:00 AM tomorrow
  if (now.getTime() >= next3AM.getTime()) {
    next3AM.setDate(next3AM.getDate() + 1);
  }

  return next3AM.getTime() - now.getTime();
}

/**
 * Gets a human-readable display string of the next 3:00 AM sync time
 */
export function getNext3AMDisplay(): string {
  const now = new Date();
  const next3AM = new Date(now);
  next3AM.setHours(3, 0, 0, 0);
  if (now.getTime() >= next3AM.getTime()) {
    next3AM.setDate(next3AM.getDate() + 1);
  }
  return next3AM.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }) + ' at 3:00 AM (local time)';
}

export function isAutoSyncEnabled(): boolean {
  try {
    const val = localStorage.getItem(AUTO_SYNC_ENABLED_KEY) ?? localStorage.getItem('receiws_auto_sync_enabled');
    return val === 'true';
  } catch {
    return false;
  }
}

export function setAutoSyncEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_SYNC_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {}
}

export function recordSuccessfulSync(): void {
  try {
    localStorage.setItem(LAST_SYNC_TIMESTAMP_KEY, new Date().toISOString());
  } catch {}
}

export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_TIMESTAMP_KEY) ?? localStorage.getItem('receiws_last_sync_timestamp');
  } catch {
    return null;
  }
}

export function hasPromptedFirstLaunchSync(): boolean {
  try {
    const val = localStorage.getItem(FIRST_LAUNCH_PROMPTED_KEY) ?? localStorage.getItem('receiws_first_launch_sync_prompted');
    return val === 'true';
  } catch {
    return false;
  }
}

export function setPromptedFirstLaunchSync(): void {
  try {
    localStorage.setItem(FIRST_LAUNCH_PROMPTED_KEY, 'true');
  } catch {}
}

/**
 * Executes a silent background sync to Google Drive if authorized.
 */
export async function executeNightlySync(receipts: CostcoReceipt[]): Promise<{ success: boolean; message: string }> {
  if (receipts.length === 0) {
    return { success: true, message: 'No receipts to sync.' };
  }

  const token = getCachedAccessToken();
  if (!token) {
    return {
      success: false,
      message: 'Google Drive authentication token required for background sync.',
    };
  }

  try {
    const result = await saveBackupToGoogleDrive(receipts, token);
    recordSuccessfulSync();
    return {
      success: true,
      message: `Nightly 3 AM sync completed successfully. Saved as ${result.name}`,
    };
  } catch (error: any) {
    console.error('Nightly Google Drive sync failed:', error);
    return {
      success: false,
      message: error?.message || 'Nightly sync failed',
    };
  }
}
