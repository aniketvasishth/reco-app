import { CostcoItem } from '../types';
import { parseDateToMs } from './receiptParsers';

export interface PricePoint {
  date: string;
  formattedDate: string;
  price: number;
  quantity: number;
  totalPrice: number;
  discount?: number;
  orderId: string;
  orderNumber?: string;
  warehouseLocation?: string;
  orderType: 'Warehouse' | 'Online';
  paymentCard?: string;
}

export interface PriceTrendSummary {
  itemId: string;
  displayName: string;
  brand?: string;
  category?: string;
  packageDetails?: string;
  purchaseCount: number;
  isEligible: boolean; // bought more than 2 times (count >= 3)
  firstPrice: number;
  latestPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  priceDelta: number;
  percentChange: number;
  direction: 'up' | 'down' | 'stable';
  history: PricePoint[];
}

export const MIN_PURCHASES_FOR_TREND = 3; // "bought more than 2 times" => at least 3 purchases

/**
 * Extracts and chronologically sorts all purchase instances for a given itemId.
 * Excludes return transactions to reflect actual retail shelf / purchase prices.
 */
export function getPurchasesForItem(itemId: string, allItems: CostcoItem[]): CostcoItem[] {
  if (!itemId) return [];

  const matched = allItems.filter(
    (it) =>
      it.itemId === itemId &&
      !it.isReturn &&
      it.unitPrice > 0 &&
      !/return|refund/i.test(it.rawName)
  );

  return matched.sort((a, b) => parseDateToMs(a.orderDate) - parseDateToMs(b.orderDate));
}

/**
 * Format a YYYY-MM-DD date into a compact label (e.g., "Oct 14, 24")
 */
export function formatCompactDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Computes price history analytics and trend direction for a series of purchases.
 */
export function calculatePriceTrend(
  purchases: CostcoItem[],
  threshold = MIN_PURCHASES_FOR_TREND
): PriceTrendSummary | null {
  if (!purchases || purchases.length === 0) return null;

  const sorted = [...purchases].sort(
    (a, b) => parseDateToMs(a.orderDate) - parseDateToMs(b.orderDate)
  );

  const representative = sorted[sorted.length - 1];
  const history: PricePoint[] = sorted.map((p) => ({
    date: p.orderDate,
    formattedDate: formatCompactDate(p.orderDate),
    price: Number(p.unitPrice.toFixed(2)),
    quantity: p.quantity,
    totalPrice: p.totalPrice,
    discount: p.discount,
    orderId: p.orderId,
    orderNumber: p.orderNumber,
    warehouseLocation: p.warehouseLocation,
    orderType: p.orderType,
    paymentCard: p.paymentCard,
  }));

  const prices = history.map((h) => h.price);
  const firstPrice = prices[0];
  const latestPrice = prices[prices.length - 1];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Number(
    (prices.reduce((sum, p) => sum + p, 0) / prices.length).toFixed(2)
  );

  const priceDelta = Number((latestPrice - firstPrice).toFixed(2));
  const percentChange =
    firstPrice > 0
      ? Number((((latestPrice - firstPrice) / firstPrice) * 100).toFixed(1))
      : 0;

  let direction: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(priceDelta) < 0.05) {
    direction = 'stable';
  } else if (priceDelta > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }

  return {
    itemId: representative.itemId,
    displayName: representative.productName || representative.rawName,
    brand: representative.brand,
    category: representative.category,
    packageDetails: representative.packageDetails,
    purchaseCount: history.length,
    isEligible: history.length >= threshold,
    firstPrice,
    latestPrice,
    minPrice,
    maxPrice,
    avgPrice,
    priceDelta,
    percentChange,
    direction,
    history,
  };
}

/**
 * Finds all unique items bought more than 3 times (or specified threshold).
 */
export function getTrackedTrendItems(
  allItems: CostcoItem[],
  threshold = MIN_PURCHASES_FOR_TREND
): PriceTrendSummary[] {
  const byItemId = new Map<string, CostcoItem[]>();

  for (const item of allItems) {
    if (!item.itemId || item.isReturn || item.unitPrice <= 0) continue;
    const list = byItemId.get(item.itemId) || [];
    list.push(item);
    byItemId.set(item.itemId, list);
  }

  const summaries: PriceTrendSummary[] = [];

  for (const [itemId, purchases] of byItemId.entries()) {
    if (purchases.length >= threshold) {
      const summary = calculatePriceTrend(purchases, threshold);
      if (summary) {
        summaries.push(summary);
      }
    }
  }

  // Sort by purchase count descending, then by absolute price delta
  return summaries.sort((a, b) => {
    if (b.purchaseCount !== a.purchaseCount) {
      return b.purchaseCount - a.purchaseCount;
    }
    return Math.abs(b.priceDelta) - Math.abs(a.priceDelta);
  });
}
