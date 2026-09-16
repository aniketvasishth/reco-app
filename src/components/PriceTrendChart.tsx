import React, { useState, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Store,
  Tag,
  Receipt,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PriceTrendSummary, PricePoint } from '../utils/priceTrend';
import { M3_TRANSITIONS } from '../utils/motion';

interface PriceTrendChartProps {
  trend: PriceTrendSummary;
  onViewReceipt?: (orderId: string) => void;
  compact?: boolean;
}

export function PriceTrendChart({
  trend,
  onViewReceipt,
  compact = false,
}: PriceTrendChartProps) {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const {
    displayName,
    itemId,
    purchaseCount,
    firstPrice,
    latestPrice,
    minPrice,
    maxPrice,
    avgPrice,
    priceDelta,
    percentChange,
    direction,
    history,
  } = trend;

  // Calculate Y-axis bounds to provide optical breathing room around price points
  const priceRange = maxPrice - minPrice;
  const yBuffer = priceRange > 0 ? Math.max(priceRange * 0.25, 0.5) : Math.max(minPrice * 0.1, 1);
  const yMin = Math.max(0, Number((minPrice - yBuffer).toFixed(2)));
  const yMax = Number((maxPrice + yBuffer).toFixed(2));
  const effectiveRange = yMax - yMin || 1;

  // Chart coordinate space
  const svgWidth = 500;
  const svgHeight = 160;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Calculate coordinates for each point
  const points = history.map((pt, idx) => {
    const x =
      history.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (idx / (history.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((pt.price - yMin) / effectiveRange) * chartHeight;
    return {
      ...pt,
      x,
      y,
      index: idx,
    };
  });

  // Calculate smooth SVG path
  let pathD = '';
  let areaD = '';

  if (points.length === 1) {
    pathD = `M ${padding.left},${points[0].y} L ${padding.left + chartWidth},${points[0].y}`;
    areaD = `M ${padding.left},${padding.top + chartHeight} L ${padding.left},${points[0].y} L ${
      padding.left + chartWidth
    },${points[0].y} L ${padding.left + chartWidth},${padding.top + chartHeight} Z`;
  } else if (points.length > 1) {
    pathD = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      pathD += ` C ${cx},${p0.y} ${cx},${p1.y} ${p1.x},${p1.y}`;
    }

    areaD =
      pathD +
      ` L ${points[points.length - 1].x},${padding.top + chartHeight}` +
      ` L ${points[0].x},${padding.top + chartHeight} Z`;
  }

  // Average line Y coordinate
  const avgY = padding.top + chartHeight - ((avgPrice - yMin) / effectiveRange) * chartHeight;

  // Theme stroke and gradient
  const strokeColor =
    direction === 'up'
      ? '#e11d48'
      : direction === 'down'
      ? '#059669'
      : '#7c3aed';

  const gradientId = `trendGradient-${itemId}-${Math.random().toString(36).substring(2, 6)}`;

  // Mouse / Touch interaction on SVG
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;

    // Find nearest point
    let closest = points[0];
    let minDistance = Math.abs(points[0].x - mouseX);
    for (const pt of points) {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        closest = pt;
      }
    }
    setHoveredPoint(closest);
    setHoverPos({
      x: (closest.x / svgWidth) * rect.width,
      y: (closest.y / svgHeight) * rect.height,
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverPos(null);
  };

  return (
    <div className="w-full bg-m3-surface-container/60 dark:bg-m3-surface-container-high/40 rounded-2xl p-3.5 sm:p-4 border border-m3-outline-variant/50 flex flex-col gap-3">
      {/* Header Row: Trend Status & Key Stats */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-m3-secondary-container text-m3-on-secondary-container border border-m3-outline-variant/40">
              <Tag className="w-3 h-3 text-m3-primary" />
              <span>{purchaseCount} Purchases Plotted</span>
            </span>

            {/* Price Trend Direction Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                direction === 'up'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  : direction === 'down'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-m3-surface-container-highest text-m3-on-surface-variant border-m3-outline-variant/50'
              }`}
            >
              {direction === 'up' && <TrendingUp className="w-3 h-3" />}
              {direction === 'down' && <TrendingDown className="w-3 h-3" />}
              {direction === 'stable' && <Minus className="w-3 h-3" />}
              <span>
                {direction === 'up' && `+${percentChange}% (+` + `$${priceDelta})`}
                {direction === 'down' && `${percentChange}% (-` + `$${Math.abs(priceDelta)})`}
                {direction === 'stable' && 'Steady Price'}
              </span>
            </span>
          </div>
          <span className="text-[11px] text-m3-on-surface-variant/80 block mt-1">
            Price movement over time from {history[0]?.formattedDate} to{' '}
            {history[history.length - 1]?.formattedDate}
          </span>
        </div>

        {/* Current / Latest Price */}
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-m3-on-surface-variant tracking-wider block">
            Latest Price
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-m3-on-surface">
            ${latestPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Metric Pills Grid: First, Min, Max, Avg */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-xs">
        <div className="bg-m3-surface-container-lowest dark:bg-m3-surface-container-low p-2 rounded-xl border border-m3-outline-variant/30">
          <span className="text-[10px] text-m3-on-surface-variant block uppercase font-semibold">
            First Paid
          </span>
          <span className="font-bold font-mono text-m3-on-surface">${firstPrice.toFixed(2)}</span>
        </div>
        <div className="bg-m3-surface-container-lowest dark:bg-m3-surface-container-low p-2 rounded-xl border border-m3-outline-variant/30">
          <span className="text-[10px] text-m3-on-surface-variant block uppercase font-semibold">
            Lowest
          </span>
          <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ${minPrice.toFixed(2)}
          </span>
        </div>
        <div className="bg-m3-surface-container-lowest dark:bg-m3-surface-container-low p-2 rounded-xl border border-m3-outline-variant/30">
          <span className="text-[10px] text-m3-on-surface-variant block uppercase font-semibold">
            Highest
          </span>
          <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
            ${maxPrice.toFixed(2)}
          </span>
        </div>
        <div className="bg-m3-surface-container-lowest dark:bg-m3-surface-container-low p-2 rounded-xl border border-m3-outline-variant/30">
          <span className="text-[10px] text-m3-on-surface-variant block uppercase font-semibold">
            Average
          </span>
          <span className="font-bold font-mono text-m3-on-surface">${avgPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Main Vector SVG Area Chart */}
      <div className="relative h-44 sm:h-48 w-full pt-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full select-none cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={svgWidth - padding.right}
            y2={padding.top}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartHeight / 2}
            x2={svgWidth - padding.right}
            y2={padding.top + chartHeight / 2}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={svgWidth - padding.right}
            y2={padding.top + chartHeight}
            stroke="currentColor"
            strokeOpacity={0.2}
          />

          {/* Average Reference Line */}
          <line
            x1={padding.left}
            y1={avgY}
            x2={svgWidth - padding.right}
            y2={avgY}
            stroke="currentColor"
            strokeOpacity={0.35}
            strokeDasharray="4 4"
          />
          <text
            x={padding.left + 6}
            y={avgY - 4}
            fontSize="9"
            fill="currentColor"
            className="fill-m3-on-surface-variant opacity-70 font-mono font-bold"
          >
            Avg ${avgPrice}
          </text>

          {/* Y-Axis Labels */}
          <text
            x={padding.left - 6}
            y={padding.top + 4}
            textAnchor="end"
            fontSize="9"
            className="fill-m3-on-surface-variant font-mono"
          >
            ${yMax.toFixed(0)}
          </text>
          <text
            x={padding.left - 6}
            y={padding.top + chartHeight}
            textAnchor="end"
            fontSize="9"
            className="fill-m3-on-surface-variant font-mono"
          >
            ${yMin.toFixed(0)}
          </text>

          {/* Area Gradient Fill */}
          {areaD && <path d={areaD} fill={`url(#${gradientId})`} />}

          {/* Main Stroke Path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Point Dots & Date Labels */}
          {points.map((pt, i) => {
            const isHovered = hoveredPoint?.orderId === pt.orderId;
            const isFirst = i === 0;
            const isLast = i === points.length - 1;

            return (
              <g key={`${pt.orderId}-${i}`}>
                {/* Date Label on bottom */}
                {(isFirst || isLast || points.length <= 4) && (
                  <text
                    x={pt.x}
                    y={padding.top + chartHeight + 16}
                    textAnchor="middle"
                    fontSize="9"
                    className="fill-m3-on-surface-variant font-medium"
                  >
                    {pt.formattedDate}
                  </text>
                )}

                {/* Point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#ffffff' : strokeColor}
                  stroke={strokeColor}
                  strokeWidth={isHovered ? 2.5 : 1}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* Hover indicator crosshair line */}
          {hoveredPoint && (
            <line
              x1={points.find((p) => p.orderId === hoveredPoint.orderId)?.x || 0}
              y1={padding.top}
              x2={points.find((p) => p.orderId === hoveredPoint.orderId)?.x || 0}
              y2={padding.top + chartHeight}
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
            />
          )}
        </svg>

        {/* Floating Custom Tooltip */}
        {hoveredPoint && hoverPos && (
          <div
            className="absolute pointer-events-none z-20 -translate-x-1/2 -translate-y-full mb-3 bg-m3-surface-container-highest/95 backdrop-blur-md text-m3-on-surface p-2.5 rounded-xl shadow-lg border border-m3-outline-variant/60 text-xs min-w-[170px] space-y-1"
            style={{
              left: `${Math.max(85, Math.min(window.innerWidth - 85, hoverPos.x))}px`,
              top: `${Math.max(10, hoverPos.y - 12)}px`,
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-m3-outline-variant/40 pb-1">
              <span className="font-semibold text-[11px] text-m3-on-surface-variant flex items-center gap-1">
                <Calendar className="w-3 h-3 text-m3-primary" />
                {hoveredPoint.formattedDate}
              </span>
              <span className="font-mono font-bold text-sm text-m3-on-surface">
                ${hoveredPoint.price.toFixed(2)}
              </span>
            </div>

            <div className="text-[11px] text-m3-on-surface-variant space-y-0.5 pt-0.5">
              <div className="flex items-center gap-1 truncate" title={hoveredPoint.warehouseLocation}>
                <Store className="w-3 h-3 text-m3-primary shrink-0" />
                <span className="truncate">{hoveredPoint.warehouseLocation || 'Costco'}</span>
              </div>

              {hoveredPoint.discount && hoveredPoint.discount > 0 && (
                <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Saved ${hoveredPoint.discount.toFixed(2)} rebate
                </div>
              )}

              {hoveredPoint.quantity > 1 && <div>Qty Purchased: {hoveredPoint.quantity}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Expandable Purchase History Table Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-m3-surface-container-lowest dark:bg-m3-surface-container-low text-xs font-semibold text-m3-on-surface hover:bg-m3-surface-container-high transition-colors cursor-pointer border border-m3-outline-variant/30"
        >
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-m3-primary" />
            <span>Transaction Timeline ({history.length} Receipts)</span>
          </span>
          <span className="text-m3-on-surface-variant flex items-center gap-1 text-[11px]">
            {isHistoryExpanded ? 'Hide' : 'Show Details'}
            {isHistoryExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        </button>

        {/* Detailed Timeline Table */}
        <AnimatePresence>
          {isHistoryExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={M3_TRANSITIONS.emphasizedEnter}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-1.5 pt-1">
                {history.map((pt, idx) => {
                  const prevPrice = idx > 0 ? history[idx - 1].price : null;
                  const diff = prevPrice !== null ? pt.price - prevPrice : null;

                  return (
                    <div
                      key={`${pt.orderId}-${idx}`}
                      className="p-2.5 rounded-xl bg-m3-surface-container-lowest dark:bg-m3-surface-container-low border border-m3-outline-variant/25 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-m3-on-surface">
                            {pt.formattedDate}
                          </span>
                          {pt.orderType && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-m3-surface-container text-m3-on-surface-variant font-medium">
                              {pt.orderType}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-m3-on-surface-variant block truncate">
                          {pt.warehouseLocation || 'Costco Warehouse'}
                        </span>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <span className="font-bold font-mono text-m3-on-surface block">
                            ${pt.price.toFixed(2)}
                          </span>
                          {diff !== null && (
                            <span
                              className={`text-[10px] font-mono font-medium block ${
                                diff > 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : diff < 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-m3-on-surface-variant/70'
                              }`}
                            >
                              {diff > 0 && `+$${diff.toFixed(2)}`}
                              {diff < 0 && `-$${Math.abs(diff).toFixed(2)}`}
                              {diff === 0 && 'Unchanged'}
                            </span>
                          )}
                        </div>

                        {onViewReceipt && (
                          <button
                            type="button"
                            onClick={() => onViewReceipt(pt.orderId)}
                            title="Open this receipt"
                            className="p-1 rounded-lg text-m3-primary hover:bg-m3-primary/10 transition-colors cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
