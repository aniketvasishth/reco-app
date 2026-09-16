import { CostcoReceipt } from '../types';
import { parseReceiptWithAi, parseMultiSectionReceiptWithAi } from './geminiScanner';
import { parseReceiptImageOnDevice } from './ocrParser';
import { deduplicateReceiptList } from './receiptDeduplication';

function isNonCostcoOrInvalidReceiptError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();
  return (
    msg.includes('costco') ||
    msg.includes('logo') ||
    msg.includes('rejected') ||
    msg.includes('freshco') ||
    msg.includes('fresh co') ||
    msg.includes('not appear to be') ||
    msg.includes('non-costco') ||
    msg.includes('422')
  );
}

/**
 * High-performance receipt scanner that uses Gemini 2.5/3.8 Flash Vision AI as the
 * primary engine for blur correction, SKU recognition, and detailed item parsing,
 * with automatic fallback to on-device OCR if offline.
 */
export async function scanReceiptWithAiOrFallback(
  file: File,
  onProgress?: (status: string, percent: number) => void
): Promise<{ receipt: CostcoReceipt; engine: 'gemini' | 'ocr' }> {
  try {
    const receipt = await parseReceiptWithAi(file, onProgress);
    return { receipt, engine: 'gemini' };
  } catch (aiError: any) {
    console.warn('Gemini AI receipt parsing encountered an issue:', aiError);
    // If the receipt was rejected as non-Costco, missing the Costco logo, or not a receipt, DO NOT fallback to OCR
    if (isNonCostcoOrInvalidReceiptError(aiError)) {
      throw aiError;
    }

    onProgress?.('AI endpoint unavailable. Falling back to on-device OCR engine...', 30);
    const receipt = await parseReceiptImageOnDevice(file, (msg, pct) => {
      onProgress?.(`Local OCR Fallback: ${msg}`, pct);
    });
    return { receipt, engine: 'ocr' };
  }
}

/**
 * High-resolution scanner for long Costco receipts photographed in sequential sections.
 * Gemini Vision AI stitches the sections, deduplicating any overlapping items at section seams.
 */
export async function scanMultiSectionReceiptWithAiOrFallback(
  files: File[],
  onProgress?: (status: string, percent: number) => void
): Promise<{ receipt: CostcoReceipt; engine: 'gemini' | 'ocr' }> {
  if (files.length === 1) {
    return scanReceiptWithAiOrFallback(files[0], onProgress);
  }

  try {
    const receipt = await parseMultiSectionReceiptWithAi(files, onProgress);
    return { receipt, engine: 'gemini' };
  } catch (aiError: any) {
    console.warn('Gemini AI multi-section receipt parsing encountered an issue:', aiError);
    if (isNonCostcoOrInvalidReceiptError(aiError)) {
      throw aiError;
    }

    onProgress?.(`AI endpoint unavailable. Scanning ${files.length} sections on-device...`, 20);

    // Scan each section locally
    const sectionReceipts: CostcoReceipt[] = [];
    for (let i = 0; i < files.length; i++) {
      onProgress?.(`Scanning section ${i + 1} of ${files.length} locally...`, 20 + Math.round((i / files.length) * 60));
      const partial = await parseReceiptImageOnDevice(files[i], () => {});
      sectionReceipts.push(partial);
    }

    // Combine all sections into a single receipt
    const headerReceipt = sectionReceipts[0];
    const footerReceipt = sectionReceipts[sectionReceipts.length - 1];

    // Collect all items and deduplicate
    const allItems = sectionReceipts.flatMap((r) => r.items);
    const seenIds = new Set<string>();
    const uniqueItems = allItems.filter((it) => {
      const key = `${it.itemId}_${it.totalPrice}`;
      if (seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    });

    const unifiedReceipt: CostcoReceipt = {
      ...headerReceipt,
      id: `rcpt_long_${Date.now()}`,
      fileName: `Long Receipt (${files.length} sections)`,
      items: uniqueItems,
      subtotal: footerReceipt.subtotal || uniqueItems.reduce((s, i) => s + i.totalPrice, 0),
      tax: footerReceipt.tax || 0,
      total: footerReceipt.total || (footerReceipt.subtotal || uniqueItems.reduce((s, i) => s + i.totalPrice, 0)),
      notes: `Stitched from ${files.length} receipt sections on device.`,
    };

    onProgress?.('Complete!', 100);
    return { receipt: unifiedReceipt, engine: 'ocr' };
  }
}
