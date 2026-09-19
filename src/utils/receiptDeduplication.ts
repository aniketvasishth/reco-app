import { CostcoReceipt, CostcoItem } from '../types';

/**
 * Normalizes dates across different formats (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, ISO strings).
 */
export function normalizeReceiptDate(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim().split('T')[0];

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // MM/DD/YYYY or M/D/YYYY
  const mdyMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // MM/DD/YY
  const mdyShortMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
  if (mdyShortMatch) {
    const [, m, d, y] = mdyShortMatch;
    const fullYear = parseInt(y, 10) > 70 ? `19${y}` : `20${y}`;
    return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Fallback to Date parser
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return clean;
}

/**
 * Normalizes Costco order / transaction / barcode sequences by stripping non-alphanumeric
 * characters and leading zeros (e.g. "123-4-567" -> "1234567").
 */
export function normalizeOrderNumber(orderNum?: string): string {
  if (!orderNum) return '';
  return orderNum
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .replace(/^0+/, '');
}

/**
 * Checks if orderNumber is a generated random fallback (e.g., RC-123456) vs a real parsed store order/invoice number.
 */
function isGeneratedOrderNumber(orderNum?: string): boolean {
  if (!orderNum) return true;
  return /^rc-\d{6}$/i.test(orderNum.trim().toLowerCase());
}

/**
 * Normalizes an item's numeric SKU / Item ID (e.g. Costco 3-8 digit item numbers like "1142277").
 */
export function normalizeItemId(itemId?: string): string {
  if (!itemId) return '';
  return itemId.replace(/[^0-9]/g, '').replace(/^0+/, '');
}

/**
 * Creates a normalized signature for an individual item to compare across scans/uploads.
 */
function getItemSignature(item: CostcoItem): string {
  const cleanId = normalizeItemId(item.itemId);
  const cleanName = (item.rawName || item.productName || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 15);
  const price = Math.abs(item.totalPrice || 0).toFixed(2);
  const qty = item.quantity || 1;
  return `${cleanId || cleanName}:${qty}@${price}`;
}

/**
 * Generates a deterministic content fingerprint for a receipt based on its items and financial totals.
 */
export function getReceiptContentFingerprint(receipt: CostcoReceipt): string {
  const sortedItemSigs = (receipt.items || [])
    .map(getItemSignature)
    .sort()
    .join('|');
  const totalStr = Math.abs(receipt.total || 0).toFixed(2);
  const dateStr = normalizeReceiptDate(receipt.orderDate);
  return `${dateStr}__${totalStr}__[${sortedItemSigs}]`;
}

/**
 * Determines whether two receipts are the exact same purchase receipt.
 * Handles:
 * - Scan vs. JSON duplicates (e.g. user scans paper receipt AND uploads Costco app JSON)
 * - Re-scans of the same receipt (e.g. different camera angles or re-takes)
 * - JSON re-uploads & CSV re-imports
 * - Identical files or barcodes
 */
export function isSameReceipt(a: CostcoReceipt, b: CostcoReceipt): boolean {
  if (!a || !b) return false;

  // 1. Direct ID match
  if (a.id && b.id && a.id === b.id) {
    return true;
  }

  const dateA = normalizeReceiptDate(a.orderDate);
  const dateB = normalizeReceiptDate(b.orderDate);
  const datesMatch = !dateA || !dateB || dateA === dateB;

  const totalA = Math.abs(a.total || 0);
  const totalB = Math.abs(b.total || 0);
  const totalDiff = Math.abs(totalA - totalB);
  const totalsMatchStrict = totalDiff < 0.05;
  const totalsMatchClose = totalDiff < 0.50 || (totalA > 0 && totalDiff / totalA < 0.015);

  // 2. Real Costco Order / Invoice / Transaction Number match
  const rawOrderA = (a.orderNumber || '').trim().toLowerCase();
  const rawOrderB = (b.orderNumber || '').trim().toLowerCase();
  const normOrderA = normalizeOrderNumber(a.orderNumber);
  const normOrderB = normalizeOrderNumber(b.orderNumber);

  if (normOrderA && normOrderB) {
    const isGenA = isGeneratedOrderNumber(rawOrderA);
    const isGenB = isGeneratedOrderNumber(rawOrderB);

    // If both are real order numbers and match
    if (!isGenA && !isGenB) {
      if (normOrderA === normOrderB || normOrderA.includes(normOrderB) || normOrderB.includes(normOrderA)) {
        if (normOrderA.length >= 4 && normOrderB.length >= 4) {
          return true;
        }
      }
    }

    // If generated RC-XXXXXX, only match if totals or dates match
    if (normOrderA === normOrderB && (datesMatch || totalsMatchStrict)) {
      return true;
    }
  }

  // 3. Exact Content Fingerprint (items + date + total)
  const fpA = getReceiptContentFingerprint(a);
  const fpB = getReceiptContentFingerprint(b);
  if (fpA && fpB && fpA === fpB && (a.items?.length || 0) > 0) {
    return true;
  }

  // 4. Same File Name with matching total and item count
  if (
    a.fileName &&
    b.fileName &&
    a.fileName.trim().toLowerCase() === b.fileName.trim().toLowerCase() &&
    totalsMatchStrict &&
    (a.items?.length || 0) === (b.items?.length || 0)
  ) {
    return true;
  }

  // 5. Cross-deduplication between Scan and JSON via Costco Item SKUs & Prices
  const itemsA = a.items || [];
  const itemsB = b.items || [];

  if (itemsA.length > 0 && itemsB.length > 0) {
    // Extract set of numeric Costco SKUs (3-8 digits)
    const skusA = new Set(
      itemsA.map((i) => normalizeItemId(i.itemId)).filter((sku) => sku.length >= 3 && sku.length <= 8)
    );
    const skusB = new Set(
      itemsB.map((i) => normalizeItemId(i.itemId)).filter((sku) => sku.length >= 3 && sku.length <= 8)
    );

    let matchingSkusCount = 0;
    for (const sku of skusA) {
      if (skusB.has(sku)) {
        matchingSkusCount++;
      }
    }

    // Case A: Strong multi-SKU match on the same date or close total
    // (e.g. 2 or more identical Costco SKUs like 1142277 & 2010 found on both Scan & JSON)
    if (matchingSkusCount >= 2 && (datesMatch || totalsMatchClose)) {
      return true;
    }

    // Case B: Single-item receipt where the SKU and total match
    if (matchingSkusCount >= 1 && itemsA.length === 1 && itemsB.length === 1 && totalsMatchStrict) {
      return true;
    }

    // Case C: Totals match strictly (< $0.05) AND dates match
    if (totalsMatchStrict && datesMatch) {
      // If at least one distinct SKU matches
      if (matchingSkusCount >= 1) {
        return true;
      }

      // Check item prices correlation (OCR might have misread 1 digit of SKU, but prices match)
      const pricesA = itemsA.map((i) => Math.abs(i.totalPrice || 0).toFixed(2));
      const pricesB = new Set(itemsB.map((i) => Math.abs(i.totalPrice || 0).toFixed(2)));
      let priceMatches = 0;
      for (const p of pricesA) {
        if (pricesB.has(p)) priceMatches++;
      }
      const maxCount = Math.max(itemsA.length, itemsB.length);
      if (maxCount > 0 && (priceMatches / maxCount) >= 0.5) {
        return true;
      }
    }

    // Case D: High-percentage item signature overlap (>= 75% items match exactly)
    const sigsA = new Set(itemsA.map(getItemSignature));
    const sigsB = new Set(itemsB.map(getItemSignature));
    let sigMatches = 0;
    for (const sig of sigsA) {
      if (sigsB.has(sig)) sigMatches++;
    }
    const maxLen = Math.max(itemsA.length, itemsB.length);
    if (maxLen > 0 && (sigMatches / maxLen) >= 0.75 && (datesMatch || totalsMatchClose)) {
      return true;
    }
  }

  return false;
}

/**
 * Fuses an existing receipt and an incoming receipt to keep the highest quality data:
 * - If one is JSON and one is Scan: keeps the JSON's verified product catalog details,
 *   exact warehouse name, and tax lines, while preserving the Scan's rawImagePreview photo!
 */
export function fuseReceiptData(oldReceipt: CostcoReceipt, newReceipt: CostcoReceipt): CostcoReceipt {
  const isOldJson = oldReceipt.sourceType === 'json';
  const isNewJson = newReceipt.sourceType === 'json';

  // Base receipt is preferred source (JSON over Scan if one is JSON)
  const base = isNewJson ? newReceipt : oldReceipt;
  const secondary = isNewJson ? oldReceipt : newReceipt;
  const fusedId = oldReceipt.id || newReceipt.id;
  const fusedOrderNumber =
    isGeneratedOrderNumber(base.orderNumber) && !isGeneratedOrderNumber(secondary.orderNumber)
      ? secondary.orderNumber
      : base.orderNumber;

  const synchronizedItems = (base.items || []).map((it) => ({
    ...it,
    orderId: fusedId,
    orderNumber: it.orderNumber || fusedOrderNumber,
  }));

  return {
    ...base,
    // Preserve stable receipt ID
    id: fusedId,
    // Always preserve receipt image preview if captured
    rawImagePreview: newReceipt.rawImagePreview || oldReceipt.rawImagePreview,
    // Preserve user notes
    notes: newReceipt.notes || oldReceipt.notes,
    // Prefer authoritative warehouse location
    warehouseLocation:
      base.warehouseLocation && !base.warehouseLocation.includes('Costco Wholesale')
        ? base.warehouseLocation
        : secondary.warehouseLocation || base.warehouseLocation,
    // Prefer real order number over generated
    orderNumber: fusedOrderNumber,
    items: synchronizedItems,
    // Use the latest upload timestamp
    uploadedAt: newReceipt.uploadedAt || new Date().toISOString(),
  };
}

/**
 * Deduplicates a list of receipts, replacing any duplicates with the latest fused version.
 */
export function deduplicateReceiptList(receipts: CostcoReceipt[]): CostcoReceipt[] {
  if (!receipts || receipts.length === 0) return [];

  const result: CostcoReceipt[] = [];

  for (const receipt of receipts) {
    const existingIndex = result.findIndex((existing) => isSameReceipt(existing, receipt));
    if (existingIndex >= 0) {
      result[existingIndex] = fuseReceiptData(result[existingIndex], receipt);
    } else {
      result.push(receipt);
    }
  }

  return result;
}

/**
 * Merges incoming new receipts into existing receipts.
 * If an incoming receipt matches an existing one (e.g. Scan vs JSON of the same purchase),
 * the old receipt is REPLACED in-place with the enriched, fused version.
 * Returns the updated, deduplicated list.
 */
export function mergeAndDeduplicateReceipts(
  existingReceipts: CostcoReceipt[],
  incomingReceipts: CostcoReceipt[]
): {
  merged: CostcoReceipt[];
  replacedCount: number;
  addedCount: number;
} {
  // First, deduplicate incoming batch in case incoming contains duplicates
  const cleanIncoming = deduplicateReceiptList(incomingReceipts);

  // Clone existing list
  const currentList = [...existingReceipts];
  let replacedCount = 0;
  let addedCount = 0;

  for (const incoming of cleanIncoming) {
    const existingIndex = currentList.findIndex((existing) => isSameReceipt(existing, incoming));
    if (existingIndex >= 0) {
      // Replace the old duplicate receipt with the newly uploaded/fused receipt
      currentList[existingIndex] = fuseReceiptData(currentList[existingIndex], incoming);
      replacedCount++;
    } else {
      // Add new receipt to front
      currentList.unshift(incoming);
      addedCount++;
    }
  }

  // Final sanity pass to ensure no lingering duplicates
  const finalMerged = deduplicateReceiptList(currentList);

  return {
    merged: finalMerged,
    replacedCount,
    addedCount,
  };
}
