import { CostcoReceipt } from '../types';

export interface ExportBackupData {
  appName: string;
  version: string;
  exportedAt: string;
  receiptCount: number;
  totalSpend: number;
  receipts: CostcoReceipt[];
}

/**
 * Creates formatted JSON backup payload of all receipts
 */
export function generateBackupJson(receipts: CostcoReceipt[]): string {
  const totalSpend = receipts.reduce((sum, r) => sum + r.total, 0);
  const data: ExportBackupData = {
    appName: 'Reco - Costco Receipt Searcher',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    receiptCount: receipts.length,
    totalSpend: Number(totalSpend.toFixed(2)),
    receipts,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Converts all items across all receipts into a clean CSV format
 */
export function generateItemsCsv(receipts: CostcoReceipt[]): string {
  const headers = [
    'Order Date',
    'Order Number',
    'Order Type',
    'Warehouse Location',
    'Item ID',
    'Product Name',
    'Brand',
    'Category',
    'Quantity',
    'Unit Price',
    'Total Price',
    'Instant Savings/Discount',
    'Payment Card',
    'Is Return',
  ];

  const rows: string[] = [headers.join(',')];

  receipts.forEach((r) => {
    r.items.forEach((it) => {
      const escapeCsv = (val: string | number | boolean | undefined | null) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const row = [
        escapeCsv(it.orderDate || r.orderDate),
        escapeCsv(it.orderNumber || r.orderNumber),
        escapeCsv(it.orderType || r.orderType),
        escapeCsv(it.warehouseLocation || r.warehouseLocation),
        escapeCsv(it.itemId),
        escapeCsv(it.productName || it.rawName),
        escapeCsv(it.brand || ''),
        escapeCsv(it.category || 'General'),
        escapeCsv(it.quantity),
        escapeCsv(it.unitPrice.toFixed(2)),
        escapeCsv(it.totalPrice.toFixed(2)),
        escapeCsv((it.discount || 0).toFixed(2)),
        escapeCsv(it.paymentCard || r.paymentCard || ''),
        escapeCsv(it.isReturn ? 'YES' : 'NO'),
      ];
      rows.push(row.join(','));
    });
  });

  return rows.join('\r\n');
}

/**
 * Save data to local file system using File System Access API if available,
 * or standard browser download as fallback.
 */
export async function saveToFileSystem(
  content: string,
  filename: string,
  mimeType: string = 'application/json'
): Promise<{ success: boolean; filename: string; method: 'picker' | 'download' }> {
  // Try modern File System Access API (allows user to select destination folder & filename)
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const isJson = mimeType.toLowerCase().includes('json');
      const isCsv = mimeType.toLowerCase().includes('csv');
      const cleanMime = isJson ? 'application/json' : isCsv ? 'text/csv' : 'text/plain';
      const ext = isJson ? '.json' : isCsv ? '.csv' : '.txt';

      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: isJson ? 'JSON Backup File (*.json)' : 'CSV Spreadsheet File (*.csv)',
            accept: {
              [cleanMime]: [ext],
            },
          },
        ],
      });

      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      return {
        success: true,
        filename: fileHandle.name || filename,
        method: 'picker',
      };
    } catch (err: any) {
      // If user aborted/cancelled the picker, rethrow so caller handles cancellation gracefully
      if (
        err.name === 'AbortError' ||
        err.name === 'NotAllowedError' ||
        err.message?.toLowerCase().includes('aborted') ||
        err.message?.toLowerCase().includes('cancelled')
      ) {
        throw new Error('Save cancelled by user');
      }
      // If SecurityError or API disabled (e.g. running in an iframe), fallback to standard browser download
      console.warn('File System Access API not supported in this frame context, falling back to download:', err);
    }
  }

  // Fallback: standard web download
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    filename,
    method: 'download',
  };
}

/**
 * Validates and parses a restored JSON backup file
 */
export function parseRestoredBackupJson(jsonString: string): CostcoReceipt[] {
  const parsed = JSON.parse(jsonString);

  // Check if it is standard Reco backup format
  if (parsed && Array.isArray(parsed.receipts)) {
    return parsed.receipts;
  }

  // Check if user uploaded array of receipts directly
  if (Array.isArray(parsed)) {
    return parsed;
  }

  throw new Error('Invalid backup file format. Expected a Reco backup JSON.');
}
