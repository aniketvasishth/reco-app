import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Settings,
  HardDrive,
  Cloud,
  Palette,
  Moon,
  Sun,
  Laptop,
  Maximize2,
  Minimize2,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  ExternalLink,
  MessageSquarePlus,
  Sparkles,
  Database,
  Info,
  Check,
  LogOut,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Key,
  Eye,
  EyeOff,
  Zap,
  WifiOff,
  Wifi,
  AlertTriangle,
  Vibrate,
  Smartphone,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CostcoReceipt, ThemeMode } from '../types';
import {
  MATERIAL_PALETTES,
  DEFAULT_PALETTE_ID,
  detectSystemDynamicAccent,
  getActivePalette,
} from '../utils/themePalettes';
import { getPlatformInfo } from '../utils/platform';
import { CanadaFlag } from './CanadaFlag';
import {
  isHapticsSupported,
  getHapticsEnabled,
  setHapticsEnabled,
  hapticFeedback,
} from '../utils/haptics';
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
  DriveBackupFile,
  DriveConnectedUser,
  getSavedDriveUser,
  getCachedAccessToken,
  isGoogleDriveConnected,
} from '../services/googleDriveService';
import {
  getLastSyncTime,
} from '../services/nightlySyncService';
import {
  checkOnDeviceAiAvailability,
  promptOnDeviceGeminiNano,
  getEnginePreference,
  setEnginePreference,
  getUserGeminiKey,
  setUserGeminiKey,
  getAllowCloudFallback,
  setAllowCloudFallback,
  isOfflineOnly,
  setOfflineOnly,
  OnDeviceAiStatus,
} from '../services/onDeviceAiService';
import {
  M3_TRANSITIONS,
  M3_BOTTOM_SHEET_DRAG,
  m3SharedAxisXVariants,
} from '../utils/motion';

type SettingsTab = 'backup' | 'ai' | 'compatibility' | 'theme' | 'data' | 'about';

const SETTINGS_TAB_ORDER: SettingsTab[] = ['backup', 'ai', 'compatibility', 'theme', 'data', 'about'];

const SETTINGS_TABS = [
  { id: 'backup', label: 'Backup' },
  { id: 'ai', label: 'Engine' },
  { id: 'compatibility', label: 'Compatibility' },
  { id: 'theme', label: 'Theme' },
  { id: 'data', label: 'Data' },
  { id: 'about', label: 'About' },
] as const;

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  receipts: CostcoReceipt[];
  themeMode: ThemeMode;
  onSelectThemeMode: (mode: ThemeMode) => void;
  activePaletteId: string;
  onSelectPalette: (paletteId: string) => void;
  onOpenPalettesModal?: () => void;
  isDarkMode: boolean;
  isImmersive?: boolean;
  onToggleImmersive?: () => void;
  onReceiptsRestored: (receipts: CostcoReceipt[], message: string) => void;
  onClearAllReceipts: () => void;
  onFactoryReset?: () => void;
  onLoadDemo: () => void;
  onOpenFeedback: () => void;
  onOpenInstall?: () => void;
  isInstalled?: boolean;
  onOpenDeviceDiagnostics?: () => void;
  onShowSnackbar: (message: string, title?: string) => void;
  initialTab?: SettingsTab;
}

export function SettingsDrawer({
  isOpen,
  onClose,
  receipts,
  themeMode,
  onSelectThemeMode,
  activePaletteId,
  onSelectPalette,
  onOpenPalettesModal,
  isDarkMode,
  isImmersive = false,
  onToggleImmersive,
  onReceiptsRestored,
  onClearAllReceipts,
  onFactoryReset,
  onLoadDemo,
  onOpenFeedback,
  onOpenInstall,
  isInstalled = false,
  onOpenDeviceDiagnostics,
  onShowSnackbar,
  initialTab = 'backup',
}: SettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [direction, setDirection] = useState<number>(1);
  const prevTabRef = useRef<SettingsTab>(initialTab);

  const handleTabChange = (newTab: SettingsTab) => {
    if (newTab === activeTab) return;
    const oldIndex = SETTINGS_TAB_ORDER.indexOf(activeTab);
    const newIndex = SETTINGS_TAB_ORDER.indexOf(newTab);
    setDirection(newIndex > oldIndex ? 1 : -1);
    prevTabRef.current = activeTab;
    setActiveTab(newTab);
  };

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      handleTabChange(initialTab);
    }
  }, [initialTab]);

  const [showFactoryResetConfirm, setShowFactoryResetConfirm] = useState(false);

  // AI Engine & Offline State
  const [offlineOnly, setOfflineOnlyState] = useState<boolean>(() => isOfflineOnly());
  const [allowCloudFallback, setAllowCloudFallbackState] = useState<boolean>(() => getAllowCloudFallback());
  const [enginePref, setEnginePrefState] = useState<'on-device' | 'cloud-byok'>(() => getEnginePreference());
  const [userApiKey, setUserApiKeyState] = useState<string>(() => getUserGeminiKey());
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiStatus, setAiStatus] = useState<OnDeviceAiStatus | null>(null);
  const [isCheckingAi, setIsCheckingAi] = useState(false);
  const [nanoTestResult, setNanoTestResult] = useState<string | null>(null);
  const [isTestingNano, setIsTestingNano] = useState(false);

  // Theme & Material You state
  const [detectedAccent, setDetectedAccent] = useState<{ hex: string; isNative: boolean; source: string }>(() =>
    detectSystemDynamicAccent()
  );

  type AiProcessingMode = 'strict-offline' | 'on-device-fallback' | 'cloud-byok';

  const currentAiMode: AiProcessingMode =
    enginePref === 'cloud-byok'
      ? 'cloud-byok'
      : offlineOnly
      ? 'strict-offline'
      : 'on-device-fallback';

  const handleSelectAiMode = (mode: AiProcessingMode) => {
    if (mode === 'strict-offline') {
      setEnginePrefState('on-device');
      setEnginePreference('on-device');
      setOfflineOnlyState(true);
      setOfflineOnly(true);
      setAllowCloudFallbackState(false);
      setAllowCloudFallback(false);
      onShowSnackbar(
        'Air-Gapped / Strict On-Device active: 100% on-device execution with an enforced network block.',
        'Air-Gapped Mode'
      );
    } else if (mode === 'on-device-fallback') {
      setEnginePrefState('on-device');
      setEnginePreference('on-device');
      setOfflineOnlyState(false);
      setOfflineOnly(false);
      setAllowCloudFallbackState(true);
      setAllowCloudFallback(true);
      onShowSnackbar(
        'On-Device with Cloud Fallback active: Prefers on-device Gemini Nano, uses cloud as backup.',
        'Hybrid AI Mode'
      );
    } else if (mode === 'cloud-byok') {
      setEnginePrefState('cloud-byok');
      setEnginePreference('cloud-byok');
      setOfflineOnlyState(false);
      setOfflineOnly(false);
      setAllowCloudFallbackState(true);
      setAllowCloudFallback(true);
      onShowSnackbar(
        'Personal Cloud Key (BYOK) active: Uses your personal Google AI Studio key for cloud processing.',
        'Cloud BYOK Mode'
      );
    }
  };

  const handleToggleOfflineOnly = (enabled: boolean) => {
    if (enabled) {
      handleSelectAiMode('strict-offline');
    } else {
      handleSelectAiMode('on-device-fallback');
    }
  };

  const handleToggleCloudFallback = (enabled: boolean) => {
    if (enabled) {
      handleSelectAiMode('on-device-fallback');
    } else {
      handleSelectAiMode('strict-offline');
    }
  };

  // Sync initial tab when drawer opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Reset scroll position to top whenever active tab changes or drawer opens
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab, isOpen]);

  useEffect(() => {
    if (isOpen && (activeTab === 'ai' || activeTab === 'compatibility') && !aiStatus && !isCheckingAi) {
      checkOnDeviceAiAvailability().then(setAiStatus);
    }
  }, [isOpen, activeTab, aiStatus, isCheckingAi]);

  useEffect(() => {
    if (isOpen && activeTab === 'theme') {
      setDetectedAccent(detectSystemDynamicAccent());
    }
  }, [isOpen, activeTab]);

  // File System State
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Drive State
  const [user, setUser] = useState<User | DriveConnectedUser | null>(() => getSavedDriveUser());
  const [accessToken, setAccessToken] = useState<string | null>(() => getCachedAccessToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [showDriveBackups, setShowDriveBackups] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() => getLastSyncTime());

  // Clear data confirmation modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [pendingDriveSave, setPendingDriveSave] = useState(false);
  const [showAirGappedDrivePrompt, setShowAirGappedDrivePrompt] = useState(false);

  // Haptic feedback preference state
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(() => getHapticsEnabled());

  // Initialize Auth state
  useEffect(() => {
    if (!isOpen) return;

    if (isGoogleDriveConnected()) {
      const saved = getSavedDriveUser();
      if (saved) {
        setUser(saved);
        setAccessToken(getCachedAccessToken());
      }
    }

    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        if (token) {
          setAccessToken(token);
        }
      },
      () => {
        if (!isGoogleDriveConnected()) {
          setUser(null);
          setAccessToken(null);
        }
      }
    );

    const handleConnected = () => {
      const saved = getSavedDriveUser();
      if (saved) {
        setUser(saved);
        setAccessToken(getCachedAccessToken());
      }
    };

    const handleDisconnected = () => {
      setUser(null);
      setAccessToken(null);
      setDriveBackups([]);
      setShowDriveBackups(false);
    };

    window.addEventListener('reco-gdrive-connected', handleConnected);
    window.addEventListener('reco-gdrive-disconnected', handleDisconnected);

    return () => {
      unsubscribe();
      window.removeEventListener('reco-gdrive-connected', handleConnected);
      window.removeEventListener('reco-gdrive-disconnected', handleDisconnected);
    };
  }, [isOpen]);

  // Load drive backups list if authenticated and tab opened
  const loadBackups = async (token: string) => {
    try {
      setIsLoadingBackups(true);
      const files = await listGoogleDriveBackups(token);
      setDriveBackups(files);
    } catch (err: any) {
      console.warn('Could not list drive backups:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const checkAirGappedForDrive = (): boolean => {
    if (currentAiMode === 'strict-offline') {
      setShowAirGappedDrivePrompt(true);
      return false;
    }
    return true;
  };

  const handleGoogleSignIn = async () => {
    if (!checkAirGappedForDrive()) return;
    try {
      setIsAuthenticating(true);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        onShowSnackbar(`Connected to Google Drive as ${result.user.email}`, 'Google Drive');
        loadBackups(result.accessToken);
      }
    } catch (err: any) {
      onShowSnackbar(err.message || 'Google Sign-In failed', 'Error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutGoogleUser();
      setUser(null);
      setAccessToken(null);
      setDriveBackups([]);
      setShowDriveBackups(false);
      onShowSnackbar('Disconnected from Google Drive.', 'Signed Out');
    } catch (err: any) {
      onShowSnackbar('Error signing out', 'Error');
    }
  };

  const handleExecuteDriveSave = async () => {
    if (!checkAirGappedForDrive()) return;
    let token = accessToken || getCachedAccessToken();
    if (!token) {
      try {
        setIsAuthenticating(true);
        const result = await googleSignIn();
        if (result) {
          setUser(result.user);
          setAccessToken(result.accessToken);
          token = result.accessToken;
        } else {
          return;
        }
      } catch (err: any) {
        onShowSnackbar(err.message || 'Please authenticate with Google Drive', 'Error');
        return;
      } finally {
        setIsAuthenticating(false);
      }
    }

    try {
      setIsSavingDrive(true);
      const res = await saveBackupToGoogleDrive(receipts, token);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncedTime(nowStr);
      onShowSnackbar(`Successfully backed up ${receipts.length} receipts to Google Drive! (${res.name})`, 'Google Drive');
      loadBackups(token);
    } catch (err: any) {
      // If token expired (401), prompt one transparent refresh
      if (err.message?.includes('expired') || err.message?.includes('401')) {
        try {
          const fresh = await googleSignIn();
          if (fresh) {
            setUser(fresh.user);
            setAccessToken(fresh.accessToken);
            const res = await saveBackupToGoogleDrive(receipts, fresh.accessToken);
            const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setLastSyncedTime(nowStr);
            onShowSnackbar(`Successfully backed up ${receipts.length} receipts to Google Drive! (${res.name})`, 'Google Drive');
            loadBackups(fresh.accessToken);
            return;
          }
        } catch (reAuthErr: any) {
          onShowSnackbar(reAuthErr.message || 'Google Drive session expired. Please sign in again.', 'Error');
          return;
        }
      }
      onShowSnackbar(err.message || 'Failed to save to Google Drive', 'Error');
    } finally {
      setIsSavingDrive(false);
      setPendingDriveSave(false);
    }
  };

  const handleToggleBackups = async () => {
    const nextShow = !showDriveBackups;
    setShowDriveBackups(nextShow);
    if (nextShow) {
      let token = accessToken || getCachedAccessToken();
      if (!token) {
        try {
          setIsLoadingBackups(true);
          const res = await googleSignIn();
          if (res) {
            token = res.accessToken;
            setUser(res.user);
            setAccessToken(res.accessToken);
          }
        } catch (e) {
          // Handled
        } finally {
          setIsLoadingBackups(false);
        }
      }
      if (token) {
        loadBackups(token);
      }
    }
  };

  const handleRestoreDriveFile = async (file: DriveBackupFile) => {
    if (!checkAirGappedForDrive()) return;
    let token = accessToken || getCachedAccessToken();
    if (!token) {
      try {
        const res = await googleSignIn();
        if (res) {
          token = res.accessToken;
          setUser(res.user);
          setAccessToken(res.accessToken);
        } else {
          return;
        }
      } catch {
        return;
      }
    }

    try {
      setIsLoadingBackups(true);
      const jsonContent = await downloadGoogleDriveFile(file.id, token);
      const parsedReceipts = parseRestoredBackupJson(jsonContent);
      onReceiptsRestored(
        parsedReceipts,
        `Restored ${parsedReceipts.length} receipts from Google Drive (${file.name})`
      );
      onShowSnackbar(`Restored ${parsedReceipts.length} receipts from Google Drive!`, 'Restored');
    } catch (err: any) {
      onShowSnackbar(err.message || 'Failed to restore file from Google Drive', 'Restore Failed');
    } finally {
      setIsLoadingBackups(false);
    }
  };

  // Local File System Exports
  const handleExportJson = async () => {
    try {
      setIsSavingLocal(true);
      const jsonStr = generateBackupJson(receipts);
      const filename = `reco-costco-backup-${new Date().toISOString().split('T')[0]}.json`;
      const result = await saveToFileSystem(jsonStr, filename, 'application/json');
      onShowSnackbar(`Exported ${receipts.length} receipts as ${result.filename}`, 'File Export');
    } catch (err: any) {
      if (err.message === 'Save cancelled by user' || err.name === 'AbortError') {
        return; // User cancelled save dialog
      }
      onShowSnackbar(err.message || 'Failed to export JSON backup', 'Export Error');
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsSavingLocal(true);
      const csvStr = generateItemsCsv(receipts);
      const filename = `reco-costco-purchases-${new Date().toISOString().split('T')[0]}.csv`;
      const result = await saveToFileSystem(csvStr, filename, 'text/csv;charset=utf-8;');
      onShowSnackbar(`Exported CSV of purchases as ${result.filename}`, 'File Export');
    } catch (err: any) {
      if (err.message === 'Save cancelled by user' || err.name === 'AbortError') {
        return; // User cancelled save dialog
      }
      onShowSnackbar(err.message || 'Failed to export CSV', 'Export Error');
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsedReceipts = parseRestoredBackupJson(text);
        onReceiptsRestored(
          parsedReceipts,
          `Imported ${parsedReceipts.length} receipts from ${file.name}`
        );
        onShowSnackbar(`Successfully imported ${parsedReceipts.length} receipts!`, 'Imported');
      } catch (err: any) {
        onShowSnackbar(err.message || 'Invalid backup JSON file', 'Import Error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveEnginePref = (pref: 'on-device' | 'cloud-byok') => {
    if (offlineOnly && pref === 'cloud-byok') {
      onShowSnackbar(
        'Offline Only mode is active. Disable Offline Only to use Cloud BYOK.',
        'Offline Only Active'
      );
      return;
    }
    setEnginePrefState(pref);
    setEnginePreference(pref);
    onShowSnackbar(
      pref === 'on-device'
        ? 'Switched to 100% On-Device Engine (Private & Offline-First)'
        : 'Switched to Personal Cloud BYOK Key mode',
      'AI Engine'
    );
  };

  const handleSaveApiKey = (key: string) => {
    setUserApiKeyState(key);
    setUserGeminiKey(key);
    onShowSnackbar('Personal Gemini API key saved to device storage', 'API Key');
  };

  const handleCheckAiStatus = async () => {
    setIsCheckingAi(true);
    try {
      const status = await checkOnDeviceAiAvailability();
      setAiStatus(status);
      onShowSnackbar(
        status.available
          ? 'Android / Chrome Built-in AI detected on this device!'
          : 'Running high-speed on-device WebAssembly OCR & catalog',
        'Device Diagnostics'
      );
    } finally {
      setIsCheckingAi(false);
    }
  };

  const handleTestNano = async () => {
    setIsTestingNano(true);
    setNanoTestResult(null);
    const start = performance.now();
    try {
      const res = await promptOnDeviceGeminiNano('Explain in one short sentence what a Costco receipt is.');
      const ms = Math.round(performance.now() - start);
      if (res) {
        setNanoTestResult(`Success (${ms}ms): "${res.trim()}"`);
      } else {
        setNanoTestResult('Gemini Nano is not currently enabled in this browser. Running local WebAssembly OCR fallback.');
      }
    } catch (err: any) {
      setNanoTestResult(`Test result: ${err.message || 'Unavailable'}`);
    } finally {
      setIsTestingNano(false);
    }
  };

  const handleForceSync = () => {
    const detected = detectSystemDynamicAccent();
    setDetectedAccent(detected);
    onSelectPalette('dynamic_system');
    onShowSnackbar(
      `System accent applied & saved (${detected.hex})`,
      'Theme Updated'
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 md:p-6 pointer-events-none">
          {/* Settings Backdrop */}
          <motion.div
            id="settings-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs pointer-events-auto"
            onClick={onClose}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          />

          {/* Settings Drawer / Dialog (Adaptive Bottom Sheet on Mobile, Centered Card on Desktop matching SummaryDrawer) */}
          <motion.div
            id="settings-drawer"
            initial={{ opacity: 0, scale: 0.94, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 60 }}
            transition={M3_TRANSITIONS.emphasizedEnter}
            drag={M3_BOTTOM_SHEET_DRAG.drag}
            dragConstraints={M3_BOTTOM_SHEET_DRAG.dragConstraints}
            dragElastic={M3_BOTTOM_SHEET_DRAG.dragElastic}
            onDragEnd={(_, info) => {
              if (
                info.offset.y > M3_BOTTOM_SHEET_DRAG.dismissThresholdY ||
                info.velocity.y > M3_BOTTOM_SHEET_DRAG.dismissVelocityY
              ) {
                onClose();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="relative z-10 pointer-events-auto w-full max-w-lg md:max-w-2xl lg:max-w-3xl bg-m3-surface-container text-m3-on-surface max-h-[88vh] sm:max-h-[90vh] rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden border border-m3-outline-variant/60 touch-pan-y"
          >
            {/* Mobile Drag Handle Bar */}
            <div className="pt-2.5 pb-1 flex justify-center sm:hidden cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.5 rounded-full bg-m3-outline-variant/60" />
            </div>

            {/* Header */}
            <div className="px-5 py-3.5 border-b border-m3-outline-variant/40 bg-m3-surface-container-high/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center shadow-2xs">
                    <Settings className="w-5 h-5 text-m3-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-m3-on-surface">Settings</h2>
                    <p className="text-[11px] text-m3-on-surface-variant leading-none mt-0.5">
                      Backup, Appearance & App Preferences
                    </p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={onClose}
                  className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
                  aria-label="Close Settings"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Material 3 Segmented Pill Tabs */}
              <div className="px-4 pt-3 pb-2 bg-m3-surface-container shrink-0 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-center gap-1.5 bg-m3-surface-container-high p-1 rounded-full min-w-max w-full justify-between">
                  {SETTINGS_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleTabChange(tab.id)}
                        className={`relative flex-1 py-1.5 px-3 text-xs font-semibold rounded-full transition-colors cursor-pointer select-none text-center whitespace-nowrap ${
                          isActive
                            ? 'text-m3-on-secondary-container'
                            : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="m3-settings-tab-pill"
                            transition={M3_TRANSITIONS.snappySpring}
                            className="absolute inset-0 bg-m3-secondary-container rounded-full shadow-xs -z-0"
                          />
                        )}
                        <span className="relative z-10 truncate block">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Persistent Air-Gapped Banner in Settings Drawer */}
              {currentAiMode === 'strict-offline' && (
                <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    Air-Gapped Mode Active • 100% on-device processing
                  </span>
                </div>
              )}

              {/* Drawer Scrollable Content with Material 3 Shared X-Axis */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 relative">
                <AnimatePresence mode="wait" custom={direction}>
                  {/* TAB 1: BACKUP & SYNC */}
                  {activeTab === 'backup' && (
                    <motion.div
                      key="tab-backup"
                      custom={direction}
                      variants={m3SharedAxisXVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="space-y-4"
                    >
                    {/* Google Drive Card */}
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xs">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-m3-primary/15 text-m3-primary flex items-center justify-center shrink-0">
                            <Cloud className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-m3-on-surface">Google Drive Sync</h3>
                            <p className="text-[11px] text-m3-on-surface-variant">
                              Encrypted cloud backup directly to your personal Drive
                            </p>
                          </div>
                        </div>

                        {user && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Connected
                          </span>
                        )}
                      </div>

                      {/* Air-Gapped Mode Notification for Google Drive */}
                      {currentAiMode === 'strict-offline' && (
                        <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-2.5 text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1.5 text-m3-on-surface flex-1 min-w-0">
                            <span className="font-bold block text-amber-700 dark:text-amber-300">
                              Air-Gapped Mode Active
                            </span>
                            <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                              Outbound network traffic is currently blocked. To connect Google Drive, change your Engine to <strong>On-Device with Cloud Fallback</strong>.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleSelectAiMode('on-device-fallback')}
                              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-bold text-[11px] rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span>Switch Engine to Cloud Fallback</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* User status / Login */}
                      {user ? (
                        <div className="p-3.5 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 pr-2">
                              <span className="text-xs font-semibold text-m3-on-surface block truncate">
                                {user.displayName || 'Google Account'}
                              </span>
                              <span className="text-[11px] text-m3-on-surface-variant block truncate">
                                {user.email}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleGoogleLogout}
                              className="px-2.5 py-1 text-xs rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Disconnect</span>
                            </button>
                          </div>

                          {lastSyncedTime && (
                            <div className="text-[11px] text-m3-on-surface-variant flex items-center gap-1.5 pt-2 border-t border-m3-outline-variant/20">
                              <Clock className="w-3 h-3 text-m3-primary" />
                              <span>Last backed up: {lastSyncedTime}</span>
                            </div>
                          )}

                          {/* Primary Action Buttons when connected */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                if (!checkAirGappedForDrive()) return;
                                setPendingDriveSave(true);
                              }}
                              disabled={isSavingDrive}
                              className="py-2.5 px-3 rounded-xl bg-m3-primary text-m3-on-primary hover:opacity-90 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                            >
                              {isSavingDrive ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              <span>Backup Now</span>
                            </motion.button>

                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={handleToggleBackups}
                              className="py-2.5 px-3 rounded-xl bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border border-m3-outline-variant/30 transition-all"
                            >
                              <Download className="w-3.5 h-3.5 text-m3-primary" />
                              <span>{showDriveBackups ? 'Hide Backups' : 'View Backups'}</span>
                            </motion.button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGoogleSignIn}
                            disabled={isAuthenticating}
                            className="w-full py-3 px-4 rounded-2xl bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                          >
                            {isAuthenticating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Cloud className="w-4 h-4" />
                            )}
                            <span>Connect Google Drive</span>
                          </motion.button>
                        </div>
                      )}

                      {/* Drive Backups List */}
                      {showDriveBackups && user && (
                        <div className="pt-2 space-y-2 border-t border-m3-outline-variant/20">
                          <div className="flex items-center justify-between text-xs font-bold text-m3-on-surface-variant">
                            <span>Cloud Backups in Drive</span>
                            <button
                              type="button"
                              onClick={() => {
                                const tok = accessToken || getCachedAccessToken();
                                if (tok) loadBackups(tok);
                                else handleToggleBackups();
                              }}
                              className="text-m3-primary hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <RefreshCw className={`w-3 h-3 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                              <span>Refresh</span>
                            </button>
                          </div>

                          {isLoadingBackups ? (
                            <div className="p-4 text-center text-xs text-m3-on-surface-variant flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-m3-primary" />
                              <span>Loading Drive files...</span>
                            </div>
                          ) : driveBackups.length > 0 ? (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {driveBackups.map((bk) => (
                                <div
                                  key={bk.id}
                                  className="p-2.5 rounded-xl bg-m3-surface-container border border-m3-outline-variant/30 flex items-center justify-between gap-2 text-xs"
                                >
                                  <div className="min-w-0">
                                    <span className="font-semibold text-m3-on-surface block truncate text-[11px]">
                                      {bk.name}
                                    </span>
                                    <span className="text-[10px] text-m3-on-surface-variant">
                                      {new Date(bk.createdTime).toLocaleDateString()} • {new Date(bk.createdTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRestoreDriveFile(bk)}
                                    className="px-2.5 py-1 rounded-lg bg-m3-primary text-m3-on-primary text-[11px] font-bold hover:opacity-90 shrink-0 cursor-pointer shadow-2xs"
                                  >
                                    Restore
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-m3-on-surface-variant italic text-center p-2">
                              No prior backups found in Google Drive. Tap "Backup Now" above.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Local File System Export / Import */}
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-m3-primary/15 text-m3-primary flex items-center justify-center shrink-0">
                          <HardDrive className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-m3-on-surface">Local File Backups</h3>
                          <p className="text-[11px] text-m3-on-surface-variant">
                            Export or restore JSON files on your computer/phone
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={handleExportJson}
                          disabled={isSavingLocal}
                          className="p-3 rounded-2xl bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant/30 text-left transition-all cursor-pointer flex flex-col justify-between gap-1"
                        >
                          <div className="flex items-center justify-between w-full">
                            <FileJson className="w-4 h-4 text-m3-primary" />
                            <Download className="w-3.5 h-3.5 text-m3-on-surface-variant" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-m3-on-surface block">Export JSON</span>
                            <span className="text-[10px] text-m3-on-surface-variant leading-none">
                              Full database backup
                            </span>
                          </div>
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={handleExportCsv}
                          disabled={isSavingLocal}
                          className="p-3 rounded-2xl bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant/30 text-left transition-all cursor-pointer flex flex-col justify-between gap-1"
                        >
                          <div className="flex items-center justify-between w-full">
                            <FileSpreadsheet className="w-4 h-4 text-m3-primary" />
                            <Download className="w-3.5 h-3.5 text-m3-on-surface-variant" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-m3-on-surface block">Export CSV</span>
                            <span className="text-[10px] text-m3-on-surface-variant leading-none">
                              Itemized for Excel
                            </span>
                          </div>
                        </motion.button>
                      </div>

                      {/* Restore Local JSON File */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileInputChange}
                        accept=".json,application/json"
                        className="hidden"
                      />
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2.5 px-3 rounded-2xl bg-m3-surface-container hover:bg-m3-surface-container-high border border-dashed border-m3-outline-variant/60 text-m3-on-surface text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Upload className="w-4 h-4 text-m3-primary" />
                        <span>Import / Restore JSON File</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* TAB: AI ENGINE & PRIVACY */}
                {activeTab === 'ai' && (
                  <motion.div
                    key="tab-ai"
                    custom={direction}
                    variants={m3SharedAxisXVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    {/* 3-WAY AI ENGINE & NETWORK SELECTOR: Zero Redundancy */}
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xs">
                      <div>
                        <h3 className="text-sm font-bold text-m3-on-surface flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-m3-primary" />
                          <span>AI Engine & Network Policy</span>
                        </h3>
                        <p className="text-[11px] text-m3-on-surface-variant">
                          Choose how receipts are analyzed and your privacy guarantee
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* Option 1: Air-Gapped / Strict On-Device (Default) */}
                        <div
                          onClick={() => handleSelectAiMode('strict-offline')}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                            currentAiMode === 'strict-offline'
                              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs'
                              : 'bg-m3-surface-container border-m3-outline-variant/30 hover:border-m3-outline-variant/60'
                          }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            currentAiMode === 'strict-offline'
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-m3-outline-variant'
                          }`}>
                            {currentAiMode === 'strict-offline' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>

                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-bold text-m3-on-surface">
                                Air-Gapped / Strict On-Device
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                Default • 100% Local
                              </span>
                            </div>
                            <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                              Runs 100% on-device with an enforced network block. Disables all external cloud calls and processes receipts locally using Android Gemini Nano and bundled WebAssembly OCR.
                            </p>

                            {currentAiMode === 'strict-offline' && (
                              <div className="pt-1 flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span>Zero data ever leaves your device. Hard air-gap active.</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Option 2: On-Device with Cloud Fallback */}
                        <div
                          onClick={() => handleSelectAiMode('on-device-fallback')}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                            currentAiMode === 'on-device-fallback'
                              ? 'bg-m3-primary/10 border-m3-primary shadow-xs'
                              : 'bg-m3-surface-container border-m3-outline-variant/30 hover:border-m3-outline-variant/60'
                          }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            currentAiMode === 'on-device-fallback'
                              ? 'border-m3-primary bg-m3-primary text-m3-on-primary'
                              : 'border-m3-outline-variant'
                          }`}>
                            {currentAiMode === 'on-device-fallback' && <div className="w-1.5 h-1.5 rounded-full bg-m3-on-primary" />}
                          </div>

                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-bold text-m3-on-surface">
                                On-Device with Cloud Fallback
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-m3-primary/15 text-m3-primary">
                                Smart Hybrid
                              </span>
                            </div>
                            <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                              Prefers on-device Gemini Nano, but can use cloud as a backup if your device hardware doesn't support Nano.
                            </p>

                            {currentAiMode === 'on-device-fallback' && (
                              <div className="pt-1 flex items-center gap-1.5 text-[10px] text-m3-primary font-medium">
                                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                <span>Primary: Gemini Nano • Secondary: Cloud Vision Model</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Option 3: Personal Cloud Key (BYOK) */}
                        <div
                          onClick={() => handleSelectAiMode('cloud-byok')}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                            currentAiMode === 'cloud-byok'
                              ? 'bg-amber-500/10 border-amber-500/60 shadow-xs'
                              : 'bg-m3-surface-container border-m3-outline-variant/30 hover:border-m3-outline-variant/60'
                          }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            currentAiMode === 'cloud-byok'
                              ? 'border-amber-500 bg-amber-500 text-white'
                              : 'border-m3-outline-variant'
                          }`}>
                            {currentAiMode === 'cloud-byok' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>

                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-bold text-m3-on-surface">
                                Personal Cloud Key (BYOK)
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                Cloud Dedicated
                              </span>
                            </div>
                            <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                              Uses your personal Google AI Studio key for cloud processing.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* BYOK Input Form if Personal Cloud Key selected */}
                      {currentAiMode === 'cloud-byok' && (
                        <div className="p-3.5 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30 space-y-3 pt-3">
                          <label className="text-[11px] font-semibold text-m3-on-surface flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Key className="w-3.5 h-3.5 text-amber-500" />
                              <span>Your Personal Google AI Studio API Key</span>
                            </span>
                            <span className="text-[10px] text-m3-on-surface-variant">Stored locally in browser</span>
                          </label>

                          <div className="relative">
                            <input
                              type={showApiKey ? 'text' : 'password'}
                              value={userApiKey}
                              onChange={(e) => setUserApiKeyState(e.target.value)}
                              placeholder="AIzaSy..."
                              className="w-full text-xs font-mono bg-m3-surface-container-high border border-m3-outline-variant/60 rounded-xl px-3 py-2 pr-10 text-m3-on-surface focus:outline-none focus:border-m3-primary"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-m3-on-surface-variant hover:text-m3-on-surface p-1 cursor-pointer"
                            >
                              {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <a
                              href="https://aistudio.google.com/app/apikey"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-m3-primary hover:underline flex items-center gap-1"
                            >
                              <span>Get free key at Google AI Studio</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            <div className="flex items-center gap-2">
                              {userApiKey && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveApiKey('')}
                                  className="px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleSaveApiKey(userApiKey)}
                                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-m3-primary text-m3-on-primary hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                              >
                                Save Key
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Active Status Overview Bar */}
                      <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                        <div className="p-2.5 bg-m3-surface-container rounded-xl border border-m3-outline-variant/20 space-y-0.5">
                          <span className="text-m3-on-surface-variant font-medium block">Network Policy</span>
                          <span className={`font-bold ${
                            currentAiMode === 'strict-offline'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : currentAiMode === 'on-device-fallback'
                              ? 'text-m3-primary'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {currentAiMode === 'strict-offline'
                              ? 'Enforced Air-Gap'
                              : currentAiMode === 'on-device-fallback'
                              ? 'Local + Cloud Backup'
                              : 'Online (BYOK Key)'}
                          </span>
                        </div>

                        <div className="p-2.5 bg-m3-surface-container rounded-xl border border-m3-outline-variant/20 space-y-0.5">
                          <span className="text-m3-on-surface-variant font-medium block">Local Storage</span>
                          <span className="font-bold text-m3-on-surface">100% Sandbox</span>
                        </div>

                        <div className="p-2.5 bg-m3-surface-container rounded-xl border border-m3-outline-variant/20 space-y-0.5 col-span-2 sm:col-span-1">
                          <span className="text-m3-on-surface-variant font-medium block">AI Cost</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {currentAiMode === 'cloud-byok' ? 'Your Cloud Key' : '$0.00 (On-Device)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Informational Compatibility Check Label */}
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleTabChange('compatibility')}
                        className="inline-flex items-center justify-center py-1.5 px-4 rounded-full bg-m3-primary/10 hover:bg-m3-primary/20 border border-m3-primary/30 text-xs font-semibold text-m3-primary dark:text-m3-primary tracking-tight transition-colors cursor-pointer"
                      >
                        Looking for device hardware diagnostics? Open Compatibility Check
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* TAB: COMPATIBILITY CHECK & HARDWARE DIAGNOSTICS */}
                {activeTab === 'compatibility' && (
                  <motion.div
                    key="tab-compatibility"
                    custom={direction}
                    variants={m3SharedAxisXVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    {/* Hardware Diagnostics Card */}
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-m3-on-surface flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>On-Device Hardware Diagnostics</span>
                          </h3>
                          <p className="text-[11px] text-m3-on-surface-variant">
                            Inspect your browser & device local AI capabilities
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCheckAiStatus}
                          disabled={isCheckingAi}
                          className="px-2.5 py-1 text-xs rounded-xl bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface transition-colors flex items-center gap-1.5 cursor-pointer font-medium border border-m3-outline-variant/30"
                        >
                          <RefreshCw className={`w-3 h-3 text-m3-primary ${isCheckingAi ? 'animate-spin' : ''}`} />
                          <span>Refresh</span>
                        </button>
                      </div>

                      <div className="space-y-2 font-mono text-[11px]">
                        <div className="flex items-center justify-between p-2.5 bg-m3-surface-container rounded-xl border border-m3-outline-variant/20">
                          <span className="text-m3-on-surface-variant font-sans">Android / Chrome Built-in AI</span>
                          <span className={`font-bold ${aiStatus?.isWindowAiAvailable ? 'text-emerald-500' : 'text-zinc-400'}`}>
                            {aiStatus?.isWindowAiAvailable ? 'Detected on Device' : 'Standard Web Environment'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-m3-surface-container rounded-xl border border-m3-outline-variant/20">
                          <span className="text-m3-on-surface-variant font-sans">Gemini Nano Language Model</span>
                          <span className="font-bold text-m3-on-surface">
                            {aiStatus?.availability || (aiStatus?.isLanguageModelAvailable ? 'readily available' : 'Local WebAssembly Engine')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-m3-surface-container rounded-xl border border-m3-outline-variant/20">
                          <span className="text-m3-on-surface-variant font-sans">Local Costco SKU Catalog</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                            2,500+ Items (Bundled offline)
                          </span>
                        </div>
                      </div>

                      {/* Test Benchmark Button */}
                      <div className="space-y-2 pt-1">
                        {onOpenDeviceDiagnostics && (
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              onClose();
                              onOpenDeviceDiagnostics();
                            }}
                            className="w-full py-2.5 px-3 rounded-2xl bg-m3-primary/10 hover:bg-m3-primary/15 border border-m3-primary/30 text-m3-primary text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Launch Full Device Capabilities Check</span>
                          </motion.button>
                        )}

                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={handleTestNano}
                          disabled={isTestingNano}
                          className="w-full py-2.5 px-3 rounded-2xl bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant/40 text-m3-on-surface text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          {isTestingNano ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-m3-primary" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 text-m3-primary" />
                          )}
                          <span>Test On-Device AI Execution</span>
                        </motion.button>

                        {nanoTestResult && (
                          <div className="p-3 rounded-xl bg-m3-surface-container border border-m3-outline-variant/30 text-xs space-y-1 font-mono">
                            <span className="text-[10px] text-m3-on-surface-variant block uppercase tracking-wider font-sans font-bold">
                              Benchmark Result
                            </span>
                            <p className="text-m3-on-surface">{nanoTestResult}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Offline Architecture Readiness Summary */}
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xs">
                      <h4 className="text-xs font-bold text-m3-on-surface uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Offline-First Readiness</span>
                      </h4>
                      <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                        Reco operates 100% locally on your device hardware. Receipt OCR, barcode scanning, search indexes, and price analytics execute strictly inside your browser sandbox without network reliance.
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="p-2.5 bg-m3-surface-container rounded-xl border border-m3-outline-variant/20 space-y-1">
                          <span className="text-m3-on-surface font-semibold block">Local WebAssembly</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Active & Preloaded</span>
                        </div>
                        <div className="p-2.5 bg-m3-surface-container rounded-xl border border-m3-outline-variant/20 space-y-1">
                          <span className="text-m3-on-surface font-semibold block">Local IndexedDB</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Encrypted Storage</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: THEME & APPEARANCE */}
                {activeTab === 'theme' && (
                  <motion.div
                    key="tab-theme"
                    custom={direction}
                    variants={m3SharedAxisXVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    {/* Color Mode: Auto / Light / Dark */}
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center">
                            {themeMode === 'system' ? (
                              <Laptop className="w-3.5 h-3.5 text-m3-primary" />
                            ) : themeMode === 'dark' ? (
                              <Moon className="w-3.5 h-3.5 text-m3-primary" />
                            ) : (
                              <Sun className="w-3.5 h-3.5 text-amber-500" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface">
                              Color Mode
                            </h3>
                            <span className="text-[11px] text-m3-on-surface-variant block">
                              Select light, dark, or system match
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] text-m3-primary font-bold uppercase">
                          Material 3
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-m3-surface-container-high rounded-2xl border border-m3-outline-variant/30">
                        {(['system', 'light', 'dark'] as const).map((mode) => (
                          <motion.button
                            key={mode}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => onSelectThemeMode(mode)}
                            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              themeMode === mode
                                ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                                : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                            }`}
                          >
                            {mode === 'system' && <Laptop className="w-3.5 h-3.5 shrink-0" />}
                            {mode === 'light' && <Sun className="w-3.5 h-3.5 shrink-0 text-amber-400" />}
                            {mode === 'dark' && <Moon className="w-3.5 h-3.5 shrink-0" />}
                            <span className="capitalize">{mode === 'system' ? 'Auto' : mode}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Colors Box */}
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-m3-primary/15 text-m3-primary flex items-center justify-center">
                            <Palette className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface">
                              Custom Colors
                            </h3>
                            <span className="text-[11px] text-m3-on-surface-variant block">
                              Material You Dynamic Palettes
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] font-semibold text-m3-primary px-2.5 py-0.5 rounded-full bg-m3-primary/10 border border-m3-primary/20 max-w-[140px] truncate">
                          {activePaletteId === 'dynamic_system' || !activePaletteId
                            ? 'Dynamic System'
                            : MATERIAL_PALETTES.find((p) => p.id === activePaletteId)?.name || 'Custom'}
                        </span>
                      </div>

                      {/* Consistent M3 Action Button for Sync System Accent */}
                      <motion.button
                        id="sync-system-accent-btn"
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={handleForceSync}
                        className={`w-full min-h-[44px] py-3 px-4 rounded-full flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs active:shadow-none focus:outline-hidden focus:ring-2 focus:ring-m3-primary/30 ${
                          activePaletteId === 'dynamic_system' || !activePaletteId
                            ? 'bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary'
                            : 'bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container border border-m3-outline-variant/40 shadow-2xs'
                        }`}
                        title="Sync with device wallpaper & system accent color"
                      >
                        <RefreshCw className="w-4 h-4 shrink-0" />
                        <span>Sync System Accent Now</span>
                        {(activePaletteId === 'dynamic_system' || !activePaletteId) && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-black/15 dark:bg-white/20 px-2 py-0.5 rounded-full ml-1">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Active</span>
                          </span>
                        )}
                      </motion.button>

                      {/* Dual-Tone Circular Chips matching Android 17 / Pixel Wallpaper & style */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
                        {MATERIAL_PALETTES.filter((p) => p.id !== 'dynamic_system').map((palette) => {
                          const isSelected = palette.id === activePaletteId;

                          return (
                            <motion.button
                              key={palette.id}
                              whileTap={{ scale: 0.94 }}
                              type="button"
                              onClick={() => onSelectPalette(palette.id)}
                              className="group flex flex-col items-center gap-1.5 focus:outline-hidden cursor-pointer"
                              title={`${palette.name} • ${palette.subtitle}`}
                            >
                              {/* Outer Ring on selected (Matches Pixel rounded square indicator) */}
                              <div
                                className={`relative w-13 h-13 rounded-2xl p-1 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'ring-2 ring-m3-primary bg-m3-primary/15 shadow-xs'
                                    : 'hover:bg-m3-surface-container-highest/60 bg-m3-surface-container/60'
                                }`}
                              >
                                {/* Dual-tone split circle */}
                                <div className="w-9 h-9 rounded-full overflow-hidden flex shadow-xs border border-white/10">
                                  {/* Left half: Dark Tone */}
                                  <div
                                    className="w-1/2 h-full"
                                    style={{ backgroundColor: palette.dualTone[0] }}
                                  />
                                  {/* Right half: Light Accent */}
                                  <div
                                    className="w-1/2 h-full"
                                    style={{ backgroundColor: palette.dualTone[1] }}
                                  />
                                </div>

                                {isSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="w-4 h-4 rounded-full bg-white/95 text-black flex items-center justify-center shadow-xs">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                  </div>
                                )}
                              </div>

                              <span
                                className={`text-[10px] text-center font-medium leading-tight line-clamp-2 max-w-[76px] ${
                                  isSelected ? 'text-m3-primary font-bold' : 'text-m3-on-surface-variant'
                                }`}
                              >
                                {palette.name}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live Component Preview */}
                    <div className="p-4 rounded-3xl bg-m3-surface-container-low border border-m3-outline-variant/40 space-y-2 shadow-2xs">
                      <span className="text-[10px] font-bold text-m3-on-surface-variant uppercase tracking-wider block">
                        Current Palette Preview
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3.5 py-1.5 rounded-full bg-m3-primary text-m3-on-primary text-xs font-medium shadow-2xs">
                          Primary Pill
                        </span>
                        <span className="px-3.5 py-1.5 rounded-full bg-m3-secondary-container text-m3-on-secondary-container text-xs font-medium">
                          Secondary Tonal
                        </span>
                        <span className="px-3.5 py-1.5 rounded-full bg-m3-surface-container-highest text-m3-on-surface text-xs font-medium border border-m3-outline-variant/50">
                          Outline
                        </span>
                      </div>
                    </div>

                    {/* Immersive Edge-to-Edge Mode */}
                    {onToggleImmersive && (
                      <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl p-4 sm:p-5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 pr-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                isImmersive
                                  ? 'bg-m3-primary text-m3-on-primary'
                                  : 'bg-m3-surface-container-highest text-m3-on-surface-variant'
                              }`}
                            >
                              {isImmersive ? (
                                <Minimize2 className="w-3.5 h-3.5" />
                              ) : (
                                <Maximize2 className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-m3-on-surface">Immersive View</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-m3-secondary-container text-m3-on-secondary-container font-semibold">
                                  {isImmersive ? 'Edge-to-Edge' : 'Standard'}
                                </span>
                              </div>
                              <p className="text-[11px] text-m3-on-surface-variant leading-tight mt-0.5">
                                Hides top status bar for true edge-to-edge experience
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={isImmersive}
                            onClick={onToggleImmersive}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                              isImmersive ? 'bg-m3-primary border-m3-primary' : 'bg-m3-surface-container-highest border-m3-outline/60'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                isImmersive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Haptic Feedback (Vibration API) */}
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 pr-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                              hapticsEnabled
                                ? 'bg-m3-primary text-m3-on-primary'
                                : 'bg-m3-surface-container-highest text-m3-on-surface-variant'
                            }`}
                          >
                            <Vibrate className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-m3-on-surface">Haptic Feedback</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                                  isHapticsSupported()
                                    ? hapticsEnabled
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                      : 'bg-m3-surface-container text-m3-on-surface-variant'
                                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                }`}
                              >
                                {isHapticsSupported()
                                  ? hapticsEnabled
                                    ? 'Tactile On'
                                    : 'Off'
                                  : 'Desktop / No Motor'}
                              </span>
                            </div>
                            <p className="text-[11px] text-m3-on-surface-variant leading-tight mt-0.5">
                              Subtle vibrations when scanning, deleting, or switching tabs
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={hapticsEnabled}
                          onClick={() => {
                            const next = !hapticsEnabled;
                            setHapticsEnabledState(next);
                            setHapticsEnabled(next);
                            if (next) {
                              hapticFeedback('success');
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                            hapticsEnabled ? 'bg-m3-primary border-m3-primary' : 'bg-m3-surface-container-highest border-m3-outline/60'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {hapticsEnabled && isHapticsSupported() && (
                        <div className="flex items-center gap-2 pt-1 border-t border-m3-outline-variant/30">
                          <span className="text-[10px] text-m3-on-surface-variant font-medium">Test Vibration:</span>
                          <button
                            type="button"
                            onClick={() => hapticFeedback('light')}
                            className="px-2.5 py-1 rounded-full bg-m3-surface-container text-m3-on-surface text-[10px] font-semibold hover:bg-m3-surface-container-highest transition-colors cursor-pointer border border-m3-outline-variant/40"
                          >
                            Tap
                          </button>
                          <button
                            type="button"
                            onClick={() => hapticFeedback('scan')}
                            className="px-2.5 py-1 rounded-full bg-m3-surface-container text-m3-on-surface text-[10px] font-semibold hover:bg-m3-surface-container-highest transition-colors cursor-pointer border border-m3-outline-variant/40"
                          >
                            Scan Shutter
                          </button>
                          <button
                            type="button"
                            onClick={() => hapticFeedback('success')}
                            className="px-2.5 py-1 rounded-full bg-m3-secondary-container text-m3-on-secondary-container text-[10px] font-semibold hover:opacity-90 transition-colors cursor-pointer"
                          >
                            Double Pulse
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* TAB 3: DATA & STORAGE */}
                {activeTab === 'data' && (
                  <motion.div
                    key="tab-data"
                    custom={direction}
                    variants={m3SharedAxisXVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    {/* Data Status Summary */}
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center">
                          <Database className="w-3.5 h-3.5 text-m3-primary" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface">
                            Indexed Local Database
                          </h3>
                          <span className="text-[11px] text-m3-on-surface-variant block">
                            Stored securely on this device (LocalStorage)
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-3 rounded-2xl bg-m3-surface-container border border-m3-outline-variant/30">
                          <span className="text-[10px] text-m3-on-surface-variant uppercase tracking-wider font-semibold block">
                            Receipts
                          </span>
                          <span className="text-lg font-bold text-m3-on-surface font-mono">
                            {receipts.length}
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-m3-surface-container border border-m3-outline-variant/30">
                          <span className="text-[10px] text-m3-on-surface-variant uppercase tracking-wider font-semibold block">
                            Items Indexed
                          </span>
                          <span className="text-lg font-bold text-m3-on-surface font-mono">
                            {receipts.reduce((acc, r) => acc + (r.items?.length || 0), 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Storage & Reset Behavior Notice */}
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl p-4 sm:p-5 space-y-2.5 shadow-2xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-m3-on-surface">
                        <Info className="w-4 h-4 text-m3-primary shrink-0" />
                        <span>
                          {getPlatformInfo().isIOS
                            ? 'iOS Storage & Safari Behavior'
                            : getPlatformInfo().isAndroid
                            ? 'Android Storage & WebAPK Behavior'
                            : 'Browser Storage & Reset Behavior'}
                        </span>
                      </div>
                      <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                        {getPlatformInfo().isIOS
                          ? 'On iOS & iPhone, web apps store local data within Safari WebKit storage. To wipe or backup data, use the controls below or manage Safari website data in iOS Settings.'
                          : getPlatformInfo().isAndroid
                          ? 'On Android, installed PWAs (WebAPKs) share storage with Google Chrome. Clearing data in App Info only resets wrapper metadata while Chrome retains site data.'
                          : 'Installed desktop and web apps retain their encrypted cache locally on your machine.'}
                      </p>
                      <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                        To completely wipe all receipts, offline cache, and preferences, use the <strong>Factory Reset</strong> button below.
                      </p>
                    </div>

                    {/* Reset / Demo Data Tools */}
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xs">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
                        Dataset Management
                      </h3>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onLoadDemo();
                          onShowSnackbar('Sample Costco Receipts loaded successfully!', 'Demo Loaded');
                        }}
                        className="w-full py-2.5 px-3 rounded-2xl bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant/30 text-m3-primary text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reload Sample Costco Receipts</span>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowClearConfirm(true)}
                        className="w-full py-2.5 px-3 rounded-2xl bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Stored Receipts Only ({receipts.length})</span>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowFactoryResetConfirm(true)}
                        className="w-full py-2.5 px-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all border border-rose-500/25"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Wipe All Storage &amp; Factory Reset</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* TAB 4: ABOUT & APP */}
                {activeTab === 'about' && (
                  <motion.div
                    key="tab-about"
                    custom={direction}
                    variants={m3SharedAxisXVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    {/* App Identity */}
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl p-5 text-center space-y-2.5 shadow-2xs">
                      <img
                        src="/icon-192.png"
                        alt="Reco App Icon"
                        className="w-16 h-16 rounded-full mx-auto shadow-md"
                      />
                      <p className="text-xs text-m3-on-surface-variant font-medium pt-0.5">
                        Smart Costco Receipt & Spending Tracker
                      </p>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-m3-secondary-container text-m3-on-secondary-container text-[10px] font-mono font-bold">
                        v2.4 • {getPlatformInfo().isIOS ? 'iOS & Apple Ecosystem Ready' : 'Material 3 Expressive'}
                      </span>
                    </div>

                    {/* Designed in Canada */}
                    <div className="p-4 bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl space-y-1.5 shadow-2xs text-center">
                      <p className="text-xs text-m3-on-surface-variant font-medium flex items-center justify-center gap-1.5">
                        <span>Designed in</span>
                        <CanadaFlag className="w-5 h-3.5 inline-block rounded-xs overflow-hidden shadow-2xs shrink-0 align-middle border border-black/10" />
                        <span>by Aniket Vasishth</span>
                      </p>
                      <p className="text-[11px] text-m3-on-surface-variant/60 leading-relaxed">
                        Engineered with privacy-first principles, offline-first reliability, and clean Material 3 design.
                      </p>
                    </div>

                    {/* Install PWA */}
                    {onOpenInstall && !isInstalled && (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={onOpenInstall}
                        className="w-full py-3 px-4 rounded-2xl bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Install App to Device</span>
                      </motion.button>
                    )}

                    {/* Send Feedback */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onOpenFeedback();
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant/30 text-m3-on-surface text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <MessageSquarePlus className="w-4 h-4 text-m3-primary" />
                      <span>Send Developer Feedback / Bug Report</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

              {/* Bottom Quick Indicator */}
              <div className="p-3 border-t border-m3-outline-variant/30 bg-m3-surface-container-low flex items-center text-[11px] text-m3-on-surface-variant shrink-0">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>On-Device Storage</span>
                </span>
              </div>
            </motion.div>

          {/* Confirm Clear All Data Modal (Rendered outside draggable sheet at z-[100]) */}
          {showClearConfirm && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                setShowClearConfirm(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-m3-surface-container rounded-3xl p-6 max-w-sm w-full border border-m3-outline-variant/40 shadow-2xl space-y-4 text-center relative z-10"
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-m3-on-surface">Clear Stored Receipts?</h3>
                  <p className="text-xs text-m3-on-surface-variant">
                    This will remove all {receipts.length} stored receipts from your local database. Your theme settings and configurations will remain intact.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowClearConfirm(false);
                    }}
                    className="py-2.5 rounded-xl bg-m3-surface-container-high text-m3-on-surface text-xs font-semibold cursor-pointer active:scale-98 transition-transform"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowClearConfirm(false);
                      onClearAllReceipts();
                      onShowSnackbar('All stored receipts cleared.', 'Database Reset');
                    }}
                    className="py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-xs active:scale-98 transition-transform"
                  >
                    Yes, Clear Receipts
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Confirm Full Factory Reset & Wipe Storage Modal */}
          {showFactoryResetConfirm && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                setShowFactoryResetConfirm(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-m3-surface-container rounded-3xl p-6 max-w-sm w-full border border-rose-500/30 shadow-2xl space-y-4 text-center relative z-10"
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-m3-on-surface">Factory Reset All Storage?</h3>
                  <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                    This will permanently wipe all local database records, offline cache storage, service worker registrations, and custom settings, resetting the application to a 100% fresh installation state.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFactoryResetConfirm(false);
                    }}
                    className="py-2.5 rounded-xl bg-m3-surface-container-high text-m3-on-surface text-xs font-semibold cursor-pointer active:scale-98 transition-transform"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFactoryResetConfirm(false);
                      if (onFactoryReset) {
                        onFactoryReset();
                      } else {
                        onClearAllReceipts();
                      }
                    }}
                    className="py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-xs active:scale-98 transition-transform"
                  >
                    Wipe &amp; Reset
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Confirm Drive Save Modal (Rendered outside draggable sheet at z-[100]) */}
          {pendingDriveSave && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                setPendingDriveSave(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-m3-surface-container rounded-3xl p-6 max-w-sm w-full border border-m3-outline-variant/40 shadow-2xl space-y-4 text-center relative z-10"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/15 text-blue-600 flex items-center justify-center mx-auto">
                  <Cloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-m3-on-surface">Save Backup to Google Drive?</h3>
                  <p className="text-xs text-m3-on-surface-variant">
                    This will create an encrypted JSON backup file of your {receipts.length} receipts inside your personal Google Drive account.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDriveSave(false);
                    }}
                    className="py-2.5 rounded-xl bg-m3-surface-container-high text-m3-on-surface text-xs font-semibold cursor-pointer active:scale-98 transition-transform"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExecuteDriveSave();
                    }}
                    className="py-2.5 rounded-xl bg-m3-primary text-m3-on-primary text-xs font-bold hover:bg-m3-primary/90 cursor-pointer shadow-xs active:scale-98 transition-transform"
                  >
                    Confirm & Save
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Air-Gapped Drive Notification & Switch Prompt Modal (Rendered outside draggable sheet at z-[100]) */}
          {showAirGappedDrivePrompt && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                setShowAirGappedDrivePrompt(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-m3-surface-container rounded-3xl p-6 max-w-sm w-full border border-m3-outline-variant/40 shadow-2xl space-y-4 text-center relative z-10"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <WifiOff className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-m3-on-surface">Change Engine to Connect Drive</h3>
                  <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                    You are currently in <strong>Air-Gapped / Strict On-Device</strong> mode, which blocks all outbound cloud network requests.
                  </p>
                  <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                    Google Drive requires network connectivity. Please switch your Engine to <strong>On-Device with Cloud Fallback</strong> before connecting.
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAiMode('on-device-fallback');
                      setShowAirGappedDrivePrompt(false);
                      handleGoogleSignIn();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-m3-primary text-m3-on-primary text-xs font-bold hover:bg-m3-primary/90 cursor-pointer shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-transform"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Switch Engine to Cloud Fallback</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAirGappedDrivePrompt(false);
                      setActiveTab('ai');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface text-xs font-semibold cursor-pointer active:scale-98 transition-transform"
                  >
                    Go to Engine Settings
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAirGappedDrivePrompt(false);
                    }}
                    className="w-full py-1.5 text-xs text-m3-on-surface-variant hover:text-m3-on-surface cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
