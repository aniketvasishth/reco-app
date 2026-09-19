import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  X,
  Share,
  PlusSquare,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  ChevronRight,
  Grid,
  Home,
  Layers,
  MoreVertical,
  Check,
} from 'lucide-react';
import { M3_TRANSITIONS } from '../utils/motion';

interface PWAInstallBannerProps {
  show: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isInstalled: boolean;
  hasDeferredPrompt: boolean;
  forceOpenGuide?: boolean;
  onCloseGuide?: () => void;
  onInstall: () => Promise<'accepted' | 'dismissed' | 'ios_guide' | 'android_guide' | 'unsupported'>;
  onDismiss: () => void;
  onMarkAlreadyInstalled?: () => void;
}

export function PWAInstallBanner({
  show,
  isIOS,
  isAndroid,
  isInstalled,
  hasDeferredPrompt,
  forceOpenGuide,
  onCloseGuide,
  onInstall,
  onDismiss,
  onMarkAlreadyInstalled,
}: PWAInstallBannerProps) {
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  React.useEffect(() => {
    if (forceOpenGuide) {
      if (isIOS) {
        setShowIOSModal(true);
      } else if (isAndroid) {
        setShowAndroidModal(true);
      } else {
        setShowDesktopModal(true);
      }
    }
  }, [forceOpenGuide, isIOS, isAndroid]);

  const handleCloseGuide = () => {
    setShowIOSModal(false);
    setShowAndroidModal(false);
    setShowDesktopModal(false);
    onCloseGuide?.();
  };

  const handleMarkAsAlreadyInstalled = () => {
    onMarkAlreadyInstalled?.();
    handleCloseGuide();
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    setIsInstalling(true);
    try {
      const result = await onInstall();
      if (result === 'ios_guide') {
        setShowIOSModal(true);
      } else if (result === 'android_guide') {
        setShowAndroidModal(true);
      } else if (result === 'unsupported') {
        setShowDesktopModal(true);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  // If already installed or running from homescreen, never display the floating prompt
  const showBottomBanner = !isInstalled && show;

  return (
    <>
      {/* Floating Bottom Install Banner for Mobile & Tablet/Desktop */}
      <AnimatePresence>
        {showBottomBanner && (
          <motion.div
            id="pwa-install-bottom-banner"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={M3_TRANSITIONS.emphasizedEnter}
            className="fixed bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-auto sm:max-w-md z-40"
          >
            <div className="bg-m3-surface-container-high text-m3-on-surface rounded-3xl p-5 shadow-lg border border-m3-outline-variant/35 relative">
              {/* Close / Dismiss Button */}
              <button
                type="button"
                onClick={onDismiss}
                className="absolute top-3.5 right-3.5 p-1.5 text-m3-on-surface-variant hover:text-m3-on-surface rounded-full hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
                aria-label="Dismiss install prompt"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-3.5 pr-6">
                {/* App Icon */}
                <div className="relative shrink-0">
                  <img
                    src="/icon-192.png"
                    alt="Reco App Icon"
                    className="w-12 h-12 rounded-2xl shadow-xs border border-m3-outline-variant/30 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icons/icon-light-192.png';
                    }}
                  />
                </div>

                {/* App Title & Value Proposition */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-m3-on-surface tracking-tight">
                      Install Reco App
                    </h4>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-m3-secondary-container text-m3-on-secondary-container">
                      PWA
                    </span>
                  </div>
                  <p className="text-xs text-m3-on-surface-variant mt-1 leading-relaxed">
                    Add shortcut for instant offline receipt search, smart catalog indexing, and full-screen camera scanning.
                  </p>
                </div>
              </div>

              {/* Material 3 Assist Chips */}
              <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-m3-on-surface-variant overflow-x-auto no-scrollbar pb-0.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-m3-surface-container-highest/80 border border-m3-outline-variant/30 shrink-0 font-medium">
                  <Home className="w-3 h-3 text-m3-primary" /> Home Screen
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-m3-surface-container-highest/80 border border-m3-outline-variant/30 shrink-0 font-medium">
                  <Grid className="w-3 h-3 text-m3-primary" /> App Drawer
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-m3-surface-container-highest/80 border border-m3-outline-variant/30 shrink-0 font-medium">
                  <Zap className="w-3 h-3 text-amber-500" /> 100% Offline
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-m3-primary hover:bg-m3-primary/90 active:scale-[0.98] text-m3-on-primary text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>{isIOS ? 'Add to Home Screen' : 'Install App'}</span>
                </button>

                <button
                  type="button"
                  onClick={onDismiss}
                  className="py-2.5 px-4 rounded-full bg-m3-surface-container-highest hover:bg-m3-surface-container-highest/70 active:scale-[0.98] text-xs font-semibold text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer"
                >
                  Not Now
                </button>
              </div>

              {/* Subtle footer */}
              <div className="mt-3 pt-2.5 border-t border-m3-outline-variant/20 flex items-center justify-between text-[11px]">
                <span className="text-m3-on-surface-variant/80">Already on your home screen?</span>
                <button
                  type="button"
                  onClick={handleMarkAsAlreadyInstalled}
                  className="font-semibold text-m3-primary hover:underline cursor-pointer"
                >
                  Don&apos;t prompt again
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Android Step-by-Step Installation Modal (Fallback / Manual Guide) */}
      {showAndroidModal && (
        <div
          id="android-install-guide-backdrop"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={handleCloseGuide}
        >
          <div
            id="android-install-guide-card"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-m3-surface-container-high text-m3-on-surface rounded-[28px] p-5 shadow-2xl border border-m3-outline-variant/50 space-y-4 animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="flex items-center justify-between pb-2 border-b border-m3-outline-variant/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-m3-on-surface">
                    Install on Android
                  </h3>
                  <p className="text-[11px] text-m3-on-surface-variant">
                    Adds Reco to your Home Screen &amp; App Drawer
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseGuide}
                className="p-1.5 text-m3-on-surface-variant hover:text-m3-on-surface rounded-full hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Steps */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-3 p-3 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30">
                <div className="w-6 h-6 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-m3-on-surface flex items-center gap-1.5">
                    <span>Tap Chrome Menu</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-m3-surface-container-high border border-m3-outline-variant/40 font-medium text-[11px] text-m3-primary">
                      <MoreVertical className="w-3 h-3" /> (3 dots)
                    </span>
                  </div>
                  <p className="text-[11px] text-m3-on-surface-variant mt-0.5">
                    Located in the top right corner of Chrome browser.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30">
                <div className="w-6 h-6 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-m3-on-surface flex items-center gap-1.5">
                    <span>Select</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-m3-surface-container-high border border-m3-outline-variant/40 font-semibold text-[11px] text-m3-primary">
                      <Download className="w-3 h-3" /> Install app / Add to Home screen
                    </span>
                  </div>
                  <p className="text-[11px] text-m3-on-surface-variant mt-0.5">
                    Android will create an icon in your app drawer and home screen.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30">
                <div className="w-6 h-6 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-m3-on-surface">
                    Open like a Native App
                  </div>
                  <p className="text-[11px] text-m3-on-surface-variant mt-0.5">
                    Launches full-screen with offline receipt search and instant camera scanner.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleMarkAsAlreadyInstalled}
                className="w-full py-2.5 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs font-semibold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>I&apos;ve Installed This / Already on Phone</span>
              </button>

              <button
                onClick={handleCloseGuide}
                className="w-full py-2 rounded-full border border-m3-outline-variant/40 hover:bg-m3-surface-container-highest text-xs text-m3-on-surface-variant transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Step-by-Step Installation Modal */}
      {showIOSModal && (
        <div
          id="ios-install-guide-backdrop"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={handleCloseGuide}
        >
          <div
            id="ios-install-guide-card"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-m3-surface-container-high text-m3-on-surface rounded-[28px] p-5 shadow-2xl border border-m3-outline-variant/50 space-y-4 animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="flex items-center justify-between pb-2 border-b border-m3-outline-variant/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-m3-on-surface">
                    Install on iPhone / iPad
                  </h3>
                  <p className="text-[11px] text-m3-on-surface-variant">
                    Add bookmark to Home Screen
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseGuide}
                className="p-1.5 text-m3-on-surface-variant hover:text-m3-on-surface rounded-full hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Steps */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-3 p-3 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30">
                <div className="w-6 h-6 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-m3-on-surface flex items-center gap-1.5">
                    <span>Tap Safari</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-m3-surface-container-high border border-m3-outline-variant/40 font-medium text-[11px] text-m3-primary">
                      <Share className="w-3.5 h-3.5" /> Share
                    </span>
                    <span>button</span>
                  </div>
                  <p className="text-[11px] text-m3-on-surface-variant mt-0.5">
                    Located in the bottom navigation toolbar of Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30">
                <div className="w-6 h-6 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-m3-on-surface flex items-center gap-1.5">
                    <span>Scroll down and select</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-m3-surface-container-high border border-m3-outline-variant/40 font-medium text-[11px] text-m3-on-surface">
                      <PlusSquare className="w-3.5 h-3.5 text-m3-primary" /> Add to Home Screen
                    </span>
                  </div>
                  <p className="text-[11px] text-m3-on-surface-variant mt-0.5">
                    This adds Reco as a dedicated standalone app icon.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30">
                <div className="w-6 h-6 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-m3-on-surface">
                    Tap <strong className="text-m3-primary">Add</strong> in top-right corner
                  </div>
                  <p className="text-[11px] text-m3-on-surface-variant mt-0.5">
                    You can now open Reco directly from your iPhone home screen with zero browser bars!
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleMarkAsAlreadyInstalled}
                className="w-full py-2.5 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs font-semibold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>I&apos;ve Added This to Home Screen</span>
              </button>

              <button
                onClick={handleCloseGuide}
                className="w-full py-2 rounded-full border border-m3-outline-variant/40 hover:bg-m3-surface-container-highest text-xs text-m3-on-surface-variant transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop / Laptop Chrome & Edge Installation Modal */}
      {showDesktopModal && (
        <div
          id="desktop-install-guide-backdrop"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={handleCloseGuide}
        >
          <div
            id="desktop-install-guide-card"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-m3-surface-container-high text-m3-on-surface rounded-[28px] p-5 shadow-2xl border border-m3-outline-variant/50 space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-m3-outline-variant/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-m3-on-surface">
                    {isInstalled ? 'Reco is Installed' : 'Install Reco PWA'}
                  </h3>
                  <p className="text-[11px] text-m3-on-surface-variant">
                    {isInstalled ? 'Offline access active' : 'Desktop & Mobile App'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseGuide}
                className="p-1.5 text-m3-on-surface-variant hover:text-m3-on-surface rounded-full hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isInstalled ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-m3-on-surface">
                  Reco is already installed!
                </p>
                <p className="text-[11px] text-m3-on-surface-variant">
                  You can launch Reco directly from your computer apps or mobile home screen with zero latency.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-3 p-3 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30">
                  <div className="w-6 h-6 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-m3-on-surface">
                      Look for Install Icon in Address Bar
                    </div>
                    <p className="text-[11px] text-m3-on-surface-variant mt-0.5">
                      In Chrome or Edge, look for the <strong>Install icon</strong> (computer monitor with down arrow) on the right side of the address bar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30">
                  <div className="w-6 h-6 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-m3-on-surface">
                      Or Open Browser Menu (⋮)
                    </div>
                    <p className="text-[11px] text-m3-on-surface-variant mt-0.5">
                      Click the three dots menu &rarr; <strong>Cast, save, and share</strong> &rarr; <strong>Install Reco...</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {!isInstalled && (
                <button
                  onClick={handleMarkAsAlreadyInstalled}
                  className="w-full py-2.5 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs font-semibold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Already Installed / Don&apos;t Prompt Again</span>
                </button>
              )}

              <button
                onClick={handleCloseGuide}
                className="w-full py-2 rounded-full border border-m3-outline-variant/40 hover:bg-m3-surface-container-highest text-xs text-m3-on-surface-variant transition-colors cursor-pointer"
              >
                {isInstalled ? 'Done' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
