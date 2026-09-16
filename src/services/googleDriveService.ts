import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { CostcoReceipt } from '../types';
import { generateBackupJson } from './fileSystemService';

// Explicit scope declaration required by Workspace Integration skill
export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Initialize Google Auth state listener.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User is known in firebase, but token may need refresh or explicit popup
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
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
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGoogleUser = async () => {
  await signOut(auth);
  cachedAccessToken = null;
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
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `costco_receipts_backup_${dateStr}.json`;

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
  const query = encodeURIComponent("name contains 'costco_receipts_backup' and trashed=false");
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
