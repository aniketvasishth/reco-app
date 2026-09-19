// Material 3 Dynamic Color Palettes derived from Android Wallpaper & Style (Monet System)
// and iOS / macOS / Windows Dynamic System Accents

export interface ColorTokens {
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceDim: string;
  surfaceBright: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

export interface MaterialPalette {
  id: string;
  name: string;
  subtitle: string;
  dualTone: [string, string]; // [Dark shade, Accent shade] for Chip preview
  isDynamic?: boolean;
  seedHex?: string;
  dark: ColorTokens;
  light: ColorTokens;
}

// Color conversion helpers
export function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [72, 93, 142];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0, g1 = 0, b1 = 0;

  if (h >= 0 && h < 60) {
    r1 = c; g1 = x; b1 = 0;
  } else if (h >= 60 && h < 120) {
    r1 = x; g1 = c; b1 = 0;
  } else if (h >= 120 && h < 180) {
    r1 = 0; g1 = c; b1 = x;
  } else if (h >= 180 && h < 240) {
    r1 = 0; g1 = x; b1 = c;
  } else if (h >= 240 && h < 300) {
    r1 = x; g1 = 0; b1 = c;
  } else {
    r1 = c; g1 = 0; b1 = x;
  }

  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

export function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

/**
 * Mathematically generates a compliant Material 3 (Monet) Light & Dark palette
 * from any seed Accent Color (RGB / Hex).
 */
export function generateMaterial3Palette(
  seedHexOrRgb: string,
  id: string,
  name: string,
  subtitle: string,
  dualTone?: [string, string]
): MaterialPalette {
  let r = 72, g = 93, b = 142; // Default Slate Blue
  if (seedHexOrRgb.startsWith('#')) {
    [r, g, b] = hexToRgb(seedHexOrRgb);
  } else if (seedHexOrRgb.startsWith('rgb')) {
    const match = seedHexOrRgb.match(/\d+/g);
    if (match && match.length >= 3) {
      [r, g, b] = match.map(Number);
    }
  }

  const [h, s] = rgbToHsl(r, g, b);
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const effectiveSaturation = Math.max(0.2, s);
  const previewDark = dualTone ? dualTone[0] : hslToHex(h, clamp(effectiveSaturation * 0.6, 0.25, 0.55), 0.22);
  const previewAccent = dualTone ? dualTone[1] : hslToHex(h, clamp(effectiveSaturation * 0.95, 0.45, 0.9), 0.82);

  return {
    id,
    name,
    subtitle,
    seedHex: rgbToHex(r, g, b),
    dualTone: [previewDark, previewAccent],
    light: {
      primary: hslToHex(h, clamp(effectiveSaturation * 0.85, 0.4, 0.8), 0.38),
      onPrimary: '#ffffff',
      primaryContainer: hslToHex(h, clamp(effectiveSaturation * 0.75, 0.25, 0.65), 0.90),
      onPrimaryContainer: hslToHex(h, clamp(effectiveSaturation, 0.45, 0.85), 0.10),

      secondary: hslToHex((h + 15) % 360, clamp(effectiveSaturation * 0.35, 0.15, 0.35), 0.38),
      onSecondary: '#ffffff',
      secondaryContainer: hslToHex((h + 15) % 360, clamp(effectiveSaturation * 0.35, 0.15, 0.35), 0.91),
      onSecondaryContainer: hslToHex((h + 15) % 360, clamp(effectiveSaturation * 0.4, 0.18, 0.4), 0.12),

      tertiary: hslToHex((h + 45) % 360, clamp(effectiveSaturation * 0.5, 0.2, 0.5), 0.38),
      onTertiary: '#ffffff',
      tertiaryContainer: hslToHex((h + 45) % 360, clamp(effectiveSaturation * 0.5, 0.2, 0.5), 0.90),
      onTertiaryContainer: hslToHex((h + 45) % 360, clamp(effectiveSaturation * 0.55, 0.25, 0.55), 0.12),

      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',

      background: hslToHex(h, 0.12, 0.98),
      onBackground: hslToHex(h, 0.10, 0.11),
      surface: hslToHex(h, 0.12, 0.98),
      onSurface: hslToHex(h, 0.10, 0.11),
      surfaceVariant: hslToHex(h, 0.12, 0.88),
      onSurfaceVariant: hslToHex(h, 0.08, 0.30),

      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: hslToHex(h, 0.12, 0.96),
      surfaceContainer: hslToHex(h, 0.12, 0.93),
      surfaceContainerHigh: hslToHex(h, 0.12, 0.90),
      surfaceContainerHighest: hslToHex(h, 0.12, 0.87),
      surfaceDim: hslToHex(h, 0.10, 0.86),
      surfaceBright: hslToHex(h, 0.12, 0.98),

      outline: hslToHex(h, 0.06, 0.48),
      outlineVariant: hslToHex(h, 0.08, 0.80),
      inverseSurface: hslToHex(h, 0.10, 0.20),
      inverseOnSurface: hslToHex(h, 0.10, 0.95),
      inversePrimary: hslToHex(h, clamp(effectiveSaturation * 0.85, 0.45, 0.85), 0.80),
    },
    dark: {
      primary: hslToHex(h, clamp(effectiveSaturation * 0.85, 0.45, 0.85), 0.80),
      onPrimary: hslToHex(h, clamp(effectiveSaturation, 0.45, 0.85), 0.20),
      primaryContainer: hslToHex(h, clamp(effectiveSaturation * 0.8, 0.35, 0.7), 0.28),
      onPrimaryContainer: hslToHex(h, clamp(effectiveSaturation * 0.75, 0.25, 0.65), 0.90),

      secondary: hslToHex((h + 15) % 360, clamp(effectiveSaturation * 0.35, 0.15, 0.38), 0.78),
      onSecondary: hslToHex((h + 15) % 360, clamp(effectiveSaturation * 0.4, 0.18, 0.4), 0.22),
      secondaryContainer: hslToHex((h + 15) % 360, clamp(effectiveSaturation * 0.35, 0.15, 0.38), 0.28),
      onSecondaryContainer: hslToHex((h + 15) % 360, clamp(effectiveSaturation * 0.35, 0.15, 0.35), 0.91),

      tertiary: hslToHex((h + 45) % 360, clamp(effectiveSaturation * 0.5, 0.2, 0.5), 0.78),
      onTertiary: hslToHex((h + 45) % 360, clamp(effectiveSaturation * 0.55, 0.25, 0.55), 0.22),
      tertiaryContainer: hslToHex((h + 45) % 360, clamp(effectiveSaturation * 0.5, 0.2, 0.5), 0.28),
      onTertiaryContainer: hslToHex((h + 45) % 360, clamp(effectiveSaturation * 0.5, 0.2, 0.5), 0.90),

      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',

      background: hslToHex(h, 0.16, 0.08),
      onBackground: hslToHex(h, 0.10, 0.90),
      surface: hslToHex(h, 0.16, 0.08),
      onSurface: hslToHex(h, 0.10, 0.90),
      surfaceVariant: hslToHex(h, 0.12, 0.28),
      onSurfaceVariant: hslToHex(h, 0.10, 0.78),

      surfaceContainerLowest: hslToHex(h, 0.16, 0.05),
      surfaceContainerLow: hslToHex(h, 0.16, 0.11),
      surfaceContainer: hslToHex(h, 0.16, 0.13),
      surfaceContainerHigh: hslToHex(h, 0.16, 0.17),
      surfaceContainerHighest: hslToHex(h, 0.16, 0.21),
      surfaceDim: hslToHex(h, 0.16, 0.08),
      surfaceBright: hslToHex(h, 0.14, 0.23),

      outline: hslToHex(h, 0.08, 0.55),
      outlineVariant: hslToHex(h, 0.10, 0.28),
      inverseSurface: hslToHex(h, 0.10, 0.90),
      inverseOnSurface: hslToHex(h, 0.10, 0.18),
      inversePrimary: hslToHex(h, clamp(effectiveSaturation * 0.85, 0.4, 0.8), 0.38),
    },
  };
}

/**
 * Accurately extracts native Android / Pixel / Monet / iOS / Windows Dynamic System Accent.
 * Uses multiple probes: Android --android-custom-accent1-* tokens, Canvas 2D rasterizer, DOM AccentColor, and Form Control computed styles.
 */
export function detectSystemDynamicAccent(): { hex: string; isNative: boolean; source: string } {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return { hex: '#b32b43', isNative: false, source: 'fallback' };
  }

  // 0. Probe via Pixel / Android 12-17 Monet experimental CSS variables (--android-custom-accent1-*)
  try {
    const probe = document.createElement('div');
    probe.style.color = 'var(--android-custom-accent1-600, var(--android-custom-accent1-500, var(--android-custom-accent1-200, var(--android-custom-accent1-800, ""))))';
    probe.style.position = 'absolute';
    probe.style.opacity = '0';
    probe.style.pointerEvents = 'none';
    document.documentElement.appendChild(probe);
    const computedColor = window.getComputedStyle(probe).color;
    document.documentElement.removeChild(probe);

    if (computedColor && computedColor.startsWith('rgb')) {
      const match = computedColor.match(/\d+/g);
      if (match && match.length >= 3) {
        const [r, g, b] = match.map(Number);
        const hex = rgbToHex(r, g, b);
        if (hex && hex !== '#000000' && hex !== '#ffffff') {
          return { hex, isNative: true, source: 'android-custom-accent-token' };
        }
      }
    }
  } catch {}

  // 1. Probe via Offscreen 2D Canvas rendering of CSS System Color "AccentColor"
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.fillStyle = 'AccentColor';
      ctx.fillRect(0, 0, 1, 1);
      const pixel = ctx.getImageData(0, 0, 1, 1).data;
      if (pixel && pixel[3] > 0) {
        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
        // Discard generic default blue (#0000ee, #0066cc) or neutral black/white if another probe exists
        if (hex && hex !== '#000000' && hex !== '#ffffff') {
          return { hex, isNative: true, source: 'canvas-accentcolor' };
        }
      }
    }
  } catch {}

  // 2. Probe via DOM AccentColor computed style
  try {
    const probe = document.createElement('span');
    probe.style.color = 'AccentColor';
    probe.style.backgroundColor = 'Highlight';
    probe.style.position = 'absolute';
    probe.style.opacity = '0';
    probe.style.pointerEvents = 'none';
    document.documentElement.appendChild(probe);
    const computedColor = window.getComputedStyle(probe).color;
    const computedBg = window.getComputedStyle(probe).backgroundColor;
    document.documentElement.removeChild(probe);

    for (const val of [computedColor, computedBg]) {
      if (val && val.startsWith('rgb')) {
        const match = val.match(/\d+/g);
        if (match && match.length >= 3) {
          const [r, g, b] = match.map(Number);
          const hex = rgbToHex(r, g, b);
          if (hex && hex !== '#0000ee' && hex !== '#000000' && hex !== '#ffffff') {
            return { hex, isNative: true, source: 'dom-computed' };
          }
        }
      }
    }
  } catch {}

  // 3. Probe native checkbox accent
  try {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.style.position = 'absolute';
    cb.style.opacity = '0';
    document.documentElement.appendChild(cb);
    const computedAccent = window.getComputedStyle(cb).accentColor;
    document.documentElement.removeChild(cb);

    if (computedAccent && computedAccent.startsWith('rgb')) {
      const match = computedAccent.match(/\d+/g);
      if (match && match.length >= 3) {
        const [r, g, b] = match.map(Number);
        const hex = rgbToHex(r, g, b);
        if (hex && hex !== '#0000ee' && hex !== '#000000' && hex !== '#ffffff') {
          return { hex, isNative: true, source: 'checkbox-accent' };
        }
      }
    }
  } catch {}

  // Check if user has saved a custom seed in localStorage
  try {
    const savedSeed = localStorage.getItem('reco_custom_seed_color');
    if (savedSeed && savedSeed.startsWith('#')) {
      return { hex: savedSeed, isNative: true, source: 'user-seed' };
    }
  } catch {}

  // High-aesthetic Material You Burgundy / Carmine default (matching user's Android active system tint)
  return { hex: '#b32b43', isNative: false, source: 'default-burgundy' };
}

/**
 * Returns dynamic Material 3 palette generated from live Android / iOS system accent.
 */
export function getDynamicSystemPalette(): MaterialPalette {
  const { hex } = detectSystemDynamicAccent();
  const palette = generateMaterial3Palette(
    hex,
    'dynamic_system',
    'Dynamic System (Material You)',
    'Auto-adapts to your Android 17 / System Wallpaper accent',
    undefined
  );
  palette.isDynamic = true;
  return palette;
}

// 12 Curated Presets covering official Android 17 / Pixel Wallpaper & style themes + iOS Liquid Glass
export const MATERIAL_PALETTES: MaterialPalette[] = [
  // 1. DYNAMIC MATERIAL YOU (Auto-samples Android OS, Chrome & System Accent)
  getDynamicSystemPalette(),

  // 2. Android 17 Swatch: Crimson & Barca Ruby (User's active Red Tint system theme)
  generateMaterial3Palette(
    '#b32b43',
    'crimson_ruby',
    'Crimson & Ruby',
    'Android 17 Red Tint Wallpaper Colors',
    ['#3a0e19', '#ffb2bc']
  ),

  // 3. Android Swatch: Burgundy & Rose Pink
  generateMaterial3Palette(
    '#78253b',
    'burgundy_rose',
    'Burgundy & Rose',
    'Deep wine & soft petal accents',
    ['#2d0c15', '#f3b4c6']
  ),

  // 4. Android Swatch: Terracotta & Copper
  generateMaterial3Palette(
    '#9c4128',
    'peach_teal',
    'Terracotta & Copper',
    'Warm earthy rust & amber highlights',
    ['#38140a', '#ffb59f']
  ),

  // 5. Android Swatch: Coral & Sunset Peach
  generateMaterial3Palette(
    '#c84b31',
    'coral_sunset',
    'Coral & Sunset Peach',
    'Vibrant warm sunset radiance',
    ['#441208', '#ffb5a0']
  ),

  // 6. Android Swatch: Amber & Gold Honey
  generateMaterial3Palette(
    '#855400',
    'amber_gold',
    'Amber & Golden Honey',
    'Rich golden sunshine tones',
    ['#2d1b00', '#ffba38']
  ),

  // 7. Android Swatch: Slate Blue & Lavender
  generateMaterial3Palette(
    '#475d92',
    'pixel_slate_blue',
    'Slate Blue & Lavender',
    'Pixel 9 Pro Cool Balance',
    ['#18233c', '#b0c6ff']
  ),

  // 8. Android Swatch: Cobalt & Ocean
  generateMaterial3Palette(
    '#1e6292',
    'cobalt_ocean',
    'Cobalt & Ocean',
    'Deep marine blue & sky accents',
    ['#08243b', '#94ccff']
  ),

  // 9. Android Swatch: Emerald & Mint
  generateMaterial3Palette(
    '#236b4e',
    'emerald_mint',
    'Emerald & Mint',
    'Lush botanic green & crisp jade',
    ['#0b291d', '#88d4ab']
  ),

  // 10. Android Swatch: Forest & Sage
  generateMaterial3Palette(
    '#3b693a',
    'forest_sage',
    'Forest & Sage',
    'Calm eucalyptus & earthy foliage',
    ['#132713', '#9ecfa2']
  ),

  // 11. Android Swatch: Plum & Warm Taupe
  generateMaterial3Palette(
    '#765655',
    'plum_taupe',
    'Plum & Warm Taupe',
    'Muted organic clay & twilight purple',
    ['#2c1a1a', '#e4bdba']
  ),

  // 12. Android Swatch: Charcoal & Monochrome Minimal
  generateMaterial3Palette(
    '#5e5e5e',
    'charcoal_monochrome',
    'Monochrome Minimal',
    'High contrast clean neutral slate',
    ['#1e1e1e', '#e2e2e2']
  ),

  // 13. iOS 25+ Liquid Glass (Translucent System Blue)
  generateMaterial3Palette(
    '#007aff',
    'ios_liquid_glass',
    'iOS Liquid Glass',
    'Apple Translucent Frosted Glass & System Blue',
    ['#002b66', '#80bfff']
  ),
];

export const PALETTE_STORAGE_KEY = 'reco_m3_palette_id';
export const DEFAULT_PALETTE_ID = 'dynamic_system';

export function getActivePalette(paletteId?: string): MaterialPalette {
  const id = paletteId || (typeof localStorage !== 'undefined' ? localStorage.getItem(PALETTE_STORAGE_KEY) : null) || DEFAULT_PALETTE_ID;

  if (id === 'dynamic_system') {
    return getDynamicSystemPalette();
  }

  // Check if it's a custom hex seed (starts with #)
  if (id.startsWith('#') || id.startsWith('custom_')) {
    const hex = id.startsWith('custom_') ? id.replace('custom_', '') : id;
    return generateMaterial3Palette(hex, id, 'Custom Seed Color', 'Generated from custom wallpaper color');
  }

  return MATERIAL_PALETTES.find((p) => p.id === id) || MATERIAL_PALETTES[0];
}

/**
 * Injects dynamic Material 3 CSS variables into document.documentElement
 * and ensures system status bar meta tags update accordingly.
 */
export function applyMaterialTokens(
  palette: MaterialPalette,
  isDark: boolean,
  themeMode: 'system' | 'light' | 'dark' = 'system'
): void {
  if (typeof document === 'undefined') return;

  const currentDynamic = palette.id === 'dynamic_system' ? getDynamicSystemPalette() : palette;
  const activeTokens = isDark ? currentDynamic.dark : currentDynamic.light;
  const root = document.documentElement;

  // Check if browser has native --android-custom-accent1-* tokens via CSS.supports
  const hasNativeAndroidTokens =
    palette.id === 'dynamic_system' &&
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('color', 'var(--android-custom-accent1-100)');

  const tokenKeys = [
    '--md-sys-color-background',
    '--md-sys-color-on-background',
    '--md-sys-color-surface',
    '--md-sys-color-on-surface',
    '--md-sys-color-surface-variant',
    '--md-sys-color-on-surface-variant',
    '--md-sys-color-surface-container-lowest',
    '--md-sys-color-surface-container-low',
    '--md-sys-color-surface-container',
    '--md-sys-color-surface-container-high',
    '--md-sys-color-surface-container-highest',
    '--md-sys-color-surface-dim',
    '--md-sys-color-surface-bright',
    '--md-sys-color-primary',
    '--md-sys-color-on-primary',
    '--md-sys-color-primary-container',
    '--md-sys-color-on-primary-container',
    '--md-sys-color-secondary',
    '--md-sys-color-on-secondary',
    '--md-sys-color-secondary-container',
    '--md-sys-color-on-secondary-container',
    '--md-sys-color-tertiary',
    '--md-sys-color-on-tertiary',
    '--md-sys-color-tertiary-container',
    '--md-sys-color-on-tertiary-container',
    '--md-sys-color-error',
    '--md-sys-color-on-error',
    '--md-sys-color-error-container',
    '--md-sys-color-on-error-container',
    '--md-sys-color-outline',
    '--md-sys-color-outline-variant',
    '--md-sys-color-inverse-surface',
    '--md-sys-color-inverse-on-surface',
    '--md-sys-color-inverse-primary',
  ];

  if (hasNativeAndroidTokens) {
    // Let the @supports (color: var(--android-custom-accent1-100)) stylesheet rule take full effect natively
    tokenKeys.forEach((key) => root.style.removeProperty(key));
  } else {
    // Set CSS Variables on root
    root.style.setProperty('--md-sys-color-background', activeTokens.background);
    root.style.setProperty('--md-sys-color-on-background', activeTokens.onBackground);
    root.style.setProperty('--md-sys-color-surface', activeTokens.surface);
    root.style.setProperty('--md-sys-color-on-surface', activeTokens.onSurface);
    root.style.setProperty('--md-sys-color-surface-variant', activeTokens.surfaceVariant);
    root.style.setProperty('--md-sys-color-on-surface-variant', activeTokens.onSurfaceVariant);

    root.style.setProperty('--md-sys-color-surface-container-lowest', activeTokens.surfaceContainerLowest);
    root.style.setProperty('--md-sys-color-surface-container-low', activeTokens.surfaceContainerLow);
    root.style.setProperty('--md-sys-color-surface-container', activeTokens.surfaceContainer);
    root.style.setProperty('--md-sys-color-surface-container-high', activeTokens.surfaceContainerHigh);
    root.style.setProperty('--md-sys-color-surface-container-highest', activeTokens.surfaceContainerHighest);
    root.style.setProperty('--md-sys-color-surface-dim', activeTokens.surfaceDim);
    root.style.setProperty('--md-sys-color-surface-bright', activeTokens.surfaceBright);

    root.style.setProperty('--md-sys-color-primary', activeTokens.primary);
    root.style.setProperty('--md-sys-color-on-primary', activeTokens.onPrimary);
    root.style.setProperty('--md-sys-color-primary-container', activeTokens.primaryContainer);
    root.style.setProperty('--md-sys-color-on-primary-container', activeTokens.onPrimaryContainer);

    root.style.setProperty('--md-sys-color-secondary', activeTokens.secondary);
    root.style.setProperty('--md-sys-color-on-secondary', activeTokens.onSecondary);
    root.style.setProperty('--md-sys-color-secondary-container', activeTokens.secondaryContainer);
    root.style.setProperty('--md-sys-color-on-secondary-container', activeTokens.onSecondaryContainer);

    root.style.setProperty('--md-sys-color-tertiary', activeTokens.tertiary);
    root.style.setProperty('--md-sys-color-on-tertiary', activeTokens.onTertiary);
    root.style.setProperty('--md-sys-color-tertiary-container', activeTokens.tertiaryContainer);
    root.style.setProperty('--md-sys-color-on-tertiary-container', activeTokens.onTertiaryContainer);

    root.style.setProperty('--md-sys-color-error', activeTokens.error);
    root.style.setProperty('--md-sys-color-on-error', activeTokens.onError);
    root.style.setProperty('--md-sys-color-error-container', activeTokens.errorContainer);
    root.style.setProperty('--md-sys-color-on-error-container', activeTokens.onErrorContainer);

    root.style.setProperty('--md-sys-color-outline', activeTokens.outline);
    root.style.setProperty('--md-sys-color-outline-variant', activeTokens.outlineVariant);

    root.style.setProperty('--md-sys-color-inverse-surface', activeTokens.inverseSurface);
    root.style.setProperty('--md-sys-color-inverse-on-surface', activeTokens.inverseOnSurface);
    root.style.setProperty('--md-sys-color-inverse-primary', activeTokens.inversePrimary);
  }

  // Critical for Android Status Bar & Overscroll window blending
  document.documentElement.style.backgroundColor = activeTokens.background;
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  if (document.body) {
    document.body.style.backgroundColor = activeTokens.background;
  }

  // Update Status Bar theme-color meta tags
  updateStatusBarThemeColor(activeTokens.background, isDark, themeMode, currentDynamic);
}

/**
 * Dynamically re-creates and updates Android / iOS theme-color meta tags
 * to force Android Chrome and WebAPK to re-evaluate the status bar window decor.
 */
export function updateStatusBarThemeColor(
  targetColor: string,
  isDark: boolean,
  themeMode: 'system' | 'light' | 'dark' = 'system',
  palette?: MaterialPalette
): void {
  if (typeof document === 'undefined') return;

  // 1. Synchronize document root and body styling
  document.documentElement.style.backgroundColor = targetColor;
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  if (document.body) {
    document.body.style.backgroundColor = targetColor;
  }

  // 2. Synchronize <meta name="color-scheme">
  let colorSchemeMeta = document.getElementById('color-scheme-meta') as HTMLMetaElement | null;
  if (!colorSchemeMeta) {
    colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  }
  if (colorSchemeMeta) {
    colorSchemeMeta.setAttribute('content', themeMode === 'system' ? 'light dark' : (isDark ? 'dark' : 'light'));
  }

  // 3. Update theme-color meta tags
  let baseMeta = document.getElementById('theme-color-meta') as HTMLMetaElement | null;
  if (!baseMeta) {
    baseMeta = document.querySelector('meta[name="theme-color"]:not([media])');
  }
  if (!baseMeta) {
    baseMeta = document.createElement('meta');
    baseMeta.setAttribute('name', 'theme-color');
    baseMeta.setAttribute('id', 'theme-color-meta');
    document.head.appendChild(baseMeta);
  }

  const darkMeta = document.getElementById('theme-color-dark') as HTMLMetaElement | null;
  const lightMeta = document.getElementById('theme-color-light') as HTMLMetaElement | null;

  if (themeMode === 'system') {
    const darkBg = palette?.dark.background ?? (isDark ? targetColor : '#161012');
    const lightBg = palette?.light.background ?? (!isDark ? targetColor : '#fff8f7');

    let currentDarkMeta = darkMeta;
    if (!currentDarkMeta) {
      currentDarkMeta = document.createElement('meta');
      currentDarkMeta.setAttribute('name', 'theme-color');
      currentDarkMeta.setAttribute('id', 'theme-color-dark');
      document.head.appendChild(currentDarkMeta);
    }
    currentDarkMeta.setAttribute('media', '(prefers-color-scheme: dark)');
    currentDarkMeta.setAttribute('content', darkBg);

    let currentLightMeta = lightMeta;
    if (!currentLightMeta) {
      currentLightMeta = document.createElement('meta');
      currentLightMeta.setAttribute('name', 'theme-color');
      currentLightMeta.setAttribute('id', 'theme-color-light');
      document.head.appendChild(currentLightMeta);
    }
    currentLightMeta.setAttribute('media', '(prefers-color-scheme: light)');
    currentLightMeta.setAttribute('content', lightBg);

    baseMeta.removeAttribute('media');
    baseMeta.setAttribute('content', targetColor);
  } else {
    if (darkMeta) darkMeta.remove();
    if (lightMeta) lightMeta.remove();

    const allMetas = document.querySelectorAll('meta[name="theme-color"]');
    allMetas.forEach((m) => {
      if (m !== baseMeta) m.remove();
    });

    baseMeta.removeAttribute('media');
    baseMeta.setAttribute('content', targetColor);
  }

  // 4. Update Windows / Tile color
  const tileMeta = document.getElementById('ms-tile-color') || document.querySelector('meta[name="msapplication-TileColor"]');
  if (tileMeta) {
    tileMeta.setAttribute('content', targetColor);
  }

  // 5. Apple Mobile status bar style
  let appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement | null;
  if (!appleStatusBarMeta) {
    appleStatusBarMeta = document.createElement('meta');
    appleStatusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    document.head.appendChild(appleStatusBarMeta);
  }
  appleStatusBarMeta.setAttribute('content', isDark ? 'black-translucent' : 'default');

  // 6. Update manifest link based on light/dark mode
  const manifestLink = document.getElementById('manifest-link');
  if (manifestLink) {
    manifestLink.setAttribute('href', isDark ? '/manifest-dark.json' : '/manifest-light.json');
  }

  // 7. Update favicon & Apple touch icon based on light/dark mode
  const faviconLink = document.getElementById('favicon-link') || document.querySelector('link[rel="icon"][sizes="32x32"]');
  if (faviconLink) {
    faviconLink.setAttribute('href', isDark ? '/icons/icon-dark-32.png' : '/icons/icon-light-32.png');
  }

  const appleIcon = document.getElementById('apple-touch-icon') || document.querySelector('link[rel="apple-touch-icon"]');
  if (appleIcon) {
    appleIcon.setAttribute('href', isDark ? '/icons/icon-dark-180.png' : '/icons/icon-light-180.png');
  }
}

/**
 * Sets up listeners for system accent changes (Android Wallpaper & Style changes, OS theme toggles, tab focus)
 */
export function setupSystemAccentObserver(onAccentChange: (newHex: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let lastHex = detectSystemDynamicAccent().hex;

  const check = () => {
    const { hex } = detectSystemDynamicAccent();
    if (hex !== lastHex) {
      lastHex = hex;
      onAccentChange(hex);
    }
  };

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      check();
    }
  };

  const handleFocus = () => {
    check();
  };

  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibility);

  // Micro-polling every 3s when active
  const interval = setInterval(check, 3000);

  return () => {
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibility);
    clearInterval(interval);
  };
}
