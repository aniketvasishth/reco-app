import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Camera,
  Upload,
  Save,
  X,
  ChevronRight,
  ShieldCheck,
  Tag,
  Receipt as ReceiptIcon,
  Sparkles,
  AlertCircle,
  FileText,
  Settings,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  DollarSign,
  PieChart,
  HardDrive,
  Check,
  Copy,
  ExternalLink,
  Store,
  Globe,
  CornerDownRight,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CostcoReceipt, CostcoItem } from './types';
import { Header } from './components/Header';
import { ItemCard } from './components/ItemCard';
import { SearchPriceTrendBanner } from './components/SearchPriceTrendBanner';
import { UploadModal } from './components/UploadModal';
import { ReceiptDetailModal } from './components/ReceiptDetailModal';
import { SummaryDrawer } from './components/SummaryDrawer';
import { SettingsDrawer } from './components/SettingsDrawer';
import { FeedbackModal } from './components/FeedbackModal';
import { SaveBackupModal } from './components/SaveBackupModal';
import { HowToModal } from './components/HowToModal';
import { FirstLaunchSyncModal } from './components/FirstLaunchSyncModal';
import { FirstLaunchCapabilitiesModal } from './components/FirstLaunchCapabilitiesModal';
import { hasCompletedFirstLaunchCapabilitiesCheck } from './services/onDeviceAiService';
import { Snackbar } from './components/Snackbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ReceiptCameraScanner } from './components/ReceiptCameraScanner';
import {
  useIsDesktop,
  usePlatformInfo,
  getViewModePreference,
  setViewModePreference,
  ViewModePreference,
} from './utils/platform';
import {
  PALETTE_STORAGE_KEY,
  DEFAULT_PALETTE_ID,
  getActivePalette,
  applyMaterialTokens,
  setupSystemAccentObserver,
} from './utils/themePalettes';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  parseCostcoCsv,
  parseCostcoJson,
  enrichCostcoItemOnWeb,
  normalizeCostcoReceipts,
  parseDateToMs,
} from './utils/receiptParsers';
import { deduplicateReceiptList, mergeAndDeduplicateReceipts } from './utils/receiptDeduplication';
import {
  calculatePriceTrend,
  getPurchasesForItem,
  MIN_PURCHASES_FOR_TREND,
  PriceTrendSummary,
} from './utils/priceTrend';
import { SAMPLE_COSTCO_RECEIPTS, isSampleReceipt } from './utils/sampleData';
import { scanReceiptWithAiOrFallback, scanMultiSectionReceiptWithAiOrFallback } from './utils/receiptScanner';
import { isPdfFile } from './utils/pdfReceiptHelper';
import { useImmersiveMode } from './utils/immersiveMode';
import { initAuth } from './services/googleDriveService';

const STORAGE_KEY = 'costco_receipt_searcher_data_v1';
const THEME_KEY = 'costco_receipt_theme';

export type ThemeMode = 'system' | 'light' | 'dark';

export default function App() {
  // Theme state: Default is Material 3 System Theme Auto Adaptation.
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        return saved;
      }
      return 'system';
    } catch {
      return 'system';
    }
  });

  // Track system-level color scheme preference
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Compute effective dark mode based on theme mode and system preference
  const isDarkMode = themeMode === 'system' ? systemPrefersDark : themeMode === 'dark';

  // Material You Dynamic Wallpaper Palette state (defaulting to user's active Burgundy & Rose wallpaper)
  const [activePaletteId, setActivePaletteId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(PALETTE_STORAGE_KEY);
      if (saved) return saved;
    } catch {}
    return DEFAULT_PALETTE_ID;
  });

  const handleToggleTheme = () => {
    // Cycle between: System Auto -> Dark -> Light -> System Auto
    setThemeMode((prev) => {
      let next: ThemeMode;
      if (prev === 'system') {
        next = isDarkMode ? 'light' : 'dark';
      } else if (prev === 'dark') {
        next = 'light';
      } else {
        next = 'system';
      }
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {}
      return next;
    });
  };

  const handleSelectThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {}
  };

  const handleSelectPalette = (paletteId: string) => {
    setActivePaletteId(paletteId);
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, paletteId);
    } catch {}
    const palette = getActivePalette(paletteId);
    applyMaterialTokens(palette, isDarkMode, themeMode);
  };

  // Toggle theme class on <html> & sync theme assets with Material 3 surface colors
  useEffect(() => {
    const palette = getActivePalette(activePaletteId);
    applyMaterialTokens(palette, isDarkMode, themeMode);

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';

    const appleIconEl = document.getElementById('apple-touch-icon');
    if (appleIconEl) {
      appleIconEl.setAttribute('href', isDarkMode ? '/icons/icon-dark-180.png' : '/icons/icon-light-180.png');
    }
  }, [isDarkMode, activePaletteId, themeMode]);

  // Live Android 17 / System Accent auto-sync observer
  useEffect(() => {
    if (activePaletteId === 'dynamic_system' || !activePaletteId) {
      const cleanup = setupSystemAccentObserver(() => {
        const palette = getActivePalette('dynamic_system');
        applyMaterialTokens(palette, isDarkMode, themeMode);
      });
      return cleanup;
    }
  }, [activePaletteId, isDarkMode, themeMode]);

  const [receipts, setReceipts] = useState<CostcoReceipt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // If the user explicitly loaded demo data in this active session, honor it
          const userExplicitlyLoadedDemo =
            sessionStorage.getItem('reco_user_explicitly_loaded_demo') === 'true';

          // Ensure NO demo data is loaded on first launch or by default.
          // Clean out any sample receipts so users start with 0 data unless they choose to load demo.
          const cleaned = parsed.filter((r) => {
            if (userExplicitlyLoadedDemo) return true;
            return !isSampleReceipt(r);
          });

          const deduplicated = deduplicateReceiptList(cleaned);
          const normalized = normalizeCostcoReceipts(deduplicated);

          // If duplicates existed in stored data, save the cleaned version immediately
          if (deduplicated.length !== cleaned.length) {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
            } catch {}
          }

          return normalized;
        }
      }
    } catch (e) {
      console.warn('Failed to load receipts from localStorage:', e);
    }
    // New device, incognito window, or first run: always start completely clean!
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'Warehouse' | 'Online'>('all');
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [scannerInitialMode, setScannerInitialMode] = useState<'standard' | 'long'>('standard');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'backup' | 'ai' | 'compatibility' | 'theme' | 'data' | 'about'>('backup');
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [isSaveBackupOpen, setIsSaveBackupOpen] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [howToInitialTab, setHowToInitialTab] = useState<'getting_started' | 'gemini_nano' | 'extension' | 'drive_sync'>('getting_started');
  const [isFirstLaunchSyncOpen, setIsFirstLaunchSyncOpen] = useState(false);
  const [isFirstLaunchCapabilitiesOpen, setIsFirstLaunchCapabilitiesOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackInitialError, setFeedbackInitialError] = useState<string | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    title?: string;
    type?: 'success' | 'error' | 'info';
  } | null>(null);
  const [enrichingItemIds, setEnrichingItemIds] = useState<Record<string, boolean>>({});

  // Responsive Desktop Platform & Viewport Detection
  const isDesktop = useIsDesktop();
  const platform = usePlatformInfo();
  const [viewModePref, setViewModePref] = useState<ViewModePreference>(() => getViewModePreference());
  const [desktopResultLayout, setDesktopResultLayout] = useState<'grid' | 'table'>('grid');
  const [desktopSortBy, setDesktopSortBy] = useState<'date-desc' | 'date-asc' | 'price-desc' | 'price-asc' | 'name'>('date-desc');
  const [tableCopiedId, setTableCopiedId] = useState<string | null>(null);

  const handleToggleViewMode = () => {
    const next: ViewModePreference = isDesktop ? 'mobile' : 'desktop';
    setViewModePreference(next);
    setViewModePref(next);
    window.dispatchEvent(new Event('resize'));
    showSnackbar(
      next === 'desktop'
        ? 'Switched to Desktop Layout (Full Width)'
        : 'Switched to Mobile Layout',
      'Layout View'
    );
  };

  // Optional Immersive Mode (Hides status bar and enters edge-to-edge view)
  const { isImmersive, toggleImmersive } = useImmersiveMode();

  const handleToggleImmersive = async () => {
    const result = await toggleImmersive();
    if (result.enabled) {
      showSnackbar(
        'Immersive Mode enabled • Status bar hidden (Swipe down from top edge to reveal)',
        'Display'
      );
    } else {
      showSnackbar('Immersive Mode disabled • Status bar restored', 'Display');
    }
  };

  const showSnackbar = (
    message: string | null,
    title?: string,
    type?: 'success' | 'error' | 'info'
  ) => {
    if (!message) {
      setSnackbar(null);
    } else {
      setSnackbar({ message, title, type });
    }
  };

  // PWA Installation Hook (Prompts on phone similar to Bet365)
  const {
    isInstallable,
    hasDeferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    showAutoPrompt,
    triggerInstall,
    dismissPrompt,
    markAsAddedToHomeScreen,
    openPromptManually,
  } = usePWAInstall();

  const handleOpenInstall = async () => {
    if (hasDeferredPrompt) {
      const outcome = await triggerInstall();
      if (outcome === 'accepted') {
        showSnackbar('Reco was installed successfully!', 'PWA Installed');
        return;
      }
    }
    setIsInstallGuideOpen(true);
  };

  // Direct file inputs
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Android PWA shortcuts launched from Homescreen / App Drawer
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      if (action === 'scan') {
        // Small delay to allow interface rendering
        const timer = setTimeout(() => {
          cameraInputRef.current?.click();
        }, 300);
        return () => clearTimeout(timer);
      } else if (action === 'search') {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore if URL parsing is unsupported
    }
  }, []);

  // Swipe gesture handling: swipe right on main dashboard opens summary (only when no modal is open)
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  const isAnyOverlayOpen =
    isSettingsOpen ||
    isSummaryOpen ||
    !!selectedReceiptId ||
    isCameraScannerOpen ||
    isUploadModalOpen ||
    isFeedbackModalOpen ||
    isHowToOpen ||
    isInstallGuideOpen ||
    isSaveBackupOpen ||
    isFirstLaunchSyncOpen ||
    isFirstLaunchCapabilitiesOpen;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnyOverlayOpen) {
      touchStartXRef.current = 0;
      touchStartYRef.current = 0;
      return;
    }
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isAnyOverlayOpen || touchStartXRef.current === 0) {
      touchStartXRef.current = 0;
      touchStartYRef.current = 0;
      return;
    }
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    if (deltaX > 75 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      setIsSummaryOpen(true);
    }
    touchStartXRef.current = 0;
    touchStartYRef.current = 0;
  };

  // Initialize Google Auth state listener on app load
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Check if first-launch device capabilities check has been performed
  useEffect(() => {
    if (!hasCompletedFirstLaunchCapabilitiesCheck()) {
      const timer = setTimeout(() => {
        setIsFirstLaunchCapabilitiesOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Persist receipts locally
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
    } catch (e) {
      console.warn('Failed to persist receipts to localStorage:', e);
    }
  }, [receipts]);

  // Flatten all items and sort reverse chronologically by purchase date (newest first)
  const allItems: CostcoItem[] = useMemo(() => {
    const items = receipts.flatMap((r) => r.items);
    return items.sort((a, b) => {
      const timeA = parseDateToMs(a.orderDate);
      const timeB = parseDateToMs(b.orderDate);
      if (timeB !== timeA) return timeB - timeA;
      return (a.productName || a.rawName).localeCompare(b.productName || b.rawName);
    });
  }, [receipts]);

  const hasSearchQuery = searchQuery.trim().length > 0;

  // Filter items based on user search and sort reverse chronologically by date of purchase
  const filteredItems = useMemo(() => {
    if (!hasSearchQuery) return [];

    const q = searchQuery.trim().toLowerCase();
    const isGiftCardSearch = /gift\s*card|giftcards?|egift|vouchers?|\bgc\b/i.test(q);
    const isReturnSearch = /return|refund/i.test(q);

    const matches = allItems.filter((item) => {
      if (selectedChannel !== 'all' && item.orderType !== selectedChannel) {
        return false;
      }

      if (
        item.itemId.toLowerCase().includes(q) ||
        (item.productName || '').toLowerCase().includes(q) ||
        item.rawName.toLowerCase().includes(q) ||
        (item.brand || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.packageDetails || '').toLowerCase().includes(q) ||
        (item.paymentCard || '').toLowerCase().includes(q) ||
        item.warehouseLocation.toLowerCase().includes(q) ||
        item.orderDate.includes(q)
      ) {
        return true;
      }

      // Gift card synonym expansion: DoorDash, Air Canada, SkipTheDishes, Uber, Cineplex, Starbucks, etc.
      if (isGiftCardSearch) {
        const itemText = `${item.productName || ''} ${item.rawName || ''} ${item.brand || ''} ${item.category || ''} ${item.description || ''}`.toLowerCase();
        if (
          itemText.includes('gift') ||
          itemText.includes('voucher') ||
          (item.category || '').toLowerCase().includes('gift') ||
          /doordash|door\s*dash|air\s*canada|aircanada|skipthedishes|skip\s*the\s*dishes|uber|cineplex|starbucks|playstation|nintendo|xbox/i.test(itemText)
        ) {
          return true;
        }
      }

      // Returns search
      if (isReturnSearch && (
        item.totalPrice < 0 ||
        item.unitPrice < 0 ||
        /return|refund|retour/i.test(item.rawName || '') ||
        /return|refund/i.test(item.productName || '') ||
        (Boolean(item.isReturn) && item.totalPrice <= 0)
      )) {
        return true;
      }

      return false;
    });

    // Apply sorting (default: newest first, or user-selected desktop sort)
    return matches.sort((a, b) => {
      if (desktopSortBy === 'price-desc') {
        return b.totalPrice - a.totalPrice;
      }
      if (desktopSortBy === 'price-asc') {
        return a.totalPrice - b.totalPrice;
      }
      if (desktopSortBy === 'name') {
        return (a.productName || a.rawName).localeCompare(b.productName || b.rawName);
      }
      if (desktopSortBy === 'date-asc') {
        const timeA = parseDateToMs(a.orderDate);
        const timeB = parseDateToMs(b.orderDate);
        return timeA - timeB;
      }
      // default: newest date first
      const timeA = parseDateToMs(a.orderDate);
      const timeB = parseDateToMs(b.orderDate);
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return (a.productName || a.rawName).localeCompare(b.productName || b.rawName);
    });
  }, [allItems, searchQuery, selectedChannel, hasSearchQuery, desktopSortBy]);

  // Computed metrics for desktop dashboard
  const totalSpend = useMemo(() => {
    return receipts.reduce((sum, r) => sum + (r.total || 0), 0);
  }, [receipts]);

  const totalExecutiveReward = useMemo(() => {
    return totalSpend * 0.02;
  }, [totalSpend]);

  const totalInstantSavings = useMemo(() => {
    return allItems.reduce((sum, item) => sum + (item.discount || 0), 0);
  }, [allItems]);

  const warehouseCount = useMemo(() => {
    return receipts.filter((r) => r.orderType === 'Warehouse').length;
  }, [receipts]);

  const onlineCount = useMemo(() => {
    return receipts.filter((r) => r.orderType === 'Online').length;
  }, [receipts]);

  // Global desktop keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('');
        }
        return;
      }

      // Ctrl+K or Cmd+K or / to focus search
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (!isInput && e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // S key to scan receipt (when not typing)
      if (!isInput && (e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey) {
        setScannerInitialMode('standard');
        setIsCameraScannerOpen(true);
        return;
      }

      // U key to upload (when not typing)
      if (!isInput && (e.key === 'u' || e.key === 'U') && !e.ctrlKey && !e.metaKey) {
        setIsUploadModalOpen(true);
        return;
      }

      // M or R key to open spending summary (when not typing)
      if (!isInput && (e.key === 'm' || e.key === 'M' || e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
        setIsSummaryOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  // Calculate price trends for distinct matching items in active search results that have > 2 purchases (>= 3)
  const matchingTrendItems: PriceTrendSummary[] = useMemo(() => {
    if (!hasSearchQuery || filteredItems.length === 0) return [];
    const uniqueItemIds: string[] = Array.from(
      new Set(filteredItems.map((it) => it.itemId).filter((id): id is string => Boolean(id)))
    );
    const trends: PriceTrendSummary[] = [];
    for (const id of uniqueItemIds) {
      const trend = calculatePriceTrend(
        getPurchasesForItem(id, allItems),
        MIN_PURCHASES_FOR_TREND
      );
      if (trend && trend.isEligible) {
        trends.push(trend);
      }
    }
    return trends;
  }, [hasSearchQuery, filteredItems, allItems]);

  // Callback when receipts are added
  const handleReceiptsAdded = (newReceipts: CostcoReceipt[], message?: string, customTitle?: string) => {
    if (!newReceipts || newReceipts.length === 0) return;

    const normalizedNew = normalizeCostcoReceipts(newReceipts);
    const totalNewItems = normalizedNew.reduce((s, r) => s + r.items.length, 0);

    // Only proceed and show confirmation if valid receipts/items were extracted and inserted
    if (normalizedNew.length === 0 || totalNewItems === 0) {
      return;
    }

    let replacedCount = 0;
    let addedCount = 0;

    setReceipts((prev) => {
      const result = mergeAndDeduplicateReceipts(prev, normalizedNew);
      replacedCount = result.replacedCount;
      addedCount = result.addedCount;
      const normalized = normalizeCostcoReceipts(result.merged);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      return normalized;
    });

    const isUpdated = replacedCount > 0 && addedCount === 0;
    const isDemo = Boolean(
      (message && message.toLowerCase().includes('demo')) ||
      (customTitle && customTitle.toLowerCase().includes('demo'))
    );
    let msg: string;
    if (message) {
      msg = message;
    } else if (isUpdated) {
      msg = `Duplicate receipt detected. Replaced and updated ${replacedCount === 1 ? 'existing receipt' : `${replacedCount} existing receipts`} with latest data (no duplicate results).`;
    } else if (replacedCount > 0 && addedCount > 0) {
      msg = `Processed scan: Added ${addedCount} new and replaced ${replacedCount} existing duplicate receipt${replacedCount === 1 ? '' : 's'}.`;
    } else {
      msg = `Scan successful! Added ${totalNewItems} item${totalNewItems === 1 ? '' : 's'} to your search index.`;
    }

    // Explicit success snackbar with green indicator, triggered strictly on successful data insertion
    showSnackbar(
      msg,
      customTitle || (isDemo ? 'Demo purchases loaded successfully' : isUpdated ? 'Receipt Updated' : 'Receipt Scanned Successfully'),
      'success'
    );

    // If a single receipt was uploaded or scanned, open it automatically so user immediately sees all parsed items
    if (normalizedNew.length === 1 && normalizedNew[0].items.length > 0) {
      setSelectedReceiptId(normalizedNew[0].id);
    }
  };

  // User explicitly opts to load demo purchases
  const handleLoadDemoData = () => {
    try {
      sessionStorage.setItem('reco_user_explicitly_loaded_demo', 'true');
    } catch {}
    handleReceiptsAdded(
      SAMPLE_COSTCO_RECEIPTS,
      `Loaded ${SAMPLE_COSTCO_RECEIPTS.reduce((s, r) => s + r.items.length, 0)} demo items. You can clear them anytime from Purchase Summary.`,
      'Demo purchases loaded successfully'
    );
  };

  // Clear all receipts from device
  const handleClearAllReceipts = () => {
    setReceipts([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('reco_user_loaded_demo');
      localStorage.removeItem('receiws_user_loaded_demo');
      sessionStorage.removeItem('reco_user_explicitly_loaded_demo');
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
    showSnackbar('All receipts cleared from this device', 'Cleanup Successful');
  };

  // Complete factory reset: purge LocalStorage, SessionStorage, CacheStorage, and Service Worker
  const handleFactoryReset = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      if ('indexedDB' in window && typeof indexedDB.databases === 'function') {
        try {
          const databases = await indexedDB.databases();
          databases.forEach((db) => {
            if (db.name) indexedDB.deleteDatabase(db.name);
          });
        } catch {}
      }
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Factory reset error:', e);
    }
    setReceipts([]);
    window.location.href = window.location.origin + window.location.pathname;
  };

  // Delete individual receipt from device
  const handleDeleteReceipt = (receiptId: string) => {
    const targetReceipt = receipts.find((r) => r.id === receiptId);
    if (!targetReceipt) return;

    setReceipts((prev) => {
      const updated = prev.filter((r) => r.id !== receiptId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to update localStorage after receipt deletion:', e);
      }
      return updated;
    });

    if (selectedReceiptId === receiptId) {
      setSelectedReceiptId(null);
    }

    showSnackbar(
      `Receipt #${targetReceipt.orderNumber} (${targetReceipt.items.length} item${targetReceipt.items.length === 1 ? '' : 's'}) deleted`,
      'Receipt Removed',
      'info'
    );
  };

  // Direct camera capture on homescreen
  const handleDirectCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showSnackbar('Scanning with Gemini AI (blur & perspective correction)...', 'Scanning Receipt', 'info');
      const { receipt, engine } = await scanReceiptWithAiOrFallback(file);
      handleReceiptsAdded(
        [receipt],
        engine === 'gemini'
          ? `Gemini AI parsed ${receipt.items.length} items from ${receipt.warehouseLocation} (blur correction applied)`
          : `Scanned receipt: Added ${receipt.items.length} items from ${receipt.warehouseLocation}`
      );
    } catch (err: any) {
      const msg = err.message || 'Could not parse image';
      setFeedbackInitialError(`Scan failure: ${msg}`);
      if (
        msg.includes('Costco') ||
        msg.includes('costco') ||
        msg.includes('Wholesale logo') ||
        msg.includes('Receipt rejected') ||
        msg.includes('FreshCo') ||
        msg.includes('freshco') ||
        msg.includes('non-Costco')
      ) {
        showSnackbar(msg, 'Costco Receipts Only', 'error');
      } else {
        showSnackbar(`Error: ${msg}`, 'Scan Failed', 'error');
      }
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Direct file upload on homescreen (JSON, CSV, Image, or Multi-Section Long Receipt)
  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);

    // Check for multi-image long receipt selection
    if (fileList.length > 1 && fileList.every((f) => f.type.startsWith('image/'))) {
      const imageFiles = fileList;
      try {
        showSnackbar(`Stitching ${imageFiles.length} sections of long receipt with Gemini AI...`, 'Long Receipt Scan', 'info');
        const { receipt, engine } = await scanMultiSectionReceiptWithAiOrFallback(imageFiles);
        handleReceiptsAdded(
          [receipt],
          engine === 'gemini'
            ? `Gemini AI stitched ${receipt.items.length} items across ${imageFiles.length} sections from ${receipt.warehouseLocation}`
            : `Stitched long receipt: Added ${receipt.items.length} items from ${receipt.warehouseLocation}`
        );
      } catch (err: any) {
        const msg = err.message || 'Could not stitch long receipt sections';
        setFeedbackInitialError(`Long receipt scan failure: ${msg}`);
        if (
          msg.includes('Costco') ||
          msg.includes('costco') ||
          msg.includes('Wholesale logo') ||
          msg.includes('Receipt rejected') ||
          msg.includes('FreshCo') ||
          msg.includes('freshco') ||
          msg.includes('non-Costco')
        ) {
          showSnackbar(msg, 'Costco Receipts Only', 'error');
        } else {
          showSnackbar(`Error: ${msg}`, 'Scan Failed', 'error');
        }
      } finally {
        if (e.target) e.target.value = '';
      }
      return;
    }

    const file = files[0];

    try {
      if (file.name.endsWith('.json') || file.type === 'application/json') {
        const text = await file.text();
        const parsed = parseCostcoJson(text, file.name);
        for (const r of parsed) {
          for (const it of r.items) {
            const enriched = await enrichCostcoItemOnWeb(it.itemId, it.rawName);
            it.productName = enriched.productName || it.rawName;
            it.brand = enriched.brand || it.brand;
            it.category = enriched.category || it.category;
            it.description = enriched.description || it.description;
            it.webSourceUrl = enriched.webSourceUrl || it.webSourceUrl;
            it.isEnriched = true;
          }
        }
        const total = parsed.reduce((s, r) => s + r.items.length, 0);
        handleReceiptsAdded(parsed, `Imported ${total} items from JSON export`);
      } else if (file.name.endsWith('.csv') || file.type.includes('csv')) {
        const text = await file.text();
        const parsed = parseCostcoCsv(text, file.name);
        for (const r of parsed) {
          for (const it of r.items) {
            const enriched = await enrichCostcoItemOnWeb(it.itemId, it.rawName);
            it.productName = enriched.productName || it.rawName;
            it.brand = enriched.brand || it.brand;
            it.category = enriched.category || it.category;
            it.description = enriched.description || it.description;
            it.webSourceUrl = enriched.webSourceUrl || it.webSourceUrl;
            it.isEnriched = true;
          }
        }
        const total = parsed.reduce((s, r) => s + r.items.length, 0);
        handleReceiptsAdded(parsed, `Imported ${total} items from CSV export`);
      } else if (file.type.startsWith('image/') || isPdfFile(file)) {
        showSnackbar(
          isPdfFile(file)
            ? 'Parsing digital Costco PDF invoice...'
            : 'Scanning with Gemini AI (blur & perspective correction)...',
          'Scanning Receipt',
          'info'
        );
        const { receipt, engine } = await scanReceiptWithAiOrFallback(file);
        handleReceiptsAdded(
          [receipt],
          engine === 'gemini'
            ? `Gemini AI parsed ${receipt.items.length} items from ${receipt.warehouseLocation}`
            : `Scanned receipt: Added ${receipt.items.length} items from ${receipt.warehouseLocation}`
        );
      } else {
        showSnackbar('Please select a valid PDF, JSON, CSV, or receipt photo.', 'Invalid File', 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to process file';
      setFeedbackInitialError(`File parse failure (${file.name}): ${msg}`);
      if (
        msg.includes('Costco') ||
        msg.includes('costco') ||
        msg.includes('Wholesale logo') ||
        msg.includes('Receipt rejected') ||
        msg.includes('FreshCo') ||
        msg.includes('freshco') ||
        msg.includes('non-Costco')
      ) {
        showSnackbar(msg, 'Costco Receipts Only', 'error');
      } else {
        showSnackbar(`Error: ${msg}`, 'Scan Failed', 'error');
      }
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleReEnrichItem = async (itemId: string, rawName: string) => {
    setEnrichingItemIds((prev) => ({ ...prev, [itemId]: true }));
    try {
      const enriched = await enrichCostcoItemOnWeb(itemId, rawName);
      setReceipts((prevReceipts) =>
        prevReceipts.map((r) => ({
          ...r,
          items: r.items.map((it) => {
            if (it.itemId === itemId) {
              return {
                ...it,
                productName: enriched.productName || it.rawName,
                brand: enriched.brand || it.brand,
                category: enriched.category || it.category,
                description: enriched.description || it.description,
                packageDetails: enriched.packageDetails || it.packageDetails,
                webSourceUrl: enriched.webSourceUrl || it.webSourceUrl,
                isEnriched: true,
              };
            }
            return it;
          }),
        }))
      );
    } catch (e) {
      console.warn(`Failed to re-enrich item ${itemId}:`, e);
    } finally {
      setEnrichingItemIds((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const activeReceipt = receipts.find((r) => r.id === selectedReceiptId) || null;

  return (
    <div
      id="app-root"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen flex flex-col bg-m3-background text-m3-on-background transition-colors selection:bg-m3-primary selection:text-m3-on-primary pb-28 no-scrollbar"
    >
      {/* Hidden file inputs for direct camera and file upload */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleDirectCameraCapture}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf,.json,.csv,image/*,application/json,text/csv"
        multiple
        className="hidden"
        onChange={handleDirectFileUpload}
      />

      {/* Header */}
      <Header
        receipts={receipts}
        items={allItems}
        isInstalled={isInstalled}
        isDesktop={isDesktop}
        hasSearchQuery={hasSearchQuery}
        onResetSearch={() => setSearchQuery('')}
        onOpenScan={() => {
          setScannerInitialMode('standard');
          setIsCameraScannerOpen(true);
        }}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenSettings={() => {
          setSettingsInitialTab('backup');
          setIsSettingsOpen(true);
        }}
        onOpenSummary={() => setIsSummaryOpen(true)}
        onOpenFeedback={() => {
          setFeedbackInitialError(null);
          setIsFeedbackModalOpen(true);
        }}
        onOpenHowTo={() => setIsHowToOpen(true)}
        onOpenInstall={handleOpenInstall}
        onOpenPrivacySettings={() => {
          setSettingsInitialTab('ai');
          setIsSettingsOpen(true);
        }}
        onToggleViewMode={handleToggleViewMode}
        currentViewMode={viewModePref}
      />

      {/* Main Content Area: Responsive Layout (Full-width stretched on Desktop, Centered on Mobile) */}
      {!hasSearchQuery ? (
        /* INITIAL STATE */
        isDesktop ? (
          /* DESKTOP INITIAL DASHBOARD: Full-Width Stretched Hero, Action Grid, Stats & Recent Purchases */
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 flex flex-col space-y-10">
            {/* Desktop Hero & Search Bar */}
            <div className="flex flex-col items-center text-center space-y-5 max-w-4xl lg:max-w-5xl mx-auto w-full">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-m3-on-background">
                  Costco Wholesale Receipt Search
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-m3-on-surface-variant mt-2 max-w-2xl mx-auto leading-relaxed">
                  Search warehouse purchases, track unit prices & verify receipts with 100% on-device privacy
                </p>
              </div>

              {/* Large Command-Center Search Bar */}
              <div className="w-full relative">
                <Search className="w-6 h-6 text-m3-primary absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by item # (e.g. 56366), product name, brand, date, payment card..."
                  className="w-full pl-14 sm:pl-16 pr-36 py-4.5 sm:py-5 bg-m3-surface-container-high hover:bg-m3-surface-container-highest focus:bg-m3-surface-container-highest border border-m3-outline-variant/50 focus:border-m3-primary focus:ring-4 focus:ring-m3-primary/20 rounded-2xl sm:rounded-3xl text-base sm:text-lg text-m3-on-surface placeholder:text-m3-on-surface-variant shadow-sm hover:shadow-md focus:shadow-lg transition-all"
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchQuery && (
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => setSearchQuery('')}
                      className="text-m3-on-surface-variant hover:text-m3-on-surface p-1.5 cursor-pointer rounded-full hover:bg-m3-surface-container-lowest transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  )}
                  <kbd className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-bold text-m3-on-surface-variant bg-m3-surface-container rounded-lg border border-m3-outline-variant/50 shadow-2xs">
                    ⌘K / Ctrl+K
                  </kbd>
                </div>
              </div>

              {/* Desktop Channel & Quick Category Chips */}
              <div className="flex items-center justify-center gap-3 flex-wrap text-sm pt-1">
                {/* Channels */}
                <div className="flex items-center gap-1.5 bg-m3-surface-container-high p-1.5 rounded-full border border-m3-outline-variant/40 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('all')}
                    className={`px-4 py-2 rounded-full font-semibold transition-all cursor-pointer ${
                      selectedChannel === 'all'
                        ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs'
                        : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                    }`}
                  >
                    All Purchases
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('Warehouse')}
                    className={`px-4 py-2 rounded-full font-semibold transition-all cursor-pointer ${
                      selectedChannel === 'Warehouse'
                        ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs'
                        : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                    }`}
                  >
                    Warehouse Register
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('Online')}
                    className={`px-4 py-2 rounded-full font-semibold transition-all cursor-pointer ${
                      selectedChannel === 'Online'
                        ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs'
                        : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                    }`}
                  >
                    Costco.com Online
                  </button>
                </div>

                {/* Popular Search Shortcuts */}
                <div className="hidden lg:flex items-center gap-2 text-m3-on-surface-variant text-xs pl-2">
                  <span className="opacity-80 font-medium">Quick filters:</span>
                  {['Kirkland Signature', 'Groceries', 'Fuel', 'Electronics', 'Gift Cards', 'Returns'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="px-3.5 py-1.5 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-highest border border-m3-outline-variant/40 text-m3-on-surface font-medium hover:border-m3-primary/50 hover:shadow-2xs transition-all cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Primary Action Grid (4 Substantial Interactive Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {/* Card 1: Scan Paper Receipt */}
              <motion.div
                whileHover={{ y: -3 }}
                className="bg-m3-surface-container-lowest dark:bg-m3-surface-container-low rounded-3xl border border-m3-outline-variant/50 p-6 lg:p-7 flex flex-col justify-between shadow-xs hover:border-m3-primary/60 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => {
                  setScannerInitialMode('standard');
                  setIsCameraScannerOpen(true);
                }}
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Camera className="w-7 h-7 text-m3-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base lg:text-lg text-m3-on-surface">Scan Paper Receipt</h3>
                    <p className="text-sm text-m3-on-surface-variant mt-1.5 leading-relaxed">
                      Webcam or high-res receipt capture with instant on-device OCR.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-m3-outline-variant/30 flex items-center justify-between text-sm font-semibold text-m3-primary">
                  <span className="group-hover:underline">Open Scanner</span>
                  <kbd className="px-2 py-1 bg-m3-surface-container text-m3-on-surface-variant rounded font-mono text-xs font-bold border border-m3-outline-variant/40 shadow-2xs">
                    S
                  </kbd>
                </div>
              </motion.div>

              {/* Card 2: Upload Invoices / PDF */}
              <motion.div
                whileHover={{ y: -3 }}
                className="bg-m3-surface-container-lowest dark:bg-m3-surface-container-low rounded-3xl border border-m3-outline-variant/50 p-6 lg:p-7 flex flex-col justify-between shadow-xs hover:border-m3-secondary/60 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-m3-secondary-container text-m3-on-secondary-container flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Upload className="w-7 h-7 text-m3-secondary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base lg:text-lg text-m3-on-surface">Upload Invoices & Data</h3>
                    <p className="text-sm text-m3-on-surface-variant mt-1.5 leading-relaxed">
                      Drag & drop Costco PDF e-invoices, photos, or JSON backups.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-m3-outline-variant/30 flex items-center justify-between text-sm font-semibold text-m3-secondary">
                  <span className="group-hover:underline">Upload Files</span>
                  <kbd className="px-2 py-1 bg-m3-surface-container text-m3-on-surface-variant rounded font-mono text-xs font-bold border border-m3-outline-variant/40 shadow-2xs">
                    U
                  </kbd>
                </div>
              </motion.div>

              {/* Card 3: Summary & Rewards */}
              <motion.div
                whileHover={{ y: -3 }}
                id="desktop-dashboard-summary-card"
                className="bg-m3-surface-container-lowest dark:bg-m3-surface-container-low rounded-3xl border border-m3-outline-variant/50 p-6 lg:p-7 flex flex-col justify-between shadow-xs hover:border-m3-tertiary/60 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setIsSummaryOpen(true)}
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-m3-tertiary-container text-m3-on-tertiary-container flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <PieChart className="w-7 h-7 text-m3-tertiary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base lg:text-lg text-m3-on-surface">Summary & Rewards</h3>
                    <p className="text-sm text-m3-on-surface-variant mt-1.5 leading-relaxed">
                      Calculate 2% Executive rewards and analyze category spending.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-m3-outline-variant/30 flex items-center justify-between text-sm font-semibold text-m3-tertiary">
                  <span className="group-hover:underline">Open Summary</span>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-2 py-1 bg-m3-surface-container text-m3-on-surface-variant rounded font-mono text-xs font-bold border border-m3-outline-variant/40 shadow-2xs">
                      M
                    </kbd>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>

              {/* Card 4: Backup & Drive Sync */}
              <motion.div
                whileHover={{ y: -3 }}
                className="bg-m3-surface-container-lowest dark:bg-m3-surface-container-low rounded-3xl border border-m3-outline-variant/50 p-6 lg:p-7 flex flex-col justify-between shadow-xs hover:border-emerald-500/60 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => {
                  setSettingsInitialTab('backup');
                  setIsSettingsOpen(true);
                }}
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <HardDrive className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base lg:text-lg text-m3-on-surface">Backup & Drive Sync</h3>
                    <p className="text-sm text-m3-on-surface-variant mt-1.5 leading-relaxed">
                      Air-gapped export, Google Drive sync, and theme customization.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-m3-outline-variant/30 flex items-center justify-between text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="group-hover:underline">Open Settings</span>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-2 py-1 bg-m3-surface-container text-m3-on-surface-variant rounded font-mono text-xs font-bold border border-m3-outline-variant/40 shadow-2xs">
                      B
                    </kbd>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Desktop Metrics & Purchase Overview */}
            {receipts.length > 0 ? (
              <div className="space-y-6">
                {/* Metric Row Header with Direct Summary Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg lg:text-xl font-bold text-m3-on-surface">Spending & Rewards Overview</h3>
                    <p className="text-xs sm:text-sm text-m3-on-surface-variant mt-0.5">
                      Real-time totals across your {receipts.length} Costco warehouse & online receipts
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    id="desktop-overview-summary-btn"
                    onClick={() => setIsSummaryOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-m3-secondary-container hover:bg-m3-secondary-container/85 text-m3-on-secondary-container border border-m3-outline-variant/40 text-sm font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                    title="Open spending summary drawer"
                  >
                    <PieChart className="w-4 h-4 text-m3-primary" />
                    <span>View Full Summary</span>
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* 4-Stat Metric Row (Clickable cards to open summary) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  <div
                    onClick={() => setIsSummaryOpen(true)}
                    className="p-5 lg:p-6 rounded-3xl bg-m3-surface-container-low border border-m3-outline-variant/40 shadow-xs hover:border-emerald-500/50 hover:bg-m3-surface-container transition-all cursor-pointer group"
                    title="Click to view detailed spending summary"
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm text-m3-on-surface-variant font-medium">
                      <span>Total Costco Spend</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-m3-on-surface mt-2 tracking-tight">
                      ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-m3-on-surface-variant mt-1 group-hover:text-m3-primary transition-colors">
                      Across {receipts.length} recorded receipt{receipts.length === 1 ? '' : 's'} • Breakdown →
                    </p>
                  </div>

                  <div className="p-5 lg:p-6 rounded-3xl bg-m3-surface-container-low border border-m3-outline-variant/40 shadow-xs">
                    <div className="flex items-center justify-between text-xs sm:text-sm text-m3-on-surface-variant font-medium">
                      <span>Receipts Recorded</span>
                      <div className="w-8 h-8 rounded-lg bg-m3-primary/10 flex items-center justify-center">
                        <ReceiptIcon className="w-4 h-4 text-m3-primary" />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-m3-on-surface mt-2 tracking-tight">
                      {receipts.length}
                    </p>
                    <p className="text-xs text-m3-on-surface-variant mt-1">
                      {warehouseCount} In-Store • {onlineCount} Online
                    </p>
                  </div>

                  <div className="p-5 lg:p-6 rounded-3xl bg-m3-surface-container-low border border-m3-outline-variant/40 shadow-xs">
                    <div className="flex items-center justify-between text-xs sm:text-sm text-m3-on-surface-variant font-medium">
                      <span>Indexed Items</span>
                      <div className="w-8 h-8 rounded-lg bg-m3-secondary/10 flex items-center justify-center">
                        <Tag className="w-4 h-4 text-m3-secondary" />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-m3-on-surface mt-2 tracking-tight">
                      {allItems.length}
                    </p>
                    <p className="text-xs text-m3-on-surface-variant mt-1">
                      100% on-device searchable
                    </p>
                  </div>

                  <div
                    onClick={() => setIsSummaryOpen(true)}
                    className="p-5 lg:p-6 rounded-3xl bg-m3-surface-container-low border border-m3-outline-variant/40 shadow-xs hover:border-amber-500/50 hover:bg-m3-surface-container transition-all cursor-pointer group"
                    title="Click to view Executive 2% reward calculations"
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm text-m3-on-surface-variant font-medium">
                      <span>Est. 2% Executive Reward</span>
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-amber-600 dark:text-amber-400 mt-2 tracking-tight">
                      ${totalExecutiveReward.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-m3-on-surface-variant mt-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      + ${totalInstantSavings.toFixed(2)} savings • View rewards →
                    </p>
                  </div>
                </div>

                {/* Recent Costco Purchases Section (3-column Desktop Grid) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-m3-on-surface">Recent Costco Purchases</h3>
                      <p className="text-xs text-m3-on-surface-variant mt-0.5">
                        Showing latest purchases • Search above or click item to view full receipt
                      </p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsSummaryOpen(true)}
                      className="text-xs font-semibold text-m3-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View spending breakdown</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                    {allItems.slice(0, 6).map((item, idx) => (
                      <ItemCard
                        key={`${item.orderId || 'ord'}_${item.id || idx}_${item.itemId || idx}`}
                        item={item}
                        allItems={allItems}
                        onViewReceipt={(orderId) => setSelectedReceiptId(orderId)}
                        onReEnrich={(itemId, rawName) => handleReEnrichItem(itemId, rawName)}
                        onSearchKeyword={(keyword) => setSearchQuery(keyword)}
                        isEnriching={!!enrichingItemIds[item.itemId]}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop Empty State */
              <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-3">
                <ReceiptIcon className="w-10 h-10 text-m3-primary mx-auto opacity-75" />
                <h3 className="font-bold text-base text-m3-on-surface">No Receipts Recorded Yet</h3>
                <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                  Get started by scanning a paper Costco receipt, uploading an online PDF invoice, or loading demo purchases.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadDemoData}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-m3-primary text-m3-on-primary text-xs font-semibold hover:bg-m3-primary/90 transition-colors cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load Demo Costco Purchases</span>
                  </button>
                </div>
              </div>
            )}

            {/* Desktop Subtle Footer Status Bar */}
            <div className="pt-6 border-t border-m3-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-m3-on-surface-variant/75">
              <span>Designed in 🇨🇦 by Aniket Vasishth</span>
              <div className="flex items-center gap-3">
                <span>Keyboard: ⌘K Search • Esc Clear • S Scan • U Upload</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% On-Device Private Sandbox</span>
              </div>
            </div>
          </main>
        ) : (
          /* MOBILE INITIAL STATE: Compact Centered Single-Column Layout */
          <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 pt-10 pb-24 max-w-xl mx-auto w-full text-center">
            {/* Centered Brand Title */}
            <div className="mb-8 flex flex-col items-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-m3-on-background">
                Reco
              </h2>
              <p className="text-xs sm:text-sm text-m3-on-surface-variant mt-1.5 whitespace-nowrap">
                Costco Wholesale Receipt Search
              </p>
            </div>

            {/* Centered Search Bar */}
            <div className="w-full relative max-w-lg mb-4">
              <Search className="w-5 h-5 text-m3-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search item #, name, date, card..."
                className="w-full pl-12 pr-11 py-4 bg-m3-surface-container-high hover:bg-m3-surface-container-highest focus:bg-m3-surface-container-highest border border-transparent focus:border-m3-primary focus:ring-4 focus:ring-m3-primary/20 rounded-full text-sm sm:text-base text-m3-on-surface placeholder:text-m3-on-surface-variant shadow-xs transition-all"
                autoFocus
              />
              {searchQuery && (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-m3-on-surface-variant hover:text-m3-on-surface p-1.5 cursor-pointer rounded-full hover:bg-m3-surface-container-lowest transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </div>

            {/* Channel Filters */}
            <div className="flex items-center gap-1.5 bg-m3-surface-container-high p-1 rounded-full border border-m3-outline-variant/40 text-xs">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedChannel('all')}
                className={`px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  selectedChannel === 'all'
                    ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs font-semibold'
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest/60'
                }`}
              >
                All Purchases
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedChannel('Warehouse')}
                className={`px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  selectedChannel === 'Warehouse'
                    ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs font-semibold'
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest/60'
                }`}
              >
                Warehouse
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedChannel('Online')}
                className={`px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  selectedChannel === 'Online'
                    ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs font-semibold'
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest/60'
                }`}
              >
                Online
              </motion.button>
            </div>

            {/* Local Status Indicator & Empty State Prompt */}
            {receipts.length === 0 ? (
              <div className="mt-7 p-4 sm:p-5 rounded-3xl bg-m3-surface-container-low border border-m3-outline-variant/35 max-w-sm w-full text-center space-y-3 shadow-2xs">
                <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                  No receipts recorded yet. Scan a paper receipt or upload your order data below.
                </p>
                <div className="flex items-center justify-center gap-2 pt-0.5">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleLoadDemoData}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-primary border border-m3-outline-variant/50 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-m3-tertiary" />
                    <span>Load Demo Purchases</span>
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md mt-6 space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setSettingsInitialTab('ai');
                    setIsSettingsOpen(true);
                  }}
                  title="View local database and on-device AI status"
                  className="mx-auto text-xs text-m3-on-surface-variant flex items-center justify-center gap-1.5 pt-1 hover:text-m3-primary transition-colors cursor-pointer group"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:underline">
                    {receipts.length} receipt{receipts.length === 1 ? '' : 's'} • {allItems.length} item{allItems.length === 1 ? '' : 's'} indexed on-device
                  </span>
                </button>
              </div>
            )}
          </main>
        )
      ) : (
        /* ACTIVE SEARCH STATE: Stretched Full-Width Desktop or Adaptive Mobile */
        <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 flex flex-col space-y-4 no-scrollbar ${
          isDesktop ? 'max-w-7xl' : 'max-w-xl'
        }`}>
          {/* Top Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 md:w-6 md:h-6 text-m3-primary absolute left-4 md:left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search item #, name, date, card..."
              className={`w-full bg-m3-surface-container-high hover:bg-m3-surface-container-highest focus:bg-m3-surface-container-highest border border-transparent focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/30 rounded-full text-m3-on-surface placeholder:text-m3-on-surface-variant shadow-xs transition-all ${
                isDesktop
                  ? 'pl-14 pr-16 py-4 text-base font-medium rounded-2xl sm:rounded-3xl'
                  : 'pl-12 pr-11 py-3.5 text-sm'
              }`}
              autoFocus
            />
            {searchQuery && (
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-m3-on-surface-variant hover:text-m3-on-surface p-1.5 cursor-pointer rounded-full hover:bg-m3-surface-container-lowest transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </motion.button>
            )}
          </div>

          {/* Search Header Row & Desktop Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm pt-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="text-m3-on-surface-variant font-medium text-xs sm:text-sm">
                <span>Found </span>
                <strong className="text-m3-on-surface font-bold text-sm sm:text-base">{filteredItems.length}</strong>
                <span> purchase{filteredItems.length === 1 ? '' : 's'}</span>
              </div>

              {/* Channel Filter Pills */}
              <div className="flex items-center gap-1.5 bg-m3-surface-container-high p-1 rounded-full border border-m3-outline-variant/40 ml-1">
                <button
                  type="button"
                  onClick={() => setSelectedChannel('all')}
                  className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer text-xs sm:text-sm ${
                    selectedChannel === 'all'
                      ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs'
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChannel('Warehouse')}
                  className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer text-xs sm:text-sm ${
                    selectedChannel === 'Warehouse'
                      ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs'
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                  }`}
                >
                  Warehouse
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChannel('Online')}
                  className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer text-xs sm:text-sm ${
                    selectedChannel === 'Online'
                      ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs'
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                  }`}
                >
                  Online
                </button>
              </div>
            </div>

            {/* Desktop Specific Controls: Summary button, Sort Dropdown & Grid vs Table view toggle */}
            {isDesktop && (
              <div className="flex items-center gap-2.5">
                {/* Summary Button in Search Toolbar */}
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  id="desktop-search-summary-btn"
                  onClick={() => setIsSummaryOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-m3-secondary-container hover:bg-m3-secondary-container/85 text-m3-on-secondary-container text-xs sm:text-sm font-semibold border border-m3-outline-variant/40 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                  title="View full spending summary and rewards (Press M)"
                >
                  <span>Summary</span>
                  {filteredItems.length > 0 && (
                    <span className="px-2 py-0.5 bg-m3-primary text-m3-on-primary text-[10px] md:text-xs rounded-full font-mono font-bold leading-none shadow-2xs">
                      {filteredItems.length}
                    </span>
                  )}
                </motion.button>

                {/* Sort Selector */}
                <div className="flex items-center gap-1.5 bg-m3-surface-container-high px-3 py-1.5 rounded-full border border-m3-outline-variant/40 shadow-2xs">
                  <ArrowUpDown className="w-4 h-4 text-m3-on-surface-variant" />
                  <select
                    value={desktopSortBy}
                    onChange={(e) => setDesktopSortBy(e.target.value as any)}
                    className="bg-transparent text-xs sm:text-sm text-m3-on-surface font-medium outline-hidden cursor-pointer"
                    aria-label="Sort purchases"
                  >
                    <option value="date-desc">Newest Date First</option>
                    <option value="date-asc">Oldest Date First</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="name">Product Name A-Z</option>
                  </select>
                </div>

                {/* View Layout Switcher (Grid vs Table) */}
                <div className="flex items-center gap-1 bg-m3-surface-container-high p-1 rounded-full border border-m3-outline-variant/40 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setDesktopResultLayout('grid')}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      desktopResultLayout === 'grid'
                        ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-2xs'
                        : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                    }`}
                    title="Grid View (Cards)"
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesktopResultLayout('table')}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      desktopResultLayout === 'table'
                        ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-2xs'
                        : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                    }`}
                    title="Compact Table View"
                    aria-label="Table view"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Price Trends Banner */}
          {matchingTrendItems.length > 0 && (
            <SearchPriceTrendBanner
              trends={matchingTrendItems}
              onViewReceipt={(orderId) => setSelectedReceiptId(orderId)}
            />
          )}

          {/* Results List: Grid or Table View */}
          <div className="pt-1">
            {filteredItems.length === 0 ? (
              <div className="bg-m3-surface-container-lowest dark:bg-m3-surface-container-low rounded-3xl border border-m3-outline-variant/60 p-10 text-center space-y-3">
                <Search className="w-9 h-9 text-m3-outline mx-auto" />
                <h3 className="text-base font-semibold text-m3-on-surface">
                  No purchases matching "{searchQuery}"
                </h3>
                <p className="text-xs text-m3-on-surface-variant max-w-sm mx-auto leading-relaxed">
                  Try searching with an Item ID (e.g. 56366), brand name, product title, or payment card digits.
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchQuery('')}
                  className="mt-2 inline-block px-4 py-2 rounded-full bg-m3-secondary-container text-m3-on-secondary-container hover:bg-m3-secondary-container/80 text-xs font-medium transition-colors cursor-pointer"
                >
                  Clear Search
                </motion.button>
              </div>
            ) : isDesktop && desktopResultLayout === 'table' ? (
              /* Desktop Table View */
              <div className="bg-m3-surface-container-lowest dark:bg-m3-surface-container-low rounded-3xl border border-m3-outline-variant/60 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-m3-on-surface">
                    <thead className="bg-m3-surface-container-high/60 border-b border-m3-outline-variant/40 text-m3-on-surface-variant font-bold text-xs uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-5">Item #</th>
                        <th className="py-3.5 px-5">Product Name & Category</th>
                        <th className="py-3.5 px-4">Channel</th>
                        <th className="py-3.5 px-4">Purchase Date</th>
                        <th className="py-3.5 px-4 text-right">Unit Price</th>
                        <th className="py-3.5 px-5 text-right">Total</th>
                        <th className="py-3.5 px-4 text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-m3-outline-variant/30">
                      {filteredItems.map((item, idx) => (
                        <tr
                          key={`${item.orderId || 'ord'}_${item.id || idx}_${item.itemId || idx}`}
                          className="hover:bg-m3-surface-container-highest/40 transition-colors cursor-pointer"
                          onClick={() => setSelectedReceiptId(item.orderId)}
                        >
                          <td className="py-3.5 px-5 font-mono font-bold text-m3-primary whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(item.itemId);
                                setTableCopiedId(item.itemId);
                                setTimeout(() => setTableCopiedId(null), 1500);
                              }}
                              className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                              title="Click to copy Item ID"
                            >
                              <span>#{item.itemId}</span>
                              {tableCopiedId === item.itemId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-5 max-w-sm">
                            <div className="font-semibold text-m3-on-surface text-sm truncate">
                              {item.productName || item.rawName}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-m3-on-surface-variant mt-0.5">
                              {item.brand && <span className="font-medium text-m3-secondary">{item.brand}</span>}
                              {item.category && <span>• {item.category}</span>}
                              {item.warehouseLocation && <span>• {item.warehouseLocation}</span>}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              item.orderType === 'Online'
                                ? 'bg-m3-primary-container text-m3-on-primary-container border-m3-primary/30'
                                : 'bg-m3-secondary-container text-m3-on-secondary-container border-m3-secondary/30'
                            }`}>
                              {item.orderType === 'Online' ? <Globe className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                              <span>{item.orderType}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-m3-on-surface-variant text-xs sm:text-sm">
                            {item.orderDate}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-xs sm:text-sm">
                            ${(item.unitPrice || 0).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-5 text-right whitespace-nowrap font-mono font-bold text-sm text-m3-on-surface">
                            ${(item.totalPrice || 0).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReceiptId(item.orderId);
                              }}
                              className="p-2 rounded-full hover:bg-m3-surface-container-highest text-m3-primary transition-colors cursor-pointer"
                              title="View full receipt"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Grid View (Cards): 3 columns on Desktop, 1 column on Mobile */
              <div className={`grid gap-5 lg:gap-6 ${
                isDesktop ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 space-y-3.5'
              }`}>
                {filteredItems.map((item, idx) => (
                  <ItemCard
                    key={`${item.orderId || 'ord'}_${item.id || idx}_${item.itemId || idx}`}
                    item={item}
                    allItems={allItems}
                    onViewReceipt={(orderId) => setSelectedReceiptId(orderId)}
                    onReEnrich={(itemId, rawName) => handleReEnrichItem(itemId, rawName)}
                    onSearchKeyword={(keyword) => setSearchQuery(keyword)}
                    isEnriching={!!enrichingItemIds[item.itemId]}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {/* MOBILE ONLY: FIXED BOTTOM ACTION BAR (Hidden on Desktop) */}
      {!isDesktop && (
        <footer className="fixed bottom-0 inset-x-0 z-20 bg-m3-surface-container-low/95 backdrop-blur-md border-t border-m3-outline-variant/40 px-3 sm:px-4 py-2.5 sm:py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-md mx-auto flex items-center justify-between gap-2.5 sm:gap-3">
            {/* M3 Filled Tonal Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setScannerInitialMode('standard');
                setIsCameraScannerOpen(true);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-3 rounded-full bg-m3-secondary-container hover:bg-m3-secondary-container/80 border border-m3-outline-variant/30 text-m3-on-secondary-container text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer truncate"
              title="Scan receipt with camera"
            >
              <Camera className="w-4 h-4 text-m3-primary shrink-0" />
              <span className="truncate">Scan Receipt</span>
            </motion.button>

            {/* M3 Filled Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsUploadModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-3 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer truncate"
              title="Upload JSON, CSV, or receipt photos"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span className="truncate">Upload Data</span>
            </motion.button>

            {/* M3 Settings Gear Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setSettingsInitialTab('backup');
                setIsSettingsOpen(true);
              }}
              className="shrink-0 flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface border border-m3-outline-variant/40 shadow-2xs transition-all cursor-pointer"
              title="Settings (Backup, Theme & Storage)"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-m3-on-surface" />
            </motion.button>
          </div>
        </footer>
      )}

      {/* Settings Drawer (Backup, Theme, Data, About) */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsInitialTab}
        receipts={receipts}
        themeMode={themeMode}
        onSelectThemeMode={handleSelectThemeMode}
        activePaletteId={activePaletteId}
        onSelectPalette={handleSelectPalette}
        isDarkMode={isDarkMode}
        isImmersive={isImmersive}
        onToggleImmersive={handleToggleImmersive}
        onReceiptsRestored={(restored, msg) => {
          handleReceiptsAdded(restored, msg);
        }}
        onClearAllReceipts={handleClearAllReceipts}
        onFactoryReset={handleFactoryReset}
        onLoadDemo={handleLoadDemoData}
        onOpenFeedback={() => {
          setFeedbackInitialError(null);
          setIsFeedbackModalOpen(true);
        }}
        onOpenInstall={handleOpenInstall}
        isInstalled={isInstalled}
        onOpenDeviceDiagnostics={() => setIsFirstLaunchCapabilitiesOpen(true)}
        onShowSnackbar={(msg, title) => showSnackbar(msg, title || 'Settings')}
      />

      {/* Summary Drawer revealed on swipe to right or Header tap */}
      <SummaryDrawer
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        receipts={receipts}
        items={allItems}
        themeMode={themeMode}
        onSelectThemeMode={handleSelectThemeMode}
        onOpenPalettes={() => {
          setSettingsInitialTab('theme');
          setIsSettingsOpen(true);
        }}
        onSelectReceipt={(receiptId) => setSelectedReceiptId(receiptId)}
        onOpenFeedback={() => {
          setFeedbackInitialError(null);
          setIsFeedbackModalOpen(true);
        }}
        onOpenSaveBackup={() => setIsSaveBackupOpen(true)}
        onClearAllReceipts={handleClearAllReceipts}
        onDeleteReceipt={handleDeleteReceipt}
        onOpenInstall={handleOpenInstall}
        isInstalled={isInstalled}
        onLoadDemo={handleLoadDemoData}
        isImmersive={isImmersive}
        onToggleImmersive={handleToggleImmersive}
        onSearchItemId={(itemId) => setSearchQuery(itemId)}
      />

      {/* Save & Backup Modal (File System & Google Drive) */}
      <SaveBackupModal
        isOpen={isSaveBackupOpen}
        onClose={() => setIsSaveBackupOpen(false)}
        receipts={receipts}
        onReceiptsRestored={(restored, msg) => {
          handleReceiptsAdded(restored, msg);
        }}
        onShowSnackbar={(msg) => showSnackbar(msg, 'Backup & Sync')}
      />

      {/* Detailed Upload Modal (Photo files, JSON, CSV, Demo) */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onReceiptsAdded={handleReceiptsAdded}
        onShowSnackbar={(msg, title, type) => showSnackbar(msg, title, type)}
      />

      {/* Live Camera Scanner with Real-time White Boundary Detection */}
      <ReceiptCameraScanner
        isOpen={isCameraScannerOpen}
        initialMode={scannerInitialMode}
        onClose={() => setIsCameraScannerOpen(false)}
        onReceiptScanned={(receipt, msg) => {
          handleReceiptsAdded([receipt], msg);
        }}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onShowSnackbar={(msg, title, type) => showSnackbar(msg, title, type)}
      />

      {/* Receipt Detail Modal */}
      <ReceiptDetailModal
        receipt={activeReceipt}
        onClose={() => setSelectedReceiptId(null)}
        onSearchItemId={(itemId) => {
          setSearchQuery(itemId);
        }}
        onDeleteReceipt={handleDeleteReceipt}
      />

      {/* How To & Chrome Extension Guide Modal */}
      <HowToModal
        isOpen={isHowToOpen}
        onClose={() => setIsHowToOpen(false)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenSync={() => setIsSaveBackupOpen(true)}
        initialTab={howToInitialTab}
      />

      {/* First Launch Google Drive Sync Prompt Modal */}
      <FirstLaunchSyncModal
        isOpen={isFirstLaunchSyncOpen}
        onClose={() => setIsFirstLaunchSyncOpen(false)}
        onSyncEnabled={() => {
          setIsFirstLaunchSyncOpen(false);
        }}
        onShowSnackbar={(msg) => showSnackbar(msg, 'Google Drive Sync')}
      />

      {/* First Launch On-Device AI & Capabilities Diagnostic Modal */}
      <FirstLaunchCapabilitiesModal
        isOpen={isFirstLaunchCapabilitiesOpen}
        onClose={() => setIsFirstLaunchCapabilitiesOpen(false)}
        onOpenHowToGuide={() => {
          setIsFirstLaunchCapabilitiesOpen(false);
          setHowToInitialTab('gemini_nano');
          setIsHowToOpen(true);
        }}
        onOpenSettings={() => {
          setIsFirstLaunchCapabilitiesOpen(false);
          setSettingsInitialTab('compatibility');
          setIsSettingsOpen(true);
        }}
        onShowSnackbar={(msg, title) => showSnackbar(msg, title)}
      />

      {/* Developer Feedback & Bug Report Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        initialError={feedbackInitialError}
      />

      {/* PWA Floating Install Prompt and Device Guidance */}
      <PWAInstallBanner
        show={showAutoPrompt}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isInstalled={isInstalled}
        hasDeferredPrompt={hasDeferredPrompt}
        onInstall={triggerInstall}
        onDismiss={dismissPrompt}
        onMarkAlreadyInstalled={() => {
          markAsAddedToHomeScreen();
          showSnackbar('Preference saved • Install prompt hidden permanently', 'Home Screen');
        }}
        forceOpenGuide={isInstallGuideOpen}
        onCloseGuide={() => setIsInstallGuideOpen(false)}
      />

      {/* PWA Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Confirmation Snackbar (Always top-level over all modals/drawers) */}
      <Snackbar
        message={snackbar?.message || null}
        title={snackbar?.title}
        type={snackbar?.type}
        onClose={() => setSnackbar(null)}
        duration={5000}
      />
    </div>
  );
}
