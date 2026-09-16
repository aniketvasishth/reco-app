import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please check your environment variables in AI Studio settings.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface ImagePayload {
  imageBase64: string;
  mimeType?: string;
  fileName?: string;
}

export interface ParseReceiptParams {
  imageBase64?: string;
  mimeType?: string;
  fileName?: string;
  images?: ImagePayload[];
}

export interface ParsedAiItem {
  itemId: string;
  rawName: string;
  productName: string;
  brand?: string;
  category?: string;
  description?: string;
  packageDetails?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  isReturn?: boolean;
}

export interface ParsedAiReceiptResult {
  isReceipt: boolean;
  isCostcoReceipt?: boolean;
  hasCostcoLogoAtTop?: boolean;
  detectedStoreName?: string;
  nonReceiptReason?: string;
  warehouseLocation: string;
  orderNumber: string;
  orderDate: string;
  orderType: 'Warehouse' | 'Online';
  paymentCard?: string;
  subtotal: number;
  tax: number;
  total: number;
  isReturn?: boolean;
  notes?: string;
  items: ParsedAiItem[];
}

function cleanBase64Data(raw: string, fallbackMime = 'image/jpeg'): { clean: string; mime: string } {
  let clean = raw;
  let mime = fallbackMime;
  if (clean.includes(';base64,')) {
    const parts = clean.split(';base64,');
    mime = parts[0].replace('data:', '') || mime;
    clean = parts[1];
  }
  return { clean, mime };
}

function safeParseReceiptJson(rawText: string): ParsedAiReceiptResult {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned) as ParsedAiReceiptResult;
  } catch (initialErr) {
    // Attempt robust recovery for truncated or cutoff JSON
    let repaired = cleaned;
    
    // If ending in an unclosed string or field, truncate back to last valid closed element
    const lastBrace = repaired.lastIndexOf('}');
    const lastBracket = repaired.lastIndexOf(']');
    const cutPos = Math.max(lastBrace, lastBracket);
    if (cutPos > 0) {
      repaired = repaired.slice(0, cutPos + 1);
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;

      for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
      for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';

      try {
        const parsed = JSON.parse(repaired) as ParsedAiReceiptResult;
        if (parsed && typeof parsed === 'object') {
          if (!parsed.items) parsed.items = [];
          return parsed;
        }
      } catch (repairErr) {
        console.warn('JSON structural recovery attempt failed:', repairErr);
      }
    }

    throw initialErr;
  }
}

export async function parseReceiptWithGemini({
  imageBase64,
  mimeType = 'image/jpeg',
  fileName,
  images,
}: ParseReceiptParams): Promise<ParsedAiReceiptResult> {
  const ai = getGeminiClient();

  // Normalize image inputs into an array of inlineData objects
  const rawList: ImagePayload[] = [];
  if (images && images.length > 0) {
    rawList.push(...images);
  } else if (imageBase64) {
    rawList.push({ imageBase64, mimeType, fileName });
  } else {
    throw new Error('No image payload provided for receipt parsing.');
  }

  const isMultiSectionLongReceipt = rawList.length > 1;

  const contentParts: any[] = [];

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    const { clean, mime } = cleanBase64Data(item.imageBase64, item.mimeType || 'image/jpeg');
    contentParts.push({
      inlineData: {
        mimeType: mime,
        data: clean,
      },
    });
  }

  const singlePrompt = `You are an expert wholesale receipt auditor and vision extraction engine specialized exclusively in Costco Wholesale receipts and Costco online invoices.

CRITICAL MANDATORY INSTRUCTION - STRICT COSTCO WHOLESALE VALIDATION:
1. Costco receipts ALWAYS feature the official 'COSTCO WHOLESALE' logo or wordmark prominently at the very top of the receipt (or 'Costco.com' / 'Costco.ca' for digital online invoices).
2. Carefully inspect the top / header of the uploaded receipt image:
   - Does this receipt have the Costco Wholesale logo or 'COSTCO WHOLESALE' at the top?
   - If the receipt is from ANY OTHER retailer, grocery store, or supermarket (such as FRESHCO, Fresh Co, Walmart, Target, No Frills, Loblaws, Sobeys, Metro, Safeway, Kroger, Trader Joe's, Aldi, Lidl, Giant Eagle, Food Lion, etc.), or if there is NO Costco Wholesale logo at the top:
     YOU MUST REJECT THE RECEIPT:
     * isReceipt: false
     * isCostcoReceipt: false
     * hasCostcoLogoAtTop: false
     * detectedStoreName: the name of the store detected at the top (e.g. "FreshCo", "Walmart", etc.)
     * nonReceiptReason: "Receipt rejected: Costco receipts have the Costco Wholesale logo at the top. This receipt appears to be from " + (detectedStoreName || "another store") + " and does not have the Costco Wholesale logo."
     * items: []
     * subtotal: 0, tax: 0, total: 0
     * DO NOT extract line items from non-Costco receipts!

SPECIAL HANDLING FOR VALID COSTCO RECEIPTS, DIGITAL INVOICES & PDF DOCUMENTS:
1. Document Types:
   - The input may be a photographed paper Costco receipt, a digital PDF e-receipt, a warehouse customer service return slip, or a Costco Online / Web printed invoice (e.g., Costco.com or Costco.ca Order Details).
   - For Costco Online / Web Invoices (such as "Order Details" with "Order Number", "Order Date", "Membership Number", "Payment Method", "Shipping Address", "Item Quantity Status Total Price", and "Order Summary"):
     * Set orderType: "Online".
     * Extract orderNumber (e.g., "1314163428"), orderDate (in YYYY-MM-DD format e.g. "2026-09-14"), paymentCard (e.g., "Mastercard ending in 5445").
     * Set warehouseLocation to "Costco Online (Costco.ca)" if Costco.ca, Canadian province (ON, BC, QC, AB, etc.), or GST/HST/PST/QST is present; otherwise "Costco Online".
     * Parse each item: e.g. "Uber 2 x $50 E-Gift Cards", "Item #1005262" (itemId: "1005262"), unitPrice (e.g. 79.99), quantity (e.g. 2), totalPrice (e.g. 159.98).
     * Extract subtotal, shipping, taxes (GST/HST/PST/QST), and final order total (e.g. 159.98).
   - For return/refund slips (e.g., marked 'APPROVED - REFUND', negative item amounts like '21.99- Y', 'Items Sold: 6-'):
     * Set isReturn: true on the receipt and on each refunded item.
     * Record unitPrice as positive, totalPrice as negative (e.g., -21.99), and isReturn: true.
     * Set subtotal, tax, and total as signed values matching the document (e.g., subtotal: -182.94, tax: -23.78, total: -206.72).

2. Optical & Contextual Reconstruction:
   - Receipts are frequently photographed with camera motion blur, low lighting, curved paper folds, or faded thermal ink.
   - Use deep multimodal vision reasoning to reconstruct text and cross-reference with typical Costco catalog patterns:
     * Item numbers on Costco receipts & web invoices are 3 to 8 numeric digits (e.g., 1005262, 7012750, 5333021, 2880791, 2001911, 2093760, 1743473, 2070487).
     * Descriptions can be abbreviated uppercase names (e.g. "KS VIT WOMEN", "OMNIBREEZE") or full web catalog titles (e.g. "Uber 2 x $50 E-Gift Cards").
     * Monetary amounts have 2 decimal places on the right side of the item line.
     * Instant coupons/discounts appear with a minus sign or 'TPD' line.

3. Rich Item Expansion:
   - For every detected item, extract:
     * itemId: The numeric SKU/item number (e.g., "1005262", "7012750").
     * rawName: The exact printed string on the receipt or invoice (e.g., "Uber 2 x $50 E-Gift Cards" or "7012750 KS VIT WOMEN").
     * productName: Expanded, polished, customer-friendly full product name.
     * brand: Recognized brand name (e.g., "Uber", "Kirkland Signature", "DoorDash", "Dyson").
     * category: General department category (e.g., "Gift Cards", "Health & Beauty", "Home & Seasonal", "Frozen & Groceries", "Clothing & Apparel", "Pantry & Groceries", "Sports & Fitness").
     * description: A clean 1-sentence product summary (maximum 15 words).
     * packageDetails: Package size, weight, count, or specifications.
     * quantity: Number of units (default 1, or negative if returned).
     * unitPrice: Unit price.
     * totalPrice: Total price for this line (negative if returned/refunded).
     * discount: Store instant savings/coupon amount if applied.
     * isReturn: Boolean true if returned or refunded.

4. Transaction Header:
   - warehouseLocation: Store location and warehouse number if found (e.g., "Costco Wholesale S Mississauga #531", "Costco Online (Costco.ca)", "Costco Online").
   - orderDate: Date in YYYY-MM-DD format (e.g., '2026-09-14').
   - orderNumber: Transaction barcode, invoice number, or sequence ID (e.g., "1314163428").
   - orderType: "Warehouse" or "Online".
   - paymentCard: Payment tender details if visible (e.g., "Mastercard ending in 5445").
   - subtotal, tax, total: Accurate financial sums.

Keep descriptions concise and strictly adhere to the JSON schema.`;

  const multiSectionPrompt = `You are an expert wholesale receipt auditor and vision extraction engine specialized in Costco long-receipt stitching.
The user has photographed a single, continuous, long Costco warehouse receipt across ${rawList.length} sequential close-up sections (Top section, Middle section(s), and Bottom totals section).

CRITICAL MANDATORY INSTRUCTION - STRICT COSTCO WHOLESALE VALIDATION:
1. The top section of the receipt MUST show the Costco Wholesale logo or header.
2. If this receipt is from any other store (e.g., FreshCo, Walmart, etc.) or lacks the Costco Wholesale logo at the top:
   Reject the receipt with isReceipt: false, isCostcoReceipt: false, hasCostcoLogoAtTop: false, nonReceiptReason, and empty items [].

SPECIAL INSTRUCTIONS FOR VALID MULTI-SECTION COSTCO RECEIPTS:
1. Sequential Stitching & De-duplication:
   - Trace the receipt items continuously down across all ${rawList.length} images.
   - CRITICAL: Because consecutive photos often overlap slightly at the boundaries, detect any duplicated items appearing in adjacent photo edges and include each purchased item ONLY ONCE in the final list.
2. Complete Line Item Extraction:
   - Extract every single purchased item with high accuracy:
     * itemId: The numeric SKU/item number (3-8 digits, e.g. "1142277").
     * rawName: The exact uppercase text on the receipt (e.g. "KS ORG EVOO").
     * productName: Customer-friendly expanded name (e.g. "Kirkland Signature Organic Extra Virgin Olive Oil").
     * brand, category, description, packageDetails, quantity, unitPrice, totalPrice, discount, isReturn.
3. Transaction Header & Financial Totals:
   - Extract warehouseLocation, orderDate, and orderNumber from the Top section.
   - Extract subtotal, tax, final total, and payment tender info from the Bottom totals section.
   - Cross-check that the sum of item totalPrices (plus tax) corresponds to the printed receipt total.
4. Set notes to explain: "Unified ${rawList.length}-section long receipt scan with seamless line stitching."

Keep all item descriptions concise (maximum 15 words per item). Return strictly structured JSON adhering to the specified schema.`;

  contentParts.push({
    text: isMultiSectionLongReceipt ? multiSectionPrompt : singlePrompt,
  });

  const CANDIDATE_MODELS = [
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.6-flash',
    'gemini-3.8-flash',
  ];
  let response: any = null;
  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    // Attempt with current candidate model
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: contentParts,
          },
          config: {
            systemInstruction: `You are an AI-powered receipt scanning and inventory parsing engine specialized exclusively for Costco Wholesale receipts and Costco digital invoices. Costco receipts MUST feature the official Costco Wholesale logo or header at the top of the receipt. If the document is from another store (e.g., FreshCo, Walmart, Target, Kroger, No Frills, etc.) or lacks the Costco Wholesale logo at the top, you MUST reject it by setting isReceipt: false, isCostcoReceipt: false, hasCostcoLogoAtTop: false, detectedStoreName, nonReceiptReason, and empty items [].`,
            responseMimeType: 'application/json',
            maxOutputTokens: 8192,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isReceipt: {
                  type: Type.BOOLEAN,
                  description: 'Strictly true ONLY if image contains a valid Costco Wholesale receipt with the Costco Wholesale logo at the top. False if it is from any other store (e.g. FreshCo) or not a receipt.',
                },
                isCostcoReceipt: {
                  type: Type.BOOLEAN,
                  description: 'Strictly true ONLY if this is an authentic Costco Wholesale receipt. False for any non-Costco store.',
                },
                hasCostcoLogoAtTop: {
                  type: Type.BOOLEAN,
                  description: 'True ONLY if the Costco Wholesale logo or header is clearly present at the top of the receipt. False otherwise.',
                },
                detectedStoreName: {
                  type: Type.STRING,
                  description: 'The store or merchant name detected at the top of the receipt (e.g. "Costco Wholesale", "FreshCo", "Walmart", "Unknown").',
                },
                nonReceiptReason: {
                  type: Type.STRING,
                  description: 'Explanation if the receipt is rejected or does not have the Costco Wholesale logo at the top.',
                },
                warehouseLocation: {
                  type: Type.STRING,
                  description: 'Store name and warehouse number, e.g. "Costco Wholesale Sunnyvale #423"',
                },
                orderNumber: {
                  type: Type.STRING,
                  description: 'Transaction, order, or sequence number',
                },
                orderDate: {
                  type: Type.STRING,
                  description: 'Date in YYYY-MM-DD format',
                },
                orderType: {
                  type: Type.STRING,
                  description: 'Warehouse or Online',
                },
                paymentCard: {
                  type: Type.STRING,
                  description: 'Payment tender info, e.g. "Visa ending in 4567"',
                },
                subtotal: {
                  type: Type.NUMBER,
                  description: 'Subtotal amount before tax',
                },
                tax: {
                  type: Type.NUMBER,
                  description: 'Sales tax amount',
                },
                total: {
                  type: Type.NUMBER,
                  description: 'Final total amount',
                },
                isReturn: {
                  type: Type.BOOLEAN,
                  description: 'True if entire receipt is a return',
                },
                notes: {
                  type: Type.STRING,
                  description: 'AI vision processing notes',
                },
                items: {
                  type: Type.ARRAY,
                  description: 'Extracted list of items',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      itemId: {
                        type: Type.STRING,
                        description: 'Costco Item Number / SKU (3-8 digits)',
                      },
                      rawName: {
                        type: Type.STRING,
                        description: 'Receipt printed text',
                      },
                      productName: {
                        type: Type.STRING,
                        description: 'Full expanded product name',
                      },
                      brand: {
                        type: Type.STRING,
                        description: 'Recognized brand name',
                      },
                      category: {
                        type: Type.STRING,
                        description: 'Department category',
                      },
                      description: {
                        type: Type.STRING,
                        description: 'Short 1-sentence description (max 15 words)',
                      },
                      packageDetails: {
                        type: Type.STRING,
                        description: 'Package size, weight, or count',
                      },
                      quantity: {
                        type: Type.NUMBER,
                        description: 'Quantity',
                      },
                      unitPrice: {
                        type: Type.NUMBER,
                        description: 'Unit price',
                      },
                      totalPrice: {
                        type: Type.NUMBER,
                        description: 'Total line price (negative for returns)',
                      },
                      discount: {
                        type: Type.NUMBER,
                        description: 'Discount amount',
                      },
                      isReturn: {
                        type: Type.BOOLEAN,
                        description: 'True if return/refund item',
                      },
                    },
                    required: ['itemId', 'rawName', 'productName', 'quantity', 'unitPrice', 'totalPrice'],
                  },
                },
              },
              required: ['isReceipt', 'warehouseLocation', 'orderDate', 'total', 'items'],
            },
          },
        });

        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        console.warn(`Gemini attempt ${attempt} with ${modelName} failed:`, err?.message || err);
        lastError = err;
        const is429 = err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED' || err?.code === 429;
        const is503 = err?.message?.includes('503') || err?.status === 'UNAVAILABLE' || err?.code === 503;

        // If 429 quota exhausted, don't waste time on this model, switch immediately
        if (is429) {
          break;
        }

        // If 503 high demand spike, brief pause and retry once
        if (is503 && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        } else {
          break;
        }
      }
    }

    if (response && response.text) {
      break;
    }
  }

  if (!response || !response.text) {
    throw lastError || new Error('No response received from any Gemini vision model.');
  }

  const responseText = response.text;
  if (!responseText) {
    throw new Error('No text response received from Gemini model.');
  }

  const parsed = safeParseReceiptJson(responseText);

  // Deterministic, strict validation: Costco receipts MUST have Costco Wholesale branding
  const detectedStore = (parsed.detectedStoreName || '').toLowerCase().trim();
  const warehouse = (parsed.warehouseLocation || '').toLowerCase().trim();

  const nonCostcoStores = [
    'freshco', 'fresh co', 'fresh-co', 'walmart', 'target', 'trader joe', 'home depot',
    'safeway', 'kroger', 'cvs', 'walgreens', 'mcdonald', 'starbucks',
    'loblaws', 'sobeys', 'metro', 'no frills', 'real canadian superstore',
    'ikea', 'whole foods', 'publix', 'aldi', 'lidl', 'canadian tire', 'amazon',
    'giant eagle', 'food lion', 'wegmans', 'winco', 'sprouts', 'h-e-b', 'heb'
  ];

  const matchedOtherStore = nonCostcoStores.find(
    (s) => detectedStore.includes(s) || warehouse.includes(s)
  );

  const hasCostcoBranding =
    warehouse.includes('costco') ||
    detectedStore.includes('costco') ||
    warehouse.includes('kirkland');

  if (
    !parsed.isReceipt ||
    parsed.isCostcoReceipt === false ||
    parsed.hasCostcoLogoAtTop === false ||
    Boolean(matchedOtherStore) ||
    !hasCostcoBranding
  ) {
    const storeLabel = matchedOtherStore
      ? matchedOtherStore.toUpperCase()
      : parsed.detectedStoreName || 'another retailer';
    return {
      ...parsed,
      isReceipt: false,
      isCostcoReceipt: false,
      hasCostcoLogoAtTop: false,
      detectedStoreName: parsed.detectedStoreName || (matchedOtherStore ? matchedOtherStore.toUpperCase() : 'Non-Costco Store'),
      nonReceiptReason:
        parsed.nonReceiptReason ||
        `Receipt rejected: Costco receipts have the Costco Wholesale logo at the top. This receipt appears to be from ${storeLabel} and does not have the Costco Wholesale logo at the top.`,
      warehouseLocation: 'Non-Costco Store',
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    };
  }

  // Ensure standard positive purchases are never marked as returns
  const isPurchase =
    (parsed.total !== undefined && parsed.total > 0) ||
    (parsed.subtotal !== undefined && parsed.subtotal > 0);

  if (isPurchase) {
    parsed.isReturn = false;
  }

  if (Array.isArray(parsed.items) && isPurchase) {
    const parentMap = new Map<string, number>();
    parsed.items.forEach((it: any, idx: number) => {
      const cleanId = String(it.itemId || '').replace(/[^a-zA-Z0-9]/g, '');
      const rawLower = String(it.rawName || '').toLowerCase();
      const isDiscount =
        String(it.rawName || '').startsWith('/') ||
        rawLower.startsWith('tpd') ||
        rawLower.startsWith('cpn') ||
        String(it.productName || '').toLowerCase().includes('instant savings') ||
        String(it.productName || '').toLowerCase().includes('coupon');
      if (cleanId && !isDiscount) {
        parentMap.set(cleanId, idx);
      }
    });

    const finalItems: any[] = [];
    for (let idx = 0; idx < parsed.items.length; idx++) {
      const it = parsed.items[idx];
      const rawName = String(it.rawName || '');
      const rawLower = rawName.toLowerCase();
      const prodLower = String(it.productName || '').toLowerCase();

      const isDiscountLine =
        rawName.startsWith('/') ||
        rawLower.startsWith('tpd') ||
        rawLower.startsWith('cpn') ||
        prodLower.includes('instant savings') ||
        prodLower.includes('coupon');

      if (isDiscountLine) {
        const matchedNum = rawName.match(/(?:\/|\b)([0-9]{4,8})\b/);
        const targetId = matchedNum ? matchedNum[1] : null;
        const discountAmount = Math.abs(it.discount || it.totalPrice || it.unitPrice || 0);

        let parentIdx: number | undefined;
        if (targetId && parentMap.has(targetId)) {
          parentIdx = parentMap.get(targetId);
        } else if (finalItems.length > 0) {
          parentIdx = finalItems.length - 1;
        }

        if (parentIdx !== undefined && finalItems[parentIdx] && discountAmount > 0) {
          const parent = finalItems[parentIdx];
          parent.discount = Number(((parent.discount || 0) + discountAmount).toFixed(2));
          continue;
        }
      }

      const hasExplicitReturnWord =
        rawLower.includes('(return)') ||
        rawLower.includes('return item') ||
        rawLower.includes('refund') ||
        rawLower.includes('retour') ||
        prodLower.includes('(return)') ||
        prodLower.includes('refunded item');

      it.isReturn = hasExplicitReturnWord;
      if (!it.isReturn) {
        it.totalPrice = Math.abs(Number(it.totalPrice) || Number(it.unitPrice) || 0);
        it.unitPrice = Math.abs(Number(it.unitPrice) || 0);
      }

      finalItems.push(it);
    }
    parsed.items = finalItems;
  }

  return parsed;
}
