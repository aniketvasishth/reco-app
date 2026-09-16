import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Send,
  Smartphone,
  Cpu,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialError?: string | null;
}

export function FeedbackModal({ isOpen, onClose, initialError }: FeedbackModalProps) {
  const [deviceModel, setDeviceModel] = useState('');
  const [androidVersion, setAndroidVersion] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-detect device and OS version on open using modern Client Hints with fallback
  useEffect(() => {
    if (!isOpen) return;

    const detectDeviceTelemetry = async () => {
      let detectedDevice = '';
      let detectedOS = '';

      // 1. Try modern User-Agent Client Hints API (supported in Chromium/Android Chrome)
      const nav = navigator as any;
      if (nav.userAgentData && typeof nav.userAgentData.getHighEntropyValues === 'function') {
        try {
          const hints = await nav.userAgentData.getHighEntropyValues([
            'model',
            'platform',
            'platformVersion',
            'architecture',
            'fullVersionList',
          ]);

          if (hints.model) {
            detectedDevice = hints.model;
            // Clean up Pixel model formatting if needed
            if (/Pixel/i.test(hints.model) && !/Google/i.test(hints.model)) {
              detectedDevice = `Google ${hints.model}`;
            }
          }

          if (hints.platformVersion) {
            // In Android, platformVersion corresponds to the actual Android OS release (e.g. "17.0.0" -> Android 17)
            const majorVersion = hints.platformVersion.split('.')[0];
            const platformName = hints.platform || 'Android';
            if (platformName.toLowerCase() === 'android') {
              detectedOS = `Android ${majorVersion || hints.platformVersion}`;
            } else {
              detectedOS = `${platformName} ${hints.platformVersion}`;
            }
          }
        } catch (err) {
          console.warn('Client Hints high entropy extraction failed:', err);
        }
      }

      // 2. Fallback to standard User Agent parsing
      const ua = navigator.userAgent;

      if (!detectedOS) {
        const androidMatch = ua.match(/Android\s+([\d.]+)/i);
        if (androidMatch && androidMatch[1]) {
          detectedOS = `Android ${androidMatch[1]}`;
        } else if (/iPhone|iPad|iPod/i.test(ua)) {
          const iosMatch = ua.match(/OS\s+([\d_]+)/i);
          detectedOS = iosMatch ? `iOS ${iosMatch[1].replace(/_/g, '.')}` : 'iOS Device';
        } else if (/Macintosh|Mac OS/i.test(ua)) {
          detectedOS = 'macOS';
        } else if (/Windows/i.test(ua)) {
          detectedOS = 'Windows';
        } else {
          detectedOS = 'Web Browser';
        }
      }

      if (!detectedDevice) {
        if (/Pixel\s*9\s*Pro/i.test(ua)) {
          detectedDevice = 'Google Pixel 9 Pro';
        } else if (/Pixel\s*9/i.test(ua)) {
          detectedDevice = 'Google Pixel 9';
        } else if (/Pixel\s*8/i.test(ua)) {
          detectedDevice = 'Google Pixel 8';
        } else if (/Pixel/i.test(ua)) {
          const pixelMatch = ua.match(/Pixel\s*[^;)]*/i);
          detectedDevice = pixelMatch ? `Google ${pixelMatch[0]}` : 'Google Pixel';
        } else if (/Samsung|SM-[A-Z0-9]+/i.test(ua)) {
          const samMatch = ua.match(/SM-[A-Z0-9]+/i);
          detectedDevice = samMatch ? `Samsung Galaxy (${samMatch[0]})` : 'Samsung Galaxy';
        } else if (/OnePlus/i.test(ua)) {
          detectedDevice = 'OnePlus';
        } else if (/Xiaomi|Redmi/i.test(ua)) {
          detectedDevice = 'Xiaomi / Redmi';
        } else if (/iPhone/i.test(ua)) {
          detectedDevice = 'Apple iPhone';
        } else {
          // Avoid raw "Linux armv81"
          const isMobile = /Android|iPhone|iPad|Mobile/i.test(ua);
          detectedDevice = isMobile ? 'Mobile Phone' : 'Desktop / PC';
        }
      }

      setDeviceModel(detectedDevice);
      setAndroidVersion(detectedOS);
    };

    detectDeviceTelemetry();

    // Populate initial error if passed
    if (initialError) {
      setErrorDetails(initialError);
    }
  }, [isOpen, initialError]);

  // Handle screenshot selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);
  };

  // Handle clipboard paste for screenshots
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const item = e.clipboardData?.files?.[0];
      if (item && item.type.startsWith('image/')) {
        setScreenshotFile(item);
        const url = URL.createObjectURL(item);
        setScreenshotPreview(url);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const recipientEmail = 'aniketvasishth@gmail.com';

  const generateReportBody = () => {
    return [
      `=== COSTCO RECEIPT SEARCHER - BUG & FEEDBACK REPORT ===`,
      ``,
      `User Device / Phone: ${deviceModel || 'Not provided'}`,
      `Android OS Version: ${androidVersion || 'Not detected'}`,
      `Browser / User Agent: ${navigator.userAgent}`,
      `Date & Time: ${new Date().toISOString()}`,
      `Has Screenshot Attached: ${screenshotFile ? `Yes (${screenshotFile.name})` : 'No'}`,
      ``,
      `--- ERROR / ISSUE DETAILS ---`,
      errorDetails || 'No details entered by user.',
      ``,
      `=======================================================`,
    ].join('\n');
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(
      `Costco Receipt Searcher Feedback: ${errorDetails.slice(0, 40) || 'Issue Report'}`
    );
    const body = encodeURIComponent(
      `${generateReportBody()}\n\n[Note: If you took a screenshot, please attach ${screenshotFile ? screenshotFile.name : 'your screenshot image'} directly to this email message.]`
    );

    window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(generateReportBody());
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 3000);
    } catch {
      // fallback
    }
  };

  return (
    <div
      id="feedback-modal-backdrop"
      className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="feedback-modal-container"
        className="bg-m3-surface-container text-m3-on-surface rounded-[28px] border border-m3-outline-variant/60 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-m3-outline-variant/40 flex items-center justify-between bg-m3-surface-container-high">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-m3-on-surface">Send Feedback / Report Issue</h2>
              <p className="text-[11px] text-m3-on-surface-variant">
                Direct to developer: <span className="text-m3-primary font-mono">{recipientEmail}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-m3-on-surface-variant hover:text-m3-on-surface rounded-full hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <div className="p-6 space-y-4 text-xs">
          {/* Diagnostic Auto-capture Banner */}
          <div className="p-3.5 bg-m3-surface-container-low border border-m3-outline-variant/50 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-m3-on-surface">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                Auto-Captured Device Telemetry
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
              <div>
                <label className="text-m3-on-surface-variant block mb-1 flex items-center gap-1 font-medium">
                  <Smartphone className="w-3 h-3 text-m3-primary" />
                  <span>Phone / Device Model</span>
                </label>
                <input
                  type="text"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder="e.g. Pixel 8, Galaxy S24"
                  className="w-full px-3 py-2 bg-m3-surface-container-highest border border-m3-outline-variant/60 rounded-xl text-m3-on-surface focus:outline-none focus:border-m3-primary"
                />
              </div>

              <div>
                <label className="text-m3-on-surface-variant block mb-1 flex items-center gap-1 font-medium">
                  <Cpu className="w-3 h-3 text-m3-primary" />
                  <span>Android OS Version</span>
                </label>
                <input
                  type="text"
                  value={androidVersion}
                  onChange={(e) => setAndroidVersion(e.target.value)}
                  placeholder="e.g. Android 14"
                  className="w-full px-3 py-2 bg-m3-surface-container-highest border border-m3-outline-variant/60 rounded-xl text-m3-on-surface focus:outline-none focus:border-m3-primary"
                />
              </div>
            </div>
          </div>

          {/* Error Details */}
          <div>
            <label className="block font-semibold text-m3-on-surface mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>What went wrong or needs improvement?</span>
            </label>
            <textarea
              rows={4}
              value={errorDetails}
              onChange={(e) => setErrorDetails(e.target.value)}
              placeholder="Describe the error or discrepancy (e.g. receipt failed to parse, price mismatch on item #12345, card not showing)..."
              className="w-full p-3 bg-m3-surface-container-highest border border-m3-outline-variant/60 rounded-2xl text-m3-on-surface placeholder:text-m3-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-m3-primary/30 focus:border-m3-primary font-sans"
            />
          </div>

          {/* Screenshot Upload (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-m3-on-surface flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-m3-primary" />
                <span>Screenshot of Error (Optional)</span>
              </label>
              {screenshotPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setScreenshotFile(null);
                    setScreenshotPreview(null);
                  }}
                  className="text-m3-error hover:opacity-80 flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {!screenshotPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-m3-surface-container-low hover:bg-m3-surface-container-high border border-dashed border-m3-outline-variant/70 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-m3-on-surface-variant"
              >
                <Upload className="w-4 h-4 text-m3-on-surface-variant" />
                <span>Click or paste screenshot image from clipboard</span>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-m3-outline-variant/60 bg-m3-surface-container-lowest p-2.5 flex items-center gap-3">
                <img
                  src={screenshotPreview}
                  alt="Error preview"
                  className="w-16 h-16 object-cover rounded-xl border border-m3-outline-variant/40 shrink-0"
                />
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-m3-on-surface truncate">
                    {screenshotFile?.name || 'Screenshot attached'}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Ready to attach in your email app
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recipient Details */}
          <div className="pt-2 border-t border-m3-outline-variant/40 flex items-center justify-between text-[11px] text-m3-on-surface-variant">
            <span>Recipient:</span>
            <span className="font-mono text-m3-primary font-semibold">{recipientEmail}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              onClick={handleSendEmail}
              className="flex-1 py-3 px-4 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary font-semibold rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Send via Email App</span>
            </button>

            <button
              onClick={handleCopyReport}
              className="py-3 px-5 bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface font-semibold rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer border border-m3-outline-variant/60 active:scale-98"
            >
              {copiedReport ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-m3-on-surface-variant" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
