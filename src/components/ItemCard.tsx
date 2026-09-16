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
  isEnriching?: boolean;
}

export function ItemCard({
  item,
  onViewReceipt,
  onReEnrich,
  isEnriching,
}: ItemCardProps) {
  const [copied, setCopied] = useState(false);
  const { onPointerDown: onTagDown, renderRipples: renderTagRipples } = M3Ripple({ color: 'bg-m3-primary/20' });
  const { onPointerDown: onReceiptDown, renderRipples: renderReceiptRipples } = M3Ripple({ color: 'bg-m3-primary/20' });
  const { onPointerDown: onEnrichDown, renderRipples: renderEnrichRipples } = M3Ripple({ color: 'bg-current' });

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
      className={`rounded-3xl border m3-elevation-transition p-4 sm:p-5 flex flex-col justify-between group relative overflow-hidden ${
        isReturn
          ? 'bg-m3-error-container/15 border-m3-error/30 hover:border-m3-error/50 hover:shadow-md'
          : 'bg-m3-surface-container-lowest dark:bg-m3-surface-container-low border-m3-outline-variant/50 hover:border-m3-outline/60 hover:shadow-md'
      }`}
    >
      {/* Top row: Item ID badge & Channel Badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          
          {/* Costco Item ID with 1-click Copy & M3 Ripple */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onPointerDown={onTagDown}
              onClick={copyItemId}
              title="Click to copy Costco Item ID"
              className={`relative overflow-hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs font-semibold border transition-all cursor-pointer ${
                isReturn
                  ? 'bg-m3-error-container/40 text-m3-error dark:text-[#ffb4ab] border-m3-error/30 hover:bg-m3-error-container/60'
                  : 'bg-m3-secondary-container text-m3-on-secondary-container hover:bg-m3-secondary-container/80 border-m3-outline-variant/40'
              }`}
            >
              {renderTagRipples()}
              <Tag className={`w-3 h-3 ${isReturn ? 'text-m3-error dark:text-[#ffb4ab]' : 'text-m3-primary'}`} />
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
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {item.category && (
              <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
                isReturn
                  ? 'bg-m3-error-container/30 text-m3-error dark:text-[#ffb4ab] border-m3-error/20'
                  : 'bg-m3-surface-container text-m3-on-surface-variant border-m3-outline-variant/40'
              }`}>
                {item.category}
              </span>
            )}
          </div>

          {/* Return Badge OR Warehouse vs Online purchase tag */}
          <div className="shrink-0 flex items-center gap-1.5">
            {isReturn && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-m3-error-container text-m3-on-error-container border border-m3-error/30 shadow-2xs">
                <RotateCcw className="w-3 h-3 text-m3-error dark:text-[#ffb4ab]" />
                Return
              </span>
            )}
            {isOnline ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-m3-surface-container text-m3-on-surface-variant border border-m3-outline-variant/50">
                <Globe className="w-3 h-3 text-m3-tertiary" />
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-m3-surface-container text-m3-on-surface-variant border border-m3-outline-variant/50">
                <Store className="w-3 h-3 text-m3-primary" />
                Warehouse
              </span>
            )}
          </div>
        </div>

        {/* Product Title */}
        <h3 className={`text-base font-bold leading-snug transition-colors ${
          isReturn
            ? 'text-m3-on-surface group-hover:text-m3-error dark:group-hover:text-[#ffb4ab]'
            : 'text-m3-on-surface group-hover:text-m3-primary'
        }`}>
          {displayName}
        </h3>

        {/* Brand & Package Specs */}
        {(item.brand || item.packageDetails) && (
          <div className="flex items-center gap-2 mt-1 text-xs text-m3-on-surface-variant">
            {item.brand && <span className="font-semibold text-m3-on-surface">{item.brand}</span>}
            {item.brand && item.packageDetails && <span className="opacity-40">•</span>}
            {item.packageDetails && <span>{item.packageDetails}</span>}
          </div>
        )}

        {/* Raw receipt abbreviation text if different */}
        {item.productName && item.rawName && item.productName !== item.rawName && (
          <p className="text-[11px] text-m3-on-surface-variant/80 font-mono mt-0.5">
            Receipt: {item.rawName}
          </p>
        )}

        {/* Web Search Identification Description */}
        {item.description && (
          <p className={`mt-2 text-xs line-clamp-2 leading-relaxed p-2.5 rounded-2xl border ${
            isReturn
              ? 'bg-m3-error-container/20 text-m3-on-surface-variant border-m3-error/20'
              : 'bg-m3-surface-container text-m3-on-surface-variant border-m3-outline-variant/40'
          }`}>
            {item.description}
          </p>
        )}
      </div>

      {/* Primary Purchase Details: When, Amount, Location, Card */}
      <div className={`mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs ${
        isReturn ? 'border-m3-error/20' : 'border-m3-outline-variant/40'
      }`}>
        
        {/* WHEN WAS IT BOUGHT */}
        <div className={`flex items-center gap-2 p-2 rounded-xl ${
          isReturn ? 'bg-m3-error-container/20' : 'bg-m3-surface-container-low dark:bg-m3-surface-container'
        }`}>
          <Calendar className="w-3.5 h-3.5 text-m3-primary shrink-0" />
          <div className="truncate">
            <span className="text-[10px] uppercase font-bold text-m3-on-surface-variant block tracking-wider">
              Date
            </span>
            <span className="font-semibold text-m3-on-surface">
              {formatDate(item.orderDate)}
            </span>
          </div>
        </div>

        {/* HOW MUCH WAS PAID / REFUNDED */}
        <div className={`flex items-center gap-2 p-2 rounded-xl ${
          isReturn ? 'bg-m3-error-container/30' : 'bg-m3-surface-container-low dark:bg-m3-surface-container'
        }`}>
          {isReturn ? (
            <RotateCcw className="w-3.5 h-3.5 text-m3-error dark:text-[#ffb4ab] shrink-0" />
          ) : (
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <div className="truncate">
            <span className="text-[10px] uppercase font-bold text-m3-on-surface-variant block tracking-wider">
              {isReturn ? 'Refunded' : 'Paid'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`font-bold font-mono ${
                isReturn ? 'text-m3-error dark:text-[#ffb4ab]' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {isReturn ? `-$${Math.abs(item.totalPrice).toFixed(2)}` : `$${item.totalPrice.toFixed(2)}`}
              </span>
              {item.quantity > 1 && (
                <span className="text-[10px] text-m3-on-surface-variant">
                  (×{item.quantity})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* WHERE */}
        <div className="flex items-center gap-2 bg-m3-surface-container-low dark:bg-m3-surface-container p-2 rounded-xl">
          {isOnline ? (
            <Globe className="w-3.5 h-3.5 text-m3-tertiary shrink-0" />
          ) : (
            <Store className="w-3.5 h-3.5 text-m3-primary shrink-0" />
          )}
          <div className="truncate">
            <span className="text-[10px] uppercase font-bold text-m3-on-surface-variant block tracking-wider">
              Store
            </span>
            <span className="font-semibold text-m3-on-surface block truncate" title={item.warehouseLocation}>
              {item.warehouseLocation || (isOnline ? 'Costco.com' : 'Warehouse')}
            </span>
          </div>
        </div>

        {/* PAYMENT CARD USED */}
        <div className="flex items-center gap-2 bg-m3-surface-container-low dark:bg-m3-surface-container p-2 rounded-xl">
          <CreditCard className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] uppercase font-bold text-m3-on-surface-variant block tracking-wider">
              Card
            </span>
            <span className="font-semibold text-m3-on-surface block truncate" title={item.paymentCard || 'Card on file'}>
              {item.paymentCard || 'Costco Anywhere Visa'}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-2.5 pt-2 border-t border-m3-outline-variant/30 flex items-center justify-between text-xs">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onPointerDown={onReceiptDown}
          onClick={() => onViewReceipt(item.orderId)}
          className="relative overflow-hidden inline-flex items-center gap-1.5 text-xs font-semibold text-m3-primary hover:text-m3-primary/80 transition-colors cursor-pointer py-1 px-2.5 rounded-full hover:bg-m3-primary/10"
        >
          {renderReceiptRipples()}
          <Receipt className="w-3.5 h-3.5" />
          <span>View Receipt</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.94 }}
          onPointerDown={onEnrichDown}
          onClick={() => onReEnrich(item.itemId, item.rawName)}
          disabled={isEnriching}
          className="relative overflow-hidden inline-flex items-center gap-1 text-[11px] text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer py-1 px-2.5 rounded-full hover:bg-m3-surface-container-highest"
        >
          {renderEnrichRipples()}
          <RefreshCw className={`w-3 h-3 ${isEnriching ? 'animate-spin text-m3-primary' : ''}`} />
          <span>{isEnriching ? 'Updating...' : 'Refresh Info'}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
