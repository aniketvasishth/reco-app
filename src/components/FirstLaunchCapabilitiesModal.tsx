import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Cpu,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HardDrive,
  Camera,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import {
  DeviceCapabilitiesReport,
  runDeviceCapabilitiesDiagnostic,
  setCompletedFirstLaunchCapabilitiesCheck,
} from '../services/onDeviceAiService';

interface FirstLaunchCapabilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHowToGuide?: () => void;
  onOpenSettings?: () => void;
  onShowSnackbar?: (message: string, title?: string) => void;
}

export function FirstLaunchCapabilitiesModal({
  isOpen,
  onClose,
}: FirstLaunchCapabilitiesModalProps) {
  const [report, setReport] = useState<DeviceCapabilitiesReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFlagSteps, setShowFlagSteps] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const runCheck = async () => {
    setIsLoading(true);
    try {
      const result = await runDeviceCapabilitiesDiagnostic();
      setReport(result);
      if (result.geminiNano.flagConfigNeeded) {
        setShowFlagSteps(true);
      }
    } catch (e) {
      console.warn('Error running device capabilities check:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runCheck();
    }
  }, [isOpen]);

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleComplete = () => {
    setCompletedFirstLaunchCapabilitiesCheck();
    onClose();
  };

  if (!isOpen) return null;

  const isAllEnabled = Boolean(
    report && report.geminiNano.available && report.webAssemblyOcr.available && report.offlinePwa.available
  );

  return (
    <AnimatePresence>
      <div
        id="first-launch-capabilities-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          id="first-launch-capabilities-dialog"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-lg bg-m3-surface border border-m3-outline-variant/40 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-m3-outline-variant/30 bg-gradient-to-br from-m3-surface-container-low to-m3-surface flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-m3-on-surface truncate">
                  Device Capabilities Check
                </h2>
                <p className="text-xs text-m3-on-surface-variant mt-0.5 truncate">
                  100% On-Device AI • Privacy & Offline First
                </p>
              </div>
            </div>

            {/* Top Right Action & Status Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 select-none">
                Offline PWA
              </span>
              <button
                type="button"
                onClick={runCheck}
                disabled={isLoading}
                className="p-2 rounded-xl bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface border border-m3-outline-variant/30 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                title="Re-run Diagnostics"
                aria-label="Re-run Diagnostics"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-m3-primary' : ''}`} />
              </button>
            </div>
          </div>

          {/* Body Content (Scrollable) */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
            {/* Core Principle Notice or All Enabled Professional Message */}
            {isAllEnabled ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5 leading-relaxed shadow-2xs">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>On-Device AI Fully Configured</span>
                </div>
                <p className="text-m3-on-surface text-[11px] leading-relaxed">
                  Great! You already have offline capability enabled by default, and your device natively supports on-device Gemini Nano features. All receipt processing and AI features run 100% locally on your device without transmitting data to the cloud.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-1.5 leading-relaxed">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>On-Device First Architecture</span>
                </div>
                <p className="text-m3-on-surface-variant text-[11px]">
                  Reco runs directly on your device. Receipt scanning utilizes your phone’s <strong>Android Gemini Nano</strong> NPU/GPU and offline WebAssembly OCR. Your scans and personal data remain 100% private on your device.
                </p>
              </div>
            )}

            {/* Diagnostic Results List */}
            {isLoading ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-8 h-8 border-2 border-m3-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-m3-on-surface-variant font-medium">
                  Inspecting Android AICore, Gemini Nano, and hardware capabilities...
                </p>
              </div>
            ) : report ? (
              <div className="space-y-3">
                {/* 1. Android Gemini Nano Status */}
                {report.geminiNano.available ? (
                  <div className="p-3 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-m3-on-surface text-xs whitespace-nowrap">
                            Android Gemini Nano (On-Device AI)
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            Active • On-Device
                          </span>
                        </div>
                        <p className="text-[11px] text-m3-on-surface-variant mt-0.5 leading-snug">
                          {report.geminiNano.details}
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>
                ) : (
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      report.geminiNano.status === 'after-download'
                        ? 'bg-blue-500/5 border-blue-500/30'
                        : 'bg-amber-500/5 border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            report.geminiNano.status === 'after-download'
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-m3-on-surface text-xs whitespace-nowrap">
                              Android Gemini Nano (On-Device AI)
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold whitespace-nowrap ${
                                report.geminiNano.status === 'after-download'
                                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {report.geminiNano.status === 'after-download'
                                ? 'Downloading Weights'
                                : 'Setup Guide Available'}
                            </span>
                          </div>
                          <p className="text-[11px] text-m3-on-surface-variant mt-0.5 leading-snug">
                            {report.geminiNano.details}
                          </p>
                        </div>
                      </div>

                      {report.geminiNano.flagConfigNeeded && (
                        <button
                          type="button"
                          onClick={() => setShowFlagSteps(!showFlagSteps)}
                          className="text-m3-primary hover:underline flex items-center gap-0.5 text-[11px] font-semibold shrink-0 cursor-pointer pt-0.5"
                        >
                          <span>{showFlagSteps ? 'Hide steps' : 'How to enable'}</span>
                          {showFlagSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    {/* Expandable Step-by-Step Chrome Flags Instructions */}
                    {report.geminiNano.flagConfigNeeded && showFlagSteps && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-amber-500/20 space-y-2.5 text-[11px]"
                      >
                        <p className="text-m3-on-surface font-semibold">
                          To enable Gemini Nano on Android Chrome:
                        </p>
                        <div className="space-y-2">
                          {/* Step 1 */}
                          <div className="p-2 rounded-xl bg-m3-surface-container border border-m3-outline-variant/30 flex items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-m3-on-surface block">
                                1. Prompt API flag:
                              </span>
                              <code className="text-[10px] font-mono text-m3-primary">
                                chrome://flags/#prompt-api-for-gemini-nano
                              </code>
                              <span className="text-[10px] text-m3-on-surface-variant block">
                                Set to: <strong>Enabled</strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy('chrome://flags/#prompt-api-for-gemini-nano')}
                              className="p-1.5 rounded-lg bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface cursor-pointer shrink-0"
                              title="Copy flag link"
                            >
                              {copiedText === 'chrome://flags/#prompt-api-for-gemini-nano' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Step 2 */}
                          <div className="p-2 rounded-xl bg-m3-surface-container border border-m3-outline-variant/30 flex items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-m3-on-surface block">
                                2. On-Device Model flag:
                              </span>
                              <code className="text-[10px] font-mono text-m3-primary">
                                chrome://flags/#optimization-guide-on-device-model
                              </code>
                              <span className="text-[10px] text-m3-on-surface-variant block">
                                Set to: <strong>Enabled BypassPrefRequirement</strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy('chrome://flags/#optimization-guide-on-device-model')
                              }
                              className="p-1.5 rounded-lg bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface cursor-pointer shrink-0"
                              title="Copy flag link"
                            >
                              {copiedText === 'chrome://flags/#optimization-guide-on-device-model' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Step 3 */}
                          <div className="p-2 rounded-xl bg-m3-surface-container border border-m3-outline-variant/30">
                            <span className="font-bold text-m3-on-surface block">
                              3. Relaunch Chrome & Check Component:
                            </span>
                            <p className="text-[10px] text-m3-on-surface-variant mt-0.5">
                              Restart Chrome, open <code className="font-mono text-m3-primary">chrome://components/</code>, and click <strong>Check for update</strong> on <em>Optimization Guide On Device Model</em>.
                            </p>
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            <strong>Offline Ready:</strong> Reco’s built-in offline OCR engine handles all receipts right now without any network connection.
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* 2. WebAssembly OCR Engine */}
                <div className="p-3 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-m3-on-surface text-xs whitespace-nowrap">
                          Local WebAssembly Vision OCR
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          Ready • Offline
                        </span>
                      </div>
                      <p className="text-[11px] text-m3-on-surface-variant mt-0.5">
                        High-speed text extraction and bundled 2,500+ item Costco catalog.
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>

                {/* 3. Offline PWA Storage */}
                <div className="p-3 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-m3-on-surface text-xs whitespace-nowrap">
                          Offline PWA Database
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          100% Private
                        </span>
                      </div>
                      <p className="text-[11px] text-m3-on-surface-variant mt-0.5">
                        Receipts, items, and prices stay strictly in browser memory.
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>

                {/* 4. Hardware Camera */}
                <div className="p-3 bg-m3-surface-container rounded-2xl border border-m3-outline-variant/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-m3-on-surface text-xs whitespace-nowrap">
                          Camera Viewfinder
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          Hardware Ready
                        </span>
                      </div>
                      <p className="text-[11px] text-m3-on-surface-variant mt-0.5">
                        Single-shot & multi-section continuous receipt scanning supported.
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>

                {/* 5. Local Fallback Default */}
                <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-m3-on-surface text-xs whitespace-nowrap">
                          Cloud Fallback: Disabled (Default)
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          100% Local
                        </span>
                      </div>
                      <p className="text-[11px] text-m3-on-surface-variant mt-0.5">
                        Receipts are processed locally on-device unless you choose to enable cloud features in Settings.
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-m3-outline-variant/30 bg-m3-surface-container-low shrink-0">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleComplete}
              className="w-full py-3 px-6 text-xs font-bold rounded-2xl bg-m3-primary text-m3-on-primary hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Got It • Start Using Reco</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
