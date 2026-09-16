import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getActivePalette } from '../utils/themePalettes';

interface SplashScreenProps {
  onComplete: () => void;
  isDarkMode?: boolean;
  activePaletteId?: string;
}

export function SplashScreen({ onComplete, isDarkMode = true, activePaletteId }: SplashScreenProps) {
  const [stage, setStage] = useState<'enter' | 'pulse' | 'exit'>('enter');

  // Compute theme colors dynamically from the active Android Material 3 Monet palette
  const activePalette = getActivePalette(activePaletteId);
  const tokens = isDarkMode ? activePalette.dark : activePalette.light;

  useEffect(() => {
    // Stage 1: Fast enter & subtle pulse
    const pulseTimer = setTimeout(() => {
      setStage('pulse');
    }, 450);

    // Stage 2: Clean snappy exit fade
    const exitTimer = setTimeout(() => {
      setStage('exit');
    }, 1050);

    // Stage 3: Complete and unmount
    const finishTimer = setTimeout(() => {
      onComplete();
    }, 1300);

    return () => {
      clearTimeout(pulseTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  // Direct colors with CSS variable fallbacks for guaranteed high contrast in both themes
  const bgColor = tokens.background;
  const textColor = tokens.onBackground;
  const accentColor = tokens.primary;
  const subtextColor = tokens.onSurfaceVariant;

  return (
    <AnimatePresence>
      {stage !== 'exit' && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none cursor-default"
          style={{
            backgroundColor: bgColor,
            color: textColor,
          }}
        >
          {/* Centered Brand Signature matching Screenshot with high-contrast text */}
          <div className="flex flex-col items-center justify-center space-y-4 px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center space-x-2"
            >
              <h1
                className="text-5xl md:text-6xl font-black tracking-tight flex items-center"
                style={{ color: textColor }}
              >
                <span>Rec</span>
                <span className="relative" style={{ color: accentColor }}>
                  o
                  {/* Subtle rotating accent ring */}
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute -right-3.5 top-1.5 w-4 h-4 border-2 border-t-transparent rounded-full pointer-events-none"
                    style={{
                      borderColor: accentColor,
                      borderTopColor: 'transparent',
                      opacity: isDarkMode ? 0.85 : 0.75,
                    }}
                  />
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ delay: 0.18, duration: 0.35 }}
              className="text-xs font-semibold tracking-[0.22em] uppercase font-mono"
              style={{ color: subtextColor }}
            >
              Wholesale Receipt Search
            </motion.p>
          </div>

          {/* Bottom subtle status bar indicator matching Screenshot */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="absolute bottom-10 flex flex-col items-center space-y-2 text-[10px] uppercase font-mono tracking-widest"
            style={{ color: subtextColor }}
          >
            <div className="flex items-center space-x-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full animate-ping"
                style={{ backgroundColor: accentColor }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full opacity-60"
                style={{ backgroundColor: accentColor }}
              />
            </div>
            <span>On-Device Index</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
