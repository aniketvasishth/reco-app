import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  setAutoSyncEnabled,
  setPromptedFirstLaunchSync,
  getNext3AMDisplay,
} from '../services/nightlySyncService';
import { googleSignIn } from '../services/googleDriveService';

interface FirstLaunchSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncEnabled: () => void;
  onShowSnackbar?: (msg: string) => void;
}

export function FirstLaunchSyncModal({
  isOpen,
  onClose,
  onSyncEnabled,
  onShowSnackbar,
}: FirstLaunchSyncModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDecline = () => {
    setAutoSyncEnabled(false);
    setPromptedFirstLaunchSync();
    onClose();
  };

  const handleEnableSync = async () => {
    setIsConnecting(true);
    setErrorMsg(null);

    try {
      const result = await googleSignIn();
      if (result?.user) {
        setAutoSyncEnabled(true);
        setPromptedFirstLaunchSync();
        onSyncEnabled();
        if (onShowSnackbar) {
          onShowSnackbar(`Connected as ${result.user.displayName || result.user.email}. Nightly 3 AM Google Drive sync enabled!`);
        }
        onClose();
      } else {
        throw new Error('Could not connect Google Drive account.');
      }
    } catch (err: any) {
      console.error('Google Drive sign in failed on first launch:', err);
      setErrorMsg(err?.message || 'Could not complete Google Sign-In. You can enable sync anytime in Settings/Summary.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div
      id="first-launch-sync-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={handleDecline}
    >
      <div
        id="first-launch-sync-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-m3-surface-container text-m3-on-surface rounded-[28px] shadow-2xl overflow-hidden border border-m3-outline-variant/60 animate-in zoom-in-95 duration-200"
      >
        {/* Header Graphic */}
        <div className="bg-m3-primary/10 border-b border-m3-outline-variant/30 p-6 flex flex-col items-center text-center relative">
          <button
            onClick={handleDecline}
            className="absolute top-3 right-3 p-2 text-m3-on-surface-variant hover:text-m3-on-surface rounded-full hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
            aria-label="Dismiss prompt"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-m3-primary text-m3-on-primary flex items-center justify-center shadow-md mb-3">
            <Cloud className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-bold text-m3-on-surface">
            Enable Automatic Cloud Sync?
          </h2>
          <span className="text-xs text-m3-on-surface-variant mt-1">
            Back up and sync your Costco receipts to your Google Drive
          </span>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5 text-xs text-m3-on-surface">
          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-m3-surface-container-low border border-m3-outline-variant/40">
              <Clock className="w-4 h-4 text-m3-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-m3-on-surface text-xs block">
                  Automatic Nightly Backup at 3:00 AM
                </strong>
                <span className="text-[11px] text-m3-on-surface-variant leading-tight block mt-0.5">
                  Next scheduled sync: {getNext3AMDisplay()}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-m3-surface-container-low border border-m3-outline-variant/40">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-m3-on-surface text-xs block">
                  Private & Safe
                </strong>
                <span className="text-[11px] text-m3-on-surface-variant leading-tight block mt-0.5">
                  Stored directly in your personal Google Drive. No third-party servers can access your purchase data.
                </span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 pt-2 border-t border-m3-outline-variant/40 bg-m3-surface-container-high/60 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleDecline}
            disabled={isConnecting}
            className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-full bg-m3-surface-container-highest hover:bg-m3-surface-container-high text-m3-on-surface font-semibold text-xs transition-colors cursor-pointer text-center"
          >
            Not Now (Local Only)
          </button>

          <button
            type="button"
            onClick={handleEnableSync}
            disabled={isConnecting}
            className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                <span>Yes, Connect Drive</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
