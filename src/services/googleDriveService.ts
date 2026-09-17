import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { CostcoReceipt } from '../types';
import { generateBackupJson } from './fileSystemService';

// Explicit scope declaration required by Workspace Integration skill
export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Attempt to configure local persistence so auth state survives reloads
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} catch {}

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account',
});

export const RECO_GDRIVE_CONNECTED_KEY = 'reco_gdrive_connected';
export const RECO_GDRIVE_ACCESS_TOKEN_KEY = 'reco_gdrive_access_token';
export const RECO_GDRIVE_TOKEN_EXPIRY_KEY = 'reco_gdrive_token_expires_at';
export const RECO_GDRIVE_USER_INFO_KEY = 'reco_gdrive_user_info';

export interface DriveConnectedUser {
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  uid: string;
}

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Check if the user has previously connected Google Drive.
 */
export function isGoogleDriveConnected(): boolean {
  try {
    return localStorage.getItem(RECO_GDRIVE_CONNECTED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Get saved Google Drive user info from previous sessions.
 */
export function getSavedDriveUser(): DriveConnectedUser | null {
  try {
    const raw = localStorage.getItem(RECO_GDRIVE_USER_INFO_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save Google Drive connection and optional token in localStorage.
 */
export function saveDriveConnection(user: User | DriveConnectedUser, accessToken?: string | null) {
  try {
    localStorage.setItem(RECO_GDRIVE_CONNECTED_KEY, 'true');
    const userInfo: DriveConnectedUser = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      uid: user.uid,
    };
    localStorage.setItem(RECO_GDRIVE_USER_INFO_KEY, JSON.stringify(userInfo));

    if (accessToken) {
      cachedAccessToken = accessToken;
      localStorage.setItem(RECO_GDRIVE_ACCESS_TOKEN_KEY, accessToken);
      // Google OAuth tokens typically last 3600s; keep a safety margin of 3500s
      const expiresAt = Date.now() + 3500 * 1000;
      localStorage.setItem(RECO_GDRIVE_TOKEN_EXPIRY_KEY, String(expiresAt));
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reco-gdrive-connected', { detail: userInfo }));
    }
  } catch (e) {
    console.warn('Failed to save Drive connection info to localStorage', e);
  }
}

/**
 * Clear stored Google Drive connection credentials.
 */
export function clearDriveConnection() {
  try {
    cachedAccessToken = null;
    localStorage.removeItem(RECO_GDRIVE_CONNECTED_KEY);
    localStorage.removeItem(RECO_GDRIVE_ACCESS_TOKEN_KEY);
    localStorage.removeItem(RECO_GDRIVE_TOKEN_EXPIRY_KEY);
    localStorage.removeItem(RECO_GDRIVE_USER_INFO_KEY);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reco-gdrive-disconnected'));
    }
  } catch {}
}

/**
 * Retrieve cached access token if available and not expired.
 */
export const getCachedAccessToken = (): string | null => {
  if (cachedAccessToken) {
    const expiryStr = localStorage.getItem(RECO_GDRIVE_TOKEN_EXPIRY_KEY);
    if (expiryStr && Date.now() > Number(expiryStr)) {
      return null;
    }
    return cachedAccessToken;
  }
  try {
    const stored = localStorage.getItem(RECO_GDRIVE_ACCESS_TOKEN_KEY);
    const expiryStr = localStorage.getItem(RECO_GDRIVE_TOKEN_EXPIRY_KEY);
    if (stored) {
      if (expiryStr && Date.now() > Number(expiryStr)) {
        return null;
      }
      cachedAccessToken = stored;
      return stored;
    }
  } catch {}
  return null;
};

/**
 * Generates the standardized backup filename: reco_backup_yyyy-mm-dd.json
 */
export function getBackupFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `reco_backup_${year}-${month}-${day}.json`;
}

/**
 * Initialize Google Auth state listener.
 * Retains connected status across app reloads.
 */
export const initAuth = (
  onAuthSuccess?: (user: User | DriveConnectedUser, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  // 1. Immediately hydrate from stored connection if user previously connected Drive
  if (isGoogleDriveConnected()) {
    const savedUser = getSavedDriveUser();
    if (savedUser && onAuthSuccess) {
      const token = getCachedAccessToken();
      onAuthSuccess(savedUser, token);
    }
  }

  // 2. Listen to Firebase auth changes
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Firebase User session is active
      saveDriveConnection(user);
      const token = getCachedAccessToken();
      if (onAuthSuccess) {
        onAuthSuccess(user, token);
      }
    } else {
      // If Firebase reports null user, check if we still have remembered connection
      if (isGoogleDriveConnected()) {
        const savedUser = getSavedDriveUser();
        if (savedUser && onAuthSuccess) {
          const token = getCachedAccessToken();
          onAuthSuccess(savedUser, token);
          return;
        }
      }
      cachedAccessToken = null;
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

/**
 * Trigger Google Sign-In popup with drive.file scope
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve access token from Google sign in');
    }

    cachedAccessToken = credential.accessToken;
    saveDriveConnection(result.user, credential.accessToken);

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logoutGoogleUser = async () => {
  try {
    await signOut(auth);
  } finally {
    clearDriveConnection();
  }
};

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
  webViewLink?: string;
}

/**
 * Upload receipts backup to user's Google Drive via Drive v3 multipart upload
 */
export async function saveBackupToGoogleDrive(
  receipts: CostcoReceipt[],
  token: string
): Promise<{ fileId: string; name: string; webViewLink?: string }> {
  const content = generateBackupJson(receipts);
  const filename = getBackupFilename();
  const dateStr = filename.replace('reco_backup_', '').replace('.json', '');

  const metadata = {
    name: filename,
    mimeType: 'application/json',
    description: `Reco Costco Receipts Backup (${receipts.length} receipts, saved ${dateStr})`,
  };

  const boundary = '-------RecoDriveBoundary' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      cachedAccessToken = null;
      try {
        localStorage.removeItem(RECO_GDRIVE_ACCESS_TOKEN_KEY);
        localStorage.removeItem(RECO_GDRIVE_TOKEN_EXPIRY_KEY);
      } catch {}
      throw new Error('Google Drive session expired. Please sign in again.');
    }
    throw new Error(`Google Drive upload error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return {
    fileId: result.id,
    name: result.name,
    webViewLink: result.webViewLink,
  };
}

/**
 * List files previously created by this app in user's Drive
 */
export async function listGoogleDriveBackups(token: string): Promise<DriveBackupFile[]> {
  const query = encodeURIComponent("(name contains 'reco_backup' or name contains 'costco_receipts_backup') and trashed=false");
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size,webViewLink)&orderBy=createdTime desc&pageSize=15`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      cachedAccessToken = null;
      try {
        localStorage.removeItem(RECO_GDRIVE_ACCESS_TOKEN_KEY);
        localStorage.removeItem(RECO_GDRIVE_TOKEN_EXPIRY_KEY);
      } catch {}
      throw new Error('Google Drive session expired. Please sign in again.');
    }
    throw new Error(`Failed to list Google Drive backups: ${response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Download a backup file from user's Drive
 */
export async function downloadGoogleDriveFile(fileId: string, token: string): Promise<string> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to download backup from Google Drive: ${response.statusText}`);
  }

  return await response.text();
}
