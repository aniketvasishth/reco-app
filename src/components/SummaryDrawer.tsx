import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import {
  X,
  Store,
  Globe,
  CreditCard,
  Calendar,
  ShoppingBag,
  TrendingUp,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Sparkles,
  PieChart,
  Layers,
  Info,
  Tag,
  MessageSquarePlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CostcoReceipt, CostcoItem } from '../types';
import { parseDateToMs } from '../utils/receiptParsers';
import {
  M3_TRANSITIONS,
  M3_BOTTOM_SHEET_DRAG,
  m3SharedAxisXVariants,
} from '../utils/motion';
import { M3Ripple } from './M3Ripple';

interface SummaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  receipts: CostcoReceipt[];
  items: CostcoItem[];
  themeMode?: 'system' | 'light' | 'dark';
  onSelectThemeMode?: (mode: 'system' | 'light' | 'dark') => void;
  onOpenPalettes?: () => void;
  onSelectReceipt: (receiptId: string) => void;
  onOpenFeedback?: () => void;
  onOpenSaveBackup?: () => void;
  onClearAllReceipts?: () => void;
  onDeleteReceipt?: (receiptId: string) => void;
  onOpenInstall?: () => void;
  isInstalled?: boolean;
  onLoadDemo?: () => void;
  isImmersive?: boolean;
  onToggleImmersive?: () => void;
  onSearchItemId?: (itemId: string) => void;
}

type SummaryTab = 'overview' | 'channels' | 'categories' | 'cards';

export function SummaryDrawer({
  isOpen,
  onClose,
  receipts,
  items,
  themeMode = 'system',
  onSelectThemeMode,
  onOpenPalettes,
  onSelectReceipt,
  onOpenFeedback,
  onOpenSaveBackup,
  onClearAllReceipts,
  onDeleteReceipt,
  onOpenInstall,
  isInstalled,
  onLoadDemo,
  isImmersive = false,
  onToggleImmersive,
  onSearchItemId,
}: SummaryDrawerProps) {
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Tab navigation with M3 Shared Axis X
  const [activeTab, setActiveTab] = useState<SummaryTab>('overview');
  const [direction, setDirection] = useState<number>(1);
  const prevTabRef = useRef<SummaryTab>('overview');

  // In-app deletion confirmation states (replaces window.confirm for iframe & mobile reliability)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<CostcoReceipt | null>(null);

  const tabOrder: SummaryTab[] = ['overview', 'channels', 'categories', 'cards'];

  const handleTabChange = (newTab: SummaryTab) => {
    if (newTab === activeTab) return;
    const oldIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(newTab);
    setDirection(newIndex > oldIndex ? 1 : -1);
    prevTabRef.current = activeTab;
    setActiveTab(newTab);
  };

  const { onPointerDown: onCloseDown, renderRipples: renderCloseRipples } = M3Ripple({ color: 'bg-current' });

  const [showSavingsTooltip, setShowSavingsTooltip] = useState(false);
  const savingsTooltipRef = useRef<HTMLDivElement | null>(null);

  const [savingsTooltipPos, setSavingsTooltipPos] = useState<{
    leftOffset: number;
    width: number;
    arrowLeft: number;
  }>({
    leftOffset: 0,
    width: 320,
    arrowLeft: 24,
  });

  useLayoutEffect(() => {
    if (!showSavingsTooltip) return;

    const updatePosition = () => {
      if (!savingsTooltipRef.current) return;
      const badgeRect = savingsTooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const margin = 16;
      const targetWidth = Math.min(320, Math.max(260, viewportWidth - margin * 2));

      let screenLeft = badgeRect.left;
      if (screenLeft + targetWidth > viewportWidth - margin) {
        const rightAlignedLeft = badgeRect.right - targetWidth;
        screenLeft = Math.max(margin, Math.min(rightAlignedLeft, viewportWidth - margin - targetWidth));
      } else if (screenLeft < margin) {
        screenLeft = margin;
      }

      const leftOffset = Math.round(screenLeft - badgeRect.left);
      const badgeCenterX = badgeRect.left + badgeRect.width / 2;
      const arrowX = badgeCenterX - screenLeft;
      const arrowLeft = Math.max(16, Math.min(targetWidth - 24, Math.round(arrowX)));

      setSavingsTooltipPos({
        leftOffset,
        width: targetWidth,
        arrowLeft,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [showSavingsTooltip]);

  useEffect(() => {
    if (!showSavingsTooltip) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (savingsTooltipRef.current && !savingsTooltipRef.current.contains(e.target as Node)) {
        setShowSavingsTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showSavingsTooltip]);

  // Helper function to identify return items
  const isItemReturn = (it: CostcoItem) => {
    return (
      it.totalPrice < 0 ||
      it.unitPrice < 0 ||
      /return|refund|retour/i.test(it.rawName || '') ||
      /return|refund/i.test(it.productName || '') ||
      (Boolean(it.isReturn) && (it.totalPrice <= 0 || /return|refund/i.test(it.description || '')))
    );
  };

  const purchaseItems = items.filter((it) => !isItemReturn(it));
  const returnItems = items.filter((it) => isItemReturn(it));

  const totalPurchasesCount = purchaseItems.length;
  const totalReturnsCount = returnItems.length;

  const totalPurchasesAmount = purchaseItems.reduce(
    (sum, it) => sum + Math.abs(it.totalPrice),
    0
  );
  const totalReturnsAmount = returnItems.reduce(
    (sum, it) => sum + Math.abs(it.totalPrice),
    0
  );

  const totalCostcoSpend = totalPurchasesAmount - totalReturnsAmount;

  const totalSavings = items.reduce((sum, it) => {
    if (it.discount && it.discount > 0 && !isItemReturn(it)) {
      return sum + it.discount;
    }
    return sum;
  }, 0);

  const preDiscountTotal = totalPurchasesAmount + totalSavings;
  const discountedItemsCount = items.filter(
    (it) => it.discount && it.discount > 0 && !isItemReturn(it)
  ).length;

  const warehouseItems = items.filter((it) => it.orderType === 'Warehouse');
  const onlineItems = items.filter((it) => it.orderType === 'Online');

  const warehousePurchases = warehouseItems.filter((it) => !isItemReturn(it));
  const warehouseReturns = warehouseItems.filter((it) => isItemReturn(it));
  const warehouseSpend =
    warehousePurchases.reduce((sum, it) => sum + Math.abs(it.totalPrice), 0) -
    warehouseReturns.reduce((sum, it) => sum + Math.abs(it.totalPrice), 0);

  const onlinePurchases = onlineItems.filter((it) => !isItemReturn(it));
  const onlineReturns = onlineItems.filter((it) => isItemReturn(it));
  const onlineSpend =
    onlinePurchases.reduce((sum, it) => sum + Math.abs(it.totalPrice), 0) -
    onlineReturns.reduce((sum, it) => sum + Math.abs(it.totalPrice), 0);

  const cardMap: Record<string, { count: number; spend: number }> = {};
  items.forEach((it) => {
    const card = it.paymentCard || 'Costco Anywhere Visa';
    if (!cardMap[card]) {
      cardMap[card] = { count: 0, spend: 0 };
    }
    cardMap[card].count += 1;
    const isRet = isItemReturn(it);
    cardMap[card].spend += isRet ? -Math.abs(it.totalPrice) : Math.abs(it.totalPrice);
  });

  const yearMap: Record<string, { count: number; spend: number }> = {};
  items.forEach((it) => {
    const year = it.orderDate ? it.orderDate.slice(0, 4) : 'Recent';
    if (!yearMap[year]) {
      yearMap[year] = { count: 0, spend: 0 };
    }
    yearMap[year].count += 1;
    const isRet = isItemReturn(it);
    yearMap[year].spend += isRet ? -Math.abs(it.totalPrice) : Math.abs(it.totalPrice);
  });

  const categoryMap: Record<string, { count: number; spend: number }> = {};
  items.forEach((it) => {
    const cat = it.category || 'General';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { count: 0, spend: 0 };
    }
    categoryMap[cat].count += 1;
    const isRet = isItemReturn(it);
    categoryMap[cat].spend += isRet ? -Math.abs(it.totalPrice) : Math.abs(it.totalPrice);
  });

  const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1].spend - a[1].spend);
  const sortedCards = Object.entries(cardMap).sort((a, b) => b[1].spend - a[1].spend);
  const sortedYears = Object.entries(yearMap).sort((a, b) => b[0].localeCompare(a[0]));

  const sortedReceipts = [...receipts].sort((a, b) => {
    const timeA = parseDateToMs(a.orderDate);
    const timeB = parseDateToMs(b.orderDate);
    if (timeB !== timeA) return timeB - timeA;
    return (b.orderNumber || '').localeCompare(a.orderNumber || '');
  });

  const allDates = [
    ...receipts.map((r) => r.orderDate),
    ...items.map((it) => it.orderDate),
  ]
    .filter(Boolean)
    .sort();

  const firstPurchaseDate = allDates.length > 0 ? allDates[0] : null;
  const latestPurchaseDate = allDates.length > 0 ? allDates[allDates.length - 1] : null;

  const formatDateLabel = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="summary-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 md:p-6"
          onClick={onClose}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <motion.div
            ref={drawerRef}
            id="summary-drawer"
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
            className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl bg-m3-surface-container text-m3-on-surface max-h-[88vh] sm:max-h-[90vh] rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden border border-m3-outline-variant/60 touch-pan-y"
          >
            {/* Mobile Drag Handle Bar */}
            <div className="pt-2.5 pb-1 flex justify-center sm:hidden cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.5 rounded-full bg-m3-outline-variant/60" />
            </div>

            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-m3-outline-variant/40 flex items-center justify-between shrink-0 bg-m3-surface-container-high/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center shadow-2xs shrink-0">
                  <PieChart className="w-4 h-4 text-m3-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-m3-on-surface leading-tight">
                    Purchase Summary
                  </h2>
                  <span className="text-[11px] text-m3-on-surface-variant block">
                    {receipts.length} receipts • {items.length} items
                  </span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onPointerDown={onCloseDown}
                onClick={onClose}
                className="relative overflow-hidden p-2 text-m3-on-surface-variant hover:text-m3-on-surface rounded-full hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
                aria-label="Close summary"
              >
                {renderCloseRipples()}
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Material 3 Segmented Pill Tabs */}
            <div className="px-4 pt-3 pb-2 bg-m3-surface-container shrink-0 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex items-center gap-1.5 bg-m3-surface-container-high p-1 rounded-full min-w-max w-full justify-between">
                {(
                  [
                    { id: 'overview', label: 'Overview' },
                    { id: 'channels', label: 'Channels' },
                    { id: 'categories', label: 'Categories' },
                    { id: 'cards', label: 'Cards & Years' },
                  ] as const
                ).map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      className={`relative flex-1 py-1.5 px-3 text-xs font-semibold rounded-full transition-colors cursor-pointer select-none text-center whitespace-nowrap ${
                        isActive
                          ? 'text-m3-on-secondary-container'
                          : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="m3-summary-tab-pill"
                          transition={M3_TRANSITIONS.snappySpring}
                          className="absolute inset-0 bg-m3-secondary-container rounded-full shadow-xs -z-0"
                        />
                      )}
                      <span className="relative z-10 truncate block">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Animated Content with Material 3 Shared X-Axis */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 relative">
              <AnimatePresence mode="wait" custom={direction}>
                {activeTab === 'overview' && (
                  <motion.div
                    key="tab-overview"
                    custom={direction}
                    variants={m3SharedAxisXVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    {/* Key Totals Primary Card */}
                    <div className="bg-m3-surface-container-high rounded-3xl p-5 sm:p-6 shadow-xs border border-m3-outline-variant/50 space-y-4">
                      <div>
                        <span className="text-xs uppercase tracking-wider font-bold text-m3-primary block">
                          Total Costco Spend
                        </span>
                        <div className="flex items-center flex-wrap gap-2.5 mt-1.5">
                          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-m3-on-surface">
                            ${totalCostcoSpend.toFixed(2)}
                          </span>

                          {/* Interactive "Saved" Badge with Calculation Popover */}
                          <div className="relative inline-block" ref={savingsTooltipRef}>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.94 }}
                              onClick={() => setShowSavingsTooltip((prev) => !prev)}
                              className={`group inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-2xs ${
                                totalSavings > 0
                                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                  : 'bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface-variant border border-m3-outline-variant/40'
                              }`}
                              title={showSavingsTooltip ? 'Hide savings calculation' : 'View savings calculation'}
                            >
                              <span>Saved ${totalSavings.toFixed(2)}</span>
                              <Info className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 shrink-0 transition-opacity" />
                            </motion.button>

                            <AnimatePresence>
                              {showSavingsTooltip && (
                                <motion.div
                                  role="status"
                                  aria-live="polite"
                                  initial={{ opacity: 0, scale: 0.92, y: -6 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                  transition={M3_TRANSITIONS.snappySpring}
                                  style={{
                                    left: `${savingsTooltipPos.leftOffset}px`,
                                    width: `${savingsTooltipPos.width}px`,
                                    maxWidth: 'calc(100vw - 32px)',
                                  }}
                                  className="absolute top-full mt-2 z-50 p-3.5 bg-m3-inverse-surface text-m3-inverse-on-surface rounded-2xl shadow-xl border border-m3-outline-variant/30 text-xs leading-relaxed"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
                                      <span className="font-bold text-m3-inverse-on-surface">
                                        How Savings Are Calculated
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setShowSavingsTooltip(false)}
                                      className="text-m3-inverse-on-surface/60 hover:text-m3-inverse-on-surface p-1 rounded-full hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="p-2.5 rounded-xl bg-white/10 dark:bg-black/20 border border-white/10 space-y-1.5 font-mono text-[11px]">
                                    <div className="flex items-center justify-between text-m3-inverse-on-surface/80">
                                      <span>(X) Pre-Discount Retail:</span>
                                      <span className="font-bold text-m3-inverse-on-surface">
                                        ${preDiscountTotal.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-m3-inverse-on-surface/80">
                                      <span>(Y) Total Paid at Register:</span>
                                      <span className="font-bold text-m3-inverse-on-surface">
                                        -${totalPurchasesAmount.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="pt-1.5 border-t border-white/15 flex items-center justify-between font-bold text-emerald-300">
                                      <span>(X − Y) Instant Savings:</span>
                                      <span>= ${totalSavings.toFixed(2)}</span>
                                    </div>
                                  </div>

                                  <div className="mt-2.5 space-y-1 text-[11px] opacity-90 leading-normal">
                                    <p>
                                      • Extracted from instant manufacturer rebates and coupons across {discountedItemsCount} item{discountedItemsCount === 1 ? '' : 's'}.
                                    </p>
                                  </div>

                                  <div
                                    style={{ left: `${savingsTooltipPos.arrowLeft}px` }}
                                    className="absolute -top-1.5 w-3 h-3 bg-m3-inverse-surface border-t border-l border-m3-outline-variant/30 rotate-45 pointer-events-none"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      {/* Total Purchases and Total Returns Sub-grid */}
                      <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-m3-outline-variant/30">
                        <div className="bg-m3-surface-container-low rounded-2xl p-3 border border-m3-outline-variant/40 flex flex-col justify-between shadow-2xs">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] sm:text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider truncate">
                              Purchases
                            </span>
                            <span className="text-[10px] font-bold text-m3-on-secondary-container bg-m3-secondary-container px-1.5 py-0.5 rounded font-mono shrink-0">
                              #{totalPurchasesCount}
                            </span>
                          </div>
                          <div className="mt-1.5 text-base sm:text-lg font-bold font-mono text-m3-on-surface truncate">
                            ${totalPurchasesAmount.toFixed(2)}
                          </div>
                        </div>

                        <div className="bg-m3-error-container/25 rounded-2xl p-3 border border-m3-error/30 flex flex-col justify-between shadow-2xs">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] sm:text-[11px] font-bold text-m3-error dark:text-[#ffb4ab] uppercase tracking-wider truncate">
                              Returns
                            </span>
                            <span className="text-[10px] font-bold text-m3-on-error-container bg-m3-error-container px-1.5 py-0.5 rounded font-mono shrink-0">
                              #{totalReturnsCount}
                            </span>
                          </div>
                          <div className="mt-1.5 text-base sm:text-lg font-bold font-mono text-m3-error dark:text-[#ffb4ab] truncate">
                            -${totalReturnsAmount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Purchase Date Range */}
                    <div className="bg-m3-surface-container-low rounded-2xl p-4 border border-m3-outline-variant/40 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-m3-on-surface">
                        <Calendar className="w-3.5 h-3.5 text-m3-primary" />
                        <span>Purchase Date Range</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSearchItemId && firstPurchaseDate) {
                              onSearchItemId(firstPurchaseDate);
                              onClose();
                            }
                          }}
                          title={`Search purchases from ${formatDateLabel(firstPurchaseDate)}`}
                          className="bg-m3-surface-container p-2.5 rounded-xl border border-m3-outline-variant/30 shadow-2xs text-left cursor-pointer hover:bg-m3-surface-container-high transition-colors"
                        >
                          <span className="text-[10px] uppercase font-bold text-m3-on-surface-variant block">
                            First Purchase
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-m3-on-surface block mt-0.5">
                            {formatDateLabel(firstPurchaseDate)}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onSearchItemId && latestPurchaseDate) {
                              onSearchItemId(latestPurchaseDate);
                              onClose();
                            }
                          }}
                          title={`Search purchases from ${formatDateLabel(latestPurchaseDate)}`}
                          className="bg-m3-surface-container p-2.5 rounded-xl border border-m3-outline-variant/30 shadow-2xs text-left cursor-pointer hover:bg-m3-surface-container-high transition-colors"
                        >
                          <span className="text-[10px] uppercase font-bold text-m3-on-surface-variant block">
                            Latest Purchase
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-m3-on-surface block mt-0.5">
                            {formatDateLabel(latestPurchaseDate)}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* All Receipts History List */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
                          Receipts History ({receipts.length})
                        </h3>
                        {receipts.length > 0 && onClearAllReceipts && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowClearAllConfirm(true);
                            }}
                            className="text-[11px] text-m3-error dark:text-[#ffb4ab] hover:underline flex items-center gap-1 font-semibold cursor-pointer py-1 px-1.5 rounded-lg active:bg-m3-error-container/20 transition-colors"
                            title="Clear all stored receipts"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>

                      {receipts.length === 0 ? (
                        <div className="bg-m3-surface-container-low border border-m3-outline-variant/30 rounded-2xl p-5 text-center space-y-3">
                          <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                            No receipts recorded yet. Tap "Scan Receipt" or "Upload Data" on the main page to add your first receipt!
                          </p>
                          {onLoadDemo && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onLoadDemo();
                                  onClose();
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-m3-primary-container text-m3-on-primary-container hover:bg-m3-primary-container/80 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Try with Demo Data</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {sortedReceipts.map((r) => {
                            const isRet = r.isReturn || r.total < 0;
                            return (
                              <motion.div
                                whileTap={{ scale: 0.98 }}
                                key={r.id}
                                onClick={() => {
                                  onSelectReceipt(r.id);
                                }}
                                className={`border p-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between text-xs m3-elevation-transition ${
                                  isRet
                                    ? 'bg-m3-error-container/15 hover:bg-m3-error-container/25 border-m3-error/30'
                                    : 'bg-m3-surface-container-low hover:bg-m3-surface-container-high border-m3-outline-variant/40 hover:shadow-xs'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 font-semibold text-m3-on-surface">
                                    {r.orderType === 'Online' ? (
                                      <Globe className="w-3.5 h-3.5 text-m3-tertiary shrink-0" />
                                    ) : (
                                      <Store className="w-3.5 h-3.5 text-m3-primary shrink-0" />
                                    )}
                                    <span className="truncate">{r.warehouseLocation}</span>
                                  </div>
                                  <span className="text-[11px] text-m3-on-surface-variant block mt-0.5">
                                    {r.orderDate} • {r.items.length} items
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 pl-2">
                                  <span
                                    className={`font-bold font-mono ${
                                      isRet ? 'text-m3-error dark:text-[#ffb4ab]' : 'text-m3-on-surface'
                                    }`}
                                  >
                                    {isRet
                                      ? `-$${Math.abs(r.total).toFixed(2)}`
                                      : `$${r.total.toFixed(2)}`}
                                  </span>
                                  {onDeleteReceipt && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReceiptToDelete(r);
                                      }}
                                      title="Delete this receipt"
                                      aria-label={`Delete receipt #${r.orderNumber}`}
                                      className="p-2 -mr-1 rounded-full text-m3-on-surface-variant/70 hover:text-m3-error hover:bg-m3-error-container/25 active:bg-m3-error-container/40 transition-colors cursor-pointer shrink-0"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  <ChevronRight className="w-4 h-4 text-m3-on-surface-variant" />
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'channels' && (
                  <motion.div
                    key="tab-channels"
                    custom={direction}
                    variants={m3SharedAxisXVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSearchItemId) {
                            onSearchItemId('Warehouse');
                            onClose();
                          }
                        }}
                        title="Filter warehouse purchases"
                        className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-2xl p-4 space-y-1.5 shadow-xs text-left cursor-pointer hover:bg-m3-surface-container transition-colors"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-m3-primary">
                          <Store className="w-4 h-4" />
                          <span>Warehouse</span>
                        </div>
                        <div className="text-xl font-bold text-m3-on-surface font-mono">
                          ${warehouseSpend.toFixed(2)}
                        </div>
                        <div className="text-xs text-m3-on-surface-variant">
                          {warehouseItems.length} items ({totalCostcoSpend > 0 ? Math.round((warehouseSpend / totalCostcoSpend) * 100) : 0}%)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onSearchItemId) {
                            onSearchItemId('Costco.com');
                            onClose();
                          }
                        }}
                        title="Filter online purchases"
                        className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-2xl p-4 space-y-1.5 shadow-xs text-left cursor-pointer hover:bg-m3-surface-container transition-colors"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-m3-tertiary">
                          <Globe className="w-4 h-4" />
                          <span>Costco Online</span>
                        </div>
                        <div className="text-xl font-bold text-m3-on-surface font-mono">
                          ${onlineSpend.toFixed(2)}
                        </div>
                        <div className="text-xs text-m3-on-surface-variant">
                          {onlineItems.length} items ({totalCostcoSpend > 0 ? Math.round((onlineSpend / totalCostcoSpend) * 100) : 0}%)
                        </div>
                      </button>
                    </div>

                    {/* Channel comparison progress bar */}
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 p-4 rounded-2xl space-y-2">
                      <span className="text-xs font-semibold text-m3-on-surface block">
                        Spending Ratio
                      </span>
                      <div className="w-full bg-m3-surface-container-highest h-3 rounded-full overflow-hidden flex">
                        <div
                          className="bg-m3-primary h-full transition-all"
                          style={{
                            width: `${
                              totalCostcoSpend > 0 ? (warehouseSpend / totalCostcoSpend) * 100 : 50
                            }%`,
                          }}
                        />
                        <div
                          className="bg-m3-tertiary h-full transition-all"
                          style={{
                            width: `${
                              totalCostcoSpend > 0 ? (onlineSpend / totalCostcoSpend) * 100 : 50
                            }%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-m3-on-surface-variant pt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <span className="w-2 h-2 rounded-full bg-m3-primary" /> Warehouse ({totalCostcoSpend > 0 ? Math.round((warehouseSpend / totalCostcoSpend) * 100) : 0}%)
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <span className="w-2 h-2 rounded-full bg-m3-tertiary" /> Online ({totalCostcoSpend > 0 ? Math.round((onlineSpend / totalCostcoSpend) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'categories' && (
                  <motion.div
                    key="tab-categories"
                    custom={direction}
                    variants={m3SharedAxisXVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    {sortedCategories.length > 0 ? (
                      <div className="space-y-3 bg-m3-surface-container-low border border-m3-outline-variant/40 p-4 rounded-2xl">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
                          Top Categories Breakdown
                        </h3>
                        {sortedCategories.map(([cat, data]) => {
                          const pct = totalCostcoSpend > 0 ? (data.spend / totalCostcoSpend) * 100 : 0;
                          return (
                            <button
                              type="button"
                              key={cat}
                              onClick={() => {
                                if (onSearchItemId) {
                                  onSearchItemId(cat);
                                  onClose();
                                }
                              }}
                              title={`Filter items in ${cat}`}
                              className="w-full text-left space-y-1.5 text-xs p-1.5 -mx-1.5 rounded-xl hover:bg-m3-surface-container transition-colors cursor-pointer"
                            >
                              <div className="flex justify-between text-m3-on-surface">
                                <span className="font-semibold truncate max-w-[220px]">{cat}</span>
                                <div className="text-right">
                                  <span className="font-bold font-mono">${data.spend.toFixed(2)}</span>
                                  <span className="text-[10px] text-m3-on-surface-variant ml-1.5 font-mono">
                                    ({data.count} items)
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-m3-surface-container-highest h-2.5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                                  transition={{ duration: 0.5, ease: [0.05, 0.7, 0.1, 1] }}
                                  className="bg-m3-primary h-full rounded-full"
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-m3-on-surface-variant bg-m3-surface-container-low rounded-2xl border border-m3-outline-variant/30">
                        No categories found yet. Upload receipts to see categorized Costco spending.
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'cards' && (
                  <motion.div
                    key="tab-cards"
                    custom={direction}
                    variants={m3SharedAxisXVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    {/* Payment Cards */}
                    {sortedCards.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
                          Payment Cards
                        </h3>
                        <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-2xl divide-y divide-m3-outline-variant/30 overflow-hidden">
                          {sortedCards.map(([card, data]) => (
                            <button
                              type="button"
                              key={card}
                              onClick={() => {
                                if (onSearchItemId) {
                                  onSearchItemId(card);
                                  onClose();
                                }
                              }}
                              title={`Filter items paid with ${card}`}
                              className="w-full p-3.5 flex items-center justify-between gap-3 text-xs text-left cursor-pointer hover:bg-m3-surface-container transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                                  <CreditCard className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                </div>
                                <span className="font-semibold text-m3-on-surface truncate" title={card}>
                                  {card}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-bold text-m3-on-surface font-mono">
                                  ${data.spend.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-m3-on-surface-variant block">
                                  {data.count} purchases
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Spending by Year */}
                    {sortedYears.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
                          Spending by Year
                        </h3>
                        <div className="bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-2xl divide-y divide-m3-outline-variant/30 overflow-hidden">
                          {sortedYears.map(([yr, data]) => (
                            <button
                              type="button"
                              key={yr}
                              onClick={() => {
                                if (onSearchItemId) {
                                  onSearchItemId(yr);
                                  onClose();
                                }
                              }}
                              title={`Filter purchases from year ${yr}`}
                              className="w-full p-3.5 flex items-center justify-between text-xs text-left cursor-pointer hover:bg-m3-surface-container transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-m3-on-surface-variant" />
                                <span className="font-semibold text-m3-on-surface">{yr}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-m3-on-surface font-mono">
                                  ${data.spend.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-m3-on-surface-variant block">
                                  {data.count} items
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer with Developer Feedback */}
            <div className="p-3.5 border-t border-m3-outline-variant/40 bg-m3-surface-container-high flex items-center justify-between text-[11px] text-m3-on-surface-variant shrink-0">
              <span>Private • On-device</span>
              {onOpenFeedback && (
                <button
                  onClick={() => {
                    onOpenFeedback();
                  }}
                  className="text-m3-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <MessageSquarePlus className="w-3 h-3" />
                  <span>Report issue / Feedback</span>
                </button>
              )}
            </div>
          </motion.div>

          {/* Confirm Clear All Receipts Modal */}
          {showClearAllConfirm && (
            <div
              className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={(e) => {
                e.stopPropagation();
                setShowClearAllConfirm(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-m3-surface-container rounded-3xl p-6 max-w-sm w-full border border-m3-outline-variant/40 shadow-2xl space-y-4 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-m3-error-container/40 text-m3-error flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-m3-on-surface">Clear All Receipts?</h3>
                  <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                    This will permanently delete all {receipts.length} stored receipts and their items from your local database. You can restore from a backup or reload sample data at any time.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClearAllConfirm(false)}
                    className="py-2.5 rounded-xl bg-m3-surface-container-high text-m3-on-surface text-xs font-semibold hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowClearAllConfirm(false);
                      onClearAllReceipts?.();
                      onClose();
                    }}
                    className="py-2.5 rounded-xl bg-m3-error text-m3-on-error text-xs font-bold hover:bg-m3-error/90 transition-colors cursor-pointer shadow-xs"
                  >
                    Yes, Clear All
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Confirm Delete Individual Receipt Modal */}
          {receiptToDelete && (
            <div
              className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={(e) => {
                e.stopPropagation();
                setReceiptToDelete(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-m3-surface-container rounded-3xl p-6 max-w-sm w-full border border-m3-outline-variant/40 shadow-2xl space-y-4 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-m3-error-container/40 text-m3-error flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-m3-on-surface font-mono">
                    Delete Receipt #{receiptToDelete.orderNumber}?
                  </h3>
                  <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                    Remove this {receiptToDelete.orderType === 'Online' ? 'Costco.com order' : 'Costco Warehouse receipt'} from {receiptToDelete.orderDate}?
                  </p>
                  <div className="p-2.5 rounded-xl bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs flex items-center justify-between text-m3-on-surface font-semibold">
                    <span>{receiptToDelete.items.length} item{receiptToDelete.items.length === 1 ? '' : 's'}</span>
                    <span className="font-mono text-m3-primary">
                      {receiptToDelete.total < 0
                        ? `-$${Math.abs(receiptToDelete.total).toFixed(2)}`
                        : `$${receiptToDelete.total.toFixed(2)}`}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReceiptToDelete(null)}
                    className="py-2.5 rounded-xl bg-m3-surface-container-high text-m3-on-surface text-xs font-semibold hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteReceipt && receiptToDelete) {
                        onDeleteReceipt(receiptToDelete.id);
                      }
                      setReceiptToDelete(null);
                    }}
                    className="py-2.5 rounded-xl bg-m3-error text-m3-on-error text-xs font-bold hover:bg-m3-error/90 transition-colors cursor-pointer shadow-xs"
                  >
                    Yes, Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
