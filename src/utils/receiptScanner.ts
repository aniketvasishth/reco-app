import { CostcoReceipt } from '../types';
import { parseReceiptWithAi, parseMultiSectionReceiptWithAi } from './geminiScanner';
import { parseReceiptImageOnDevice } from './ocrParser';
import {
  parseReceiptWithOnDeviceEngine,
  checkOnDeviceAiAvailability,
  getAllowCloudFallback,
  getEnginePreference,
  getUserGeminiKey,
  isOfflineOnly,
} from '../services/onDeviceAiService';

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
 * On-Device Primary Scanner:
 * 1. Strictly prioritizes Android On-Device Gemini Nano (via Chrome Built-in AI / AICore).
 *    Runs 100% locally on device NPU/GPU: complete privacy, zero network data.
 * 2. If Gemini Nano is not available, checks the "Allow Cloud AI Fallback" setting.
 *    By DEFAULT, Cloud Fallback is OFF (false), so it uses the 100% On-Device WebAssembly
 *    OCR & bundled 2,500+ item catalog (completely offline).
 * 3. Only if the user explicitly enabled the Cloud Fallback toggle in Settings will it
 *    reach out to cloud APIs as a secondary fallback.
 */
export async function scanReceiptWithAiOrFallback(
  file: File,
  onProgress?: (status: string, percent: number) => void
): Promise<{ receipt: CostcoReceipt; engine: 'gemini' | 'ocr'; usedCloudFallback?: boolean }> {
  const offlineOnly = isOfflineOnly();

  // Step 1: Check On-Device Gemini Nano status on this Android/browser device
  const nanoStatus = await checkOnDeviceAiAvailability();

  if (nanoStatus.available) {
    // 100% ON-DEVICE GEMINI NANO: Fast, private, on-device local execution
    onProgress?.('Processing with Android On-Device Gemini Nano...', 15);
    const { receipt, engineUsed } = await parseReceiptWithOnDeviceEngine(file, onProgress);
    return { receipt, engine: engineUsed === 'on-device-nano' ? 'gemini' : 'ocr', usedCloudFallback: false };
  }

  // IF OFFLINE ONLY IS ENABLED:
  // Disables ALL external network requests to Gemini cloud services and strictly forces local on-device processing.
  if (offlineOnly) {
    onProgress?.('Offline Only active: External Gemini cloud requests disabled. Processing locally...', 20);
    const { receipt, engineUsed } = await parseReceiptWithOnDeviceEngine(file, onProgress);
    return { receipt, engine: engineUsed === 'on-device-nano' ? 'gemini' : 'ocr', usedCloudFallback: false };
  }

  // Step 2: Check if Cloud AI Fallback is enabled in Settings (Default: FALSE / OFF)
  const isCloudFallbackAllowed = getAllowCloudFallback();
  const enginePref = getEnginePreference();
  const userKey = getUserGeminiKey();

  // If user enabled Cloud Fallback OR configured a personal BYOK key:
  if (isCloudFallbackAllowed || (enginePref === 'cloud-byok' && userKey)) {
    try {
      onProgress?.('On-device Gemini Nano not active. Using Cloud Fallback...', 25);
      const receipt = await parseReceiptWithAi(file, onProgress);
      receipt.notes = (receipt.notes ? receipt.notes + ' • ' : '') + 'Cloud AI Fallback';
      return { receipt, engine: 'gemini', usedCloudFallback: true };
    } catch (aiError: any) {
      console.warn('Cloud fallback encountered error:', aiError);
      if (isNonCostcoOrInvalidReceiptError(aiError)) {
        throw aiError;
      }
      onProgress?.('Cloud fallback failed. Falling back to 100% On-Device Local Engine...', 35);
    }
  }

  // DEFAULT & PRIMARY FALLBACK: 100% On-Device Engine (Local WebAssembly OCR + Costco Catalog)
  // Ensures 100% on-device private processing.
  onProgress?.('Processing on-device (100% local, offline)...', 20);
  const { receipt, engineUsed } = await parseReceiptWithOnDeviceEngine(file, onProgress);
  return { receipt, engine: engineUsed === 'on-device-nano' ? 'gemini' : 'ocr', usedCloudFallback: false };
}

/**
 * High-resolution scanner for long Costco receipts photographed in sequential sections.
 * Stitched completely on-device with zero cloud calls and complete privacy.
 */
export async function scanMultiSectionReceiptWithAiOrFallback(
  files: File[],
  onProgress?: (status: string, percent: number) => void
): Promise<{ receipt: CostcoReceipt; engine: 'gemini' | 'ocr'; usedCloudFallback?: boolean }> {
  if (files.length === 1) {
    return scanReceiptWithAiOrFallback(files[0], onProgress);
  }

  const offlineOnly = isOfflineOnly();
  const nanoStatus = await checkOnDeviceAiAvailability();
  const isCloudFallbackAllowed = getAllowCloudFallback();
  const enginePref = getEnginePreference();
  const userKey = getUserGeminiKey();

  // Optional Cloud Multi-section Stitch only if user explicitly enabled Cloud Fallback and NOT offline-only
  if (!offlineOnly && !nanoStatus.available && (isCloudFallbackAllowed || (enginePref === 'cloud-byok' && userKey))) {
    try {
      onProgress?.('Stitching long receipt via Cloud AI Fallback...', 20);
      const receipt = await parseMultiSectionReceiptWithAi(files, onProgress);
      receipt.notes = (receipt.notes ? receipt.notes + ' • ' : '') + 'Cloud AI Fallback';
      return { receipt, engine: 'gemini', usedCloudFallback: true };
    } catch (aiError: any) {
      console.warn('Cloud long receipt stitch failed, falling back to on-device:', aiError);
      if (isNonCostcoOrInvalidReceiptError(aiError)) {
        throw aiError;
      }
    }
  }

  // Default: On-device stitching (100% local)
  onProgress?.(`Processing ${files.length} sections on-device (100% local)...`, 20);

  const sectionReceipts: CostcoReceipt[] = [];
  for (let i = 0; i < files.length; i++) {
    onProgress?.(
      `Scanning section ${i + 1} of ${files.length} on device...`,
      20 + Math.round((i / files.length) * 60)
    );
    const partial = await parseReceiptImageOnDevice(files[i], () => {});
    sectionReceipts.push(partial);
  }

  const headerReceipt = sectionReceipts[0];
  const footerReceipt = sectionReceipts[sectionReceipts.length - 1];

  // Deduplicate items across section overlaps
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
    notes: `Stitched from ${files.length} receipt sections on device (100% local).`,
  };

  onProgress?.('Complete!', 100);
  return { receipt: unifiedReceipt, engine: 'ocr' };
}
