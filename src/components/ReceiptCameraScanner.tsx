import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Zap,
  ZapOff,
  Camera,
  Info,
  Layers,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CostcoReceipt } from '../types';
import { scanReceiptWithAiOrFallback, scanMultiSectionReceiptWithAiOrFallback } from '../utils/receiptScanner';
import { hapticFeedback } from '../utils/haptics';

interface ReceiptCameraScannerProps {
  isOpen: boolean;
  initialMode?: 'standard' | 'long';
  onClose: () => void;
  onReceiptScanned: (receipt: CostcoReceipt, summaryMessage?: string) => void;
  onOpenUploadModal?: () => void;
  onShowSnackbar?: (message: string, title?: string, type?: 'success' | 'error' | 'info') => void;
}

interface BoundaryRect {
  x: number; // Normalized 0..1
  y: number;
  width: number;
  height: number;
  confidence: number;
}

// Web Audio synthetic camera shutter sound
function playShutterSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    // AudioContext blocked or not allowed
  }
}

export function ReceiptCameraScanner({
  isOpen,
  initialMode = 'standard',
  onClose,
  onReceiptScanned,
  onShowSnackbar,
}: ReceiptCameraScannerProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionBlockedReason, setPermissionBlockedReason] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [captureMode, setCaptureMode] = useState<'manual' | 'auto'>('manual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [processProgress, setProcessProgress] = useState(0);

  // Multi-section / long receipt mode toggle within scanner (defaults to Normal / Standard receipt)
  const [isLongReceiptMode, setIsLongReceiptMode] = useState(initialMode === 'long');
  const [capturedSections, setCapturedSections] = useState<{ file: File; preview: string }[]>([]);

  // Detected receipt boundary state (in normalized percentages)
  const [boundary, setBoundary] = useState<BoundaryRect | null>({
    x: 0.22,
    y: 0.16,
    width: 0.56,
    height: 0.68,
    confidence: 0.9,
  });
  const [steadyCounter, setSteadyCounter] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Scanning...hold steady');

  // Video and canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Smoothed boundary ref for interpolation
  const smoothedBoundaryRef = useRef<BoundaryRect>({
    x: 0.22,
    y: 0.16,
    width: 0.56,
    height: 0.68,
    confidence: 0.9,
  });

  const lastStableBoundaryRef = useRef<BoundaryRect | null>(null);
  const isCapturingRef = useRef(false);

  // Initialize or re-request camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setPermissionBlockedReason(null);
    setIsRequestingCamera(true);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API is not supported on this browser.');
      }

      // Check permission query API if available
      try {
        if ('permissions' in navigator && (navigator.permissions as any).query) {
          const status = await navigator.permissions.query({ name: 'camera' as any });
          if (status.state === 'denied') {
            setPermissionBlockedReason(
              'Your browser has previously blocked camera access for this site. Browsers do not show a pop-up once blocked—you can re-enable it in Site Settings above or use the System Camera.'
            );
          }
        }
      } catch {
        // Permissions query not supported or failed
      }

      let stream: MediaStream;
      try {
        // Preferred high-resolution environment rear camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (firstErr) {
        console.warn('High-res camera constraints failed, attempting fallback constraints:', firstErr);
        // Fallback to simpler constraints to ensure maximum browser compatibility
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      trackRef.current = track || null;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setHasCameraPermission(true);
      setCameraError(null);
      setPermissionBlockedReason(null);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable in this environment:', err);
      setHasCameraPermission(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was blocked by your browser.');
        setPermissionBlockedReason(
          'Your browser remembered a previous "Block" setting. Browsers will not display the permission dialog again automatically once blocked.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No physical camera device was detected on your device.');
      } else {
        setCameraError(
          err.message || 'Hardware camera is not accessible in this window.'
        );
      }
    } finally {
      setIsRequestingCamera(false);
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    trackRef.current = null;
    setIsTorchOn(false);
  }, []);

  // Torch / Flash toggle
  const toggleTorch = async () => {
    if (!trackRef.current) {
      onShowSnackbar?.('Torch is active only when camera is connected');
      return;
    }
    try {
      const capabilities = (trackRef.current.getCapabilities?.() as any) || {};
      if (capabilities.torch) {
        const nextState = !isTorchOn;
        await (trackRef.current as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } else {
        onShowSnackbar?.('Torch / flash is not supported on this camera device');
      }
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Real-time boundary recognition loop
  useEffect(() => {
    if (!isOpen || isProcessing) return;

    let isSubscribed = true;

    const analyzeFrame = () => {
      if (!isSubscribed) return;

      if (hasCameraPermission && videoRef.current) {
        const video = videoRef.current;
        if (video.readyState >= 2 && !video.paused) {
          const width = video.videoWidth;
          const height = video.videoHeight;

          if (width > 0 && height > 0) {
            if (!hiddenCanvasRef.current) {
              hiddenCanvasRef.current = document.createElement('canvas');
            }
            const canvas = hiddenCanvasRef.current;
            const procW = 160;
            const procH = Math.round((height / width) * 160);
            canvas.width = procW;
            canvas.height = procH;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, procW, procH);
              const imgData = ctx.getImageData(0, 0, procW, procH);
              const data = imgData.data;

              let minX = procW;
              let maxX = 0;
              let minY = procH;
              let maxY = 0;
              let whitePixelCount = 0;

              const totalPixels = procW * procH;
              const step = 2;

              for (let y = 0; y < procH; y += step) {
                for (let x = 0; x < procW; x += step) {
                  const idx = (y * procW + x) * 4;
                  const r = data[idx];
                  const g = data[idx + 1];
                  const b = data[idx + 2];

                  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                  const maxC = Math.max(r, g, b);
                  const minC = Math.min(r, g, b);
                  const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

                  // High-luminance white paper boundary detection
                  if (lum > 142 && sat < 0.35) {
                    whitePixelCount++;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                  }
                }
              }

              const sampledTotal = totalPixels / (step * step);
              const coverageRatio = whitePixelCount / sampledTotal;

              const detectedW = maxX - minX;
              const detectedH = maxY - minY;

              const isValid =
                coverageRatio >= 0.12 &&
                coverageRatio <= 0.85 &&
                detectedW >= procW * 0.25 &&
                detectedH >= procH * 0.3 &&
                minX < maxX &&
                minY < maxY;

              if (isValid) {
                const targetX = Math.max(0.04, minX / procW);
                const targetY = Math.max(0.04, minY / procH);
                const targetW = Math.min(0.92, detectedW / procW);
                const targetH = Math.min(0.92, detectedH / procH);

                const cur = smoothedBoundaryRef.current;
                const lerpFactor = 0.3;
                cur.x += (targetX - cur.x) * lerpFactor;
                cur.y += (targetY - cur.y) * lerpFactor;
                cur.width += (targetW - cur.width) * lerpFactor;
                cur.height += (targetH - cur.height) * lerpFactor;
                cur.confidence = Math.min(1, cur.confidence + 0.1);

                setBoundary({ ...cur });
                setStatusMessage('Scanning...hold steady');

                const last = lastStableBoundaryRef.current;
                if (last) {
                  const delta =
                    Math.abs(cur.x - last.x) +
                    Math.abs(cur.y - last.y) +
                    Math.abs(cur.width - last.width) +
                    Math.abs(cur.height - last.height);

                  if (delta < 0.04) {
                    setSteadyCounter((prev) => {
                      const next = prev + 1;
                      if (next >= 22 && captureMode === 'auto' && !isCapturingRef.current) {
                        isCapturingRef.current = true;
                        triggerShutterCapture();
                      }
                      return next;
                    });
                  } else {
                    setSteadyCounter(0);
                  }
                }
                lastStableBoundaryRef.current = { ...cur };
              } else {
                const cur = smoothedBoundaryRef.current;
                const defaultX = 0.2;
                const defaultY = 0.14;
                const defaultW = 0.6;
                const defaultH = 0.72;

                cur.x += (defaultX - cur.x) * 0.1;
                cur.y += (defaultY - cur.y) * 0.1;
                cur.width += (defaultW - cur.width) * 0.1;
                cur.height += (defaultH - cur.height) * 0.1;
                cur.confidence = Math.max(0, cur.confidence - 0.05);

                setBoundary({ ...cur });
                setStatusMessage('Align receipt within frame');
                setSteadyCounter(0);
              }
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(analyzeFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(analyzeFrame);

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isOpen, hasCameraPermission, captureMode, isProcessing]);

  // Capture single frame as File
  const captureFrameAsFile = (): Promise<File | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video) return resolve(null);

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          const file = new File([blob], `receipt_scan_${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          resolve(file);
        },
        'image/jpeg',
        0.92
      );
    });
  };

  // Handle native camera file input change (direct device camera snapshot)
  const handleNativeDeviceCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isLongReceiptMode) {
      const previewUrl = URL.createObjectURL(file);
      setCapturedSections((prev) => [...prev, { file, preview: previewUrl }]);
      if (nativeCameraInputRef.current) nativeCameraInputRef.current.value = '';
      return;
    }

    setIsProcessing(true);
    setProcessProgress(20);
    setProcessStatus('Scanning receipt image...');

    try {
      const { receipt, engine } = await scanReceiptWithAiOrFallback(file, (msg, pct) => {
        setProcessStatus(msg);
        setProcessProgress(pct);
      });

      receipt.rawImagePreview = URL.createObjectURL(file);

      const isNano = receipt.notes?.includes('Gemini Nano') || engine === 'gemini';
      hapticFeedback('success');
      onReceiptScanned(
        receipt,
        isNano
          ? `On-Device Gemini parsed ${receipt.items.length} items from ${receipt.warehouseLocation}`
          : `On-Device engine scanned ${receipt.items.length} items from ${receipt.warehouseLocation}`
      );
      handleClose();
    } catch (err: any) {
      hapticFeedback('error');
      const msg = err.message || 'Failed to scan receipt. Please make sure the text is visible.';
      const isValidationErr =
        msg.includes('Costco') ||
        msg.includes('costco') ||
        msg.includes('Wholesale logo') ||
        msg.includes('Receipt rejected') ||
        msg.includes('FreshCo') ||
        msg.includes('freshco') ||
        msg.includes('non-Costco');

      if (isValidationErr) {
        console.warn('Scan validation rejection:', msg);
      } else {
        console.error('Scan error:', err);
      }
      setCameraError(msg);
    } finally {
      setIsProcessing(false);
      if (nativeCameraInputRef.current) nativeCameraInputRef.current.value = '';
    }
  };

  // Trigger Shutter (Manual or Auto)
  const triggerShutterCapture = async () => {
    if (isProcessing) return;
    playShutterSound();
    hapticFeedback('scan');

    const file = await captureFrameAsFile();
    if (!file) {
      isCapturingRef.current = false;
      return;
    }

    if (isLongReceiptMode) {
      const previewUrl = URL.createObjectURL(file);
      setCapturedSections((prev) => [...prev, { file, preview: previewUrl }]);
      isCapturingRef.current = false;
      setSteadyCounter(0);
      return;
    }

    // Standard single receipt flow
    setIsProcessing(true);
    setProcessProgress(20);
    setProcessStatus('Scanning receipt image...');

    try {
      const { receipt, engine } = await scanReceiptWithAiOrFallback(file, (msg, pct) => {
        setProcessStatus(msg);
        setProcessProgress(pct);
      });

      receipt.rawImagePreview = URL.createObjectURL(file);

      const isNano = receipt.notes?.includes('Gemini Nano') || engine === 'gemini';
      hapticFeedback('success');
      onReceiptScanned(
        receipt,
        isNano
          ? `On-Device Gemini parsed ${receipt.items.length} items from ${receipt.warehouseLocation}`
          : `On-Device engine scanned ${receipt.items.length} items from ${receipt.warehouseLocation}`
      );
      handleClose();
    } catch (err: any) {
      hapticFeedback('error');
      const msg = err.message || 'Failed to scan receipt. Please make sure the text is visible.';
      const isValidationErr =
        msg.includes('Costco') ||
        msg.includes('costco') ||
        msg.includes('Wholesale logo') ||
        msg.includes('Receipt rejected') ||
        msg.includes('FreshCo') ||
        msg.includes('freshco') ||
        msg.includes('non-Costco');

      if (isValidationErr) {
        console.warn('Scan validation rejection:', msg);
      } else {
        console.error('Scan error:', err);
      }
      setCameraError(msg);
    } finally {
      setIsProcessing(false);
      isCapturingRef.current = false;
      setSteadyCounter(0);
    }
  };

  // Finalize long receipt multi-section stitch
  const handleFinalizeLongReceipt = async () => {
    if (capturedSections.length === 0) return;
    setIsProcessing(true);
    setProcessProgress(15);
    setProcessStatus(`Stitching ${capturedSections.length} sections on-device...`);

    const files = capturedSections.map((s) => s.file);

    try {
      const { receipt } = await scanMultiSectionReceiptWithAiOrFallback(files, (msg, pct) => {
        setProcessStatus(msg);
        setProcessProgress(pct);
      });

      if (capturedSections[0]) {
        receipt.rawImagePreview = capturedSections[0].preview;
      }

      onReceiptScanned(
        receipt,
        `Stitched long receipt with ${receipt.items.length} items across ${files.length} sections`
      );
      handleClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to stitch sections. Please try again.';
      const isValidationErr =
        msg.includes('Costco') ||
        msg.includes('costco') ||
        msg.includes('Wholesale logo') ||
        msg.includes('Receipt rejected') ||
        msg.includes('FreshCo') ||
        msg.includes('freshco') ||
        msg.includes('non-Costco');

      if (isValidationErr) {
        console.warn('Long receipt validation rejection:', msg);
      } else {
        console.error('Long receipt error:', err);
      }
      setCameraError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setBoundary(null);
    setSteadyCounter(0);
    setIsProcessing(false);
    setCapturedSections([]);
    setCaptureMode('manual');
    setIsLongReceiptMode(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setCaptureMode('manual');
      setIsLongReceiptMode(initialMode === 'long');
      if (initialMode === 'standard') {
        setCapturedSections([]);
      }
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, initialMode, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="camera-scanner-modal"
        className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none"
      >
        {/* Hidden Native Camera Input for Direct Device Capture (bypasses WebRTC blocked permissions) */}
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeDeviceCapture}
          className="hidden"
          aria-hidden="true"
        />

        {/* Live Camera Viewfinder Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-950 flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />

          {/* DEDICATED PERMISSION RECOVERY OVERLAY (When permission is blocked or denied) */}
          {hasCameraPermission === false && (
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-between p-6 z-30 overflow-y-auto">
              {/* Top Bar with Close X */}
              <div className="w-full flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Camera Permissions</span>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Explainer Card */}
              <div className="max-w-sm w-full my-auto flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg">
                    <Camera className="w-8 h-8" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-black shadow-md">
                    !
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-white font-bold text-lg">
                    Camera Access Required
                  </h3>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    {permissionBlockedReason ||
                      cameraError ||
                      'Camera permission is required to stream and recognize receipt items live.'}
                  </p>
                </div>

                {/* Instant Action 1: Snap with Phone Camera (Works 100% on any mobile browser) */}
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Snap Photo with Phone Camera App</span>
                </button>

                {/* Action 2: Retry Browser Permission Request */}
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={isRequestingCamera}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isRequestingCamera ? 'animate-spin' : ''}`} />
                  <span>{isRequestingCamera ? 'Requesting Camera...' : 'Grant Live Permission & Retry'}</span>
                </button>

                {/* Step-by-step browser setting unlock guidance */}
                <div className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-3.5 text-left space-y-2">
                  <p className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>How to unblock in browser settings:</span>
                  </p>
                  <ol className="text-[11px] text-zinc-400 space-y-1 pl-4 list-decimal leading-normal">
                    <li>Tap the 🔒 lock or 🎛️ tune icon in your browser URL bar.</li>
                    <li>Tap <strong className="text-zinc-200">Permissions</strong> or <strong className="text-zinc-200">Site settings</strong>.</li>
                    <li>Change <strong className="text-zinc-200">Camera</strong> from Blocked to <strong className="text-emerald-400">Allow</strong>.</li>
                    <li>Return here and tap <strong className="text-blue-400">Grant Live Permission & Retry</strong>.</li>
                  </ol>
                </div>
              </div>

              {/* Bottom Close Button */}
              <div className="w-full max-w-sm pb-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer border border-white/10"
                >
                  <span>Close Scanner</span>
                </button>
              </div>
            </div>
          )}

          {/* Rule-of-Thirds Composition Grid Overlay (only when live camera is running) */}
          {hasCameraPermission && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div />
            </div>
          )}

          {/* RECOGNIZED RECEIPT BOUNDARY HIGHLIGHT OVERLAY */}
          {hasCameraPermission && boundary && (
            <motion.div
              initial={false}
              animate={{
                left: `${boundary.x * 100}%`,
                top: `${boundary.y * 100}%`,
                width: `${boundary.width * 100}%`,
                height: `${boundary.height * 100}%`,
              }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 24,
                mass: 0.6,
              }}
              className="absolute pointer-events-none z-10"
            >
              <div className="w-full h-full relative rounded-md border-[2.5px] border-blue-500 bg-blue-500/25 backdrop-blur-[0.5px] shadow-[0_0_24px_rgba(59,130,246,0.45)] transition-all">
                {/* Decorative Top Zigzag / Serrated Receipt Edge */}
                <div className="absolute -top-1 inset-x-0 h-1.5 flex justify-between overflow-hidden opacity-90">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-blue-400 rotate-45 transform -translate-y-1 shrink-0"
                    />
                  ))}
                </div>

                {/* Corner Bracket Accents */}
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-white rounded-tl-xs shadow-sm" />
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-white rounded-tr-xs shadow-sm" />
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-white rounded-bl-xs shadow-sm" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-white rounded-br-xs shadow-sm" />

                {/* Auto-capture Progress Pulse Halo */}
                {captureMode === 'auto' && steadyCounter > 0 && (
                  <div
                    className="absolute inset-0 rounded-md border-2 border-emerald-400 bg-emerald-400/20 transition-all duration-150"
                    style={{
                      opacity: Math.min(1, steadyCounter / 20),
                    }}
                  />
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* TOP HEADER CONTROLS (Only visible when camera is active) */}
        {hasCameraPermission && (
          <header className="relative z-20 pt-4 px-4 flex items-center justify-between pointer-events-auto">
            {/* Close X Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition-colors border border-white/10 cursor-pointer shadow-md"
              title="Close scanner"
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Top Pill Status Badge */}
            <div className="flex flex-col items-center select-none">
              <div className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-lg flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    steadyCounter > 8
                      ? 'bg-emerald-400 animate-ping'
                      : boundary
                      ? 'bg-blue-400 animate-pulse'
                      : 'bg-zinc-400'
                  }`}
                />
                <span>{statusMessage}</span>
              </div>
            </div>

            {/* Flash / Torch Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={toggleTorch}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors border cursor-pointer shadow-md ${
                isTorchOn
                  ? 'bg-amber-400 text-black border-amber-300'
                  : 'bg-black/50 text-white hover:bg-black/70 border-white/10'
              }`}
              title="Toggle Flash"
            >
              {isTorchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </motion.button>
          </header>
        )}

        {/* Captured Sections Carousel for Long Receipt Mode */}
        {hasCameraPermission && isLongReceiptMode && capturedSections.length > 0 && !cameraError && (
          <div className="relative z-20 px-4 py-2 bg-black/70 backdrop-blur-md border-y border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              {capturedSections.map((sec, idx) => (
                <div
                  key={idx}
                  className="relative w-12 h-16 rounded-md overflow-hidden border border-blue-400 bg-zinc-900 shrink-0"
                >
                  <img src={sec.preview} alt={`Section ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute top-0.5 left-0.5 px-1 bg-black/80 rounded text-[9px] text-white font-bold">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      hapticFeedback('delete');
                      setCapturedSections((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="absolute bottom-0.5 right-0.5 p-0.5 bg-black/80 hover:bg-red-600 rounded text-white cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleFinalizeLongReceipt}
              className="ml-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Done ({capturedSections.length})</span>
            </motion.button>
          </div>
        )}

        {/* BOTTOM CONTROLS (Shutter, Mode Toggle, Privacy - only when camera permission granted) */}
        {hasCameraPermission && (
          <footer className="relative z-20 pb-8 pt-4 px-6 flex flex-col items-center bg-gradient-to-t from-black via-black/80 to-transparent">
            {/* Shutter Button Row */}
            <div className="w-full max-w-xs flex items-center justify-center px-4 mb-4 relative">
              {/* Main Shutter Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={triggerShutterCapture}
                disabled={isProcessing}
                className="relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 cursor-pointer transition-transform active:scale-95 group shadow-2xl"
                title={isLongReceiptMode ? 'Snap section' : 'Snap receipt'}
              >
                <div className="w-full h-full bg-white rounded-full transition-transform group-hover:scale-95 group-active:scale-90 flex items-center justify-center">
                  {isLongReceiptMode ? (
                    <Plus className="w-6 h-6 text-zinc-900" />
                  ) : (
                    <Camera className="w-6 h-6 text-zinc-900 opacity-60" />
                  )}
                </div>
              </motion.button>

              {/* Section count badge for long receipt mode */}
              {isLongReceiptMode && capturedSections.length > 0 && (
                <div className="absolute right-4 w-12 h-12 rounded-full bg-zinc-800/90 text-white flex flex-col items-center justify-center border border-white/20 text-[10px] font-bold shadow-lg">
                  <span>{capturedSections.length}</span>
                  <span className="text-[8px] text-zinc-400">secs</span>
                </div>
              )}
            </div>

            {/* Manual vs Auto Capture Segmented Pill */}
            <div className="bg-zinc-900/90 border border-white/15 p-1 rounded-full flex items-center gap-1 shadow-md mb-2.5">
              <button
                type="button"
                onClick={() => setCaptureMode('manual')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  captureMode === 'manual'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setCaptureMode('auto')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  captureMode === 'auto'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Auto capture
              </button>
            </div>

            {/* Mode Switcher: Standard vs Long Receipt (positioned below Manual/Auto) */}
            <div className="mb-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLongReceiptMode(false)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  !isLongReceiptMode
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Standard Receipt
              </button>
              <button
                type="button"
                onClick={() => setIsLongReceiptMode(true)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  isLongReceiptMode
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Long Receipt (Stitch)</span>
              </button>
            </div>

            {/* Privacy Disclaimer */}
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-medium select-none">
              <span>Reco will have access only to the images you scan</span>
              <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            </div>
          </footer>
        )}

        {/* Processing Spinner Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4 pointer-events-auto">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <Sparkles className="w-6 h-6 text-blue-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-1.5 max-w-xs">
              <h3 className="text-white font-bold text-sm">{processStatus}</h3>
              <p className="text-zinc-400 text-xs">
                Analyzing receipt lines & SKUs locally
              </p>
            </div>
            <div className="w-48 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${processProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Active Scan Rejection / Validation Error Alert Card */}
        {cameraError && hasCameraPermission === true && !isProcessing && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900 border border-red-500/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 relative z-50"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/15 text-red-400 mx-auto flex items-center justify-center border border-red-500/20 shadow-inner">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">Costco Receipts Only</h3>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  {cameraError}
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCameraError(null);
                    setCapturedSections([]);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Scan a Costco Receipt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCameraError(null);
                    setCapturedSections([]);
                    handleClose();
                  }}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full text-xs font-semibold transition-colors cursor-pointer border border-white/10"
                >
                  Close Scanner
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
