import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Camera, CheckCircle2, ChevronRight } from 'lucide-react';

export function AndroidInstallGuide() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowModal(true);
    }
  };

  if (isDismissed) return null;

  return (
    <>
      <div className="bg-m3-surface-container-high text-m3-on-surface rounded-[24px] p-4 sm:p-4.5 shadow-md border border-m3-outline-variant/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-m3-on-surface">Android & Mobile App Ready</h4>
              <span className="text-[10px] uppercase font-bold bg-m3-primary text-m3-on-primary px-2 py-0.5 rounded-full">
                PWA / Camera
              </span>
            </div>
            <p className="text-xs text-m3-on-surface-variant mt-0.5">
              Install Costco Receipt Searcher on your Android phone to snap photos of receipts with your camera anywhere.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleInstallClick}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-m3-primary text-m3-on-primary hover:bg-m3-primary/90 font-medium text-xs shadow-xs transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install on Android</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Android Installation Instructions Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-m3-surface-container-high rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-m3-outline-variant/40 text-m3-on-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-m3-outline-variant/30">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-m3-primary" />
                <h3 className="font-bold text-m3-on-surface text-base">Install on Android Device</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-m3-on-surface-variant">
              <div className="flex items-start gap-3 bg-m3-surface-container p-3 rounded-2xl border border-m3-outline-variant/30">
                <span className="w-6 h-6 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-m3-on-surface block mb-0.5">Open in Chrome on Android</strong>
                  <span>Open this app URL in Google Chrome on your Android smartphone or tablet.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-m3-surface-container p-3 rounded-2xl border border-m3-outline-variant/30">
                <span className="w-6 h-6 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-m3-on-surface block mb-0.5">Tap the 3 dots menu (⋮)</strong>
                  <span>In Chrome, tap the top-right menu and choose <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-m3-surface-container p-3 rounded-2xl border border-m3-outline-variant/30">
                <span className="w-6 h-6 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-m3-on-surface block mb-0.5">Launch & Snap Photos</strong>
                  <span>The app will open full-screen like a native Android app with instant access to your device camera!</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-5 w-full py-2.5 rounded-full bg-m3-primary text-m3-on-primary font-medium text-xs hover:bg-m3-primary/90 transition-colors cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
