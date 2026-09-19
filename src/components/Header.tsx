import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  ChevronRight,
  MessageSquarePlus,
  HelpCircle,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CostcoReceipt, CostcoItem } from '../types';

interface HeaderProps {
  receipts: CostcoReceipt[];
  items: CostcoItem[];
  isInstalled?: boolean;
  isDesktop?: boolean;
  hasSearchQuery?: boolean;
  onResetSearch?: () => void;
  onOpenScan?: () => void;
  onOpenUpload?: () => void;
  onOpenSettings?: () => void;
  onOpenSummary: () => void;
  onOpenFeedback: () => void;
  onOpenHowTo: () => void;
  onOpenInstall?: () => void;
  onOpenPrivacySettings?: () => void;
  onToggleViewMode?: () => void;
  currentViewMode?: 'auto' | 'desktop' | 'mobile';
}

export function Header({
  receipts,
  items,
  isInstalled,
  isDesktop = false,
  hasSearchQuery = false,
  onResetSearch,
  onOpenScan,
  onOpenUpload,
  onOpenSettings,
  onOpenSummary,
  onOpenFeedback,
  onOpenHowTo,
  onOpenInstall,
  onOpenPrivacySettings,
  onToggleViewMode,
  currentViewMode = 'auto',
}: HeaderProps) {
  const [showSecurityTooltip, setShowSecurityTooltip] = useState(false);
  const securityTimerRef = useRef<number | null>(null);
  const tooltipContainerRef = useRef<HTMLDivElement | null>(null);

  const handleToggleSecurityInfo = () => {
    if (securityTimerRef.current) {
      window.clearTimeout(securityTimerRef.current);
      securityTimerRef.current = null;
    }

    setShowSecurityTooltip((prev) => {
      const next = !prev;
      if (next) {
        // Automatically fade away after 6 seconds if not closed manually
        securityTimerRef.current = window.setTimeout(() => {
          setShowSecurityTooltip(false);
          securityTimerRef.current = null;
        }, 6000);
      }
      return next;
    });
  };

  const handleCloseSecurityTooltip = () => {
    if (securityTimerRef.current) {
      window.clearTimeout(securityTimerRef.current);
      securityTimerRef.current = null;
    }
    setShowSecurityTooltip(false);
  };

  useEffect(() => {
    return () => {
      if (securityTimerRef.current) {
        window.clearTimeout(securityTimerRef.current);
      }
    };
  }, []);

  return (
    <header className="border-b border-m3-outline-variant/30 bg-m3-background/95 backdrop-blur-md sticky top-0 z-30 transition-colors pt-[env(safe-area-inset-top,0px)] px-3 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto py-2.5 sm:py-3 md:py-3.5 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: All tool and status icons in requested order: Privacy, How To, Feedback */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 1. Privacy/Security Shield Indicator with On-Device Pill */}
          <div className="relative" ref={tooltipContainerRef}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              id="privacy-security-indicator-btn"
              onClick={handleToggleSecurityInfo}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                showSecurityTooltip
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/40'
                  : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20'
              }`}
              title={showSecurityTooltip ? 'Hide Privacy Info' : 'Privacy & Data Security (100% On-Device)'}
              aria-label="Privacy and data security information"
              aria-expanded={showSecurityTooltip}
            >
              <ShieldCheck className="w-4 h-4 md:w-4.5 md:h-4.5 shrink-0 text-emerald-500" />
              <span className="hidden sm:inline text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                100% On-Device
              </span>
            </motion.button>

            <AnimatePresence>
              {showSecurityTooltip && (
                <motion.div
                  id="privacy-security-tooltip"
                  role="status"
                  aria-live="polite"
                  initial={{ opacity: 0, scale: 0.9, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 p-3.5 bg-m3-inverse-surface text-m3-inverse-on-surface rounded-2xl shadow-xl border border-m3-outline-variant/30 text-xs leading-relaxed"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-m3-inverse-on-surface mb-0.5">100% On-Device & Private</p>
                        <p className="opacity-90 text-[11px] leading-normal">
                          Your receipt data and OCR run exclusively on your local device with complete privacy.
                        </p>
                        {onOpenPrivacySettings && (
                          <button
                            type="button"
                            onClick={() => {
                              handleCloseSecurityTooltip();
                              onOpenPrivacySettings();
                            }}
                            className="mt-2 text-[11px] font-bold text-emerald-300 hover:text-emerald-200 underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open Engine & Privacy Settings</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleCloseSecurityTooltip}
                      className="text-m3-inverse-on-surface/60 hover:text-m3-inverse-on-surface p-1 rounded-full hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                      aria-label="Close tooltip"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* Subtle decorative arrow pointing to icon */}
                  <div className="absolute -top-1.5 left-3.5 w-3 h-3 bg-m3-inverse-surface border-t border-l border-m3-outline-variant/30 rotate-45 pointer-events-none" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. How To / Help Guide Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            id="howto-guide-header-btn"
            onClick={onOpenHowTo}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-surface-container-highest transition-colors cursor-pointer flex items-center justify-center border border-m3-outline-variant/30 shadow-2xs"
            title="How to Use Reco & Chrome Extension Guide"
            aria-label="How to Use Guide"
          >
            <HelpCircle className="w-4.5 h-4.5 md:w-5 md:h-5 text-m3-primary" />
          </motion.button>

          {/* 3. Feedback & Bug Report Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            id="feedback-header-btn"
            onClick={onOpenFeedback}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-surface-container-highest transition-colors cursor-pointer flex items-center justify-center border border-m3-outline-variant/30 shadow-2xs"
            title="Send Feedback or Report Bug to developer"
            aria-label="Send feedback"
          >
            <MessageSquarePlus className="w-4 h-4 md:w-4.5 md:h-4.5 text-m3-on-surface-variant" />
          </motion.button>
        </div>

        {/* Right: Summary pill ONLY */}
        <div className="flex items-center shrink-0">
          <motion.button
            whileTap={{ scale: 0.94 }}
            id="header-summary-btn"
            onClick={onOpenSummary}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 md:px-4.5 py-1.5 sm:py-2 md:py-2.5 rounded-full bg-m3-secondary-container hover:bg-m3-secondary-container/85 text-m3-on-secondary-container text-xs sm:text-sm font-semibold border border-m3-outline-variant/40 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
            title="View spending summary and reward analytics (Press M)"
            aria-label="View spending summary and reward analytics"
          >
            <span className="font-semibold">Summary</span>
            {items.length > 0 && (
              <span className="px-2 py-0.5 bg-m3-primary text-m3-on-primary text-[10px] md:text-xs rounded-full font-mono font-bold leading-none shadow-2xs">
                {items.length}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
}
