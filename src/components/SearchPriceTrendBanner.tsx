import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PriceTrendSummary } from '../utils/priceTrend';
import { PriceTrendChart } from './PriceTrendChart';
import { M3_TRANSITIONS } from '../utils/motion';
import { M3Ripple } from './M3Ripple';

interface SearchPriceTrendBannerProps {
  trends: PriceTrendSummary[];
  onViewReceipt: (orderId: string) => void;
}

export function SearchPriceTrendBanner({
  trends,
  onViewReceipt,
}: SearchPriceTrendBannerProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(
    trends.length === 1 ? trends[0].itemId : null
  );

  if (!trends || trends.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={M3_TRANSITIONS.emphasizedEnter}
      className="bg-m3-surface-container-high rounded-3xl p-4 sm:p-5 border border-m3-outline-variant/50 shadow-xs space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-m3-primary/10 flex items-center justify-center text-m3-primary shrink-0">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs uppercase font-bold tracking-wider text-m3-on-surface">
            Price Trend{trends.length > 1 ? `s (${trends.length})` : ''}
          </span>
        </div>
        <span className="text-[11px] text-m3-on-surface-variant font-medium">
          {trends.length === 1 ? 'Purchased > 2 times' : 'Matching items bought > 2 times'}
        </span>
      </div>

      <div className="space-y-2.5">
        {trends.map((trend) => {
          const isExpanded = expandedItemId === trend.itemId;
          const isUp = trend.direction === 'up';
          const isDown = trend.direction === 'down';

          return (
            <div
              key={trend.itemId}
              className="bg-m3-surface-container-lowest dark:bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-2xl p-3 sm:p-3.5 transition-all shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-m3-secondary-container text-m3-on-secondary-container">
                      <Tag className="w-2.5 h-2.5 text-m3-primary" />
                      #{trend.itemId}
                    </span>
                    {trend.brand && (
                      <span className="text-xs font-semibold text-m3-on-surface-variant">
                        {trend.brand}
                      </span>
                    )}
                    <span className="text-xs font-bold text-m3-on-surface truncate max-w-xs">
                      {trend.displayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 text-xs text-m3-on-surface-variant flex-wrap">
                    <span className="font-mono text-m3-on-surface font-semibold">
                      ${trend.firstPrice.toFixed(2)} → ${trend.latestPrice.toFixed(2)}
                    </span>
                    <span>•</span>
                    <span>{trend.purchaseCount} purchases</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Trend Pill */}
                  <div
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-2xs border ${
                      isUp
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        : isDown
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-m3-surface-container text-m3-on-surface-variant border-m3-outline-variant/30'
                    }`}
                  >
                    {isUp && <TrendingUp className="w-3.5 h-3.5" />}
                    {isDown && <TrendingDown className="w-3.5 h-3.5" />}
                    {!isUp && !isDown && <Minus className="w-3.5 h-3.5" />}
                    <span>
                      {isUp && `+${trend.percentChange}%`}
                      {isDown && `${trend.percentChange}%`}
                      {!isUp && !isDown && 'Steady'}
                    </span>
                  </div>

                  {/* Toggle Chart Button */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setExpandedItemId(isExpanded ? null : trend.itemId)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-primary cursor-pointer transition-colors border border-m3-outline-variant/30"
                  >
                    <span>{isExpanded ? 'Hide Chart' : 'Price Chart'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Collapsible Chart */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={M3_TRANSITIONS.emphasizedEnter}
                    className="overflow-hidden pt-3 border-t border-m3-outline-variant/30 mt-3"
                  >
                    <PriceTrendChart
                      trend={trend}
                      onViewReceipt={onViewReceipt}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
