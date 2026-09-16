import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Moon, Sun, Smartphone, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import {
  MATERIAL_PALETTES,
  MaterialPalette,
  DEFAULT_PALETTE_ID,
} from '../utils/themePalettes';
import { ThemeMode } from '../types';

interface ThemePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePaletteId: string;
  onSelectPalette: (paletteId: string) => void;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  isDarkMode: boolean;
  isImmersive?: boolean;
  onToggleImmersive?: () => void;
}

export function ThemePaletteModal({
  isOpen,
  onClose,
  activePaletteId,
  onSelectPalette,
  themeMode,
  onThemeModeChange,
  isDarkMode,
  isImmersive = false,
  onToggleImmersive,
}: ThemePaletteModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal / Bottom Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0.9 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg bg-m3-surface-container rounded-t-3xl sm:rounded-3xl shadow-2xl border border-m3-outline-variant/30 overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Top Drag handle on mobile */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-m3-outline-variant/60" />
          </div>

          {/* Header */}
          <div className="px-6 pt-3 pb-3 flex items-center justify-between border-b border-m3-outline-variant/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-m3-primary-container text-m3-on-primary-container">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-m3-on-surface">Wallpaper & Colors</h2>
                <p className="text-xs text-m3-on-surface-variant">Material You Dynamic System</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {/* Explanatory banner matching Pixel Wallpaper & style */}
            <div className="p-4 rounded-2xl bg-m3-surface-container-high border border-m3-outline-variant/25">
              <p className="text-xs sm:text-sm text-m3-on-surface-variant leading-relaxed">
                Icons, text, and accents adapt dynamically to match your Android wallpaper colors and system status bar.
              </p>
            </div>

            {/* Android Wallpaper Color Palettes (Circle Chips matching Screenshot 1) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-m3-primary">
                  Wallpaper Palettes
                </h3>
                <span className="text-[11px] font-medium text-m3-on-surface-variant">
                  {MATERIAL_PALETTES.find((p) => p.id === activePaletteId)?.name}
                </span>
              </div>

              {/* 7 Circular Dual-Tone Chips */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 sm:gap-2">
                {MATERIAL_PALETTES.map((palette) => {
                  const isSelected = palette.id === activePaletteId;
                  const isPhoneDefault = palette.id === DEFAULT_PALETTE_ID;

                  return (
                    <motion.button
                      key={palette.id}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => onSelectPalette(palette.id)}
                      className="group flex flex-col items-center gap-1.5 focus:outline-hidden cursor-pointer"
                      title={`${palette.name} - ${palette.subtitle}`}
                    >
                      {/* Outer Ring on selected (Matches Pixel rounded square indicator in Screenshot 1) */}
                      <div
                        className={`relative w-14 h-14 sm:w-13 sm:h-13 rounded-2xl p-1 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-m3-primary bg-m3-primary/10 shadow-xs'
                            : 'hover:bg-m3-surface-container-highest/60'
                        }`}
                      >
                        {/* Dual-tone split circle */}
                        <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-full overflow-hidden flex shadow-xs border border-white/10">
                          {/* Left half: Dark Tone */}
                          <div
                            className="w-1/2 h-full"
                            style={{ backgroundColor: palette.dualTone[0] }}
                          />
                          {/* Right half: Light Accent */}
                          <div
                            className="w-1/2 h-full"
                            style={{ backgroundColor: palette.dualTone[1] }}
                          />
                        </div>

                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="w-4 h-4 rounded-full bg-white/90 text-black flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          </div>
                        )}
                      </div>

                      <span
                        className={`text-[10px] text-center font-medium leading-tight line-clamp-1 max-w-[64px] ${
                          isSelected ? 'text-m3-primary font-bold' : 'text-m3-on-surface-variant'
                        }`}
                      >
                        {palette.name.split(' ')[0]}
                      </span>

                      {isPhoneDefault && (
                        <span className="text-[9px] px-1 py-0.2 rounded-sm bg-m3-tertiary-container text-m3-on-tertiary-container font-mono uppercase tracking-tighter">
                          Phone
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Dark Theme & Mode Selection (Styled like Pixel Settings Switch in Screenshot 1) */}
            <div className="pt-2 border-t border-m3-outline-variant/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-m3-primary mb-3">
                Theme Mode
              </h3>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onThemeModeChange('system')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-2 border transition-all cursor-pointer ${
                    themeMode === 'system'
                      ? 'bg-m3-primary-container text-m3-on-primary-container border-m3-primary font-semibold shadow-xs'
                      : 'bg-m3-surface-container-high text-m3-on-surface-variant border-m3-outline-variant/30 hover:bg-m3-surface-container-highest'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs">System Auto</span>
                </button>

                <button
                  onClick={() => onThemeModeChange('dark')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-2 border transition-all cursor-pointer ${
                    themeMode === 'dark'
                      ? 'bg-m3-primary-container text-m3-on-primary-container border-m3-primary font-semibold shadow-xs'
                      : 'bg-m3-surface-container-high text-m3-on-surface-variant border-m3-outline-variant/30 hover:bg-m3-surface-container-highest'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span className="text-xs">Dark Theme</span>
                </button>

                <button
                  onClick={() => onThemeModeChange('light')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-2 border transition-all cursor-pointer ${
                    themeMode === 'light'
                      ? 'bg-m3-primary-container text-m3-on-primary-container border-m3-primary font-semibold shadow-xs'
                      : 'bg-m3-surface-container-high text-m3-on-surface-variant border-m3-outline-variant/30 hover:bg-m3-surface-container-highest'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span className="text-xs">Light Theme</span>
                </button>
              </div>
            </div>

            {/* Optional Immersive Mode Toggle (Hide Status Bar) */}
            {onToggleImmersive && (
              <div className="pt-2 border-t border-m3-outline-variant/20">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-m3-surface-container-high border border-m3-outline-variant/30">
                  <div className="flex items-center gap-3 pr-2">
                    <div
                      className={`p-2 rounded-xl transition-colors ${
                        isImmersive
                          ? 'bg-m3-primary text-m3-on-primary'
                          : 'bg-m3-surface-container-highest text-m3-on-surface-variant'
                      }`}
                    >
                      {isImmersive ? (
                        <Minimize2 className="w-5 h-5" />
                      ) : (
                        <Maximize2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-m3-on-surface">Immersive Mode</h4>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-m3-secondary-container text-m3-on-secondary-container font-medium">
                          Optional
                        </span>
                      </div>
                      <p className="text-[11px] text-m3-on-surface-variant leading-tight mt-0.5">
                        Hides the top status bar for edge-to-edge viewing. Swipe down from top edge anytime to reveal.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isImmersive}
                    onClick={onToggleImmersive}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                      isImmersive
                        ? 'bg-m3-primary border-m3-primary'
                        : 'bg-m3-surface-container-highest border-m3-outline/60'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isImmersive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Live Component Preview */}
            <div className="p-4 rounded-2xl bg-m3-surface-container-low border border-m3-outline-variant/20">
              <span className="text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider block mb-2.5">
                Current Palette Preview
              </span>
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-m3-primary text-m3-on-primary text-xs font-medium">
                  Primary Pill
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-m3-secondary-container text-m3-on-secondary-container text-xs font-medium">
                  Secondary Tonal
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-m3-surface-container-highest text-m3-on-surface text-xs font-medium border border-m3-outline-variant/40">
                  Outline
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="px-6 py-3.5 bg-m3-surface-container-high border-t border-m3-outline-variant/20 flex items-center justify-between">
            <span className="text-xs text-m3-on-surface-variant">
              Status Bar:{' '}
              <strong className="font-mono text-m3-primary">
                {isImmersive ? 'Hidden (Edge-to-Edge)' : isDarkMode ? 'Dark Tint' : 'Light Tint'}
              </strong>
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-m3-primary text-m3-on-primary text-xs font-bold hover:bg-m3-primary/90 transition-all cursor-pointer shadow-xs"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
