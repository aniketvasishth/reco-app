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
import { Snackbar } from './components/Snackbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ScanReceiptModal } from './components/ScanReceiptModal';
import { ThemePaletteModal } from './components/ThemePaletteModal';
import { ReceiptCameraScanner } from './components/ReceiptCameraScanner';
import {
  PALETTE_STORAGE_KEY,
  DEFAULT_PALETTE_ID,
  getActivePalette,
  applyMaterialTokens,
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

  const [isPaletteModalOpen, setIsPaletteModalOpen] = useState(false);

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
  const [isScanReceiptModalOpen, setIsScanReceiptModalOpen] = useState(false);
  const [scannerInitialMode, setScannerInitialMode] = useState<'standard' | 'long'>('standard');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'backup' | 'theme' | 'data' | 'about'>('backup');
  const [isSaveBackupOpen, setIsSaveBackupOpen] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [isFirstLaunchSyncOpen, setIsFirstLaunchSyncOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackInitialError, setFeedbackInitialError] = useState<string | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    title?: string;
    type?: 'success' | 'error' | 'info';
  } | null>(null);
  const [enrichingItemIds, setEnrichingItemIds] = useState<Record<string, boolean>>({});

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
    openPromptManually,
  } = usePWAInstall();

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

  // Swipe gesture handling: swipe right opens summary
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    if (deltaX > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      setIsSummaryOpen(true);
    }
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

    // Ensure search results are strictly in reverse chronological order by date of purchase (newest first)
    return matches.sort((a, b) => {
      const timeA = parseDateToMs(a.orderDate);
      const timeB = parseDateToMs(b.orderDate);
      if (timeB !== timeA) {
        return timeB - timeA; // Newer purchases at the top
      }
      return (a.productName || a.rawName).localeCompare(b.productName || b.rawName);
    });
  }, [allItems, searchQuery, selectedChannel, hasSearchQuery]);

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
  const handleReceiptsAdded = (newReceipts: CostcoReceipt[], message?: string) => {
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
      isUpdated ? 'Receipt Updated' : 'Receipt Scanned Successfully',
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
      `Loaded ${SAMPLE_COSTCO_RECEIPTS.reduce((s, r) => s + r.items.length, 0)} demo items. You can clear them anytime from Purchase Summary.`
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
        onOpenSummary={() => setIsSummaryOpen(true)}
        onOpenFeedback={() => {
          setFeedbackInitialError(null);
          setIsFeedbackModalOpen(true);
        }}
        onOpenHowTo={() => setIsHowToOpen(true)}
        onOpenInstall={openPromptManually}
      />

      {/* Spacious Main Area */}
      {!hasSearchQuery ? (
        /* INITIAL STATE: Spacious Centered Search Box with zero items displayed */
        <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 pt-10 pb-24 max-w-xl mx-auto w-full text-center">
          {/* Centered Brand Title with Beta Superscript */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative inline-flex items-center">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-2xs select-none">
                Beta
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2.5">
                <span className="text-m3-on-background">Rec</span>
                <span className="text-m3-tertiary">o</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-m3-on-surface-variant mt-1.5 whitespace-nowrap">
              Wholesale Receipt Search
            </p>
          </div>

          {/* Centered Search Bar (M3 Search Bar Pattern) */}
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

          {/* Channel Filters - M3 Filter Chips */}
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
              <div className="text-xs text-m3-on-surface-variant flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {receipts.length} receipt{receipts.length === 1 ? '' : 's'} • {allItems.length} item{allItems.length === 1 ? '' : 's'} indexed on-device
                </span>
              </div>
            </div>
          )}
        </main>
      ) : (
        /* ACTIVE SEARCH STATE: Search Bar at top, followed by matching items */
        <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-6 pb-24 flex flex-col space-y-4 no-scrollbar">
          
          {/* Top Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-m3-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search item #, name, date, card..."
              className="w-full pl-12 pr-11 py-3.5 bg-m3-surface-container-high hover:bg-m3-surface-container-highest focus:bg-m3-surface-container-highest border border-transparent focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/30 rounded-full text-sm text-m3-on-surface placeholder:text-m3-on-surface-variant shadow-xs transition-all"
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

          {/* Search Header Row & Channel Filter Pills */}
          <div className="flex items-center justify-between gap-2 text-xs pt-1">
            <div className="text-m3-on-surface-variant font-medium">
              <span>Found </span>
              <strong className="text-m3-on-surface">{filteredItems.length}</strong>
              <span> result{filteredItems.length === 1 ? '' : 's'}</span>
            </div>

            <div className="flex items-center gap-1 bg-m3-surface-container-high p-1 rounded-full border border-m3-outline-variant/40">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedChannel('all')}
                className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                  selectedChannel === 'all'
                    ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs font-semibold'
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest/60'
                }`}
              >
                All
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedChannel('Warehouse')}
                className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
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
                className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                  selectedChannel === 'Online'
                    ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs font-semibold'
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest/60'
                }`}
              >
                Online
              </motion.button>
            </div>
          </div>

          {/* Price Trends Pill / Banner (Only pops up when searched items have price trend history) */}
          {matchingTrendItems.length > 0 && (
            <SearchPriceTrendBanner
              trends={matchingTrendItems}
              onViewReceipt={(orderId) => setSelectedReceiptId(orderId)}
            />
          )}

          {/* Results List */}
          <div className="space-y-3 pt-1">
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
            ) : (
              <div className="space-y-3.5">
                {filteredItems.map((item, idx) => (
                  <ItemCard
                    key={`${item.orderId || 'ord'}_${item.id || idx}_${item.itemId || idx}`}
                    item={item}
                    allItems={allItems}
                    onViewReceipt={(orderId) => setSelectedReceiptId(orderId)}
                    onReEnrich={(itemId, rawName) => handleReEnrichItem(itemId, rawName)}
                    isEnriching={!!enrichingItemIds[item.itemId]}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {/* FIXED BOTTOM ACTION BAR: Scan, Upload, Settings (Material 3 Buttons) */}
      <footer className="fixed bottom-0 inset-x-0 z-20 bg-m3-surface-container-low/95 backdrop-blur-md border-t border-m3-outline-variant/40 px-3 sm:px-4 py-2.5 sm:py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2.5 sm:gap-3">
          {/* M3 Filled Tonal Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsScanReceiptModalOpen(true)}
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
        onOpenPalettesModal={() => {
          setIsSettingsOpen(false);
          setIsPaletteModalOpen(true);
        }}
        isDarkMode={isDarkMode}
        isImmersive={isImmersive}
        onToggleImmersive={handleToggleImmersive}
        onReceiptsRestored={(restored, msg) => {
          handleReceiptsAdded(restored, msg);
        }}
        onClearAllReceipts={handleClearAllReceipts}
        onLoadDemo={handleLoadDemoData}
        onOpenFeedback={() => {
          setFeedbackInitialError(null);
          setIsFeedbackModalOpen(true);
        }}
        onOpenInstall={openPromptManually}
        isInstalled={isInstalled}
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
        onOpenPalettes={() => setIsPaletteModalOpen(true)}
        onSelectReceipt={(receiptId) => setSelectedReceiptId(receiptId)}
        onOpenFeedback={() => {
          setFeedbackInitialError(null);
          setIsFeedbackModalOpen(true);
        }}
        onOpenSaveBackup={() => setIsSaveBackupOpen(true)}
        onClearAllReceipts={handleClearAllReceipts}
        onOpenInstall={openPromptManually}
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

      {/* Mode Selection Dialog: Scan Normal Receipt vs Scan Long Receipt */}
      <ScanReceiptModal
        isOpen={isScanReceiptModalOpen}
        onClose={() => setIsScanReceiptModalOpen(false)}
        onSelectMode={(mode) => {
          setScannerInitialMode(mode);
          setIsCameraScannerOpen(true);
        }}
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
      />

      {/* How To & Chrome Extension Guide Modal */}
      <HowToModal
        isOpen={isHowToOpen}
        onClose={() => setIsHowToOpen(false)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenSync={() => setIsSaveBackupOpen(true)}
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
      />

      {/* PWA Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Material You Dynamic Wallpaper & Theme Palette Selector Modal */}
      <ThemePaletteModal
        isOpen={isPaletteModalOpen}
        onClose={() => setIsPaletteModalOpen(false)}
        activePaletteId={activePaletteId}
        onSelectPalette={handleSelectPalette}
        themeMode={themeMode}
        onThemeModeChange={handleSelectThemeMode}
        isDarkMode={isDarkMode}
        isImmersive={isImmersive}
        onToggleImmersive={handleToggleImmersive}
      />

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
