import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  HelpCircle,
  Chrome,
  Download,
  Upload,
  Cloud,
  FileJson,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  Search,
  Camera,
  Sparkles,
  Cpu,
  Zap,
  WifiOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  M3_TRANSITIONS,
  M3_BOTTOM_SHEET_DRAG,
  m3SharedAxisXVariants,
} from '../utils/motion';
import { M3Ripple } from './M3Ripple';

interface HowToModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpload: () => void;
  onOpenSync: () => void;
  initialTab?: TabType;
}

type TabType = 'getting_started' | 'gemini_nano' | 'extension' | 'drive_sync';

export function HowToModal({
  isOpen,
  onClose,
  onOpenUpload,
  onOpenSync,
  initialTab = 'getting_started',
}: HowToModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedFlag, setCopiedFlag] = useState<string | null>(null);
  const [direction, setDirection] = useState<number>(1);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab, isOpen]);

  const tabs: Array<{ id: TabType; label: string; shortLabel: string; icon?: React.ReactNode }> = [
    { id: 'getting_started', label: 'Overview', shortLabel: 'Overview' },
    { id: 'gemini_nano', label: 'On-Device AI', shortLabel: 'Local AI', icon: <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> },
    { id: 'extension', label: 'Chrome Extension', shortLabel: 'Extension', icon: <Chrome className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'drive_sync', label: 'Google Drive Sync', shortLabel: 'Drive Sync', icon: <Cloud className="w-3.5 h-3.5 shrink-0" /> },
  ];

  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    const tabOrder: TabType[] = ['getting_started', 'gemini_nano', 'extension', 'drive_sync'];
    const oldIdx = tabOrder.indexOf(activeTab);
    const newIdx = tabOrder.indexOf(newTab);
    setDirection(newIdx > oldIdx ? 1 : -1);
    setActiveTab(newTab);
  };

  const copyFlagText = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedFlag(text);
    setTimeout(() => setCopiedFlag(null), 2500);
  };

  const { onPointerDown: onCloseDown, renderRipples: renderCloseRipples } = M3Ripple({
    color: 'bg-current',
  });

  const copyScriptSnippet = () => {
    const snippet = `// Costco Order History Extractor Snippet
// 1. Log in to Costco.com / Costco.ca -> Orders & Purchases
// 2. Open Chrome DevTools Console (F12 or right-click Inspect)
// 3. Or use the "Costco Receipt Downloader" Chrome Extension to click 'Export JSON'`;
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="howto-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 md:p-6"
          onClick={onClose}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <motion.div
            id="howto-modal"
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
            className="w-full max-w-xl bg-m3-surface-container text-m3-on-surface max-h-[88vh] sm:max-h-[90vh] rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden border border-m3-outline-variant/60 touch-pan-y"
          >
            {/* Mobile Drag Handle Bar */}
            <div className="pt-2.5 pb-1 flex justify-center sm:hidden cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.5 rounded-full bg-m3-outline-variant/60" />
            </div>

            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-m3-outline-variant/40 flex items-center justify-between shrink-0 bg-m3-surface-container-high/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-m3-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-m3-on-surface leading-tight">
                    How to Use Reco
                  </h2>
                  <span className="text-[11px] text-m3-on-surface-variant font-medium">
                    Receipt indexing, Chrome Extension & Google Drive Sync
                  </span>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onPointerDown={onCloseDown}
                onClick={onClose}
                className="relative overflow-hidden p-2 text-m3-on-surface-variant hover:text-m3-on-surface rounded-full hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
                aria-label="Close how to guide"
              >
                {renderCloseRipples()}
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Material 3 Segmented Pill Tabs - Fits all screens, no cutting off */}
            <div className="px-3 sm:px-5 pt-3 pb-2 bg-m3-surface-container shrink-0 w-full">
              <div className="grid grid-cols-4 gap-0.5 sm:gap-1 bg-m3-surface-container-high p-1 rounded-full w-full">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      className={`relative py-1.5 px-1 sm:px-2.5 text-[11px] sm:text-xs font-semibold rounded-full transition-colors cursor-pointer select-none text-center flex items-center justify-center min-w-0 ${
                        isActive
                          ? 'text-m3-on-secondary-container'
                          : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="m3-howto-tab-pill"
                          transition={M3_TRANSITIONS.snappySpring}
                          className="absolute inset-0 bg-m3-secondary-container rounded-full shadow-xs -z-0"
                        />
                      )}
                      <span className="relative z-10 flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 w-full truncate">
                        {tab.icon}
                        <span className="hidden sm:inline truncate">{tab.label}</span>
                        <span className="sm:hidden truncate">{tab.shortLabel}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Tab Content with M3 Shared Axis X */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs text-m3-on-surface">
              <AnimatePresence mode="wait" custom={direction}>
                {/* TAB 1: GETTING STARTED */}
                {activeTab === 'getting_started' && (
                  <motion.div
                    key="tab-getting-started"
                    custom={direction}
                    variants={m3SharedAxisXVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div className="bg-m3-primary/10 border border-m3-primary/20 rounded-2xl p-4 text-m3-on-surface">
                      <h3 className="text-sm font-bold text-m3-primary flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        Instant On-Device Costco Wholesale Receipt Search
                      </h3>
                      <p className="mt-1.5 text-xs text-m3-on-surface-variant leading-relaxed">
                        Reco lets you search through years of warehouse and online purchases in milliseconds. Search by item name, item number, warehouse location, payment card, or category (e.g. gift cards, returns).
                      </p>
                    </div>

                    <h4 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant pt-1">
                      3 Ways to Add Receipts
                    </h4>

                    <div className="grid grid-cols-1 gap-2.5">
                      {/* Way 1: Upload JSON */}
                      <div className="p-3.5 rounded-2xl border border-m3-outline-variant/50 bg-m3-surface-container-low hover:bg-m3-surface-container-high transition-colors flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0 mt-0.5">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-m3-on-surface text-xs">
                            1. Upload Orders JSON File
                          </h5>
                          <p className="text-m3-on-surface-variant text-[11px] mt-0.5 leading-relaxed">
                            Exported from Costco.com or the Reco Chrome extension. Tap "Upload Data" on the main screen to import instantly.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenUpload();
                            }}
                            className="mt-2 text-[11px] font-semibold text-m3-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open Import Dialog</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Way 2: Chrome Extension */}
                      <div className="p-3.5 rounded-2xl border border-m3-outline-variant/50 bg-m3-surface-container-low hover:bg-m3-surface-container-high transition-colors flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Chrome className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-m3-on-surface text-xs">
                            2. Costco Receipt Downloader Extension
                          </h5>
                          <p className="text-m3-on-surface-variant text-[11px] mt-0.5 leading-relaxed">
                            Use the third-party Chrome extension to download your full warehouse and online purchase history as JSON while logged in to Costco.
                          </p>
                          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                            <a
                              href="https://chromewebstore.google.com/detail/costco-receipts-downloade/nnalnbomehfogoleegpfegaeoofheemn?hl=en"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-m3-primary hover:underline inline-flex items-center gap-1 cursor-pointer bg-m3-primary/10 px-2.5 py-1 rounded-full border border-m3-primary/20"
                            >
                              <span>Chrome Web Store</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleTabChange('extension')}
                              className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Setup Guide</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Way 3: Google Drive Sync */}
                      <div className="p-3.5 rounded-2xl border border-m3-outline-variant/50 bg-m3-surface-container-low hover:bg-m3-surface-container-high transition-colors flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Cloud className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-m3-on-surface text-xs">
                            3. Google Drive Cloud Sync
                          </h5>
                          <p className="text-m3-on-surface-variant text-[11px] mt-0.5 leading-relaxed">
                            Safely backup and sync your receipts across your phone, tablet, and computer using your private Google Drive account.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenSync();
                            }}
                            className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Configure Google Drive Sync</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: ON-DEVICE GEMINI NANO SETUP */}
                {activeTab === 'gemini_nano' && (
                  <motion.div
                    key="tab-gemini-nano"
                    custom={direction}
                    variants={m3SharedAxisXVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    {/* Hero Card */}
                    <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4" />
                        <span>100% On-Device AI • Privacy First</span>
                      </div>
                      <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                        Reco is designed as an <strong>offline-first Progressive Web App (PWA)</strong>. It prioritizes the on-device <strong>Gemini Nano</strong> model built into your Android phone (via Chrome Built-in AI / AICore) and our local WebAssembly OCR engine. All receipt parsing occurs locally on your phone with zero data sent to external servers.
                      </p>
                    </div>

                    {/* Step-by-Step Chrome Configuration */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
                          How to Enable Gemini Nano on Android
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-m3-secondary-container text-m3-on-secondary-container font-semibold">
                          Chrome 128+
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        {/* Step 1 */}
                        <div className="p-3 rounded-2xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-m3-on-surface">1. Enable Prompt API Flag</span>
                            <button
                              type="button"
                              onClick={() => copyFlagText('chrome://flags/#prompt-api-for-gemini-nano')}
                              className="px-2 py-1 rounded-lg bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedFlag === 'chrome://flags/#prompt-api-for-gemini-nano' ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>Copy URL</span>
                            </button>
                          </div>
                          <code className="text-[11px] font-mono text-m3-primary block">
                            chrome://flags/#prompt-api-for-gemini-nano
                          </code>
                          <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                            Open this URL in Chrome for Android and set the dropdown to <strong>Enabled</strong>.
                          </p>
                        </div>

                        {/* Step 2 */}
                        <div className="p-3 rounded-2xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-m3-on-surface">2. Enable On-Device Model Flag</span>
                            <button
                              type="button"
                              onClick={() => copyFlagText('chrome://flags/#optimization-guide-on-device-model')}
                              className="px-2 py-1 rounded-lg bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedFlag === 'chrome://flags/#optimization-guide-on-device-model' ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>Copy URL</span>
                            </button>
                          </div>
                          <code className="text-[11px] font-mono text-m3-primary block">
                            chrome://flags/#optimization-guide-on-device-model
                          </code>
                          <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                            Open this flag and select <strong>Enabled BypassPrefRequirement</strong>.
                          </p>
                        </div>

                        {/* Step 3 */}
                        <div className="p-3 rounded-2xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-1">
                          <span className="font-bold text-m3-on-surface block">3. Relaunch & Download Weights</span>
                          <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                            Tap <strong>Relaunch</strong> at the bottom of Chrome. Then visit <code className="font-mono text-m3-primary">chrome://components/</code>, find <strong>Optimization Guide On Device Model</strong>, and tap <strong>Check for update</strong>.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Automatic Fallback & Cloud Policy */}
                    <div className="space-y-2 pt-1 text-xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
                        Fallback & Offline Engines
                      </h4>

                      <div className="p-3 rounded-2xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-m3-on-surface font-semibold text-xs">
                          <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Built-In WebAssembly OCR (Automatic Fallback)</span>
                        </div>
                        <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                          Even if Gemini Nano is not enabled on your device, Reco automatically falls back to our local WebAssembly OCR and bundled 2,500+ Costco catalog. Fast, private, and works 100% offline.
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-m3-on-surface font-semibold text-xs">
                          <WifiOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Offline Only Toggle (Strict Local Enforcement)</span>
                        </div>
                        <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                          In <strong>Settings &gt; Engine</strong>, choose <strong>Air-Gapped / Strict On-Device</strong> to strictly disable all external network requests to Gemini cloud services. This forces the app to exclusively use local on-device Gemini Nano and local WebAssembly processing with 100% data privacy and zero cloud network traffic.
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-m3-on-surface font-semibold text-xs">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Cloud Fallback Toggle (Off by Default)</span>
                        </div>
                        <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                          Under <strong>Settings &gt; AI Processing Engine</strong>, the "Allow Cloud AI Fallback" toggle is turned <strong>OFF by default</strong>. Cloud Google APIs will never be accessed unless you explicitly choose to enable them or supply your own personal API key.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: CHROME EXTENSION */}
                {activeTab === 'extension' && (
                  <motion.div
                    key="tab-extension"
                    custom={direction}
                    variants={m3SharedAxisXVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant/50 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-m3-on-surface font-bold text-xs">
                          <ShieldCheck className="w-4 h-4 text-m3-primary" />
                          <span>Costco Receipt Downloader Extension</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-m3-secondary-container text-m3-on-secondary-container font-semibold">
                          Chrome Web Store
                        </span>
                      </div>
                      <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                        Costco does not provide an open public API. The third-party <strong>"Costco Receipt Downloader"</strong> Chrome extension allows you to download your complete purchase history (in-warehouse & online) as a JSON file while logged into your Costco account.
                      </p>
                      <div>
                        <a
                          href="https://chromewebstore.google.com/detail/costco-receipts-downloade/nnalnbomehfogoleegpfegaeoofheemn?hl=en"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                        >
                          <Chrome className="w-4 h-4" />
                          <span>Install Costco Receipt Downloader</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
                        Quick 3-Step Setup
                      </h4>

                      <div className="space-y-2.5">
                        <div className="p-3 rounded-xl bg-m3-surface-container-low border border-m3-outline-variant/40 flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-m3-primary text-m3-on-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                            1
                          </span>
                          <div>
                            <span className="font-semibold text-m3-on-surface block">
                              Install Extension & Log in to Costco
                            </span>
                            <span className="text-m3-on-surface-variant text-[11px]">
                              Add Costco Receipt Downloader from the Chrome Web Store, then visit Costco.com or Costco.ca &rarr; "Orders & Purchases".
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-m3-surface-container-low border border-m3-outline-variant/40 flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-m3-primary text-m3-on-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                            2
                          </span>
                          <div>
                            <span className="font-semibold text-m3-on-surface block">
                              Click Extension Icon to Download JSON
                            </span>
                            <span className="text-m3-on-surface-variant text-[11px]">
                              Click the extension icon on the Orders page. It will automatically fetch your receipt details and save a JSON file to your device.
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-m3-surface-container-low border border-m3-outline-variant/40 flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-m3-primary text-m3-on-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                            3
                          </span>
                          <div>
                            <span className="font-semibold text-m3-on-surface block">
                              Import into Reco
                            </span>
                            <span className="text-m3-on-surface-variant text-[11px]">
                              Drag and drop the downloaded JSON file into Reco. All item IDs, dates, and prices are immediately indexed for lightning-fast search!
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Console Snippet Fallback */}
                    <div className="p-3.5 rounded-2xl bg-m3-surface-container-highest/60 border border-m3-outline-variant/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-m3-on-surface flex items-center gap-1.5">
                          <FileJson className="w-3.5 h-3.5 text-m3-primary" />
                          <span>Console Snippet Alternative</span>
                        </span>
                        <button
                          type="button"
                          onClick={copyScriptSnippet}
                          className="px-2.5 py-1 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface text-[11px] font-semibold inline-flex items-center gap-1 border border-m3-outline-variant/40 cursor-pointer transition-colors"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Snippet</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                        Don't have the extension installed? You can extract your orders in 10 seconds by pasting our extractor script directly into Chrome DevTools.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* TAB 3: GOOGLE DRIVE SYNC */}
                {activeTab === 'drive_sync' && (
                  <motion.div
                    key="tab-drive-sync"
                    custom={direction}
                    variants={m3SharedAxisXVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                        <Cloud className="w-4 h-4" />
                        <span>Encrypted & Private Google Drive Sync</span>
                      </div>
                      <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                        Reco syncs directly with your personal Google Drive storage using Google's secure OAuth flow. Your receipt data never touches any third-party server.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
                        Why Use Google Drive Sync?
                      </h4>

                      <ul className="space-y-2 text-xs text-m3-on-surface">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Private to your account:</strong> Files are saved in your Google Drive App Data / Files folder and are inaccessible to anyone else.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Seamless Restore:</strong> Switch devices or install on a new phone anytime and restore your full history with one tap.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Zero server storage:</strong> We never store your receipts on remote servers. Communication is directly between your browser and Google Drive API.
                          </span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSync();
                      }}
                      className="w-full py-2.5 px-4 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Cloud className="w-4 h-4" />
                      <span>Manage Google Drive Sync Settings</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-m3-outline-variant/40 bg-m3-surface-container-high/60 flex items-center justify-between shrink-0 text-xs">
              <span className="text-[11px] text-m3-on-surface-variant font-medium">
                Reco • Fast & Private
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full bg-m3-surface-container-highest hover:bg-m3-surface-container-high text-m3-on-surface font-semibold text-xs transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
