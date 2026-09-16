import { CostcoReceipt, CostcoItem, PurchaseType } from '../types';
import { resolveCostcoItemDetails } from './costcoCatalog';

// Local storage key for enriched item caching
const ENRICHED_CACHE_KEY = 'costco_enriched_items_cache_v1';

export function getCachedEnrichments(): Record<string, Partial<CostcoItem>> {
  try {
    const raw = localStorage.getItem(ENRICHED_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCachedEnrichment(itemId: string, data: Partial<CostcoItem>) {
  try {
    const current = getCachedEnrichments();
    current[itemId] = { ...current[itemId], ...data };
    localStorage.setItem(ENRICHED_CACHE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to cache item enrichment:', e);
  }
}

export const NON_COSTCO_ERROR_MESSAGE =
  'Receipt rejected: Costco receipts have the Costco Wholesale logo at the top. The uploaded receipt does not have the Costco Wholesale logo.';

export class NonCostcoReceiptError extends Error {
  constructor(message = NON_COSTCO_ERROR_MESSAGE) {
    super(message);
    this.name = 'NonCostcoReceiptError';
  }
}

// Convert receipt image File to Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Parse CSV text exported from Chrome Extension
export function parseCostcoCsv(csvText: string, fileName: string): CostcoReceipt[] {
  const lowerCsv = csvText.toLowerCase();
  const nonCostcoBrands = [
    'freshco', 'fresh co', 'fresh-co', 'walmart', 'target', 'trader joe', 'home depot', 'best buy',
    'safeway', 'kroger', 'cvs', 'walgreens', 'mcdonald', 'starbucks',
    'loblaws', 'sobeys', 'metro', 'no frills', 'real canadian superstore',
    'ikea', 'whole foods', 'publix', 'aldi', 'lidl', 'canadian tire', 'amazon',
    'giant eagle', 'food lion', 'wegmans', 'winco', 'sprouts', 'h-e-b', 'heb'
  ];

  const matchedOtherBrand = nonCostcoBrands.find((b) => lowerCsv.includes(b));
  if (matchedOtherBrand && !lowerCsv.includes('costco') && !lowerCsv.includes('kirkland')) {
    throw new NonCostcoReceiptError(
      `Receipt rejected: This document appears to be from ${matchedOtherBrand.toUpperCase()} and does not have the Costco Wholesale logo at the top. Only official Costco receipts are accepted.`
    );
  }

  const hasCostcoMarker =
    lowerCsv.includes('costco') ||
    lowerCsv.includes('warehouse') ||
    lowerCsv.includes('kirkland') ||
    lowerCsv.includes('itemarray') ||
    lowerCsv.includes('tenderdescription') ||
    lowerCsv.includes('membership');

  if (!hasCostcoMarker) {
    throw new NonCostcoReceiptError();
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV file appears to be empty or has no data rows.');
  }

  // Simple CSV line splitter handling quoted commas
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Find column indices
  const findCol = (possibleNames: string[]): number => {
    return headers.findIndex((h) => possibleNames.some((p) => h.includes(p)));
  };

  const idxDate = findCol(['orderdate', 'date', 'transactiondate', 'purchasedate']);
  const idxOrderNum = findCol(['ordernumber', 'receiptnumber', 'receipt', 'orderid', 'transactionid']);
  const idxType = findCol(['ordertype', 'purchasetype', 'type', 'channel', 'locationtype']);
  const idxLocation = findCol(['location', 'warehouselocation', 'store', 'warehouse']);
  const idxItemId = findCol(['itemnumber', 'itemid', 'itemsku', 'sku', 'number', 'itemno', 'item']);
  const idxName = findCol(['itemname', 'description', 'itemdescription', 'productname', 'name']);
  const idxQty = findCol(['quantity', 'qty', 'count']);
  const idxPrice = findCol(['unitprice', 'price', 'each']);
  const idxTotal = findCol(['totalprice', 'total', 'amount', 'extprice', 'subtotal']);
  const idxCard = findCol(['paymentcard', 'card', 'paymentmethod', 'tender', 'accountnumber']);

  // Group rows by order/receipt
  const receiptMap: Record<string, CostcoReceipt> = {};

  const cached = getCachedEnrichments();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.length <= 1) continue;

    const rawDate = idxDate !== -1 ? cols[idxDate] || '' : new Date().toISOString().slice(0, 10);
    // Standardize date to YYYY-MM-DD
    let orderDate = rawDate;
    const parsedDate = Date.parse(rawDate);
    if (!isNaN(parsedDate)) {
      orderDate = new Date(parsedDate).toISOString().slice(0, 10);
    }

    const orderNumber = (idxOrderNum !== -1 ? cols[idxOrderNum] : '') || `CSV-${i}`;
    const rawType = (idxType !== -1 ? cols[idxType] : '').toLowerCase();
    const orderType: PurchaseType = rawType.includes('online') || rawType.includes('costco.com') ? 'Online' : 'Warehouse';
    const warehouseLocation = (idxLocation !== -1 ? cols[idxLocation] : '') || (orderType === 'Online' ? 'Costco.com' : 'Costco Warehouse');
    const paymentCard = (idxCard !== -1 ? cols[idxCard] : '') || 'Costco Anywhere Visa';

    const rawItemId = idxItemId !== -1 ? cols[idxItemId] : '';
    // Clean item ID to numeric or alphanumeric string (preserve leading slash if present for return tracking)
    const isSlashItem = rawItemId.trim().startsWith('/');
    const itemId = (isSlashItem ? '/' : '') + rawItemId.replace(/[^a-zA-Z0-9]/g, '') || `ITEM-${i}`;
    const rawName = (idxName !== -1 ? cols[idxName] : '') || `Costco Item #${itemId}`;

    const rawTotalStr = idxTotal !== -1 ? (cols[idxTotal] || '') : '';
    const rawPriceStr = idxPrice !== -1 ? (cols[idxPrice] || '') : '';
    const rawQtyStr = idxQty !== -1 ? (cols[idxQty] || '') : '';

    // Check for negative indicator: '-' anywhere, parentheses '(12.99)', or explicit return words
    const hasReturnMarker =
      rawTotalStr.includes('-') ||
      rawTotalStr.includes('(') ||
      rawPriceStr.includes('-') ||
      rawPriceStr.includes('(') ||
      rawQtyStr.includes('-') ||
      rawName.toLowerCase().includes('return') ||
      rawName.toLowerCase().includes('refund') ||
      rawName.toLowerCase().includes('retour') ||
      rawType.includes('return') ||
      rawType.includes('refund') ||
      orderNumber.toLowerCase().includes('return') ||
      orderNumber.toLowerCase().includes('refund');

    const parseMoney = (valStr: string): number => {
      if (!valStr) return 0;
      const clean = valStr.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? 0 : parsed;
    };

    const parsedQty = idxQty !== -1 ? Math.abs(parseMoney(cols[idxQty])) || 1 : 1;
    const rawParsedUnitPrice = idxPrice !== -1 ? parseMoney(cols[idxPrice]) : 0;
    const rawParsedTotalPrice = idxTotal !== -1 ? parseMoney(cols[idxTotal]) : rawParsedUnitPrice * parsedQty;

    const isReturn = hasReturnMarker || rawParsedTotalPrice < 0 || rawParsedUnitPrice < 0;
    const absUnitPrice = Math.abs(rawParsedUnitPrice) > 0 ? Math.abs(rawParsedUnitPrice) : (parsedQty > 0 ? Number((Math.abs(rawParsedTotalPrice) / parsedQty).toFixed(2)) : Math.abs(rawParsedTotalPrice));
    const absTotalPrice = Math.abs(rawParsedTotalPrice) > 0 ? Math.abs(rawParsedTotalPrice) : Number((absUnitPrice * parsedQty).toFixed(2));

    const finalUnitPrice = isReturn ? -absUnitPrice : absUnitPrice;
    const finalTotalPrice = isReturn ? -absTotalPrice : absTotalPrice;

    const receiptKey = `${orderDate}_${orderNumber}`;
    if (!receiptMap[receiptKey]) {
      receiptMap[receiptKey] = {
        id: `rcpt_csv_${receiptKey.replace(/[^a-zA-Z0-9]/g, '_')}`,
        orderNumber,
        orderDate,
        orderType,
        warehouseLocation,
        paymentCard,
        subtotal: 0,
        tax: 0,
        total: 0,
        sourceType: 'csv',
        fileName,
        uploadedAt: new Date().toISOString(),
        items: [],
      };
    }

    const cachedInfo = cached[itemId] || {};

    const item: CostcoItem = {
      id: `item_${receiptKey}_${itemId}_${i}`,
      itemId,
      rawName,
      productName: cachedInfo.productName || undefined,
      brand: cachedInfo.brand || undefined,
      category: cachedInfo.category || undefined,
      description: cachedInfo.description || undefined,
      packageDetails: cachedInfo.packageDetails || undefined,
      webSourceUrl: cachedInfo.webSourceUrl || undefined,
      isEnriched: !!cachedInfo.productName,
      isReturn: isReturn,
      quantity: parsedQty,
      unitPrice: finalUnitPrice,
      totalPrice: finalTotalPrice,
      orderId: receiptMap[receiptKey].id,
      orderNumber,
      orderDate,
      orderType,
      warehouseLocation,
      paymentCard,
    };

    receiptMap[receiptKey].items.push(item);
    if (isReturn) {
      receiptMap[receiptKey].isReturn = true;
    }
    receiptMap[receiptKey].subtotal += finalTotalPrice;
    receiptMap[receiptKey].total += finalTotalPrice;
  }

  const receipts = Object.values(receiptMap);
  if (receipts.length === 0) {
    throw new Error('No valid Costco purchase items could be parsed from this CSV.');
  }

  return receipts;
}

// Parse JSON exported from Chrome Extension (Costco Order Exporter, official Costco WarehouseReceiptDetail, etc.)
export function parseCostcoJson(jsonContent: any, fileName: string): CostcoReceipt[] {
  const rawString = typeof jsonContent === 'string' ? jsonContent : JSON.stringify(jsonContent);
  const lowerJson = rawString.toLowerCase();

  const nonCostcoBrands = [
    'walmart', 'target', 'trader joe', 'home depot', 'best buy',
    'safeway', 'kroger', 'cvs', 'walgreens', 'mcdonald', 'starbucks',
    'loblaws', 'sobeys', 'metro', 'no frills', 'real canadian superstore',
    'ikea', 'whole foods', 'publix', 'aldi', 'lidl', 'canadian tire', 'amazon'
  ];

  if (nonCostcoBrands.some((b) => lowerJson.includes(b)) && !lowerJson.includes('costco')) {
    throw new NonCostcoReceiptError();
  }

  // Check positive Costco markers (either in text or in schema properties)
  const hasCostcoText =
    lowerJson.includes('costco') ||
    lowerJson.includes('kirkland') ||
    lowerJson.includes('warehousename') ||
    lowerJson.includes('warehousenumber') ||
    lowerJson.includes('transactionbarcode') ||
    lowerJson.includes('itemactualname') ||
    lowerJson.includes('frenchitemdescription') ||
    lowerJson.includes('itemdescription01') ||
    lowerJson.includes('tenderarray') ||
    lowerJson.includes('warehouse');

  if (!hasCostcoText) {
    throw new NonCostcoReceiptError();
  }

  let data = jsonContent;
  if (typeof jsonContent === 'string') {
    data = JSON.parse(jsonContent);
  }

  const cached = getCachedEnrichments();
  const receipts: CostcoReceipt[] = [];

  // Identify list of orders/receipts from various common JSON export schemas
  let rawOrders: any[] = [];
  if (Array.isArray(data)) {
    rawOrders = data;
  } else if (data && typeof data === 'object') {
    if (Array.isArray(data.orders)) rawOrders = data.orders;
    else if (Array.isArray(data.receipts)) rawOrders = data.receipts;
    else if (Array.isArray(data.warehouseReceiptDetails)) rawOrders = data.warehouseReceiptDetails;
    else if (Array.isArray(data.data)) rawOrders = data.data;
    else if (Array.isArray(data.results)) rawOrders = data.results;
    else if (Array.isArray(data.itemArray) || Array.isArray(data.items)) {
      // Single receipt at top level
      rawOrders = [data];
    } else {
      const candidateArray = Object.values(data).find(
        (val) => Array.isArray(val) && val.length > 0 && typeof val[0] === 'object'
      );
      if (candidateArray) {
        rawOrders = candidateArray as any[];
      } else {
        rawOrders = [data];
      }
    }
  }

  // Helper to process a raw order object
  const processOrder = (order: any, index: number): CostcoReceipt => {
    const rawDate =
      order.transactionDate ||
      (order.transactionDateISO ? String(order.transactionDateISO).slice(0, 10) : null) ||
      (order.transactionDateTime ? String(order.transactionDateTime).slice(0, 10) : null) ||
      order.orderDate ||
      order.date ||
      order.purchaseDate ||
      new Date().toISOString().slice(0, 10);

    let orderDate = rawDate;
    const parsedDate = Date.parse(rawDate);
    if (!isNaN(parsedDate)) {
      orderDate = new Date(parsedDate).toISOString().slice(0, 10);
    }

    const orderNumber = String(
      order.transactionBarcode ||
      order.transactionNumber ||
      order.orderNumber ||
      order.receiptNumber ||
      order.orderId ||
      order.invoiceNumber ||
      `ORD-${index + 1}`
    );

    const isOnline =
      order.channel?.toLowerCase().includes('online') ||
      order.receiptType?.toLowerCase().includes('online') ||
      order.orderType?.toLowerCase().includes('online') ||
      order.warehouseLocation?.toLowerCase().includes('costco.com') ||
      (order.orderNumber && String(order.orderNumber).length >= 9);

    const orderType: PurchaseType = isOnline ? 'Online' : 'Warehouse';

    let warehouseLocation = order.warehouseLocation || order.location || order.warehouse;
    if (!warehouseLocation) {
      if (order.warehouseName) {
        warehouseLocation = `Costco ${order.warehouseName}${order.warehouseNumber ? ` #${order.warehouseNumber}` : ''}${order.warehouseCity ? `, ${order.warehouseCity}` : ''}`;
      } else if (order.warehouseFullAddress) {
        warehouseLocation = `Costco - ${order.warehouseFullAddress}`;
      } else if (order.warehouseCity) {
        warehouseLocation = `Costco Warehouse - ${order.warehouseCity}`;
      } else {
        warehouseLocation = isOnline ? 'Costco.com (Online Order)' : 'Costco Wholesale';
      }
    }

    // Detect payment card from tenderArray or standard fields
    let paymentCard = '';
    if (Array.isArray(order.tenderArray) && order.tenderArray.length > 0) {
      const tenders = order.tenderArray
        .map((t: any) => {
          const desc = t.tenderDescription || (t.tenderTypeCode === '070' ? 'Costco Mastercard' : 'Card');
          const last4 = t.displayAccountNumber || t.accountNumberLast4;
          if (last4 && last4 !== '0000' && last4 !== 'null') {
            return `${desc} ending in ${last4}`;
          }
          return desc;
        })
        .filter(Boolean);
      if (tenders.length > 0) {
        paymentCard = tenders.join(', ');
      }
    }

    if (!paymentCard) {
      if (order.accountNumberLast4) {
        paymentCard = `${order.cardType || 'Card'} ending in ${order.accountNumberLast4}`;
      } else {
        paymentCard = order.paymentCard || order.paymentMethod || order.tenderType || order.card || 'Costco Anywhere Visa';
      }
    }

    const receiptId = `rcpt_json_${orderNumber}_${Date.now()}_${index}`;
    const rawItems =
      order.itemArray ||
      order.items ||
      order.lineItems ||
      order.products ||
      order.orderItems ||
      order.orderLines ||
      order.details ||
      order.lines ||
      order.itemsList ||
      [];

    const items: CostcoItem[] = [];

    // Comprehensive check for return / refund markers on order level
    const orderIsRefund =
      String(order.transactionType || '').toLowerCase().includes('refund') ||
      String(order.transactionType || '').toLowerCase().includes('return') ||
      String(order.orderType || '').toLowerCase().includes('refund') ||
      String(order.orderType || '').toLowerCase().includes('return') ||
      String(order.documentType || '').toLowerCase().includes('refund') ||
      String(order.documentType || '').toLowerCase().includes('return') ||
      String(order.orderNumber || '').toLowerCase().includes('return') ||
      String(order.orderNumber || '').toLowerCase().includes('refund') ||
      Number(order.total || order.orderTotal || order.subTotal || 0) < 0;

    // Parse and link items and discounts (e.g. TPD / coupon lines)
    for (let itIdx = 0; itIdx < rawItems.length; itIdx++) {
      const it = rawItems[itIdx];
      const rawItemId = String(it.itemNumber || it.itemId || it.sku || it.item_id || it.id || `ITEM-${itIdx + 1}`);
      const itemId = rawItemId.replace(/[^a-zA-Z0-9]/g, '');

      const actualName = (
        it.itemActualName ||
        it.itemDescription01 ||
        it.frenchItemDescription1 ||
        it.productName ||
        it.name ||
        it.itemDescription ||
        it.description ||
        ''
      ).trim();

      const packageSpecs = (it.itemDescription02 || it.frenchItemDescription2 || it.packageDetails || '').trim();
      const amount = Number(it.amount !== undefined ? it.amount : (it.totalPrice || it.price || 0));
      const unitPrice = Number(it.itemUnitPriceAmount !== undefined ? it.itemUnitPriceAmount : (it.unitPrice || it.price || 0));
      const unit = it.unit !== undefined ? Number(it.unit) : Number(it.quantity || it.qty || 1);

      // Check if this line is an instant savings / temporary promotional discount (TPD) line
      const isCouponOrTpd =
        actualName.startsWith('TPD/') ||
        actualName.startsWith('CPN/') ||
        actualName.includes('TPD') ||
        actualName === '/0' ||
        actualName.startsWith('/') ||
        actualName.toLowerCase().includes('instant savings') ||
        actualName.toLowerCase().includes('savings') ||
        (amount < 0 && unitPrice === 0 && unit <= 0 && items.length > 0);

      if (isCouponOrTpd) {
        const discountVal = Math.abs(amount);
        const targetRef = actualName.replace(/^(TPD\/|CPN\/|\/\s*)/i, '').trim();

        let matchedItem: CostcoItem | undefined;
        if (targetRef) {
          matchedItem = items.slice().reverse().find((prev) =>
            prev.itemId === targetRef ||
            prev.rawName.toUpperCase().includes(targetRef.toUpperCase())
          );
        }
        if (!matchedItem && items.length > 0) {
          matchedItem = items[items.length - 1];
        }

        if (matchedItem && discountVal > 0) {
          matchedItem.discount = Number(((matchedItem.discount || 0) + discountVal).toFixed(2));
          continue;
        }
      }

      // Comprehensive check for return / refund markers on item level
      const isRefund =
        orderIsRefund ||
        it.itemReturnFlag === 'Y' ||
        it.itemReturnFlag === 'y' ||
        it.returnFlag === true ||
        it.isReturn === true ||
        String(it.transactionType || '').toLowerCase().includes('refund') ||
        String(it.transactionType || '').toLowerCase().includes('return') ||
        actualName.toLowerCase().includes('return') ||
        actualName.toLowerCase().includes('refund') ||
        actualName.toLowerCase().includes('retour');

      const rawName = actualName || `Costco Item #${itemId}`;
      const displayRawName = isRefund && !rawName.includes('Refund') && !rawName.includes('Return')
        ? `${rawName} (Return)`
        : rawName;

      const absQty = Math.abs(unit) || 1;
      const absAmount = Number(Math.abs(amount).toFixed(2));
      const absUnitPrice = unitPrice > 0 ? unitPrice : Number((absAmount / absQty).toFixed(2));
      const discount = Number(it.discount || it.coupon || 0);

      const cachedInfo = cached[itemId] || {};

      items.push({
        id: `item_${receiptId}_${itemId}_${itIdx}`,
        itemId,
        rawName: displayRawName,
        productName: it.enrichedName || cachedInfo.productName || undefined,
        brand: it.brand || cachedInfo.brand || undefined,
        category: it.category || cachedInfo.category || undefined,
        description: it.description || cachedInfo.description || undefined,
        packageDetails: packageSpecs || cachedInfo.packageDetails || undefined,
        webSourceUrl: it.webSourceUrl || cachedInfo.webSourceUrl || undefined,
        isEnriched: !!(it.enrichedName || cachedInfo.productName),
        isReturn: isRefund,
        quantity: absQty,
        unitPrice: isRefund ? -absUnitPrice : absUnitPrice,
        totalPrice: isRefund ? -absAmount : absAmount,
        discount: discount > 0 ? discount : undefined,
        orderId: receiptId,
        orderNumber,
        orderDate,
        orderType,
        warehouseLocation,
        paymentCard,
      });
    }

    const calculatedSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const subtotal = Number(order.subTotal !== undefined ? order.subTotal : (order.subtotal || calculatedSubtotal));
    const tax = Number(order.taxes !== undefined ? order.taxes : (order.tax || (order.total ? order.total - subtotal : 0)));
    const total = Number(order.total !== undefined ? order.total : (subtotal + tax));

    const isOrderReturn =
      orderIsRefund ||
      total < 0 ||
      subtotal < 0;

    return {
      id: receiptId,
      orderNumber,
      orderDate,
      orderType,
      warehouseLocation,
      paymentCard,
      isReturn: isOrderReturn,
      subtotal: isOrderReturn ? -Math.abs(subtotal) : Math.abs(subtotal),
      tax: Number(Math.abs(tax).toFixed(2)),
      total: isOrderReturn ? -Math.abs(total) : Math.abs(total),
      sourceType: 'json',
      fileName,
      uploadedAt: new Date().toISOString(),
      items,
    };
  };

  rawOrders.forEach((ord, idx) => {
    const processed = processOrder(ord, idx);
    if (processed.items.length > 0) {
      receipts.push(processed);
    }
  });

  if (receipts.length === 0 || receipts.every((r) => r.items.length === 0)) {
    throw new Error('Could not parse any Costco items from this JSON file. Ensure it contains an itemArray or orders list.');
  }

  return receipts;
}

// 100% Client-side on-device resolver: Data never leaves client device
export async function enrichCostcoItemOnWeb(itemId: string, rawName: string): Promise<Partial<CostcoItem>> {
  // Check local cache first
  const cached = getCachedEnrichments();
  if (cached[itemId]?.productName) {
    return cached[itemId];
  }

  // Resolve completely locally using on-device dictionary and intelligent heuristics
  const resolved = resolveCostcoItemDetails(itemId, rawName);
  saveCachedEnrichment(itemId, resolved);
  return resolved;
}

/**
 * Parse any date string into a comparable numeric millisecond timestamp
 */
export function parseDateToMs(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const s = String(dateStr).trim();
  if (!s) return 0;

  // 1. Check for standard YYYY-MM-DD or YYYY/MM/DD
  const isoYmd = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoYmd) {
    const y = parseInt(isoYmd[1], 10);
    const m = parseInt(isoYmd[2], 10) - 1;
    const d = parseInt(isoYmd[3], 10);
    const time = new Date(y, m, d).getTime();
    if (!isNaN(time)) return time;
  }

  // 2. Check for MM/DD/YYYY or MM-DD-YYYY
  const mdy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (mdy) {
    const m = parseInt(mdy[1], 10) - 1;
    const d = parseInt(mdy[2], 10);
    const y = parseInt(mdy[3], 10);
    const time = new Date(y, m, d).getTime();
    if (!isNaN(time)) return time;
  }

  // 3. Fallback to standard Date.parse
  const time = Date.parse(s.includes('T') ? s : `${s}T00:00:00`);
  if (!isNaN(time)) return time;

  const fallbackTime = Date.parse(s);
  return isNaN(fallbackTime) ? 0 : fallbackTime;
}

/**
 * Normalizes all Costco receipts, ensuring any refund or return items (including negative amounts,
 * return keywords, slash prefixes, or refund order types) are accurately flagged with isReturn: true
 * and negative unit/total prices, and sorts receipts in reverse chronological order by purchase date.
 */
export function normalizeCostcoReceipts(receipts: CostcoReceipt[]): CostcoReceipt[] {
  const normalized = receipts.map((receipt) => {
    // Determine if this receipt is a net positive purchase transaction
    const isNetPositive =
      (receipt.total !== undefined && receipt.total > 0) ||
      (receipt.subtotal !== undefined && receipt.subtotal > 0);

    // A receipt is ONLY a return/refund order if the net total is negative or explicitly a refund slip
    const orderIsRefund = !isNetPositive && (
      (receipt.total !== undefined && receipt.total < 0) ||
      (receipt.subtotal !== undefined && receipt.subtotal < 0) ||
      (receipt.total === 0 && (
        String(receipt.orderNumber || '').toLowerCase().includes('refund') ||
        String(receipt.orderNumber || '').toLowerCase().includes('return') ||
        String(receipt.paymentCard || '').toLowerCase().includes('refund')
      ))
    );

    // For purchase receipts, inspect items and fold instant savings / manufacturer coupon lines into parent items
    const workingItems: CostcoItem[] = (receipt.items || []).map((it) => ({ ...it }));
    const parentMap = new Map<string, number>(); // itemId -> index in workingItems

    workingItems.forEach((it, idx) => {
      const cleanId = String(it.itemId || '').replace(/[^a-zA-Z0-9]/g, '');
      const rawLower = (it.rawName || '').toLowerCase();
      const prodLower = (it.productName || '').toLowerCase();
      const isDiscount =
        it.rawName?.startsWith('/') ||
        rawLower.startsWith('tpd') ||
        rawLower.startsWith('cpn') ||
        prodLower.includes('instant savings') ||
        prodLower.includes('coupon');

      if (cleanId && !isDiscount) {
        parentMap.set(cleanId, idx);
      }
    });

    const itemsToKeep: CostcoItem[] = [];
    for (let idx = 0; idx < workingItems.length; idx++) {
      const item = workingItems[idx];
      const rawName = item.rawName || '';
      const rawLower = rawName.toLowerCase();
      const prodLower = (item.productName || '').toLowerCase();

      const isDiscountLine =
        rawName.startsWith('/') ||
        rawLower.startsWith('tpd') ||
        rawLower.startsWith('cpn') ||
        prodLower.includes('instant savings') ||
        prodLower.includes('coupon');

      if (isDiscountLine && isNetPositive) {
        // Find targeted item number: e.g. "/ 1953084" -> "1953084"
        const matchedNum = rawName.match(/(?:\/|\b)([0-9]{4,8})\b/);
        const targetId = matchedNum ? matchedNum[1] : null;
        const discountAmount = Math.abs(item.discount || item.totalPrice || item.unitPrice || 0);

        let parentIdx: number | undefined;
        if (targetId && parentMap.has(targetId)) {
          parentIdx = parentMap.get(targetId);
        } else if (itemsToKeep.length > 0) {
          parentIdx = itemsToKeep.length - 1;
        }

        if (parentIdx !== undefined && itemsToKeep[parentIdx] && discountAmount > 0) {
          const parent = itemsToKeep[parentIdx];
          parent.discount = Number(((parent.discount || 0) + discountAmount).toFixed(2));
          continue; // Successfully folded coupon into parent item
        }
      }

      itemsToKeep.push(item);
    }

    const updatedItems = itemsToKeep.map((item) => {
      const rawNameLower = (item.rawName || '').toLowerCase();
      const prodNameLower = (item.productName || '').toLowerCase();

      // Explicit return marker in item text
      const hasExplicitReturnWord =
        rawNameLower.includes('(return)') ||
        rawNameLower.includes('return item') ||
        rawNameLower.includes('refund') ||
        rawNameLower.includes('retour') ||
        prodNameLower.includes('(return)') ||
        prodNameLower.includes('refunded item') ||
        Boolean(item.description && item.description.toLowerCase().includes('returned item'));

      let isReturn = false;
      if (orderIsRefund) {
        // Entire receipt is an approved refund slip
        isReturn = true;
      } else if (isNetPositive) {
        // Standard purchase: normal grocery/household items are NEVER returns!
        isReturn = hasExplicitReturnWord;
      } else {
        isReturn = hasExplicitReturnWord || Boolean(item.isReturn && item.totalPrice < 0);
      }

      const absTotal = Math.abs(item.totalPrice);
      const absUnit = Math.abs(item.unitPrice);

      return {
        ...item,
        isReturn,
        totalPrice: isReturn ? -absTotal : absTotal,
        unitPrice: isReturn ? -absUnit : absUnit,
      };
    });

    return {
      ...receipt,
      isReturn: orderIsRefund,
      items: updatedItems,
    };
  });

  // Sort receipts in reverse chronological order by purchase date (newest first)
  return normalized.sort((a, b) => {
    const timeA = parseDateToMs(a.orderDate);
    const timeB = parseDateToMs(b.orderDate);
    if (timeB !== timeA) return timeB - timeA;
    return (b.orderNumber || '').localeCompare(a.orderNumber || '');
  });
}

