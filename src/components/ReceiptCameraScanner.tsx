import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Zap,
  ZapOff,
  Image as ImageIcon,
  Camera,
  Info,
  Layers,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CostcoReceipt } from '../types';
import { scanReceiptWithAiOrFallback, scanMultiSectionReceiptWithAiOrFallback } from '../utils/receiptScanner';

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

// Simple Web Audio synthetic camera shutter sound
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
  onOpenUploadModal,
  onShowSnackbar,
}: ReceiptCameraScannerProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [captureMode, setCaptureMode] = useState<'manual' | 'auto'>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [processProgress, setProcessProgress] = useState(0);

  // Simulation mode for sandbox environments where camera stream is blocked in iframe
  const [isSimulatedStream, setIsSimulatedStream] = useState(false);

  // Multi-section / long receipt mode toggle within scanner
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
  const filePickerRef = useRef<HTMLInputElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsSimulatedStream(false);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      trackRef.current = track || null;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setHasCameraPermission(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable in this environment:', err);
      setHasCameraPermission(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was not granted. You can use the Interactive Simulator or choose photos from your gallery.'
          : 'Hardware camera stream is not accessible in this browser window. Try the Interactive Simulator below.'
      );
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
      onShowSnackbar?.('Torch is active only when hardware camera is connected');
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

      if (isSimulatedStream) {
        // Simulated natural camera breathing / subtle micro-movement
        const time = Date.now() * 0.002;
        const targetX = 0.22 + Math.sin(time) * 0.008;
        const targetY = 0.16 + Math.cos(time * 0.8) * 0.006;
        const targetW = 0.56 + Math.sin(time * 0.5) * 0.005;
        const targetH = 0.68;

        const cur = smoothedBoundaryRef.current;
        cur.x += (targetX - cur.x) * 0.1;
        cur.y += (targetY - cur.y) * 0.1;
        cur.width += (targetW - cur.width) * 0.1;
        cur.height += (targetH - cur.height) * 0.1;
        cur.confidence = 0.95;

        setBoundary({ ...cur });
        setStatusMessage('Scanning...hold steady');

        if (captureMode === 'auto' && !isCapturingRef.current) {
          setSteadyCounter((prev) => {
            const next = prev + 1;
            if (next >= 35) {
              isCapturingRef.current = true;
              triggerShutterCapture();
            }
            return next;
          });
        }
      } else if (hasCameraPermission && videoRef.current) {
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
  }, [isOpen, hasCameraPermission, isSimulatedStream, captureMode, isProcessing]);

  // Capture single frame as File
  const captureFrameAsFile = (): Promise<File | null> => {
    return new Promise((resolve) => {
      if (isSimulatedStream) {
        // Draw high-res simulated receipt image to canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1600;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        // Wood desk background
        ctx.fillStyle = '#6b4f3b';
        ctx.fillRect(0, 0, 1200, 1600);

        // Receipt white body
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(260, 200, 680, 1200);

        // Thermal receipt content
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('COSTCO WHOLESALE', 600, 280);
        ctx.font = '22px monospace';
        ctx.fillText('Warehouse #0471 • Richmond, CA', 600, 320);
        ctx.fillText('09/14/2026  14:32  Mbr: 11192837465', 600, 355);

        ctx.textAlign = 'left';
        ctx.font = '24px monospace';
        const items = [
          ['84572 KIRKLAND EVOO 2L', '18.99 A'],
          ['318942 ORGANIC EGGS 24PK', '8.49 A'],
          ['712004 ROTISSERIE CHICKEN', '4.99 A'],
          ['129845 PAPER TOWELS 12PK', '21.99 A'],
          ['552190 ORG RASPBERRIES', '6.99 A'],
          ['901243 ROASTED ALMONDS', '12.49 A'],
        ];

        let y = 440;
        items.forEach(([desc, price]) => {
          ctx.fillText(desc, 300, y);
          ctx.fillText(price, 820, y);
          y += 50;
        });

        y += 40;
        ctx.fillText('SUBTOTAL:                  $73.94', 300, y);
        y += 45;
        ctx.fillText('TAX:                        $2.10', 300, y);
        y += 45;
        ctx.font = 'bold 28px monospace';
        ctx.fillText('TOTAL:                     $76.04', 300, y);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(null);
            const file = new File([blob], `simulated_receipt_${Date.now()}.jpg`, {
              type: 'image/jpeg',
            });
            resolve(file);
          },
          'image/jpeg',
          0.92
        );
        return;
      }

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

  // Trigger Shutter (Manual or Auto)
  const triggerShutterCapture = async () => {
    if (isProcessing) return;
    playShutterSound();
    try {
      navigator.vibrate?.(50);
    } catch {}

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

    // Process single receipt with Gemini AI Vision
    setIsProcessing(true);
    setProcessProgress(15);
    setProcessStatus('Analyzing receipt boundary and parsing items with Gemini AI...');

    try {
      const { receipt, engine } = await scanReceiptWithAiOrFallback(file, (msg, pct) => {
        setProcessStatus(msg);
        setProcessProgress(pct);
      });

      receipt.rawImagePreview = URL.createObjectURL(file);

      onReceiptScanned(
        receipt,
        engine === 'gemini'
          ? `Gemini AI parsed ${receipt.items.length} items from ${receipt.warehouseLocation}`
          : `Scanned ${receipt.items.length} items from ${receipt.warehouseLocation}`
      );
      handleClose();
    } catch (err: any) {
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
    setProcessStatus(`Stitching ${capturedSections.length} sections with Gemini AI Vision...`);

    const files = capturedSections.map((s) => s.file);

    try {
      const { receipt, engine } = await scanMultiSectionReceiptWithAiOrFallback(files, (msg, pct) => {
        setProcessStatus(msg);
        setProcessProgress(pct);
      });

      if (capturedSections[0]) {
        receipt.rawImagePreview = capturedSections[0].preview;
      }

      onReceiptScanned(
        receipt,
        engine === 'gemini'
          ? `Gemini AI stitched ${receipt.items.length} items across ${files.length} sections!`
          : `Stitched long receipt with ${receipt.items.length} items`
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

  // File gallery input handler
  const handleGallerySelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);

    if (fileList.length > 1) {
      const arr = fileList.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setCapturedSections(arr);
      setIsLongReceiptMode(true);
      return;
    }

    const file = fileList[0];
    setIsProcessing(true);
    setProcessProgress(20);
    setProcessStatus('Scanning selected photo with Gemini AI...');

    scanReceiptWithAiOrFallback(file, (msg, pct) => {
      setProcessStatus(msg);
      setProcessProgress(pct);
    })
      .then(({ receipt, engine }) => {
        receipt.rawImagePreview = URL.createObjectURL(file);
        onReceiptScanned(
          receipt,
          engine === 'gemini'
            ? `Gemini AI parsed ${receipt.items.length} items from ${receipt.warehouseLocation}`
            : `Scanned ${receipt.items.length} items from ${receipt.warehouseLocation}`
        );
        handleClose();
      })
      .catch((err: any) => {
        const msg = err.message || 'Could not parse selected photo';
        const isValidationErr =
          msg.includes('Costco') ||
          msg.includes('costco') ||
          msg.includes('Wholesale logo') ||
          msg.includes('Receipt rejected') ||
          msg.includes('FreshCo') ||
          msg.includes('freshco') ||
          msg.includes('non-Costco');

        if (isValidationErr) {
          console.warn('Gallery photo validation rejection:', msg);
        } else {
          console.error('Gallery photo parse error:', err);
        }
        setCameraError(msg);
        setIsProcessing(false);
      });
  };

  const handleClose = () => {
    stopCamera();
    setBoundary(null);
    setSteadyCounter(0);
    setIsProcessing(false);
    setCapturedSections([]);
    setIsSimulatedStream(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
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
        {/* Hidden gallery file input */}
        <input
          ref={filePickerRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleGallerySelected}
        />

        {/* Live Camera Viewfinder Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-950 flex items-center justify-center">
          {isSimulatedStream ? (
            /* Interactive Simulated Camera View (matching user's screenshot with wooden desk & white receipt) */
            <div className="relative w-full h-full bg-[#5c432d] flex items-center justify-center overflow-hidden">
              {/* Subtle wood grain styling */}
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.1) 40px, rgba(0,0,0,0.1) 80px)',
                }}
              />

              {/* Physical White Paper Receipt on the Table */}
              <div className="w-[56%] h-[68%] bg-white rounded-xs shadow-2xl p-4 flex flex-col justify-between border border-zinc-200 text-zinc-800 select-none pointer-events-none transform -rotate-0.5">
                <div className="space-y-1 text-center">
                  <div className="text-[10px] tracking-widest uppercase font-black">COSTCO WHOLESALE</div>
                  <div className="text-[7px] text-zinc-500">Warehouse #0471 • Richmond, CA</div>
                  <div className="text-[6px] text-zinc-400">09/14/2026  14:32  Mbr: 11192837465</div>
                  <div className="border-b border-dashed border-zinc-300 my-1" />
                </div>

                <div className="space-y-1 font-mono text-[7px]">
                  <div className="flex justify-between font-bold">
                    <span>84572 KIRKLAND EVOO 2L</span>
                    <span>$18.99 A</span>
                  </div>
                  <div className="flex justify-between">
                    <span>318942 ORGANIC EGGS 24PK</span>
                    <span>$8.49 A</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>712004 ROTISSERIE CHICKEN</span>
                    <span>$4.99 A</span>
                  </div>
                  <div className="flex justify-between">
                    <span>129845 PAPER TOWELS 12PK</span>
                    <span>$21.99 A</span>
                  </div>
                  <div className="flex justify-between">
                    <span>552190 ORG RASPBERRIES</span>
                    <span>$6.99 A</span>
                  </div>
                  <div className="flex justify-between">
                    <span>901243 ROASTED ALMONDS</span>
                    <span>$12.49 A</span>
                  </div>
                </div>

                <div className="space-y-0.5 pt-2 border-t border-dashed border-zinc-300 text-[8px] font-mono">
                  <div className="flex justify-between text-zinc-500">
                    <span>SUBTOTAL</span>
                    <span>$73.94</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>TAX</span>
                    <span>$2.10</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-zinc-900 text-[10px] pt-0.5">
                    <span>TOTAL</span>
                    <span>$76.04</span>
                  </div>
                  <div className="text-center text-[6px] text-zinc-400 pt-1 tracking-widest">
                    |||||| | |||||||| || ||||||||| ||||
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
          )}

          {/* Fallback Screen if camera is blocked or permission denied */}
          {hasCameraPermission === false && !isSimulatedStream && (
            <div className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg">
                <Camera className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h3 className="text-white font-bold text-base">Camera Scanner Helper</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {cameraError || 'Hardware camera is blocked by iframe or browser permissions.'}
                </p>
              </div>

              {/* Simulation Mode Button */}
              <div className="flex flex-col gap-2.5 w-full max-w-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSimulatedStream(true);
                    setHasCameraPermission(true);
                    setStatusMessage('Scanning...hold steady');
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Launch Live Scanner Simulation</span>
                </button>

                <button
                  type="button"
                  onClick={() => filePickerRef.current?.click()}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-full text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-white/10"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Choose Photo from Gallery</span>
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-2 text-zinc-400 hover:text-zinc-200 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera Connection</span>
                </button>
              </div>
            </div>
          )}

          {/* Rule-of-Thirds Composition Grid Overlay (Subtle 3x3, matching Screenshot) */}
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

          {/* RECOGNIZED RECEIPT BOUNDARY HIGHLIGHT OVERLAY (Exact match to User Screenshot) */}
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
              {/* Vibrant Blue Tint Fill and Glowing High-Contrast Border */}
              <div className="w-full h-full relative rounded-md border-[2.5px] border-blue-500 bg-blue-500/25 backdrop-blur-[0.5px] shadow-[0_0_24px_rgba(59,130,246,0.45)] transition-all">
                {/* Decorative Top Zigzag / Serrated Receipt Edge (Matching Costco Thermal Paper) */}
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

        {/* TOP HEADER CONTROLS (X close, Status Pill, Flash toggle) */}
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

          {/* Top Pill Status Badge (e.g. "Scanning...hold steady") */}
          <div className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-lg flex items-center gap-1.5 select-none">
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

        {/* Captured Sections Carousel for Long Receipt Mode */}
        {isLongReceiptMode && capturedSections.length > 0 && !cameraError && (
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
                      setCapturedSections((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="absolute bottom-0.5 right-0.5 p-0.5 bg-black/80 hover:bg-red-600 rounded text-white"
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

        {/* BOTTOM CONTROLS (Shutter, Gallery, Mode Toggle, Privacy) */}
        <footer className="relative z-20 pb-8 pt-4 px-6 flex flex-col items-center bg-gradient-to-t from-black via-black/80 to-transparent">
          {/* Mode Switcher: Single vs Long Receipt */}
          <div className="mb-4 flex items-center gap-2">
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

          {/* Shutter and Primary Buttons Row */}
          <div className="w-full max-w-xs flex items-center justify-between px-4 mb-4">
            {/* Gallery Picker Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={() => filePickerRef.current?.click()}
              className="w-12 h-12 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center justify-center border border-white/20 shadow-lg cursor-pointer"
              title="Pick photo from gallery"
            >
              <ImageIcon className="w-5 h-5" />
            </motion.button>

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

            {/* Upload Modal Shortcut or Section Count */}
            {isLongReceiptMode ? (
              <div className="w-12 h-12 rounded-full bg-zinc-800/80 text-white flex flex-col items-center justify-center border border-white/20 text-[10px] font-bold">
                <span>{capturedSections.length}</span>
                <span className="text-[8px] text-zinc-400">secs</span>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={() => {
                  handleClose();
                  onOpenUploadModal?.();
                }}
                className="w-12 h-12 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center justify-center border border-white/20 shadow-lg cursor-pointer"
                title="JSON / CSV / Demo Uploads"
              >
                <Layers className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          {/* Manual vs Auto Capture Segmented Pill (Matching Screenshot) */}
          <div className="bg-zinc-900/90 border border-white/15 p-1 rounded-full flex items-center gap-1 shadow-md mb-3">
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

          {/* Privacy Disclaimer (Matching User Screenshot) */}
          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-medium select-none">
            <span>Reco will have access only to the images you scan</span>
            <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </div>
        </footer>

        {/* Processing Spinner Overlay (Placed at root level so it sits cleanly on top of all controls) */}
        {isProcessing && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4 pointer-events-auto">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <Sparkles className="w-6 h-6 text-blue-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-1.5 max-w-xs">
              <h3 className="text-white font-bold text-sm">{processStatus}</h3>
              <p className="text-zinc-400 text-xs">
                Gemini AI Vision is analyzing receipt lines, SKUs, and totals
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

        {/* Active Scan Rejection / Validation Error Alert Card (e.g. Non-Costco receipt) */}
        {/* Placed at root level at z-50 to ensure it is ALWAYS in front of the horizontal bar and controls */}
        {cameraError && hasCameraPermission !== false && !isProcessing && (
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
