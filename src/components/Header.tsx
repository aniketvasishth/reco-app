import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  ChevronRight,
  MessageSquarePlus,
  HelpCircle,
  Download,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CostcoReceipt, CostcoItem } from '../types';

interface HeaderProps {
  receipts: CostcoReceipt[];
  items: CostcoItem[];
  isInstalled?: boolean;
  onOpenSummary: () => void;
  onOpenFeedback: () => void;
  onOpenHowTo: () => void;
  onOpenInstall?: () => void;
}

export function Header({
  items,
  isInstalled,
  onOpenSummary,
  onOpenFeedback,
  onOpenHowTo,
  onOpenInstall,
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
        // Automatically fade away after 4 seconds if not closed manually
        securityTimerRef.current = window.setTimeout(() => {
          setShowSecurityTooltip(false);
          securityTimerRef.current = null;
        }, 4000);
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
    <header className="border-b border-m3-outline-variant/30 bg-m3-background/95 backdrop-blur-md sticky top-0 z-30 transition-colors pt-[env(safe-area-inset-top,0px)] px-3 sm:px-6 md:px-8">
      <div className="max-w-4xl mx-auto py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Top Left: Privacy, How To Guide & Install */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Privacy/Security Shield Indicator */}
          <div className="relative" ref={tooltipContainerRef}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              id="privacy-security-indicator-btn"
              onClick={handleToggleSecurityInfo}
              className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                showSecurityTooltip
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/40'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
              }`}
              title={showSecurityTooltip ? 'Hide Privacy Info' : 'Privacy & Data Security (Tap to show/hide)'}
              aria-label="Privacy and data security information"
              aria-expanded={showSecurityTooltip}
            >
              <ShieldCheck className="w-5 h-5 shrink-0" />
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
                        <p className="font-semibold text-m3-inverse-on-surface mb-0.5">Data Privacy & Security</p>
                        <p className="opacity-90 text-[11px] leading-normal">
                          Your data remains completely private and secure. All receipt data is stored locally on your device and is never transmitted to remote servers.
                        </p>
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

          {/* How To / Help Guide Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            id="howto-guide-header-btn"
            onClick={onOpenHowTo}
            className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-surface-container-highest transition-colors cursor-pointer flex items-center justify-center"
            title="How to Use Reco & Chrome Extension Guide"
            aria-label="How to Use Guide"
          >
            <HelpCircle className="w-5 h-5 text-m3-primary" />
          </motion.button>

          {/* Quick Install App Button in Header when not yet installed */}
          {!isInstalled && onOpenInstall && (
            <>
              <motion.button
                whileTap={{ scale: 0.94 }}
                id="header-install-app-btn"
                onClick={onOpenInstall}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-m3-primary text-m3-on-primary hover:bg-m3-primary/90 text-xs font-semibold shadow-xs transition-all cursor-pointer ml-1"
                title="Install Reco to Homescreen & App Drawer"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Install App</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                id="header-install-app-mobile-btn"
                onClick={onOpenInstall}
                className="sm:hidden p-2 rounded-full text-m3-primary hover:bg-m3-primary/10 transition-colors cursor-pointer flex items-center justify-center"
                title="Install Reco App"
                aria-label="Install App"
              >
                <Download className="w-4.5 h-4.5" />
              </motion.button>
            </>
          )}
        </div>

        {/* Right Actions: Feedback & Summary Button */}
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          {/* Feedback & Bug Report - M3 Standard Icon Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onOpenFeedback}
            className="hidden xs:inline-flex p-2 rounded-full text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
            title="Send Feedback or Report Bug to developer"
            aria-label="Send feedback"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </motion.button>

          {/* Summary Button - Material 3 Filled Tonal Button with Badge & Spring Animation */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onOpenSummary}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 ml-1 rounded-full bg-m3-secondary-container hover:bg-m3-secondary-container/85 text-m3-on-secondary-container text-xs font-semibold transition-all cursor-pointer border border-m3-outline-variant/30 shadow-2xs shrink-0"
            title="View summary and purchase statistics"
          >
            <span>Summary</span>
            {items.length > 0 && (
              <motion.span
                key={items.length}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="px-1.5 py-0.5 bg-m3-primary text-m3-on-primary text-[10px] rounded-full font-mono font-bold leading-none shadow-2xs"
              >
                {items.length}
              </motion.span>
            )}
            <ChevronRight className="w-3.5 h-3.5 opacity-75" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
