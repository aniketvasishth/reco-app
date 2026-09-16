import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, Loader2, X } from 'lucide-react';

interface SnackbarProps {
  message: string | null;
  title?: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Snackbar({ message, title, type, onClose, duration = 4000 }: SnackbarProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const lowerMsg = message.toLowerCase();
  const lowerTitle = (title || '').toLowerCase();

  // Strict evaluation of snackbar nature
  const isErrorIndicator =
    type === 'error' ||
    lowerTitle.includes('error') ||
    lowerTitle.includes('failed') ||
    lowerTitle.includes('failure') ||
    lowerTitle.includes('invalid') ||
    lowerTitle.includes('costco receipts only') ||
    lowerTitle.includes('rejected') ||
    lowerMsg.includes('error') ||
    lowerMsg.includes('failed') ||
    lowerMsg.includes('failure') ||
    lowerMsg.includes('could not') ||
    lowerMsg.includes('cannot') ||
    lowerMsg.includes('rejected') ||
    lowerMsg.includes('not appear to be') ||
    lowerMsg.includes('non-costco') ||
    lowerMsg.includes('costco receipts have the costco wholesale logo');

  const isInfoIndicator =
    !isErrorIndicator &&
    (type === 'info' ||
      lowerTitle.includes('scanning') ||
      lowerTitle.includes('stitching') ||
      lowerTitle.includes('display') ||
      lowerTitle.includes('info') ||
      lowerTitle.includes('camera') ||
      lowerMsg.includes('scanning') ||
      lowerMsg.includes('stitching') ||
      lowerMsg.includes('analyzing') ||
      lowerMsg.includes('connecting') ||
      lowerMsg.includes('downloading') ||
      lowerMsg.includes('immersive mode'));

  let resolvedType: 'success' | 'error' | 'info' = 'success';
  if (isErrorIndicator) {
    resolvedType = 'error';
  } else if (isInfoIndicator) {
    resolvedType = 'info';
  } else if (type) {
    resolvedType = type;
  }

  // Compute display title if not explicitly provided
  let displayTitle = title;
  if (!displayTitle) {
    if (resolvedType === 'error') {
      displayTitle = 'Error';
    } else if (resolvedType === 'info') {
      displayTitle =
        lowerMsg.includes('scanning') || lowerMsg.includes('stitching')
          ? 'Scanning Receipt'
          : 'Notice';
    } else {
      if (lowerMsg.includes('cleared') || lowerMsg.includes('cleanup') || lowerMsg.includes('reset')) {
        displayTitle = 'Cleanup Successful';
      } else if (
        lowerMsg.includes('sync') ||
        lowerMsg.includes('drive') ||
        lowerMsg.includes('backup') ||
        lowerMsg.includes('saved')
      ) {
        displayTitle = 'Backup & Sync';
      } else if (lowerMsg.includes('updated')) {
        displayTitle = 'Receipt Updated';
      } else {
        displayTitle = 'Receipt Scanned Successfully';
      }
    }
  }

  const isScanningActive =
    resolvedType === 'info' &&
    (lowerMsg.includes('scanning') || lowerMsg.includes('stitching') || lowerMsg.includes('analyzing'));

  return (
    <div
      id="upload-snackbar"
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] max-w-md w-[calc(100%-2rem)] bg-m3-inverse-surface text-m3-inverse-on-surface px-4 py-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200 pointer-events-auto"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            resolvedType === 'error'
              ? 'bg-rose-500/20 text-rose-400'
              : resolvedType === 'info'
              ? 'bg-sky-500/20 text-sky-400'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          {resolvedType === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : isScanningActive ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : resolvedType === 'info' ? (
            <Info className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-m3-inverse-on-surface truncate">{displayTitle}</p>
          <p className="text-xs text-m3-inverse-on-surface/80 truncate">{message}</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 text-m3-inverse-on-surface/70 hover:text-m3-inverse-on-surface rounded-full hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
