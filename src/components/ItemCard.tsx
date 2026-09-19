import React, { useState } from 'react';
import {
  Calendar,
  CreditCard,
  Store,
  Globe,
  Copy,
  Check,
  Receipt,
  Tag,
  RefreshCw,
  ShoppingBag,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CostcoItem } from '../types';
import { M3_TRANSITIONS } from '../utils/motion';
import { M3Ripple } from './M3Ripple';

interface ItemCardProps {
  key?: string;
  item: CostcoItem;
  allItems?: CostcoItem[];
  allPurchases?: CostcoItem[];
  onViewReceipt: (orderId: string) => void;
  onReEnrich: (itemId: string, rawName: string) => void;
  onSearchKeyword?: (keyword: string) => void;
  isEnriching?: boolean;
}

export function ItemCard({
  item,
  onViewReceipt,
  onReEnrich,
  onSearchKeyword,
  isEnriching,
}: ItemCardProps) {
  const [copied, setCopied] = useState(false);
  const { onPointerDown: onTagDown, renderRipples: renderTagRipples } = M3Ripple({ color: 'bg-m3-primary/20' });
  const { onPointerDown: onReceiptDown, renderRipples: renderReceiptRipples } = M3Ripple({ color: 'bg-m3-primary/20' });
  const { onPointerDown: onEnrichDown, renderRipples: renderEnrichRipples } = M3Ripple({ color: 'bg-current' });
  const { onPointerDown: onDateDown, renderRipples: renderDateRipples } = M3Ripple({ color: 'bg-m3-primary/20' });
  const { onPointerDown: onPaidDown, renderRipples: renderPaidRipples } = M3Ripple({ color: 'bg-emerald-500/20' });
  const { onPointerDown: onStoreDown, renderRipples: renderStoreRipples } = M3Ripple({ color: 'bg-m3-primary/20' });
  const { onPointerDown: onCardDown, renderRipples: renderCardRipples } = M3Ripple({ color: 'bg-amber-500/20' });

  const copyItemId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.itemId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const displayName = item.productName || item.rawName;
  const isOnline = item.orderType === 'Online';
  const isReturn =
    item.totalPrice < 0 ||
    item.unitPrice < 0 ||
    /return|refund|retour/i.test(item.rawName || '') ||
    /return|refund/i.test(item.productName || '') ||
    (Boolean(item.isReturn) && (item.totalPrice <= 0 || /return|refund/i.test(item.description || '')));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={M3_TRANSITIONS.emphasizedEnter}
      whileHover={{ y: -2 }}
      className={`rounded-3xl border m3-elevation-transition p-4 sm:p-5 md:p-6 flex flex-col justify-between group relative overflow-hidden ${
        isReturn
          ? 'bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/30 dark:border-rose-400/40 hover:border-rose-500/50 hover:shadow-md'
          : 'bg-m3-surface-container-lowest dark:bg-m3-surface-container-low border-m3-outline-variant/50 hover:border-m3-outline/60 hover:shadow-md'
      }`}
    >
      {/* Top row: Item ID badge & Channel Badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          
          {/* Costco Item ID with 1-click Copy & M3 Ripple */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onPointerDown={onTagDown}
              onClick={copyItemId}
              title="Click to copy Costco Item ID"
              className={`relative overflow-hidden inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg font-mono text-xs md:text-sm font-semibold border transition-all cursor-pointer ${
                isReturn
                  ? 'bg-rose-500/20 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200 border-rose-500/30 dark:border-rose-400/30 hover:bg-rose-500/30'
                  : 'bg-m3-secondary-container text-m3-on-secondary-container hover:bg-m3-secondary-container/80 border-m3-outline-variant/40'
              }`}
            >
              {renderTagRipples()}
              <Tag className={`w-3.5 h-3.5 ${isReturn ? 'text-rose-600 dark:text-rose-300' : 'text-m3-primary'}`} />
              <span>ITEM #{item.itemId}</span>
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="checked"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={M3_TRANSITIONS.snappySpring}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {item.category && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSearchKeyword && item.category) onSearchKeyword(item.category);
                }}
                title={`Filter items by category: ${item.category}`}
                className={`inline-block px-2.5 md:px-3 py-0.5 md:py-1 rounded-md text-[11px] md:text-xs font-medium border cursor-pointer hover:opacity-85 transition-opacity ${
                  isReturn
                    ? 'bg-m3-error-container/30 text-m3-error dark:text-[#ffb4ab] border-m3-error/20'
                    : 'bg-m3-surface-container text-m3-on-surface-variant border-m3-outline-variant/40'
                }`}
              >
                {item.category}
              </button>
            )}
          </div>

          {/* Return Badge OR Warehouse vs Online purchase tag */}
          <div className="shrink-0 flex items-center gap-1.5">
            {isReturn && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewReceipt(item.orderId);
                }}
                title="View return receipt"
                className="inline-flex items-center gap-1 px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-[11px] md:text-xs font-bold bg-m3-error-container text-m3-on-error-container border border-m3-error/30 shadow-2xs cursor-pointer hover:opacity-90"
              >
                <RotateCcw className="w-3.5 h-3.5 text-m3-error dark:text-[#ffb4ab]" />
                Return
              </button>
            )}
            {isOnline ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSearchKeyword) onSearchKeyword('Costco.com');
                }}
                title="Filter online purchases"
                className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-[11px] md:text-xs font-semibold bg-m3-surface-container text-m3-on-surface-variant border border-m3-outline-variant/50 cursor-pointer hover:bg-m3-surface-container-high transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-m3-tertiary" />
                Online
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSearchKeyword && item.warehouseLocation) onSearchKeyword(item.warehouseLocation);
                }}
                title={`Filter items from ${item.warehouseLocation || 'Warehouse'}`}
                className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-[11px] md:text-xs font-semibold bg-m3-surface-container text-m3-on-surface-variant border border-m3-outline-variant/50 cursor-pointer hover:bg-m3-surface-container-high transition-colors"
              >
                <Store className="w-3.5 h-3.5 text-m3-primary" />
                Warehouse
              </button>
            )}
          </div>
        </div>

        {/* Product Title */}
        <h3 className={`text-base md:text-lg font-bold leading-snug transition-colors ${
          isReturn
            ? 'text-m3-on-surface group-hover:text-m3-error dark:group-hover:text-[#ffb4ab]'
            : 'text-m3-on-surface group-hover:text-m3-primary'
        }`}>
          {displayName}
        </h3>

        {/* Brand & Package Specs */}
        {(item.brand || item.packageDetails) && (
          <div className="flex items-center gap-2 mt-1.5 text-xs md:text-sm text-m3-on-surface-variant">
            {item.brand && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSearchKeyword && item.brand) onSearchKeyword(item.brand);
                }}
                title={`Filter items by brand: ${item.brand}`}
                className="font-semibold text-m3-on-surface hover:underline cursor-pointer"
              >
                {item.brand}
              </button>
            )}
            {item.brand && item.packageDetails && <span className="opacity-40">•</span>}
            {item.packageDetails && <span>{item.packageDetails}</span>}
          </div>
        )}

        {/* Raw receipt abbreviation text if different */}
        {item.productName && item.rawName && item.productName !== item.rawName && (
          <p className="text-[11px] md:text-xs text-m3-on-surface-variant/80 font-mono mt-0.5">
            Receipt: {item.rawName}
          </p>
        )}

        {/* Web Search Identification Description */}
        {item.description && (
          <p className={`mt-2.5 text-xs md:text-sm line-clamp-2 leading-relaxed p-2.5 md:p-3 rounded-2xl border ${
            isReturn
              ? 'bg-m3-error-container/20 text-m3-on-surface-variant border-m3-error/20'
              : 'bg-m3-surface-container text-m3-on-surface-variant border-m3-outline-variant/40'
          }`}>
            {item.description}
          </p>
        )}
      </div>

      {/* Primary Purchase Details: When, Amount, Location, Card (All Interactive Chips) */}
      <div className={`mt-3.5 pt-3 md:pt-3.5 border-t grid grid-cols-2 gap-2 md:gap-2.5 text-xs md:text-sm ${
        isReturn ? 'border-m3-error/20' : 'border-m3-outline-variant/40'
      }`}>
        
        {/* WHEN WAS IT BOUGHT - Opens Receipt */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onPointerDown={onDateDown}
          onClick={(e) => {
            e.stopPropagation();
            onViewReceipt(item.orderId);
          }}
          title="View receipt for this purchase date"
          className={`relative overflow-hidden flex items-center gap-2 p-2 md:p-2.5 rounded-xl text-left cursor-pointer transition-all hover:ring-1 hover:ring-m3-primary/30 ${
            isReturn ? 'bg-m3-error-container/20' : 'bg-m3-surface-container-low dark:bg-m3-surface-container'
          }`}
        >
          {renderDateRipples()}
          <Calendar className="w-4 h-4 text-m3-primary shrink-0" />
          <div className="truncate">
            <span className="text-[10px] md:text-[11px] uppercase font-bold text-m3-on-surface-variant block tracking-wider">
              Date
            </span>
            <span className="font-semibold text-m3-on-surface">
              {formatDate(item.orderDate)}
            </span>
          </div>
        </motion.button>

        {/* HOW MUCH WAS PAID / REFUNDED - Opens Receipt */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onPointerDown={onPaidDown}
          onClick={(e) => {
            e.stopPropagation();
            onViewReceipt(item.orderId);
          }}
          title="View receipt breakdown for this amount"
          className={`relative overflow-hidden flex items-center gap-2 p-2 md:p-2.5 rounded-xl text-left cursor-pointer transition-all hover:ring-1 hover:ring-emerald-500/30 ${
            isReturn ? 'bg-rose-500/15 dark:bg-rose-950/40 border border-rose-500/30 dark:border-rose-400/30' : 'bg-m3-surface-container-low dark:bg-m3-surface-container'
          }`}
        >
          {renderPaidRipples()}
          {isReturn ? (
            <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-200 shrink-0" />
          ) : (
            <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <div className="truncate">
            <span className="text-[10px] md:text-[11px] uppercase font-bold text-m3-on-surface-variant block tracking-wider">
              {isReturn ? 'Refunded' : 'Paid'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`font-bold font-mono ${
                isReturn ? 'text-rose-700 dark:text-rose-200' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {isReturn ? `-$${Math.abs(item.totalPrice).toFixed(2)}` : `$${item.totalPrice.toFixed(2)}`}
              </span>
              {item.quantity > 1 && (
                <span className="text-[10px] md:text-xs text-m3-on-surface-variant">
                  (×{item.quantity})
                </span>
              )}
            </div>
          </div>
        </motion.button>

        {/* WHERE - Filters by Location */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onPointerDown={onStoreDown}
          onClick={(e) => {
            e.stopPropagation();
            if (onSearchKeyword) {
              onSearchKeyword(item.warehouseLocation || (isOnline ? 'Costco.com' : 'Costco Warehouse'));
            } else {
              onViewReceipt(item.orderId);
            }
          }}
          title={`Filter items from ${item.warehouseLocation || 'this location'}`}
          className="relative overflow-hidden flex items-center gap-2 bg-m3-surface-container-low dark:bg-m3-surface-container p-2 md:p-2.5 rounded-xl text-left cursor-pointer transition-all hover:ring-1 hover:ring-m3-primary/30"
        >
          {renderStoreRipples()}
          {isOnline ? (
            <Globe className="w-4 h-4 text-m3-tertiary shrink-0" />
          ) : (
            <Store className="w-4 h-4 text-m3-primary shrink-0" />
          )}
          <div className="truncate">
            <span className="text-[10px] md:text-[11px] uppercase font-bold text-m3-on-surface-variant block tracking-wider">
              Store
            </span>
            <span className="font-semibold text-m3-on-surface block truncate" title={item.warehouseLocation}>
              {item.warehouseLocation || (isOnline ? 'Costco.com' : 'Warehouse')}
            </span>
          </div>
        </motion.button>

        {/* PAYMENT CARD USED - Filters by Card */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onPointerDown={onCardDown}
          onClick={(e) => {
            e.stopPropagation();
            if (onSearchKeyword && item.paymentCard) {
              onSearchKeyword(item.paymentCard);
            } else {
              onViewReceipt(item.orderId);
            }
          }}
          title={`Filter items paid with ${item.paymentCard || 'this card'}`}
          className="relative overflow-hidden flex items-center gap-2 bg-m3-surface-container-low dark:bg-m3-surface-container p-2 md:p-2.5 rounded-xl text-left cursor-pointer transition-all hover:ring-1 hover:ring-amber-500/30"
        >
          {renderCardRipples()}
          <CreditCard className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] md:text-[11px] uppercase font-bold text-m3-on-surface-variant block tracking-wider">
              Card
            </span>
            <span className="font-semibold text-m3-on-surface block truncate" title={item.paymentCard || 'Card on file'}>
              {item.paymentCard || 'Costco Anywhere Visa'}
            </span>
          </div>
        </motion.button>
      </div>

      {/* Card Footer */}
      <div className="mt-3 pt-2.5 border-t border-m3-outline-variant/30 flex items-center justify-between text-xs sm:text-sm">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onPointerDown={onReceiptDown}
          onClick={() => onViewReceipt(item.orderId)}
          className="relative overflow-hidden inline-flex items-center gap-1.5 font-semibold text-m3-primary hover:text-m3-primary/80 transition-colors cursor-pointer py-1.5 px-3 md:py-2 md:px-3.5 rounded-full hover:bg-m3-primary/10"
        >
          {renderReceiptRipples()}
          <Receipt className="w-4 h-4" />
          <span>View Receipt</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.94 }}
          onPointerDown={onEnrichDown}
          onClick={() => onReEnrich(item.itemId, item.rawName)}
          disabled={isEnriching}
          className="relative overflow-hidden inline-flex items-center gap-1.5 text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer py-1.5 px-3 md:py-2 md:px-3.5 rounded-full hover:bg-m3-surface-container-highest"
        >
          {renderEnrichRipples()}
          <RefreshCw className={`w-3.5 h-3.5 ${isEnriching ? 'animate-spin text-m3-primary' : ''}`} />
          <span>{isEnriching ? 'Updating...' : 'Refresh Info'}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
