import React from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  Store,
  Globe,
  CreditCard,
  ArrowUpDown,
  Tag,
  Check,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FilterState } from '../types';
import { M3_TRANSITIONS, M3_EASING } from '../utils/motion';
import { M3Ripple } from './M3Ripple';

interface SearchAndFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  availableCards: string[];
  availableCategories: string[];
  totalItemCount: number;
  filteredItemCount: number;
  recentItemIds: string[];
}

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  activeContainerClass?: string;
  activeTextClass?: string;
}

function M3FilterChip({
  label,
  selected,
  onClick,
  icon,
  activeContainerClass = 'bg-m3-secondary-container border-m3-secondary/40 text-m3-on-secondary-container shadow-xs',
  activeTextClass = 'text-m3-on-secondary-container',
}: FilterChipProps) {
  const { onPointerDown, renderRipples } = M3Ripple({
    color: selected ? 'bg-current' : 'bg-m3-primary',
  });

  return (
    <motion.button
      layout
      type="button"
      whileTap={{ scale: 0.94 }}
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={`relative overflow-hidden inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none ${
        selected
          ? activeContainerClass
          : 'bg-m3-surface-container-high/70 hover:bg-m3-surface-container-highest border-m3-outline-variant/60 text-m3-on-surface-variant hover:text-m3-on-surface'
      }`}
    >
      {renderRipples()}

      {/* M3 Animated Leading Checkmark / Icon morph */}
      <AnimatePresence mode="wait" initial={false}>
        {selected ? (
          <motion.span
            key="check"
            initial={{ width: 0, scale: 0, opacity: 0 }}
            animate={{ width: 'auto', scale: 1, opacity: 1 }}
            exit={{ width: 0, scale: 0, opacity: 0 }}
            transition={{
              scale: { duration: 0.22, ease: M3_EASING.emphasizedDecelerate },
              width: { duration: 0.2, ease: M3_EASING.standard },
              opacity: { duration: 0.18 },
            }}
            className="inline-flex items-center overflow-hidden"
          >
            <Check className="w-3.5 h-3.5 shrink-0 text-current stroke-[2.5]" />
          </motion.span>
        ) : icon ? (
          <motion.span
            key="icon"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="inline-flex items-center shrink-0 opacity-80"
          >
            {icon}
          </motion.span>
        ) : null}
      </AnimatePresence>

      <span className={selected ? activeTextClass : ''}>{label}</span>
    </motion.button>
  );
}

export function SearchAndFilters({
  filters,
  onFilterChange,
  availableCards,
  availableCategories,
  totalItemCount,
  filteredItemCount,
  recentItemIds,
}: SearchAndFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.orderType !== 'all' ||
    filters.category !== 'all' ||
    filters.selectedCard !== 'all' ||
    filters.sortBy !== 'date-desc';

  const resetFilters = () => {
    onFilterChange({
      searchQuery: '',
      orderType: 'all',
      category: 'all',
      sortBy: 'date-desc',
      selectedCard: 'all',
      year: 'all',
    });
  };

  return (
    <div className="bg-m3-surface-container-lowest dark:bg-m3-surface-container-low rounded-3xl border border-m3-outline-variant/60 shadow-xs p-4 sm:p-5 space-y-4 m3-elevation-transition">
      {/* Primary Item ID / Keyword Search Bar (M3 Search Bar Pattern) */}
      <div className="relative flex items-center">
        <div className="absolute left-4 text-m3-on-surface-variant pointer-events-none">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => updateFilter('searchQuery', e.target.value)}
          placeholder="Search by Costco Item ID (e.g. 1142277, 2010, 1462000) or product name..."
          className="w-full pl-12 pr-11 py-3 sm:py-3.5 bg-m3-surface-container-high hover:bg-m3-surface-container-highest focus:bg-m3-surface-container-highest text-m3-on-surface placeholder:text-m3-on-surface-variant rounded-full border border-transparent focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/30 text-sm font-medium transition-all outline-hidden"
        />
        {filters.searchQuery && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => updateFilter('searchQuery', '')}
            className="absolute right-3.5 p-1 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-lowest transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Quick Search Item ID Suggestions (M3 Suggestion Chips) */}
      {recentItemIds.length > 0 && !filters.searchQuery && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-m3-on-surface-variant">
          <span className="font-semibold text-m3-on-surface flex items-center gap-1">
            <Tag className="w-3 h-3 text-m3-primary" />
            Quick Item IDs:
          </span>
          {recentItemIds.slice(0, 6).map((id) => (
            <motion.button
              key={id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => updateFilter('searchQuery', id)}
              className="px-2.5 py-0.5 rounded-lg bg-m3-secondary-container hover:bg-m3-primary-container text-m3-on-secondary-container hover:text-m3-on-primary-container border border-m3-outline-variant/40 font-mono text-[11px] font-semibold transition-colors cursor-pointer"
            >
              #{id}
            </motion.button>
          ))}
        </div>
      )}

      {/* Filter and Sort Row with Animated M3 Filter Chips */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-m3-outline-variant/40">
        
        {/* Channel Filter Chips with Checkmark Morphing */}
        <div className="flex items-center gap-2 flex-wrap">
          <M3FilterChip
            label="All Purchases"
            selected={filters.orderType === 'all'}
            onClick={() => updateFilter('orderType', 'all')}
          />
          <M3FilterChip
            label="Warehouse"
            icon={<Store className="w-3.5 h-3.5" />}
            selected={filters.orderType === 'Warehouse'}
            onClick={() => updateFilter('orderType', 'Warehouse')}
            activeContainerClass="bg-m3-primary-container border-m3-primary/40 text-m3-on-primary-container shadow-xs"
            activeTextClass="text-m3-on-primary-container"
          />
          <M3FilterChip
            label="Costco Online"
            icon={<Globe className="w-3.5 h-3.5" />}
            selected={filters.orderType === 'Online'}
            onClick={() => updateFilter('orderType', 'Online')}
            activeContainerClass="bg-m3-tertiary-container border-m3-tertiary/40 text-m3-on-tertiary-container shadow-xs"
            activeTextClass="text-m3-on-tertiary-container"
          />
        </div>

        {/* Secondary Select Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Payment Card Filter */}
          {availableCards.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <CreditCard className="w-3.5 h-3.5 text-m3-on-surface-variant hidden sm:inline" />
              <select
                value={filters.selectedCard}
                onChange={(e) => updateFilter('selectedCard', e.target.value)}
                className="bg-m3-surface-container border border-m3-outline-variant/60 text-m3-on-surface text-xs rounded-xl px-2.5 py-1.5 focus:border-m3-primary focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Payment Cards</option>
                {availableCards.map((card) => (
                  <option key={card} value={card}>
                    {card}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="bg-m3-surface-container border border-m3-outline-variant/60 text-m3-on-surface text-xs rounded-xl px-2.5 py-1.5 focus:border-m3-primary focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <div className="flex items-center gap-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-m3-on-surface-variant hidden sm:inline" />
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value as any)}
              className="bg-m3-surface-container border border-m3-outline-variant/60 text-m3-on-surface text-xs rounded-xl px-2.5 py-1.5 focus:border-m3-primary focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="date-desc">Newest Purchase</option>
              <option value="date-asc">Oldest Purchase</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="item-asc">Item ID (0-9)</option>
            </select>
          </div>

          {/* Animated Clear Button */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.92 }}
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-m3-error hover:bg-m3-error-container/40 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Result feedback count with Animated Spring Bounce */}
      <div className="flex items-center justify-between text-xs text-m3-on-surface-variant pt-1">
        <span className="flex items-center gap-1.5 flex-wrap">
          <span>Showing</span>
          <motion.strong
            key={filteredItemCount}
            initial={{ scale: 1.35, color: 'var(--md-sys-color-primary)' }}
            animate={{ scale: 1, color: 'inherit' }}
            transition={M3_TRANSITIONS.snappySpring}
            className="text-m3-on-surface font-mono font-bold inline-block"
          >
            {filteredItemCount}
          </motion.strong>
          <span>of</span>
          <strong className="text-m3-on-surface font-mono">{totalItemCount}</strong>
          <span>purchases</span>
          {filters.searchQuery && (
            <span>
              matching "<strong className="text-m3-primary">{filters.searchQuery}</strong>"
            </span>
          )}
        </span>
        {filters.orderType !== 'all' && (
          <span className="font-medium text-m3-on-surface">
            Channel: {filters.orderType}
          </span>
        )}
      </div>
    </div>
  );
}
