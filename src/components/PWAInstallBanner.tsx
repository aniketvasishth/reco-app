import React, { useState } from 'react';
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
} from 'lucide-react';

interface PWAInstallBannerProps {
  show: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isInstalled: boolean;
  hasDeferredPrompt: boolean;
  onInstall: () => Promise<'accepted' | 'dismissed' | 'ios_guide' | 'android_guide' | 'unsupported'>;
  onDismiss: () => void;
}

export function PWAInstallBanner({
  show,
  isIOS,
  isAndroid,
  isInstalled,
  hasDeferredPrompt,
  onInstall,
  onDismiss,
}: PWAInstallBannerProps) {
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed or shouldn't show, render nothing
  if (isInstalled || !show) {
    return null;
  }

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
      } else if (result === 'android_guide' || result === 'unsupported') {
        setShowAndroidModal(true);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <>
      {/* Floating Bottom Install Banner for Mobile & Tablet */}
      <div
        id="pwa-install-bottom-banner"
        className="fixed bottom-3 left-3 right-3 sm:bottom-5 sm:left-auto sm:right-5 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300"
      >
        <div className="bg-m3-surface-container-high/95 backdrop-blur-md rounded-[28px] p-4.5 shadow-2xl border border-m3-outline-variant/50 text-m3-on-surface relative overflow-hidden">
          {/* Top M3 Gradient Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-m3-primary via-m3-secondary to-m3-tertiary" />

          {/* Close / Dismiss Button */}
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 p-1.5 text-m3-on-surface-variant hover:text-m3-on-surface rounded-full hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
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
                className="w-12 h-12 rounded-2xl shadow-md border border-m3-outline-variant/40 object-cover bg-m3-primary"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icons/icon-light-192.png';
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
              </div>
            </div>

            {/* App Title & Value Proposition */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm text-m3-on-surface tracking-tight">
                  Install Reco App
                </h4>
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-m3-primary-container text-m3-on-primary-container border border-m3-outline-variant/30">
                  Native PWA
                </span>
              </div>
              <p className="text-xs text-m3-on-surface-variant mt-1 leading-snug">
                Adds a shortcut to your <strong>Homescreen & App Drawer</strong> for full-screen camera scanning and instant offline search.
              </p>
            </div>
          </div>

          {/* Feature Highlights Pill Row */}
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-m3-on-surface-variant overflow-x-auto pb-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-m3-surface-container border border-m3-outline-variant/30 shrink-0">
              <Home className="w-3 h-3 text-m3-primary" /> Homescreen
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-m3-surface-container border border-m3-outline-variant/30 shrink-0">
              <Grid className="w-3 h-3 text-m3-primary" /> App Drawer
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-m3-surface-container border border-m3-outline-variant/30 shrink-0">
              <Zap className="w-3 h-3 text-amber-500" /> Offline Fast
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-m3-primary hover:bg-m3-primary/90 active:scale-98 text-m3-on-primary text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{isIOS ? 'Add to Home Screen' : 'Install App'}</span>
            </button>

            <button
              onClick={onDismiss}
              className="py-2.5 px-4 rounded-full border border-m3-outline-variant/50 bg-m3-surface-container hover:bg-m3-surface-container-highest text-xs font-medium text-m3-on-surface transition-colors cursor-pointer"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>

      {/* Android Step-by-Step Installation Modal (Fallback / Manual Guide) */}
      {showAndroidModal && (
        <div
          id="android-install-guide-backdrop"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowAndroidModal(false)}
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
                    Adds Reco to your Home Screen & App Drawer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAndroidModal(false)}
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

            <button
              onClick={() => setShowAndroidModal(false)}
              className="w-full py-2.5 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Step-by-Step Installation Modal */}
      {showIOSModal && (
        <div
          id="ios-install-guide-backdrop"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
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
                    Install via Safari in 2 quick taps
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
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
                    <span>Tap the Safari</span>
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
                    <span>Scroll and select</span>
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
                    You can now open Reco anytime directly from your iPhone home screen!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-full bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container text-xs font-semibold transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

