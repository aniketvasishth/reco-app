import React from 'react';
import { X, TrendingUp, Tag, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PriceTrendSummary } from '../utils/priceTrend';
import { PriceTrendChart } from './PriceTrendChart';
import { M3_TRANSITIONS, M3_BOTTOM_SHEET_DRAG } from '../utils/motion';
import { M3Ripple } from './M3Ripple';

interface PriceTrendModalProps {
  trend: PriceTrendSummary | null;
  onClose: () => void;
  onViewReceipt: (orderId: string) => void;
}

export function PriceTrendModal({ trend, onClose, onViewReceipt }: PriceTrendModalProps) {
  const { onPointerDown: onCloseDown, renderRipples: renderCloseRipples } = M3Ripple({ color: 'bg-white/20' });

  return (
    <AnimatePresence>
      {trend && (
        <motion.div
          key="price-trend-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
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
            className="bg-m3-surface-container text-m3-on-surface w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-m3-outline-variant/60 overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[90vh] touch-pan-y"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="pt-2 pb-1 bg-m3-primary flex justify-center sm:hidden cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.5 rounded-full bg-white/40" />
            </div>

            {/* Modal Header */}
            <div className="bg-m3-primary text-m3-on-primary px-4 py-3.5 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-m3-on-primary/15 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-m3-on-primary" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-m3-on-primary/80 block">
                    Price History & Inflation Trend
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-m3-on-primary leading-tight line-clamp-1">
                    {trend.displayName}
                  </h2>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={onCloseDown}
                onClick={onClose}
                className="relative overflow-hidden w-9 h-9 rounded-full flex items-center justify-center text-m3-on-primary/80 hover:text-m3-on-primary hover:bg-m3-on-primary/10 transition-colors cursor-pointer"
                aria-label="Close price trend modal"
              >
                {renderCloseRipples()}
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center gap-2 flex-wrap text-xs text-m3-on-surface-variant">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-mono font-bold bg-m3-secondary-container text-m3-on-secondary-container border border-m3-outline-variant/40">
                  <Tag className="w-3 h-3 text-m3-primary" />
                  ITEM #{trend.itemId}
                </span>
                {trend.brand && <span className="font-semibold text-m3-on-surface">{trend.brand}</span>}
                {trend.packageDetails && <span>• {trend.packageDetails}</span>}
              </div>

              {/* Chart Component */}
              <PriceTrendChart
                trend={trend}
                onViewReceipt={(orderId) => {
                  onClose();
                  onViewReceipt(orderId);
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
