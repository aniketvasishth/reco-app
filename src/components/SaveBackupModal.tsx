import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  HardDrive,
  Cloud,
  Download,
  FileSpreadsheet,
  FileJson,
  Upload,
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CostcoReceipt } from '../types';
import {
  generateBackupJson,
  generateItemsCsv,
  saveToFileSystem,
  parseRestoredBackupJson,
} from '../services/fileSystemService';
import {
  initAuth,
  googleSignIn,
  logoutGoogleUser,
  saveBackupToGoogleDrive,
  listGoogleDriveBackups,
  downloadGoogleDriveFile,
  getCachedAccessToken,
  DriveBackupFile,
} from '../services/googleDriveService';
import {
  isAutoSyncEnabled,
  setAutoSyncEnabled,
  getLastSyncTime,
  getNext3AMDisplay,
} from '../services/nightlySyncService';

interface SaveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipts: CostcoReceipt[];
  onReceiptsRestored: (receipts: CostcoReceipt[], message: string) => void;
  onShowSnackbar: (message: string) => void;
}

export function SaveBackupModal({
  isOpen,
  onClose,
  receipts,
  onReceiptsRestored,
  onShowSnackbar,
}: SaveBackupModalProps) {
  const [activeTab, setActiveTab] = useState<'filesystem' | 'googledrive'>('filesystem');

  // File System State
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [localSuccessMsg, setLocalSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Drive State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [driveSuccessData, setDriveSuccessData] = useState<{
    fileId: string;
    name: string;
    webViewLink?: string;
  } | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Drive Backups List
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [showDriveBackups, setShowDriveBackups] = useState(false);

  // Auto-Sync 3 AM state
  const [autoSyncOn, setAutoSyncOn] = useState(() => isAutoSyncEnabled());

  const handleToggleAutoSync = () => {
    const next = !autoSyncOn;
    setAutoSyncOn(next);
    setAutoSyncEnabled(next);
    onShowSnackbar(
      next
        ? 'Automatic nightly sync enabled. Reco will backup to Drive at 3:00 AM.'
        : 'Automatic nightly sync disabled.'
    );
  };

  // Confirmation Modals (Mandatory for mutating/Workspace operations)
  const [pendingDriveSave, setPendingDriveSave] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<{
    source: 'local' | 'drive';
    receipts: CostcoReceipt[];
    title: string;
  } | null>(null);

  // Track Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setAccessToken(token);
      },
      () => {
        const cached = getCachedAccessToken();
        if (!cached) {
          setAccessToken(null);
        }
      }
    );
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  // Handle Local File System Save (JSON)
  const handleSaveJsonLocal = async () => {
    setIsSavingLocal(true);
    setLocalSuccessMsg(null);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const jsonContent = generateBackupJson(receipts);
      const filename = `costco_receipts_backup_${dateStr}.json`;

      const result = await saveToFileSystem(jsonContent, filename, 'application/json');
      setLocalSuccessMsg(`Saved backup as "${result.filename}"`);
      onShowSnackbar(`Successfully saved "${result.filename}" to your file system`);
    } catch (err: any) {
      if (err.message !== 'Save cancelled by user') {
        onShowSnackbar(`Failed to save: ${err.message}`);
      }
    } finally {
      setIsSavingLocal(false);
    }
  };

  // Handle Local CSV Export
  const handleExportCsvLocal = async () => {
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const csvContent = generateItemsCsv(receipts);
      const filename = `costco_items_export_${dateStr}.csv`;

      const result = await saveToFileSystem(csvContent, filename, 'text/csv');
      onShowSnackbar(`Exported items spreadsheet as "${result.filename}"`);
    } catch (err: any) {
      if (err.message !== 'Save cancelled by user') {
        onShowSnackbar(`Export cancelled or failed: ${err.message}`);
      }
    }
  };

  // Handle Local Restore selection
  const handleLocalFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedReceipts = parseRestoredBackupJson(text);
      if (!parsedReceipts.length) {
        throw new Error('The selected backup file contains no receipts.');
      }

      setPendingRestore({
        source: 'local',
        receipts: parsedReceipts,
        title: `Restore from "${file.name}"`,
      });
    } catch (err: any) {
      onShowSnackbar(`Restore error: ${err.message}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setDriveError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        onShowSnackbar(`Connected to Google as ${result.user.displayName || result.user.email}`);
      }
    } catch (err: any) {
      console.error(err);
      setDriveError(err.message || 'Google sign-in failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Google Sign-Out
  const handleGoogleSignOut = async () => {
    try {
      await logoutGoogleUser();
      setUser(null);
      setAccessToken(null);
      setDriveSuccessData(null);
      setDriveBackups([]);
      setShowDriveBackups(false);
      onShowSnackbar('Signed out of Google account');
    } catch (err: any) {
      onShowSnackbar(`Sign out error: ${err.message}`);
    }
  };

  // Handle Save to Google Drive (Triggers confirmation dialog)
  const handleInitiateDriveSave = () => {
    if (!accessToken) {
      handleGoogleSignIn();
      return;
    }
    setPendingDriveSave(true);
  };

  // Execute confirmed Drive Save
  const handleExecuteDriveSave = async () => {
    setPendingDriveSave(false);
    if (!accessToken) return;

    setIsSavingDrive(true);
    setDriveError(null);
    setDriveSuccessData(null);

    try {
      const result = await saveBackupToGoogleDrive(receipts, accessToken);
      setDriveSuccessData(result);
      onShowSnackbar(`Saved "${result.name}" directly to your Google Drive!`);
      // Refresh list if open
      if (showDriveBackups) {
        fetchDriveBackups(accessToken);
      }
    } catch (err: any) {
      console.error('Drive save error:', err);
      setDriveError(err.message || 'Failed to save to Google Drive');
      onShowSnackbar(`Drive save error: ${err.message}`);
    } finally {
      setIsSavingDrive(false);
    }
  };

  // Fetch Backups from Drive
  const fetchDriveBackups = async (token: string) => {
    setIsLoadingBackups(true);
    try {
      const files = await listGoogleDriveBackups(token);
      setDriveBackups(files);
    } catch (err: any) {
      console.error('Fetch Drive backups error:', err);
      onShowSnackbar(`Could not load Drive backups: ${err.message}`);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  // Toggle Drive Backups List
  const handleToggleDriveBackups = () => {
    if (!showDriveBackups && accessToken) {
      fetchDriveBackups(accessToken);
    }
    setShowDriveBackups(!showDriveBackups);
  };

  // Restore from a Drive File
  const handleRestoreFromDriveFile = async (file: DriveBackupFile) => {
    if (!accessToken) return;
    try {
      onShowSnackbar(`Downloading "${file.name}" from your Google Drive...`);
      const text = await downloadGoogleDriveFile(file.id, accessToken);
      const parsedReceipts = parseRestoredBackupJson(text);

      setPendingRestore({
        source: 'drive',
        receipts: parsedReceipts,
        title: `Restore from Google Drive ("${file.name}")`,
      });
    } catch (err: any) {
      onShowSnackbar(`Failed to load backup: ${err.message}`);
    }
  };

  // Confirm and apply restore
  const handleConfirmRestore = () => {
    if (!pendingRestore) return;
    const { receipts: restoredReceipts, title } = pendingRestore;
    onReceiptsRestored(
      restoredReceipts,
      `Successfully restored ${restoredReceipts.length} receipts from ${title}`
    );
    setPendingRestore(null);
    onClose();
  };

  const totalItemsCount = receipts.reduce((sum, r) => sum + r.items.length, 0);

  return (
    <div
      id="save-backup-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="save-backup-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-m3-surface-container text-m3-on-surface max-h-[92vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden border border-m3-outline-variant/60 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-m3-outline-variant/40 flex items-center justify-between shrink-0 bg-m3-surface-container-high">
          <div>
            <h2 className="text-base font-bold text-m3-on-surface flex items-center gap-2">
              <span>Save & Backup Data</span>
            </h2>
            <p className="text-xs text-m3-on-surface-variant mt-0.5">
              {receipts.length} receipt{receipts.length === 1 ? '' : 's'} • {totalItemsCount} item
              {totalItemsCount === 1 ? '' : 's'} indexed
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-m3-on-surface-variant hover:text-m3-on-surface rounded-full hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-m3-outline-variant/40 px-6 pt-3 gap-2 bg-m3-surface-container">
          <button
            onClick={() => setActiveTab('filesystem')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'filesystem'
                ? 'border-m3-primary text-m3-primary'
                : 'border-transparent text-m3-on-surface-variant hover:text-m3-on-surface'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>File System (Device)</span>
          </button>

          <button
            onClick={() => setActiveTab('googledrive')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'googledrive'
                ? 'border-m3-primary text-m3-primary'
                : 'border-transparent text-m3-on-surface-variant hover:text-m3-on-surface'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Google Drive</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* TAB 1: FILE SYSTEM */}
          {activeTab === 'filesystem' && (
            <div className="space-y-4">
              <div className="bg-m3-surface-container-low border border-m3-outline-variant/50 p-4 rounded-2xl flex items-center gap-3 text-xs text-m3-on-surface-variant">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>100% On-Device & Private:</strong> Saves directly to your local file
                  system or downloads folder. No account or internet connection needed.
                </span>
              </div>

              {/* Action 1: JSON Backup */}
              <div className="border border-m3-outline-variant/50 rounded-2xl p-4 bg-m3-surface-container-low space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-m3-primary-container text-m3-on-primary-container shrink-0">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-m3-on-surface">
                        JSON Application Backup
                      </h3>
                      <p className="text-xs text-m3-on-surface-variant mt-0.5">
                        Complete snapshot of all receipts, full item details, categories, prices, and
                        return statuses. Can be restored anytime.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveJsonLocal}
                  disabled={isSavingLocal}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
                >
                  {isSavingLocal ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Save JSON to Device</span>
                </button>

                {localSuccessMsg && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{localSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Action 2: CSV Spreadsheet */}
              <div className="border border-m3-outline-variant/50 rounded-2xl p-4 bg-m3-surface-container-low space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-m3-secondary-container text-m3-on-secondary-container shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-m3-on-surface">
                      Export Items Spreadsheet (CSV)
                    </h3>
                    <p className="text-xs text-m3-on-surface-variant mt-0.5">
                      Export all {totalItemsCount} purchased & returned items into a formatted CSV
                      ready for Excel, Apple Numbers, or Google Sheets.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportCsvLocal}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface border border-m3-outline-variant/60 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Download Items CSV</span>
                </button>
              </div>

              {/* Action 3: Restore Backup from Local File */}
              <div className="border border-dashed border-m3-outline-variant/60 rounded-2xl p-4 bg-m3-surface-container-lowest text-center space-y-2">
                <span className="text-xs font-semibold text-m3-on-surface block">
                  Restore from a Previous Backup
                </span>
                <p className="text-[11px] text-m3-on-surface-variant">
                  Select a previously downloaded `.json` backup file to restore your receipt index.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleLocalFileSelected}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-m3-surface-container-high border border-m3-outline-variant/60 text-xs font-semibold text-m3-on-surface hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Backup File</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE */}
          {activeTab === 'googledrive' && (
            <div className="space-y-4">
              <div className="bg-m3-surface-container-low border border-m3-outline-variant/50 p-4 rounded-2xl flex items-center gap-3 text-xs text-m3-on-surface-variant">
                <Cloud className="w-4 h-4 text-m3-primary shrink-0" />
                <span>
                  <strong>User-Specific Drive Storage:</strong> Saves directly into your personal
                  Google Drive. Backups are private to your Google account.
                </span>
              </div>

              {/* Auth Status & Sign-In Block */}
              {!user ? (
                <div className="border border-m3-outline-variant/50 rounded-2xl p-5 bg-m3-surface-container-low text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center mx-auto">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-m3-on-surface">
                      Connect your Google Drive
                    </h3>
                    <p className="text-xs text-m3-on-surface-variant max-w-sm mx-auto mt-1">
                      Sign in with your Google account to save and restore backups directly from your
                      Drive.
                    </p>
                  </div>

                  {/* Standard GSI-styled button */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isAuthenticating}
                    className="inline-flex items-center gap-3 px-5 py-2.5 bg-m3-surface-container-lowest border border-m3-outline-variant/60 rounded-full text-xs sm:text-sm font-semibold text-m3-on-surface hover:bg-m3-surface-container-high shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isAuthenticating ? (
                      <Loader2 className="w-4 h-4 animate-spin text-m3-primary" />
                    ) : (
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-4 h-4 shrink-0"
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                      </svg>
                    )}
                    <span>{isAuthenticating ? 'Connecting...' : 'Sign in with Google'}</span>
                  </button>

                  {driveError && (
                    <div className="text-xs text-m3-error flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{driveError}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Connected State */
                <div className="space-y-4">
                  {/* User Profile Bar */}
                  <div className="flex items-center justify-between p-3.5 bg-m3-surface-container-high rounded-2xl border border-m3-outline-variant/40 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Google profile"
                          className="w-8 h-8 rounded-full shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-m3-on-surface truncate">
                          {user.displayName || 'Google User'}
                        </div>
                        <div className="text-[11px] text-m3-on-surface-variant truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleGoogleSignOut}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-m3-error hover:bg-m3-error-container/40 rounded-full transition-colors cursor-pointer"
                      title="Sign out of Google"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">Sign Out</span>
                    </button>
                  </div>

                  {/* Save to Drive Card */}
                  <div className="border border-m3-outline-variant/50 rounded-2xl p-4 bg-m3-surface-container-low space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-m3-on-surface">
                        Save Snapshot to Google Drive
                      </h3>
                      <p className="text-xs text-m3-on-surface-variant mt-0.5">
                        Uploads a dated backup file directly to your personal Drive.
                      </p>
                    </div>

                    <button
                      onClick={handleInitiateDriveSave}
                      disabled={isSavingDrive}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
                    >
                      {isSavingDrive ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Cloud className="w-4 h-4" />
                      )}
                      <span>
                        {isSavingDrive ? 'Saving to Google Drive...' : 'Save Backup to Google Drive'}
                      </span>
                    </button>

                    {/* Drive Upload Success Result */}
                    {driveSuccessData && (
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs space-y-1.5 animate-in fade-in">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>Successfully saved to Google Drive!</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          File: <strong>{driveSuccessData.name}</strong>
                        </p>
                        {driveSuccessData.webViewLink && (
                          <a
                            href={driveSuccessData.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-m3-primary hover:underline pt-0.5"
                          >
                            <span>Open in Google Drive</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {driveError && (
                      <div className="text-xs text-m3-error flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{driveError}</span>
                      </div>
                    )}
                  </div>

                  {/* Automatic 3:00 AM Nightly Sync Card */}
                  <div className="border border-m3-outline-variant/50 rounded-2xl p-4 bg-m3-surface-container-low space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-m3-on-surface">
                              Automatic 3:00 AM Nightly Sync
                            </h3>
                            {autoSyncOn && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-m3-on-surface-variant mt-0.5">
                            Automatically triggers a background Google Drive backup every night at 3:00 AM in your local timezone.
                          </p>
                        </div>
                      </div>

                      {/* Switch Toggle */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={autoSyncOn}
                        onClick={handleToggleAutoSync}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          autoSyncOn ? 'bg-m3-primary' : 'bg-m3-surface-container-highest'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            autoSyncOn ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="pt-1 text-[11px] text-m3-on-surface-variant flex items-center justify-between border-t border-m3-outline-variant/30">
                      <span>Next schedule: <strong>{getNext3AMDisplay()}</strong></span>
                      {getLastSyncTime() && (
                        <span>Last sync: {new Date(getLastSyncTime()!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>

                  {/* List Previous Drive Backups */}
                  <div className="border border-m3-outline-variant/50 rounded-2xl overflow-hidden bg-m3-surface-container-low">
                    <button
                      onClick={handleToggleDriveBackups}
                      className="w-full p-4 flex items-center justify-between text-xs font-bold text-m3-on-surface hover:bg-m3-surface-container-high transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-m3-on-surface-variant" />
                        <span>Existing Backups on Google Drive</span>
                        {driveBackups.length > 0 && (
                          <span className="px-2 py-0.5 bg-m3-secondary-container text-m3-on-secondary-container rounded-full font-mono text-[10px]">
                            {driveBackups.length}
                          </span>
                        )}
                      </div>
                      {showDriveBackups ? (
                        <ChevronUp className="w-4 h-4 text-m3-on-surface-variant" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-m3-on-surface-variant" />
                      )}
                    </button>

                    {showDriveBackups && (
                      <div className="p-3 border-t border-m3-outline-variant/40 space-y-2 bg-m3-surface-container-lowest">
                        <div className="flex justify-between items-center text-[11px] text-m3-on-surface-variant px-1">
                          <span>Backups created with Reco</span>
                          <button
                            onClick={() => accessToken && fetchDriveBackups(accessToken)}
                            className="inline-flex items-center gap-1 text-m3-primary hover:underline cursor-pointer font-medium"
                          >
                            <RefreshCw className={`w-3 h-3 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                          </button>
                        </div>

                        {isLoadingBackups ? (
                          <div className="py-6 text-center text-xs text-m3-on-surface-variant flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-m3-primary" />
                            <span>Loading Drive backups...</span>
                          </div>
                        ) : driveBackups.length === 0 ? (
                          <div className="py-5 text-center text-xs text-m3-on-surface-variant">
                            No previous backup files found in this Google Drive.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {driveBackups.map((f) => (
                              <div
                                key={f.id}
                                className="p-3 bg-m3-surface-container-high rounded-xl border border-m3-outline-variant/40 flex items-center justify-between text-xs gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="font-semibold text-m3-on-surface truncate">
                                    {f.name}
                                  </div>
                                  <div className="text-[10px] text-m3-on-surface-variant mt-0.5">
                                    {new Date(f.createdTime).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {f.webViewLink && (
                                    <a
                                      href={f.webViewLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 text-m3-on-surface-variant hover:text-m3-on-surface"
                                      title="Open in Drive"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  <button
                                    onClick={() => handleRestoreFromDriveFile(f)}
                                    className="px-3 py-1 rounded-full bg-m3-secondary-container text-m3-on-secondary-container font-semibold text-[11px] hover:opacity-90 transition-opacity cursor-pointer"
                                  >
                                    Restore
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-m3-outline-variant/40 bg-m3-surface-container-high flex items-center justify-between text-xs text-m3-on-surface-variant">
          <span>Private • On-device index</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-m3-on-surface hover:bg-m3-surface-container-highest transition-colors font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* MANDATORY EXPLICIT CONFIRMATION DIALOG FOR DRIVE SAVE */}
      {pendingDriveSave && (
        <div
          className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPendingDriveSave(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-m3-surface-container-high rounded-[28px] p-6 border border-m3-outline-variant/60 shadow-2xl space-y-4 text-m3-on-surface"
          >
            <div className="w-10 h-10 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-m3-on-surface">Save Backup to Google Drive?</h3>
              <p className="text-xs text-m3-on-surface-variant mt-1.5 leading-relaxed">
                This will create a new backup file containing {receipts.length} receipts and{' '}
                {totalItemsCount} items in your personal Google Drive account ({user?.email}) with
                your permission.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPendingDriveSave(false)}
                className="flex-1 py-2.5 px-4 rounded-full border border-m3-outline-variant/60 text-xs font-semibold text-m3-on-surface hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDriveSave}
                className="flex-1 py-2.5 px-4 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY EXPLICIT CONFIRMATION DIALOG FOR RESTORE */}
      {pendingRestore && (
        <div
          className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPendingRestore(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-m3-surface-container-high rounded-[28px] p-6 border border-m3-outline-variant/60 shadow-2xl space-y-4 text-m3-on-surface"
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-m3-on-surface">Confirm Restore from Backup?</h3>
              <p className="text-xs text-m3-on-surface-variant mt-1.5 leading-relaxed">
                This will import {pendingRestore.receipts.length} receipts into your local search
                index. Existing receipts will be updated.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPendingRestore(null)}
                className="flex-1 py-2.5 px-4 rounded-full border border-m3-outline-variant/60 text-xs font-semibold text-m3-on-surface hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                className="flex-1 py-2.5 px-4 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
