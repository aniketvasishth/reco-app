import { CostcoReceipt, CostcoItem } from '../types';
import { resolveCostcoItemDetails } from './costcoCatalog';
import { ParsedAiReceiptResult } from '../../server/geminiParser';
import { isPdfFile, renderPdfToImage } from './pdfReceiptHelper';

/**
 * Optimizes large phone photos (e.g. 48MP raw) by capping the maximum dimension
 * to 2048px while maintaining crisp contrast for OCR and Gemini multimodal vision.
 * Also handles PDF files directly by reading raw PDF base64.
 */
export async function prepareImageForAi(
  file: File
): Promise<{ imageBase64: string; mimeType: string }> {
  // If file is a PDF, render pages to a high-contrast JPEG canvas for reliable vision parsing
  if (isPdfFile(file)) {
    try {
      const rendered = await renderPdfToImage(file);
      if (rendered.dataUrl && rendered.dataUrl.includes('base64,')) {
        const [, base64] = rendered.dataUrl.split('base64,');
        return { imageBase64: base64, mimeType: 'image/jpeg' };
      }
    } catch (e) {
      console.warn('PDF client-side render to image failed, falling back to raw data:', e);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [, base64] = result.split(',');
        resolve({ imageBase64: base64, mimeType: 'application/pdf' });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  // If file is already small (under 1.5MB) and a standard image, read directly
  if (file.size < 1.5 * 1024 * 1024 && !file.type.includes('heic')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [header, base64] = result.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : file.type || 'image/jpeg';
        resolve({ imageBase64: base64, mimeType });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  // Otherwise downscale on canvas to ensure fast network upload
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_DIM = 2048;
      let { width, height } = img;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to direct reading
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const [h, b] = res.split(',');
          resolve({ imageBase64: b, mimeType: file.type || 'image/jpeg' });
        };
        reader.readAsDataURL(file);
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as high quality JPEG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      const [header, base64] = dataUrl.split(',');
      resolve({ imageBase64: base64, mimeType: 'image/jpeg' });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const [h, b] = res.split(',');
        resolve({ imageBase64: b, mimeType: file.type || 'image/jpeg' });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

function buildCostcoReceiptFromAiResult(
  data: ParsedAiReceiptResult,
  fileName: string,
  rawPreviewUrl?: string
): CostcoReceipt {
  const receiptId = `rcpt_gemini_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const orderNumber = data.orderNumber || `RC-${Math.floor(100000 + Math.random() * 900000)}`;
  const orderDate = data.orderDate || new Date().toISOString().slice(0, 10);
  const orderType = data.orderType === 'Online' ? 'Online' : 'Warehouse';
  const warehouseLocation = data.warehouseLocation || 'Costco Wholesale';
  const paymentCard = data.paymentCard || 'Costco Anywhere Visa';

  const items: CostcoItem[] = (data.items || []).map((it, idx) => {
    // Cross-verify with local catalogue for high-fidelity fallback info
    const catalog = resolveCostcoItemDetails(it.itemId, it.rawName);

    const productName = it.productName || catalog.productName || it.rawName;
    const brand = it.brand || catalog.brand || 'Costco';
    const category = it.category || catalog.category || 'General Wholesale';
    const description = it.description || catalog.description || '';
    const packageDetails = it.packageDetails || catalog.packageDetails || '';

    const isReturn = Boolean(it.isReturn || it.totalPrice < 0);
    const unitPrice = Math.abs(Number(it.unitPrice) || 0);
    const rawTotalPrice = Number(it.totalPrice) || unitPrice;
    const totalPrice = isReturn ? -Math.abs(rawTotalPrice) : Math.abs(rawTotalPrice);

    return {
      id: `item_${receiptId}_${it.itemId || idx}_${idx}`,
      itemId: String(it.itemId || idx + 1000),
      rawName: it.rawName || 'ITEM',
      productName,
      brand,
      category,
      description,
      packageDetails,
      webSourceUrl: catalog.webSourceUrl,
      isEnriched: true,
      isReturn,
      quantity: Number(it.quantity) || 1,
      unitPrice,
      totalPrice,
      discount: it.discount ? Math.abs(Number(it.discount)) : undefined,
      orderId: receiptId,
      orderNumber,
      orderDate,
      orderType,
      warehouseLocation,
      paymentCard,
    };
  });

  const calculatedSubtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const subtotal = data.subtotal != null ? Number(data.subtotal) : calculatedSubtotal;
  const tax = data.tax != null ? Number(data.tax) : 0;
  const total = data.total != null ? Number(data.total) : subtotal + tax;

  return {
    id: receiptId,
    orderNumber,
    orderDate,
    orderType,
    warehouseLocation,
    paymentCard,
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
    sourceType: 'image',
    fileName,
    rawImagePreview: rawPreviewUrl,
    notes: data.notes,
    uploadedAt: new Date().toISOString(),
    isReturn: Boolean(data.isReturn || total < 0),
    items,
  };
}

/**
 * Sends a single receipt image to the server-side Gemini AI Vision endpoint.
 */
export async function parseReceiptWithAi(
  file: File,
  onProgress?: (status: string, percent: number) => void
): Promise<CostcoReceipt> {
  onProgress?.('Preparing image for Gemini AI analysis...', 15);
  const { imageBase64, mimeType } = await prepareImageForAi(file);

  onProgress?.('Gemini AI Vision analyzing receipt & reconstructing blurred text...', 45);

  const response = await fetch('/api/gemini/parse-receipt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64,
      mimeType,
      fileName: file.name,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `AI parsing failed with status code ${response.status}.`
    );
  }

  onProgress?.('Extracting items, catalog data, and totals...', 85);
  const result = await response.json();
  const data = result.data as ParsedAiReceiptResult;

  if (!data || !data.items) {
    throw new Error('No receipt items could be extracted by Gemini AI.');
  }

  // If PDF, generate a page 1 preview image for the receipt card
  let pdfPreviewUrl: string | undefined;
  if (isPdfFile(file)) {
    try {
      const pdfRender = await renderPdfToImage(file);
      if (pdfRender.dataUrl) {
        pdfPreviewUrl = pdfRender.dataUrl;
      }
    } catch (e) {
      console.warn('Could not generate PDF image preview:', e);
    }
  }

  onProgress?.('Complete!', 100);
  return buildCostcoReceiptFromAiResult(data, file.name, pdfPreviewUrl);
}

/**
 * Sends multiple close-up section photos of a single long Costco receipt
 * to Gemini AI Vision. Gemini stitches the sections sequentially, deduplicating
 * any boundary overlaps and producing one complete unified receipt.
 */
export async function parseMultiSectionReceiptWithAi(
  files: File[],
  onProgress?: (status: string, percent: number) => void
): Promise<CostcoReceipt> {
  if (!files || files.length === 0) {
    throw new Error('No receipt photos provided for long receipt scan.');
  }

  if (files.length === 1) {
    return parseReceiptWithAi(files[0], onProgress);
  }

  onProgress?.(`Preparing ${files.length} receipt sections for high-res stitching...`, 15);

  const imagePayloads = [];
  for (let i = 0; i < files.length; i++) {
    onProgress?.(`Optimizing section ${i + 1} of ${files.length}...`, 15 + Math.round((i / files.length) * 20));
    const payload = await prepareImageForAi(files[i]);
    imagePayloads.push({
      imageBase64: payload.imageBase64,
      mimeType: payload.mimeType,
      fileName: files[i].name,
    });
  }

  onProgress?.(`Gemini AI Vision stitching ${files.length} sections & deduplicating seams...`, 50);

  const response = await fetch('/api/gemini/parse-receipt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      images: imagePayloads,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `AI long receipt stitching failed with status code ${response.status}.`
    );
  }

  onProgress?.('Finalizing line items, taxes, and transaction total...', 85);
  const result = await response.json();
  const data = result.data as ParsedAiReceiptResult;

  if (!data || !data.items) {
    throw new Error('No items could be stitched from the receipt sections.');
  }

  onProgress?.('Complete!', 100);
  const unifiedName = `Long Receipt (${files.length} sections)`;
  return buildCostcoReceiptFromAiResult(data, unifiedName);
}
