import React from 'react';
import {
  X,
  Camera,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'standard' | 'long') => void;
}

export function ScanReceiptModal({
  isOpen,
  onClose,
  onSelectMode,
}: ScanReceiptModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="scan-receipt-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          id="scan-receipt-modal-card"
          className="bg-m3-surface-container text-m3-on-surface rounded-[28px] shadow-2xl max-w-md w-full overflow-hidden border border-m3-outline-variant/60 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-m3-outline-variant/40 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base font-bold text-m3-on-surface">Scan & Add Receipts</h2>
              <div className="flex items-center gap-1.5 text-xs text-m3-primary font-medium mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Live Edge Detection • AI Vision Extraction</span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 text-m3-on-surface-variant hover:text-m3-on-surface rounded-full hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Body: Camera Scanning Modes */}
          <div className="p-5 space-y-3">
            {/* Option 1: Scan Normal Receipt */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClose();
                onSelectMode('standard');
              }}
              className="w-full text-left p-3.5 rounded-2xl bg-m3-surface-container-high hover:bg-m3-surface-container-highest border border-m3-outline-variant/50 hover:border-m3-primary/50 transition-all group flex items-start gap-3.5 cursor-pointer shadow-xs"
            >
              <div className="w-11 h-11 rounded-2xl bg-m3-secondary-container text-m3-on-secondary-container flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <Camera className="w-5 h-5 text-m3-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-m3-on-surface group-hover:text-m3-primary transition-colors">
                    Scan Normal Receipt
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-m3-primary/10 text-m3-primary shrink-0">
                    Camera Snap
                  </span>
                </div>
                <p className="text-xs text-m3-on-surface-variant mt-0.5 leading-relaxed">
                  Real-time white receipt boundary recognition and instant SKU indexing.
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-m3-on-surface-variant group-hover:text-m3-primary group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
            </motion.button>

            {/* Option 2: Scan Long Receipt */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClose();
                onSelectMode('long');
              }}
              className="w-full text-left p-3.5 rounded-2xl bg-m3-surface-container-high hover:bg-m3-surface-container-highest border border-m3-outline-variant/50 hover:border-m3-primary/50 transition-all group flex items-start gap-3.5 cursor-pointer shadow-xs"
            >
              <div className="w-11 h-11 rounded-2xl bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <Layers className="w-5 h-5 text-m3-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-m3-on-surface group-hover:text-m3-primary transition-colors">
                    Scan Long Receipt
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    Multi-Section
                  </span>
                </div>
                <p className="text-xs text-m3-on-surface-variant mt-0.5 leading-relaxed">
                  For tall receipts. Multiple photos are auto-stitched and deduplicated with AI.
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-m3-on-surface-variant group-hover:text-m3-primary group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
            </motion.button>
          </div>

          {/* Footer Tip */}
          <div className="px-6 py-3.5 bg-m3-surface-container-low/80 border-t border-m3-outline-variant/30 text-[11px] text-m3-on-surface-variant flex items-center justify-between gap-2">
            <span>Supports standard single-shot and long multi-section receipt camera scans.</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
