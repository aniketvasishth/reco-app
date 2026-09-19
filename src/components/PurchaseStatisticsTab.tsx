import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Calendar,
  ShoppingBag,
  CreditCard,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Clock,
  Award,
  ChevronRight,
  Layers,
  Store,
  Globe,
  Tag,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CostcoReceipt, CostcoItem } from '../types';
import { parseDateToMs } from '../utils/receiptParsers';
import { M3_TRANSITIONS } from '../utils/motion';
import { hapticFeedback } from '../utils/haptics';

interface PurchaseStatisticsTabProps {
  receipts: CostcoReceipt[];
  items: CostcoItem[];
  onSearchKeyword?: (keyword: string) => void;
  onSelectReceipt?: (receiptId: string) => void;
  onClose?: () => void;
  inline?: boolean;
}

interface MonthStat {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g., "Mar 2026"
  year: string;
  monthName: string;
  grossPurchases: number;
  returnsAmount: number;
  netSpend: number;
  purchasesCount: number;
  returnsCount: number;
  receiptsCount: number;
  savings: number;
  avgPerReceipt: number;
}

interface DayOfWeekStat {
  dayName: string;
  dayShort: string;
  tripCount: number;
  spend: number;
  percentage: number;
}

export function PurchaseStatisticsTab({
  receipts,
  items,
  onSearchKeyword,
  onSelectReceipt,
  onClose,
  inline = false,
}: PurchaseStatisticsTabProps) {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'both' | 'spend' | 'returns'>('both');
  const [hoveredMonth, setHoveredMonth] = useState<MonthStat | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

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

  // Available Years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    receipts.forEach((r) => {
      if (r.orderDate && r.orderDate.length >= 4) {
        yearsSet.add(r.orderDate.slice(0, 4));
      }
    });
    items.forEach((it) => {
      if (it.orderDate && it.orderDate.length >= 4) {
        yearsSet.add(it.orderDate.slice(0, 4));
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [receipts, items]);

  // Filter receipts and items by selected year
  const filteredReceipts = useMemo(() => {
    if (selectedYear === 'all') return receipts;
    return receipts.filter((r) => r.orderDate && r.orderDate.startsWith(selectedYear));
  }, [receipts, selectedYear]);

  const filteredItems = useMemo(() => {
    if (selectedYear === 'all') return items;
    return items.filter((it) => it.orderDate && it.orderDate.startsWith(selectedYear));
  }, [items, selectedYear]);

  // 1. Monthly Statistics Calculation
  const monthlyStats: MonthStat[] = useMemo(() => {
    const map: Record<string, MonthStat> = {};

    // First, process all receipts
    filteredReceipts.forEach((r) => {
      const d = r.orderDate || '';
      if (!d || d.length < 7) return;
      const monthKey = d.slice(0, 7); // "YYYY-MM"
      const year = d.slice(0, 4);

      if (!map[monthKey]) {
        let monthName = 'Month';
        let monthLabel = monthKey;
        try {
          const dateObj = new Date(`${monthKey}-01T00:00:00`);
          monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
          monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } catch {
          monthLabel = monthKey;
        }

        map[monthKey] = {
          monthKey,
          monthLabel,
          year,
          monthName,
          grossPurchases: 0,
          returnsAmount: 0,
          netSpend: 0,
          purchasesCount: 0,
          returnsCount: 0,
          receiptsCount: 0,
          savings: 0,
          avgPerReceipt: 0,
        };
      }

      map[monthKey].receiptsCount += 1;
    });

    // Next, process all items for accurate purchase, returns, and savings sums
    filteredItems.forEach((it) => {
      const d = it.orderDate || '';
      if (!d || d.length < 7) return;
      const monthKey = d.slice(0, 7);
      const year = d.slice(0, 4);

      if (!map[monthKey]) {
        let monthName = 'Month';
        let monthLabel = monthKey;
        try {
          const dateObj = new Date(`${monthKey}-01T00:00:00`);
          monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
          monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } catch {
          monthLabel = monthKey;
        }

        map[monthKey] = {
          monthKey,
          monthLabel,
          year,
          monthName,
          grossPurchases: 0,
          returnsAmount: 0,
          netSpend: 0,
          purchasesCount: 0,
          returnsCount: 0,
          receiptsCount: 0,
          savings: 0,
          avgPerReceipt: 0,
        };
      }

      const isRet = isItemReturn(it);
      const absPrice = Math.abs(it.totalPrice);

      if (isRet) {
        map[monthKey].returnsAmount += absPrice;
        map[monthKey].returnsCount += 1;
      } else {
        map[monthKey].grossPurchases += absPrice;
        map[monthKey].purchasesCount += 1;
        if (it.discount && it.discount > 0) {
          map[monthKey].savings += it.discount;
        }
      }
    });

    // Calculate net spend and averages
    Object.values(map).forEach((m) => {
      m.netSpend = m.grossPurchases - m.returnsAmount;
      m.avgPerReceipt = m.receiptsCount > 0 ? m.netSpend / m.receiptsCount : m.netSpend;
    });

    // Return sorted chronologically ascending for charts
    return Object.values(map).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [filteredReceipts, filteredItems]);

  // Overall Aggregates
  const aggregates = useMemo(() => {
    let gross = 0;
    let returns = 0;
    let savings = 0;
    let purchasesCount = 0;
    let returnsCount = 0;

    filteredItems.forEach((it) => {
      const isRet = isItemReturn(it);
      const absPrice = Math.abs(it.totalPrice);
      if (isRet) {
        returns += absPrice;
        returnsCount += 1;
      } else {
        gross += absPrice;
        purchasesCount += 1;
        if (it.discount && it.discount > 0) {
          savings += it.discount;
        }
      }
    });

    const net = gross - returns;
    const activeMonthsCount = monthlyStats.length || 1;
    const avgMonthlySpend = net / activeMonthsCount;
    const avgSpendPerReceipt = filteredReceipts.length > 0 ? net / filteredReceipts.length : 0;
    const avgItemPrice = purchasesCount > 0 ? gross / purchasesCount : 0;
    const returnRatePercent = gross > 0 ? (returns / gross) * 100 : 0;

    // Highest and lowest spend months
    let highestMonth: MonthStat | null = null;
    let lowestMonth: MonthStat | null = null;

    monthlyStats.forEach((m) => {
      if (!highestMonth || m.netSpend > highestMonth.netSpend) {
        highestMonth = m;
      }
      if (!lowestMonth || m.netSpend < lowestMonth.netSpend) {
        lowestMonth = m;
      }
    });

    return {
      gross,
      returns,
      net,
      savings,
      purchasesCount,
      returnsCount,
      receiptsCount: filteredReceipts.length,
      activeMonthsCount,
      avgMonthlySpend,
      avgSpendPerReceipt,
      avgItemPrice,
      returnRatePercent,
      highestMonth,
      lowestMonth,
    };
  }, [filteredItems, filteredReceipts, monthlyStats]);

  // 2. Day of the Week Analysis
  const dayOfWeekStats: DayOfWeekStat[] = useMemo(() => {
    const days = [
      { name: 'Sunday', short: 'Sun' },
      { name: 'Monday', short: 'Mon' },
      { name: 'Tuesday', short: 'Tue' },
      { name: 'Wednesday', short: 'Wed' },
      { name: 'Thursday', short: 'Thu' },
      { name: 'Friday', short: 'Fri' },
      { name: 'Saturday', short: 'Sat' },
    ];

    const counts: number[] = [0, 0, 0, 0, 0, 0, 0];
    const spends: number[] = [0, 0, 0, 0, 0, 0, 0];

    filteredReceipts.forEach((r) => {
      if (!r.orderDate) return;
      try {
        const d = new Date(`${r.orderDate}T12:00:00`);
        const dayIdx = d.getDay(); // 0 = Sun, 6 = Sat
        counts[dayIdx] += 1;
        spends[dayIdx] += r.total;
      } catch {
        // Ignore unparseable
      }
    });

    const totalTrips = filteredReceipts.length || 1;

    return days.map((d, i) => ({
      dayName: d.name,
      dayShort: d.short,
      tripCount: counts[i],
      spend: Math.max(0, spends[i]),
      percentage: (counts[i] / totalTrips) * 100,
    }));
  }, [filteredReceipts]);

  // Favorite shopping day
  const favoriteDay = useMemo(() => {
    let top = dayOfWeekStats[0];
    dayOfWeekStats.forEach((d) => {
      if (d.tripCount > top.tripCount) {
        top = d;
      }
    });
    return top;
  }, [dayOfWeekStats]);

  // Weekend vs Weekday trips
  const weekendVsWeekday = useMemo(() => {
    const weekendTrips = dayOfWeekStats[0].tripCount + dayOfWeekStats[6].tripCount;
    const weekdayTrips = filteredReceipts.length - weekendTrips;
    const weekendSpend = dayOfWeekStats[0].spend + dayOfWeekStats[6].spend;
    const weekdaySpend = aggregates.net - weekendSpend;
    const total = filteredReceipts.length || 1;

    return {
      weekendTrips,
      weekdayTrips,
      weekendSpend: Math.max(0, weekendSpend),
      weekdaySpend: Math.max(0, weekdaySpend),
      weekendPercent: Math.round((weekendTrips / total) * 100),
      weekdayPercent: Math.round((weekdayTrips / total) * 100),
    };
  }, [dayOfWeekStats, filteredReceipts, aggregates]);

  // 3. Top Staple Items (Purchased most frequently)
  const stapleItems = useMemo(() => {
    const map: Record<
      string,
      {
        itemId: string;
        name: string;
        rawName: string;
        count: number;
        totalSpend: number;
        lastPrice: number;
        lastDate: string;
      }
    > = {};

    filteredItems.forEach((it) => {
      if (isItemReturn(it) || !it.itemId) return;
      const key = it.itemId;
      if (!map[key]) {
        map[key] = {
          itemId: it.itemId,
          name: it.productName || it.rawName,
          rawName: it.rawName,
          count: 0,
          totalSpend: 0,
          lastPrice: it.unitPrice,
          lastDate: it.orderDate,
        };
      }
      map[key].count += it.quantity || 1;
      map[key].totalSpend += it.totalPrice;
      if (parseDateToMs(it.orderDate) >= parseDateToMs(map[key].lastDate)) {
        map[key].lastPrice = it.unitPrice;
        map[key].lastDate = it.orderDate;
      }
    });

    return Object.values(map)
      .filter((it) => it.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredItems]);

  // 4. Highest Single Ticket Purchases (Top Splurges)
  const highestPurchases = useMemo(() => {
    return filteredItems
      .filter((it) => !isItemReturn(it) && it.totalPrice > 0)
      .sort((a, b) => b.totalPrice - a.totalPrice)
      .slice(0, 6);
  }, [filteredItems]);

  // 5. Shopping Cadence: Average days between visits
  const averageDaysBetweenVisits = useMemo(() => {
    if (filteredReceipts.length < 2) return null;
    const sorted = [...filteredReceipts]
      .filter((r) => r.orderDate)
      .sort((a, b) => parseDateToMs(a.orderDate) - parseDateToMs(b.orderDate));

    if (sorted.length < 2) return null;
    const firstMs = parseDateToMs(sorted[0].orderDate);
    const lastMs = parseDateToMs(sorted[sorted.length - 1].orderDate);
    const diffDays = (lastMs - firstMs) / (1000 * 60 * 60 * 24);
    if (diffDays <= 0) return null;
    return Math.round(diffDays / (sorted.length - 1));
  }, [filteredReceipts]);

  // Handle clicking on month/item to search
  const handleItemSearch = (keyword: string) => {
    hapticFeedback('selection');
    if (onSearchKeyword) {
      onSearchKeyword(keyword);
      if (!inline && onClose) {
        onClose();
      }
    }
  };

  // SVG Chart Dimensions & Computations
  const maxMonthValue = useMemo(() => {
    let max = 100;
    monthlyStats.forEach((m) => {
      if (m.grossPurchases > max) max = m.grossPurchases;
      if (m.returnsAmount > max) max = m.returnsAmount;
    });
    return Math.ceil(max * 1.15); // Add 15% headroom
  }, [monthlyStats]);

  const svgWidth = 560;
  const svgHeight = 200;
  const chartPadding = { top: 20, right: 16, bottom: 30, left: 45 };
  const innerWidth = svgWidth - chartPadding.left - chartPadding.right;
  const innerHeight = svgHeight - chartPadding.top - chartPadding.bottom;

  return (
    <div className="space-y-4">
      {/* Year Selector & View Controls Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
        <div className="flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4 text-m3-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-m3-on-surface">
            Costco Analytics
          </span>
        </div>

        {/* Year Filter Pills */}
        <div className="flex items-center gap-1 bg-m3-surface-container-high p-1 rounded-full border border-m3-outline-variant/40">
          <button
            type="button"
            onClick={() => {
              hapticFeedback('selection');
              setSelectedYear('all');
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedYear === 'all'
                ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-2xs'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface'
            }`}
          >
            All Time
          </button>
          {availableYears.map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => {
                hapticFeedback('selection');
                setSelectedYear(yr);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedYear === yr
                  ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-2xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metrics High-Impact Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Monthly Avg Spend */}
        <div className="bg-m3-surface-container-high rounded-2xl p-3.5 border border-m3-outline-variant/40 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-m3-on-surface-variant">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              Monthly Avg
            </span>
            <DollarSign className="w-3.5 h-3.5 text-m3-primary" />
          </div>
          <div className="mt-1">
            <div className="text-lg sm:text-xl font-bold font-mono text-m3-on-surface truncate">
              ${aggregates.avgMonthlySpend.toFixed(2)}
            </div>
            <span className="text-[10px] text-m3-on-surface-variant block mt-0.5">
              Across {aggregates.activeMonthsCount} active month{aggregates.activeMonthsCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Avg Trip Basket */}
        <div className="bg-m3-surface-container-high rounded-2xl p-3.5 border border-m3-outline-variant/40 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-m3-on-surface-variant">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              Avg Per Trip
            </span>
            <ShoppingBag className="w-3.5 h-3.5 text-m3-tertiary" />
          </div>
          <div className="mt-1">
            <div className="text-lg sm:text-xl font-bold font-mono text-m3-on-surface truncate">
              ${aggregates.avgSpendPerReceipt.toFixed(2)}
            </div>
            <span className="text-[10px] text-m3-on-surface-variant block mt-0.5">
              {aggregates.receiptsCount} total visit{aggregates.receiptsCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Returns Total & Rate */}
        <div className="bg-rose-500/10 dark:bg-rose-950/40 rounded-2xl p-3.5 border border-rose-500/30 dark:border-rose-400/30 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-300">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              Total Returns
            </span>
            <RotateCcw className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1">
            <div className="text-lg sm:text-xl font-bold font-mono text-rose-700 dark:text-rose-200 truncate">
              -${aggregates.returns.toFixed(2)}
            </div>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-300/80 block mt-0.5 font-medium">
              {aggregates.returnsCount} items ({aggregates.returnRatePercent.toFixed(1)}% of spend)
            </span>
          </div>
        </div>

        {/* Shopping Cadence / Frequency */}
        <div className="bg-m3-surface-container-high rounded-2xl p-3.5 border border-m3-outline-variant/40 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-m3-on-surface-variant">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              Run Frequency
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-1">
            <div className="text-lg sm:text-xl font-bold text-m3-on-surface truncate">
              {averageDaysBetweenVisits ? `Every ${averageDaysBetweenVisits}d` : 'Frequent'}
            </div>
            <span className="text-[10px] text-m3-on-surface-variant block mt-0.5 truncate">
              {favoriteDay ? `Peak: ${favoriteDay.dayName}` : 'Regular shopper'}
            </span>
          </div>
        </div>
      </div>

      {/* MONTHLY SPENDINGS & RETURNS CHART SECTION */}
      <div className="bg-m3-surface-container-high rounded-3xl p-4 sm:p-5 border border-m3-outline-variant/50 space-y-4 shadow-xs relative">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-m3-on-surface flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-m3-primary" />
              <span>Spendings & Returns by Month</span>
            </h3>
            <p className="text-[11px] text-m3-on-surface-variant">
              Monthly breakdown of purchases, returns, and net warehouse spending
            </p>
          </div>

          {/* Chart Filter Toggle */}
          <div className="flex items-center gap-1 bg-m3-surface-container p-1 rounded-full border border-m3-outline-variant/30 text-[11px]">
            <button
              type="button"
              onClick={() => setChartMetric('both')}
              className={`px-2 py-0.5 rounded-full font-semibold transition-all cursor-pointer ${
                chartMetric === 'both'
                  ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-2xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('spend')}
              className={`px-2 py-0.5 rounded-full font-semibold transition-all cursor-pointer ${
                chartMetric === 'spend'
                  ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-2xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              Spend
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('returns')}
              className={`px-2 py-0.5 rounded-full font-semibold transition-all cursor-pointer ${
                chartMetric === 'returns'
                  ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-2xs'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              Returns
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-m3-on-surface-variant">
          {(chartMetric === 'both' || chartMetric === 'spend') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-m3-primary" />
              <span>Purchases</span>
            </div>
          )}
          {(chartMetric === 'both' || chartMetric === 'returns') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500" />
              <span>Returns</span>
            </div>
          )}
        </div>

        {monthlyStats.length > 0 ? (
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              {/* Horizontal Grid lines */}
              {[0, 0.33, 0.66, 1].map((ratio) => {
                const y = chartPadding.top + innerHeight * (1 - ratio);
                const val = Math.round(maxMonthValue * ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={chartPadding.left}
                      y1={y}
                      x2={svgWidth - chartPadding.right}
                      y2={y}
                      stroke="currentColor"
                      className="text-m3-outline-variant/30"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={chartPadding.left - 6}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="currentColor"
                      className="text-m3-on-surface-variant font-mono"
                    >
                      ${val}
                    </text>
                  </g>
                );
              })}

              {/* Monthly Bars */}
              {monthlyStats.map((m, idx) => {
                const groupWidth = innerWidth / monthlyStats.length;
                const groupX = chartPadding.left + idx * groupWidth;
                const barSlotWidth = Math.min(groupWidth * 0.75, 40);
                const barCenter = groupX + groupWidth / 2;

                // Heights
                const spendH = (m.grossPurchases / maxMonthValue) * innerHeight;
                const returnsH = (m.returnsAmount / maxMonthValue) * innerHeight;
                const spendY = chartPadding.top + innerHeight - spendH;
                const returnsY = chartPadding.top + innerHeight - returnsH;

                const isDual = chartMetric === 'both' && m.returnsAmount > 0;
                const singleBarW = isDual ? (barSlotWidth - 3) / 2 : barSlotWidth;

                const isHovered = hoveredMonth?.monthKey === m.monthKey;

                return (
                  <g
                    key={m.monthKey}
                    className="cursor-pointer transition-opacity"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredMonth(m);
                      setHoverPos({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredMonth(null)}
                    onClick={() => handleItemSearch(m.monthKey)}
                  >
                    {/* Hover column highlight */}
                    {isHovered && (
                      <rect
                        x={groupX}
                        y={chartPadding.top}
                        width={groupWidth}
                        height={innerHeight}
                        className="fill-m3-surface-container-highest/50"
                        rx="4"
                      />
                    )}

                    {/* Spend Bar */}
                    {(chartMetric === 'both' || chartMetric === 'spend') && (
                      <rect
                        x={isDual ? barCenter - barSlotWidth / 2 : barCenter - singleBarW / 2}
                        y={spendY}
                        width={singleBarW}
                        height={Math.max(spendH, 2)}
                        rx="3"
                        className="fill-m3-primary hover:opacity-90 transition-all"
                      />
                    )}

                    {/* Returns Bar */}
                    {(chartMetric === 'both' || chartMetric === 'returns') && m.returnsAmount > 0 && (
                      <rect
                        x={isDual ? barCenter - barSlotWidth / 2 + singleBarW + 3 : barCenter - singleBarW / 2}
                        y={returnsY}
                        width={singleBarW}
                        height={Math.max(returnsH, 2)}
                        rx="3"
                        fill="#f43f5e"
                        className="hover:opacity-90 transition-all"
                      />
                    )}

                    {/* X-Axis Month label */}
                    <text
                      x={barCenter}
                      y={svgHeight - 10}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight={isHovered ? 'bold' : 'normal'}
                      fill="currentColor"
                      className={isHovered ? 'text-m3-primary font-bold' : 'text-m3-on-surface-variant'}
                    >
                      {monthlyStats.length > 8 ? m.monthName : m.monthLabel.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Custom Interactive Floating Tooltip */}
            {hoveredMonth && (
              <div className="absolute top-2 right-2 bg-m3-inverse-surface text-m3-inverse-on-surface p-3 rounded-2xl shadow-xl text-xs space-y-1.5 border border-m3-outline-variant/40 min-w-[160px] pointer-events-none z-10">
                <div className="font-bold text-sm border-b border-white/10 pb-1 flex items-center justify-between">
                  <span>{hoveredMonth.monthLabel}</span>
                  <span className="text-[10px] text-m3-inverse-on-surface/70">
                    {hoveredMonth.receiptsCount} visit{hoveredMonth.receiptsCount === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-300">Purchases:</span>
                  <span className="font-mono font-bold">${hoveredMonth.grossPurchases.toFixed(2)}</span>
                </div>
                {hoveredMonth.returnsAmount > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-rose-300">
                    <span>Returns ({hoveredMonth.returnsCount}):</span>
                    <span className="font-mono font-bold">-${hoveredMonth.returnsAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] font-bold border-t border-white/10 pt-1">
                  <span>Net Total:</span>
                  <span className="font-mono text-m3-inverse-primary">${hoveredMonth.netSpend.toFixed(2)}</span>
                </div>
                {hoveredMonth.savings > 0 && (
                  <div className="text-[10px] text-emerald-400 pt-0.5">
                    Saved ${hoveredMonth.savings.toFixed(2)} in coupons
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-m3-on-surface-variant">
            No transaction records found for the selected period.
          </div>
        )}

        {/* Highest and Lowest Month Callout Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {aggregates.highestMonth && (
            <button
              type="button"
              onClick={() => handleItemSearch(aggregates.highestMonth?.monthKey || '')}
              className="p-3 rounded-2xl bg-m3-surface-container border border-m3-outline-variant/30 flex items-center justify-between text-xs text-left cursor-pointer hover:bg-m3-surface-container-highest transition-colors group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-m3-on-surface-variant block">
                    Highest Spend Month
                  </span>
                  <span className="font-bold text-m3-on-surface">
                    {aggregates.highestMonth.monthLabel}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-m3-primary block">
                  ${aggregates.highestMonth.netSpend.toFixed(2)}
                </span>
                <span className="text-[10px] text-m3-on-surface-variant group-hover:text-m3-primary flex items-center gap-0.5 justify-end">
                  Filter <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          )}

          {aggregates.lowestMonth && monthlyStats.length > 1 && (
            <button
              type="button"
              onClick={() => handleItemSearch(aggregates.lowestMonth?.monthKey || '')}
              className="p-3 rounded-2xl bg-m3-surface-container border border-m3-outline-variant/30 flex items-center justify-between text-xs text-left cursor-pointer hover:bg-m3-surface-container-highest transition-colors group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-m3-on-surface-variant block">
                    Most Frugal Month
                  </span>
                  <span className="font-bold text-m3-on-surface">
                    {aggregates.lowestMonth.monthLabel}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 block">
                  ${aggregates.lowestMonth.netSpend.toFixed(2)}
                </span>
                <span className="text-[10px] text-m3-on-surface-variant group-hover:text-emerald-600 flex items-center gap-0.5 justify-end">
                  Filter <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* MONTH-BY-MONTH DETAILED LIST */}
      <div className="bg-m3-surface-container-low rounded-3xl border border-m3-outline-variant/40 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-m3-outline-variant/30 flex items-center justify-between bg-m3-surface-container/60">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-m3-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface">
              Monthly Spend & Return Log ({monthlyStats.length} months)
            </h3>
          </div>
          <span className="text-[11px] text-m3-on-surface-variant">Tap month to filter</span>
        </div>

        <div className="divide-y divide-m3-outline-variant/30 max-h-72 overflow-y-auto">
          {[...monthlyStats].reverse().map((m) => (
            <button
              type="button"
              key={m.monthKey}
              onClick={() => handleItemSearch(m.monthKey)}
              className="w-full p-3 sm:p-3.5 flex items-center justify-between text-xs text-left cursor-pointer hover:bg-m3-surface-container transition-colors group"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-m3-on-surface group-hover:text-m3-primary transition-colors">
                    {m.monthLabel}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-m3-surface-container-high text-m3-on-surface-variant font-mono">
                    {m.receiptsCount} visit{m.receiptsCount === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-m3-on-surface-variant mt-0.5">
                  <span>{m.purchasesCount} items bought</span>
                  {m.returnsCount > 0 && (
                    <span className="text-rose-600 dark:text-rose-300 font-medium">
                      • {m.returnsCount} returned (-${m.returnsAmount.toFixed(2)})
                    </span>
                  )}
                  {m.savings > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-300">
                      • Saved ${m.savings.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-bold font-mono text-sm text-m3-on-surface block">
                  ${m.netSpend.toFixed(2)}
                </span>
                <span className="text-[10px] text-m3-on-surface-variant block font-mono">
                  avg ${(m.avgPerReceipt).toFixed(2)}/trip
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* DAY OF THE WEEK SHOPPING HABITS */}
      <div className="bg-m3-surface-container-low rounded-3xl p-4 sm:p-5 border border-m3-outline-variant/40 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-m3-tertiary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface">
              Shopping Days & Habits
            </h3>
          </div>
          {favoriteDay && (
            <span className="text-[11px] font-semibold text-m3-tertiary bg-m3-tertiary-container/40 px-2 py-0.5 rounded-full border border-m3-tertiary/20">
              Fav: {favoriteDay.dayName}
            </span>
          )}
        </div>

        {/* Days of week bars */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {dayOfWeekStats.map((day) => {
            const isFav = favoriteDay && favoriteDay.dayName === day.dayName && day.tripCount > 0;
            return (
              <div key={day.dayName} className="flex flex-col items-center space-y-1.5 text-center">
                <span className={`text-[10px] font-semibold ${isFav ? 'text-m3-primary font-bold' : 'text-m3-on-surface-variant'}`}>
                  {day.dayShort}
                </span>
                <div className="w-full bg-m3-surface-container h-16 rounded-xl overflow-hidden flex flex-col justify-end p-0.5">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(6, day.percentage)}%` }}
                    transition={{ duration: 0.5 }}
                    className={`w-full rounded-lg ${
                      isFav
                        ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                        : day.tripCount > 0
                        ? 'bg-m3-secondary'
                        : 'bg-m3-surface-container-highest'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-m3-on-surface">
                  #{day.tripCount}
                </span>
              </div>
            );
          })}
        </div>

        {/* Weekend vs Weekday Ratio Summary */}
        <div className="p-3 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-m3-primary" />
            <span className="text-m3-on-surface font-medium">
              Weekend Trips: <strong>{weekendVsWeekday.weekendTrips} ({weekendVsWeekday.weekendPercent}%)</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-m3-secondary" />
            <span className="text-m3-on-surface font-medium">
              Weekday Trips: <strong>{weekendVsWeekday.weekdayTrips} ({weekendVsWeekday.weekdayPercent}%)</strong>
            </span>
          </div>
        </div>
      </div>

      {/* TOP STAPLE ITEMS (MOST FREQUENTLY PURCHASED) */}
      {stapleItems.length > 0 && (
        <div className="bg-m3-surface-container-low rounded-3xl p-4 sm:p-5 border border-m3-outline-variant/40 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface">
                Most Frequent Staples ({stapleItems.length})
              </h3>
            </div>
            <span className="text-[10px] text-m3-on-surface-variant">Tap to search</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {stapleItems.map((item) => (
              <button
                type="button"
                key={item.itemId}
                onClick={() => handleItemSearch(item.itemId)}
                className="p-3 bg-m3-surface-container hover:bg-m3-surface-container-high rounded-2xl border border-m3-outline-variant/30 flex items-center justify-between text-xs text-left cursor-pointer transition-colors group"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-m3-on-surface truncate block group-hover:text-m3-primary transition-colors">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-m3-on-surface-variant block mt-0.5">
                    Item #{item.itemId} • {item.count} units bought
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold font-mono text-m3-on-surface block">
                    ${item.totalSpend.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-m3-on-surface-variant block font-mono">
                    last ${item.lastPrice.toFixed(2)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* HIGHEST VALUE SINGLE PURCHASES */}
      {highestPurchases.length > 0 && (
        <div className="bg-m3-surface-container-low rounded-3xl p-4 sm:p-5 border border-m3-outline-variant/40 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-m3-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface">
                Highest Single Item Purchases
              </h3>
            </div>
            <span className="text-[10px] text-m3-on-surface-variant">Top value</span>
          </div>

          <div className="divide-y divide-m3-outline-variant/30">
            {highestPurchases.map((it) => (
              <div
                key={it.id || `${it.itemId}_${it.orderDate}`}
                className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0"
              >
                <div className="min-w-0 pr-3">
                  <button
                    type="button"
                    onClick={() => handleItemSearch(it.itemId)}
                    className="font-semibold text-m3-on-surface truncate block text-left hover:text-m3-primary transition-colors cursor-pointer"
                  >
                    {it.productName || it.rawName}
                  </button>
                  <span className="text-[10px] text-m3-on-surface-variant block mt-0.5">
                    {it.orderDate} • {it.category || 'General'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold font-mono text-sm text-m3-on-surface">
                    ${it.totalPrice.toFixed(2)}
                  </span>
                  {onSelectReceipt && (
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('selection');
                        onSelectReceipt(it.orderId);
                      }}
                      className="text-[10px] px-2 py-1 rounded-full bg-m3-primary/10 hover:bg-m3-primary/20 text-m3-primary font-semibold transition-colors cursor-pointer"
                    >
                      Receipt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
