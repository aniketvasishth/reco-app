import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Layers,
  Files,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CostcoReceipt, CostcoItem } from '../types';
import { parseCostcoCsv, parseCostcoJson, enrichCostcoItemOnWeb } from '../utils/receiptParsers';
import { parseReceiptImageOnDevice } from '../utils/ocrParser';
import { scanReceiptWithAiOrFallback } from '../utils/receiptScanner';
import { isPdfFile, renderPdfToImage } from '../utils/pdfReceiptHelper';
import { SAMPLE_COSTCO_RECEIPTS } from '../utils/sampleData';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptsAdded: (newReceipts: CostcoReceipt[], message?: string) => void;
  onShowSnackbar?: (message: string, title?: string, type?: 'success' | 'error' | 'info') => void;
}

type TabType = 'photo' | 'json' | 'csv' | 'sample';

const MAX_UPLOAD_FILES = 3;

interface SelectedFileInfo {
  id: string;
  file: File;
  previewUrl: string | null;
  isPdf: boolean;
  pdfPageCount: number;
  isRendering: boolean;
  status: 'idle' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

export function UploadModal({
  isOpen,
  onClose,
  onReceiptsAdded,
  onShowSnackbar,
}: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('photo');
  const [isLoading, setIsLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Multi-file selection state (max 3 files)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileInfo[]>([]);

  // For raw JSON paste
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  // Handle clipboard image/file paste
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files?.length) {
        const rawFiles = Array.from(e.clipboardData.files);
        handleFilesSelected(rawFiles);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, activeTab, selectedFiles]);

  if (!isOpen) return null;

  const resetState = () => {
    setIsLoading(false);
    setProgressMsg('');
    setProgressPct(0);
    setErrorMsg(null);
    setSelectedFiles([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFilesSelected = async (incomingFiles: File[]) => {
    setErrorMsg(null);
    const validFiles = incomingFiles.filter(
      (f) => f.type.startsWith('image/') || isPdfFile(f)
    );

    if (validFiles.length === 0) {
      setErrorMsg('Please select valid receipt files (PDF, JPG, PNG, WEBP).');
      return;
    }

    const availableSlots = MAX_UPLOAD_FILES - selectedFiles.length;
    if (availableSlots <= 0) {
      setErrorMsg(`Maximum limit is ${MAX_UPLOAD_FILES} files per upload batch.`);
      return;
    }

    let filesToAdd = validFiles;
    if (validFiles.length > availableSlots) {
      filesToAdd = validFiles.slice(0, availableSlots);
      setErrorMsg(`Maximum ${MAX_UPLOAD_FILES} files per batch. Added ${filesToAdd.length} of ${validFiles.length} files.`);
    }

    // Prepare initial entries with rendering state
    const newItems: SelectedFileInfo[] = filesToAdd.map((file) => {
      const isPdfDoc = isPdfFile(file);
      const isImg = file.type.startsWith('image/');
      let initialPreview: string | null = null;
      if (isImg) {
        try {
          initialPreview = URL.createObjectURL(file);
        } catch {
          initialPreview = null;
        }
      }

      return {
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: initialPreview,
        isPdf: isPdfDoc,
        pdfPageCount: 1,
        isRendering: isPdfDoc,
        status: 'idle',
      };
    });

    // Update state immediately
    setSelectedFiles((prev) => [...prev, ...newItems]);

    // Asynchronously render PDF previews
    for (const item of newItems) {
      if (item.isPdf) {
        try {
          const { dataUrl, numPages } = await renderPdfToImage(item.file);
          setSelectedFiles((currentList) =>
            currentList.map((f) =>
              f.id === item.id
                ? {
                    ...f,
                    previewUrl: dataUrl || null,
                    pdfPageCount: numPages || 1,
                    isRendering: false,
                  }
                : f
            )
          );
        } catch (err) {
          console.warn('PDF preview render error:', err);
          setSelectedFiles((currentList) =>
            currentList.map((f) =>
              f.id === item.id ? { ...f, isRendering: false } : f
            )
          );
        }
      }
    }
  };

  const removeFile = (idToRemove: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== idToRemove));
    setErrorMsg(null);
  };

  const processBatchWithAi = async () => {
    if (selectedFiles.length === 0) return;
    setIsLoading(true);
    setErrorMsg(null);
    setProgressPct(5);

    const totalFiles = selectedFiles.length;
    const allParsedReceipts: CostcoReceipt[] = [];
    const errors: string[] = [];

    for (let index = 0; index < totalFiles; index++) {
      const fileItem = selectedFiles[index];
      const fileNum = index + 1;
      const baseProgress = Math.round(((index) / totalFiles) * 100);

      setSelectedFiles((curr) =>
        curr.map((f) => (f.id === fileItem.id ? { ...f, status: 'processing' } : f))
      );

      setProgressMsg(
        `Processing file ${fileNum} of ${totalFiles}: ${fileItem.file.name}...`
      );
      setProgressPct(Math.max(baseProgress + 5, 10));

      try {
        const { receipt } = await scanReceiptWithAiOrFallback(
          fileItem.file,
          (status, stepPct) => {
            const currentItemProgress = (stepPct / 100) * (100 / totalFiles);
            setProgressPct(Math.min(95, Math.round(baseProgress + currentItemProgress)));
            setProgressMsg(
              `[${fileNum}/${totalFiles}] ${fileItem.file.name}: ${status}`
            );
          }
        );

        if (fileItem.previewUrl) {
          receipt.rawImagePreview = fileItem.previewUrl;
        }

        allParsedReceipts.push(receipt);
        setSelectedFiles((curr) =>
          curr.map((f) => (f.id === fileItem.id ? { ...f, status: 'done' } : f))
        );
      } catch (err: any) {
        const errMsg = err?.message || 'Failed to parse file';
        const isValidationRejection =
          errMsg.includes('Costco') ||
          errMsg.includes('costco') ||
          errMsg.includes('Wholesale logo') ||
          errMsg.includes('Receipt rejected') ||
          errMsg.includes('FreshCo') ||
          errMsg.includes('freshco');
        if (isValidationRejection) {
          console.warn(`File rejected (${fileItem.file.name}):`, errMsg);
        } else {
          console.error(`Error parsing file ${fileItem.file.name}:`, err);
        }
        errors.push(`${fileItem.file.name}: ${errMsg}`);
        setSelectedFiles((curr) =>
          curr.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: 'error', errorMessage: errMsg }
              : f
          )
        );
      }
    }

    setProgressPct(100);

    if (allParsedReceipts.length > 0) {
      const totalItems = allParsedReceipts.reduce((sum, r) => sum + r.items.length, 0);
      const summaryMsg =
        allParsedReceipts.length === 1
          ? `Gemini AI parsed ${totalItems} items from ${allParsedReceipts[0].warehouseLocation}`
          : `Batch imported ${allParsedReceipts.length} receipts (${totalItems} total items)`;

      onReceiptsAdded(allParsedReceipts, summaryMsg);

      if (errors.length > 0) {
        onShowSnackbar?.(
          `Imported ${allParsedReceipts.length} receipts. Note: ${errors.length} file(s) had errors.`,
          'Import Notice',
          'info'
        );
      }
      handleClose();
    } else {
      setIsLoading(false);
      setErrorMsg(
        errors.length > 0
          ? errors.join('; ')
          : 'Could not extract valid receipt details. Please verify the documents.'
      );
    }
  };

  const processBatchLocally = async () => {
    if (selectedFiles.length === 0) return;
    setIsLoading(true);
    setErrorMsg(null);
    setProgressPct(5);

    const totalFiles = selectedFiles.length;
    const allParsedReceipts: CostcoReceipt[] = [];
    const errors: string[] = [];

    for (let index = 0; index < totalFiles; index++) {
      const fileItem = selectedFiles[index];
      const fileNum = index + 1;
      const baseProgress = Math.round(((index) / totalFiles) * 100);

      setSelectedFiles((curr) =>
        curr.map((f) => (f.id === fileItem.id ? { ...f, status: 'processing' } : f))
      );

      setProgressMsg(
        `On-device OCR [${fileNum}/${totalFiles}]: ${fileItem.file.name}...`
      );
      setProgressPct(Math.max(baseProgress + 5, 10));

      try {
        const receipt = await parseReceiptImageOnDevice(
          fileItem.file,
          (status, stepPct) => {
            const currentItemProgress = (stepPct / 100) * (100 / totalFiles);
            setProgressPct(Math.min(95, Math.round(baseProgress + currentItemProgress)));
            setProgressMsg(
              `[${fileNum}/${totalFiles}] ${fileItem.file.name}: ${status}`
            );
          }
        );

        if (fileItem.previewUrl) {
          receipt.rawImagePreview = fileItem.previewUrl;
        }

        allParsedReceipts.push(receipt);
        setSelectedFiles((curr) =>
          curr.map((f) => (f.id === fileItem.id ? { ...f, status: 'done' } : f))
        );
      } catch (err: any) {
        const errMsg = err?.message || 'Failed to parse file';
        const isValidationRejection =
          errMsg.includes('Costco') ||
          errMsg.includes('costco') ||
          errMsg.includes('Wholesale logo') ||
          errMsg.includes('Receipt rejected') ||
          errMsg.includes('FreshCo') ||
          errMsg.includes('freshco');
        if (isValidationRejection) {
          console.warn(`Local file rejected (${fileItem.file.name}):`, errMsg);
        } else {
          console.error(`Local parse error for ${fileItem.file.name}:`, err);
        }
        errors.push(`${fileItem.file.name}: ${errMsg}`);
        setSelectedFiles((curr) =>
          curr.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: 'error', errorMessage: errMsg }
              : f
          )
        );
      }
    }

    setProgressPct(100);

    if (allParsedReceipts.length > 0) {
      const totalItems = allParsedReceipts.reduce((sum, r) => sum + r.items.length, 0);
      const summaryMsg =
        allParsedReceipts.length === 1
          ? `Fast local scan: Added ${totalItems} items from ${allParsedReceipts[0].warehouseLocation}`
          : `Fast local scan: Added ${allParsedReceipts.length} receipts (${totalItems} items)`;

      onReceiptsAdded(allParsedReceipts, summaryMsg);

      if (errors.length > 0) {
        onShowSnackbar?.(
          `Imported ${allParsedReceipts.length} receipts. ${errors.length} file(s) failed.`,
          'Import Notice',
          'info'
        );
      }
      handleClose();
    } else {
      setIsLoading(false);
      setErrorMsg(
        errors.length > 0
          ? errors.join('; ')
          : 'Could not extract valid receipt details. Please verify the files.'
      );
    }
  };

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMsg(null);
    setProgressMsg('Parsing Costco JSON export...');

    try {
      const text = await file.text();
      const receipts = parseCostcoJson(text, file.name);

      for (const r of receipts) {
        for (const it of r.items) {
          const enriched = await enrichCostcoItemOnWeb(it.itemId, it.rawName);
          it.productName = enriched.productName || it.rawName;
          it.brand = enriched.brand || it.brand;
          it.category = enriched.category || it.category;
          it.description = enriched.description || it.description;
          it.webSourceUrl = enriched.webSourceUrl || it.webSourceUrl;
          it.isEnriched = true;
        }
      }

      const totalItems = receipts.reduce((s, r) => s + r.items.length, 0);
      onReceiptsAdded(receipts, `Imported ${totalItems} items from JSON export`);
      handleClose();
    } catch (err: any) {
      const msg = err.message || 'Invalid JSON format. Please verify the exported file.';
      setErrorMsg(msg);
      if (msg.includes('currently designed for Costco receipts only') || msg.includes('Costco')) {
        onShowSnackbar?.(msg, 'Costco Receipts Only', 'error');
      }
    } finally {
      setIsLoading(false);
      setProgressMsg('');
    }
  };

  const handlePastedJsonSubmit = async () => {
    if (!pastedJsonText.trim()) {
      setErrorMsg('Please paste your Costco JSON content first.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setProgressMsg('Parsing pasted Costco JSON on-device...');

    try {
      const receipts = parseCostcoJson(pastedJsonText, 'pasted_receipts.json');

      for (const r of receipts) {
        for (const it of r.items) {
          const enriched = await enrichCostcoItemOnWeb(it.itemId, it.rawName);
          it.productName = enriched.productName || it.rawName;
          it.brand = enriched.brand || it.brand;
          it.category = enriched.category || it.category;
          it.description = enriched.description || it.description;
          it.webSourceUrl = enriched.webSourceUrl || it.webSourceUrl;
          it.isEnriched = true;
        }
      }

      const totalItems = receipts.reduce((s, r) => s + r.items.length, 0);
      onReceiptsAdded(receipts, `Imported ${totalItems} items from pasted JSON`);
      handleClose();
    } catch (err: any) {
      const msg = err.message || 'Invalid JSON format. Please verify the pasted text.';
      setErrorMsg(msg);
      if (msg.includes('currently designed for Costco receipts only') || msg.includes('Costco')) {
        onShowSnackbar?.(msg, 'Costco Receipts Only', 'error');
      }
    } finally {
      setIsLoading(false);
      setProgressMsg('');
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMsg(null);
    setProgressMsg('Parsing Costco CSV file...');

    try {
      const text = await file.text();
      const receipts = parseCostcoCsv(text, file.name);

      for (const r of receipts) {
        for (const it of r.items) {
          const enriched = await enrichCostcoItemOnWeb(it.itemId, it.rawName);
          it.productName = enriched.productName || it.rawName;
          it.brand = enriched.brand || it.brand;
          it.category = enriched.category || it.category;
          it.description = enriched.description || it.description;
          it.webSourceUrl = enriched.webSourceUrl || it.webSourceUrl;
          it.isEnriched = true;
        }
      }

      const totalItems = receipts.reduce((s, r) => s + r.items.length, 0);
      onReceiptsAdded(receipts, `Imported ${totalItems} items from CSV export`);
      handleClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to parse CSV file. Ensure it has standard columns.';
      setErrorMsg(msg);
      if (msg.includes('currently designed for Costco receipts only') || msg.includes('Costco')) {
        onShowSnackbar?.(msg, 'Costco Receipts Only', 'error');
      }
    } finally {
      setIsLoading(false);
      setProgressMsg('');
    }
  };

  const handleLoadSamples = () => {
    onReceiptsAdded(
      SAMPLE_COSTCO_RECEIPTS,
      `Loaded ${SAMPLE_COSTCO_RECEIPTS.length} sample Costco receipts (${SAMPLE_COSTCO_RECEIPTS.reduce((s, r) => s + r.items.length, 0)} items)`
    );
    handleClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          id="upload-modal-container"
          className="bg-m3-surface-container text-m3-on-surface rounded-[28px] shadow-2xl max-w-lg w-full overflow-hidden border border-m3-outline-variant/60 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-m3-outline-variant/40 flex items-center justify-between shrink-0">
            <h2 className="text-base font-bold text-m3-on-surface">Upload Costco Receipts</h2>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="p-2 text-m3-on-surface-variant hover:text-m3-on-surface rounded-full hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Tab Navigation (M3 Filter Chips style) */}
          <div className="flex border-b border-m3-outline-variant/40 bg-m3-surface-container-high/60 p-2 gap-1.5 text-xs font-semibold overflow-x-auto shrink-0 scrollbar-none">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setActiveTab('photo');
                setErrorMsg(null);
              }}
              className={`py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'photo'
                  ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs font-semibold'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              <Files className="w-3.5 h-3.5 text-m3-primary" />
              <span>Photos / PDFs</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setActiveTab('json');
                setErrorMsg(null);
              }}
              className={`py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'json'
                  ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs font-semibold'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              <FileJson className="w-3.5 h-3.5 text-m3-secondary" />
              <span>JSON</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setActiveTab('csv');
                setErrorMsg(null);
              }}
              className={`py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'csv'
                  ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-xs font-semibold'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-m3-tertiary" />
              <span>CSV</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setActiveTab('sample');
                setErrorMsg(null);
              }}
              className={`py-2 px-3 rounded-full flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'sample'
                  ? 'bg-m3-tertiary-container text-m3-on-tertiary-container shadow-xs font-semibold'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-m3-tertiary" />
              <span>Demo</span>
            </motion.button>
          </div>

          {/* Modal Content - Scrollable body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="p-3 bg-m3-error-container text-m3-on-error-container border border-m3-error/30 rounded-2xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-m3-error" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: Photo & PDF Upload (Single or Multi-file up to 3) */}
            {activeTab === 'photo' && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,application/pdf,image/*,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      handleFilesSelected(Array.from(files));
                    }
                    e.target.value = '';
                  }}
                />

                {selectedFiles.length === 0 ? (
                  <div className="space-y-3">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files?.length) {
                          handleFilesSelected(Array.from(e.dataTransfer.files));
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-8 bg-m3-surface-container-low hover:bg-m3-surface-container-high border-2 border-dashed border-m3-outline-variant/60 hover:border-m3-primary/60 rounded-2xl transition-all group cursor-pointer text-center"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-m3-secondary-container text-m3-on-secondary-container flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                          <FileText className="w-6 h-6 text-red-500 dark:text-red-400" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                          <ImageIcon className="w-6 h-6 text-m3-primary" />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-m3-on-surface">Choose PDF Invoices or Photos</span>
                      <span className="text-xs text-m3-on-surface-variant mt-1 max-w-xs leading-relaxed">
                        Costco online invoices (Costco.ca / Costco.com), warehouse receipts, refund slips, or multi-page PDFs
                      </span>
                      <div className="mt-3.5 flex items-center gap-2 flex-wrap justify-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-m3-primary/10 text-m3-primary border border-m3-primary/20">
                          <Files className="w-3 h-3" /> Multi-Select (Up to {MAX_UPLOAD_FILES} files)
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-m3-surface-container-highest text-m3-on-surface-variant">
                          PDF, JPG, PNG, WEBP
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-2xl flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-m3-primary shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-semibold text-m3-on-surface">Batch Scanning & Online Web Invoices</span>
                        <p className="text-m3-on-surface-variant text-[11px] mt-0.5 leading-relaxed">
                          Select multiple PDFs or photos in the file picker (hold Shift / Ctrl) or drag & drop up to 3 documents at once. Supports downloaded Costco Online PDF invoices (with Order Number, items, and tax breakdowns) as well as photographed paper receipts.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Header with counter and Add More button */}
                    <div className="flex items-center justify-between text-xs px-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-m3-on-surface">
                          Selected Documents ({selectedFiles.length}/{MAX_UPLOAD_FILES})
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-m3-primary/10 text-m3-primary font-semibold">
                          Max {MAX_UPLOAD_FILES}
                        </span>
                      </div>

                      {selectedFiles.length < MAX_UPLOAD_FILES && !isLoading && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1 text-m3-primary hover:text-m3-primary/80 font-semibold cursor-pointer text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add another file</span>
                        </button>
                      )}
                    </div>

                    {/* Selected files list */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedFiles.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2.5 bg-m3-surface-container-low border border-m3-outline-variant/50 rounded-2xl relative group"
                        >
                          {/* Thumbnail / icon */}
                          <div className="w-12 h-12 rounded-xl bg-m3-surface-container-highest overflow-hidden shrink-0 flex items-center justify-center border border-m3-outline-variant/40 relative">
                            {item.isRendering ? (
                              <Loader2 className="w-4 h-4 animate-spin text-m3-primary" />
                            ) : item.previewUrl ? (
                              <img
                                src={item.previewUrl}
                                alt={item.file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileText className={`w-5 h-5 ${item.isPdf ? 'text-red-500' : 'text-m3-primary'}`} />
                            )}
                            {item.isPdf && (
                              <span className="absolute bottom-0 inset-x-0 bg-red-600/90 text-white text-[8px] font-bold text-center leading-tight py-0.5">
                                PDF
                              </span>
                            )}
                          </div>

                          {/* File metadata */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-m3-on-surface truncate">
                                {item.file.name}
                              </span>
                              {item.status === 'done' && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              )}
                              {item.status === 'error' && (
                                <AlertCircle className="w-3.5 h-3.5 text-m3-error shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-m3-on-surface-variant mt-0.5">
                              <span>{(item.file.size / 1024).toFixed(0)} KB</span>
                              <span>•</span>
                              <span>
                                {item.isPdf
                                  ? `${item.pdfPageCount} ${item.pdfPageCount === 1 ? 'page' : 'pages'}`
                                  : 'Image photo'}
                              </span>
                              {item.status === 'processing' && (
                                <>
                                  <span>•</span>
                                  <span className="text-m3-primary font-medium animate-pulse">Scanning...</span>
                                </>
                              )}
                            </div>
                            {item.errorMessage && (
                              <p className="text-[11px] text-m3-error mt-1 leading-snug font-medium">
                                {item.errorMessage}
                              </p>
                            )}
                          </div>

                          {/* Remove button */}
                          {!isLoading && (
                            <button
                              type="button"
                              onClick={() => removeFile(item.id)}
                              className="p-1.5 text-m3-on-surface-variant hover:text-m3-error hover:bg-m3-surface-container-highest rounded-full transition-colors cursor-pointer shrink-0"
                              title="Remove document"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Add more files drop/click area */}
                      {selectedFiles.length < MAX_UPLOAD_FILES && !isLoading && (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.dataTransfer.files?.length) {
                              handleFilesSelected(Array.from(e.dataTransfer.files));
                            }
                          }}
                          onClick={() => fileInputRef.current?.click()}
                          className="p-3 bg-m3-surface-container-low hover:bg-m3-surface-container-high border-2 border-dashed border-m3-outline-variant/60 hover:border-m3-primary/60 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold text-m3-primary"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add another PDF invoice or photo ({selectedFiles.length}/{MAX_UPLOAD_FILES})</span>
                        </div>
                      )}
                    </div>

                    {/* Loading & Progress State */}
                    {isLoading ? (
                      <div className="p-4 bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-m3-on-surface truncate max-w-[280px]">{progressMsg}</span>
                          <span className="text-m3-primary font-mono font-bold shrink-0">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-m3-surface-container-highest rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-m3-primary h-2 transition-all duration-300 rounded-full"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <div className="flex gap-2">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={processBatchWithAi}
                            className="flex-1 py-3 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-full text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>
                              {selectedFiles.length === 1
                                ? selectedFiles[0].isPdf
                                  ? 'Parse PDF with Gemini AI'
                                  : 'Scan with Gemini AI Vision'
                                : `Scan ${selectedFiles.length} Files with Gemini AI`}
                            </span>
                          </motion.button>

                          <button
                            type="button"
                            onClick={() => setSelectedFiles([])}
                            className="px-4 py-3 bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface rounded-full text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={processBatchLocally}
                          className="w-full py-2 bg-transparent hover:bg-m3-surface-container-high text-m3-on-surface-variant rounded-full text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>
                            {selectedFiles.length === 1
                              ? 'Or use Fast Local Scan (100% On-Device OCR)'
                              : `Or Fast Local Scan for ${selectedFiles.length} files (On-Device)`}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: JSON Chrome Extension */}
            {activeTab === 'json' && (
              <div className="space-y-4">
                <input
                  ref={jsonInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleJsonUpload}
                />
                
                {!showPasteBox ? (
                  <>
                    <div
                      onClick={() => jsonInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-8 bg-m3-surface-container-low hover:bg-m3-surface-container-high border-2 border-m3-outline-variant/50 border-dashed rounded-2xl cursor-pointer transition-all text-center group"
                    >
                      <div className="w-12 h-12 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                        <FileJson className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-m3-on-surface">
                        Select or Drop JSON File
                      </span>
                      <span className="text-[11px] text-m3-on-surface-variant mt-1 max-w-xs">
                        Supports Costco Extension exports & WarehouseReceiptDetail JSON.
                      </span>
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowPasteBox(true)}
                        className="text-xs text-m3-primary font-semibold hover:underline cursor-pointer"
                      >
                        Or paste JSON text directly from clipboard →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-m3-on-surface">
                        Paste Costco JSON Content:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPasteBox(false)}
                        className="text-xs text-m3-on-surface-variant hover:text-m3-on-surface cursor-pointer"
                      >
                        Back to file picker
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={pastedJsonText}
                      onChange={(e) => setPastedJsonText(e.target.value)}
                      placeholder='Paste raw JSON here (e.g. [{"channel":"warehouse","itemArray":[...]}])'
                      className="w-full p-3 font-mono text-xs bg-m3-surface-container-lowest border border-m3-outline-variant/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-m3-primary/30 focus:border-m3-primary text-m3-on-surface"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handlePastedJsonSubmit}
                        disabled={isLoading || !pastedJsonText.trim()}
                        className="flex-1 py-2.5 bg-m3-primary hover:bg-m3-primary/90 disabled:opacity-50 text-m3-on-primary rounded-full text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        Import Pasted JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => setPastedJsonText('')}
                        className="px-3.5 py-2.5 bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface rounded-full text-xs font-semibold cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="flex items-center justify-center gap-2 text-xs text-m3-on-surface-variant">
                    <Loader2 className="w-4 h-4 animate-spin text-m3-primary" />
                    <span>{progressMsg}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CSV File */}
            {activeTab === 'csv' && (
              <div className="space-y-4">
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleCsvUpload}
                />
                <div
                  onClick={() => csvInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 bg-m3-surface-container-low hover:bg-m3-surface-container-high border-2 border-m3-outline-variant/50 border-dashed rounded-2xl cursor-pointer transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-m3-secondary-container text-m3-on-secondary-container flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-m3-on-surface">Select CSV Export</span>
                  <span className="text-[11px] text-m3-on-surface-variant mt-1 max-w-xs">
                    Upload CSV exported from Costco order history extension.
                  </span>
                </div>
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 text-xs text-m3-on-surface-variant">
                    <Loader2 className="w-4 h-4 animate-spin text-m3-primary" />
                    <span>{progressMsg}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Demo Samples */}
            {activeTab === 'sample' && (
              <div className="p-4 bg-m3-surface-container-low border border-m3-outline-variant/40 rounded-2xl space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-m3-on-surface">
                    Load Pre-loaded Costco Receipts
                  </h3>
                  <p className="text-[11px] text-m3-on-surface-variant mt-0.5">
                    Includes 4 real Costco receipts with 16 popular warehouse items (Kirkland EVOO,
                    Rotisserie Chicken, Paper Towels, AirPods Pro, Golf wedges, etc.).
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleLoadSamples}
                  className="w-full py-2.5 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-full text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-m3-tertiary-container" />
                  <span>Load Demo Purchases</span>
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

