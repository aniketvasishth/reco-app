// Material 3 Dynamic Color Palettes derived from Android Wallpaper & Style (Monet System)

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
  dualTone: [string, string]; // [Dark shade, Accent shade] for Pixel chip preview
  isDynamic?: boolean;
  dark: ColorTokens;
  light: ColorTokens;
}

// Color conversion helpers
export function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
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
  let r = 72, g = 93, b = 142; // Default Pixel Slate Blue
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

  const previewDark = dualTone ? dualTone[0] : hslToHex(h, clamp(s * 0.5, 0.2, 0.4), 0.24);
  const previewAccent = dualTone ? dualTone[1] : hslToHex(h, clamp(s * 0.9, 0.4, 0.8), 0.82);

  return {
    id,
    name,
    subtitle,
    dualTone: [previewDark, previewAccent],
    light: {
      primary: hslToHex(h, clamp(s, 0.35, 0.65), 0.38),
      onPrimary: '#ffffff',
      primaryContainer: hslToHex(h, clamp(s * 0.75, 0.25, 0.55), 0.90),
      onPrimaryContainer: hslToHex(h, clamp(s, 0.4, 0.75), 0.10),

      secondary: hslToHex(h, clamp(s * 0.32, 0.12, 0.28), 0.40),
      onSecondary: '#ffffff',
      secondaryContainer: hslToHex(h, clamp(s * 0.35, 0.14, 0.32), 0.91),
      onSecondaryContainer: hslToHex(h, clamp(s * 0.4, 0.15, 0.35), 0.12),

      tertiary: hslToHex((h + 40) % 360, clamp(s * 0.45, 0.15, 0.40), 0.40),
      onTertiary: '#ffffff',
      tertiaryContainer: hslToHex((h + 40) % 360, clamp(s * 0.45, 0.15, 0.40), 0.90),
      onTertiaryContainer: hslToHex((h + 40) % 360, clamp(s * 0.5, 0.2, 0.45), 0.12),

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
      inversePrimary: hslToHex(h, clamp(s * 0.85, 0.45, 0.80), 0.80),
    },
    dark: {
      primary: hslToHex(h, clamp(s * 0.85, 0.45, 0.80), 0.80),
      onPrimary: hslToHex(h, clamp(s, 0.4, 0.75), 0.20),
      primaryContainer: hslToHex(h, clamp(s * 0.8, 0.35, 0.65), 0.30),
      onPrimaryContainer: hslToHex(h, clamp(s * 0.75, 0.25, 0.55), 0.90),

      secondary: hslToHex(h, clamp(s * 0.35, 0.15, 0.35), 0.78),
      onSecondary: hslToHex(h, clamp(s * 0.4, 0.15, 0.35), 0.22),
      secondaryContainer: hslToHex(h, clamp(s * 0.35, 0.15, 0.35), 0.30),
      onSecondaryContainer: hslToHex(h, clamp(s * 0.35, 0.14, 0.32), 0.91),

      tertiary: hslToHex((h + 40) % 360, clamp(s * 0.45, 0.2, 0.45), 0.78),
      onTertiary: hslToHex((h + 40) % 360, clamp(s * 0.5, 0.2, 0.45), 0.22),
      tertiaryContainer: hslToHex((h + 40) % 360, clamp(s * 0.45, 0.2, 0.45), 0.30),
      onTertiaryContainer: hslToHex((h + 40) % 360, clamp(s * 0.45, 0.15, 0.40), 0.90),

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
      inversePrimary: hslToHex(h, clamp(s, 0.35, 0.65), 0.38),
    },
  };
}

/**
 * Detects native Android / Chrome Monet Dynamic System Accent via CSS System Colors probe.
 */
export function detectAndroidDynamicAccent(): { hex: string; isNative: boolean } {
  if (typeof document === 'undefined') {
    return { hex: '#485d8e', isNative: false };
  }
  try {
    const probe = document.createElement('span');
    probe.style.color = 'AccentColor';
    probe.style.position = 'absolute';
    probe.style.opacity = '0';
    probe.style.pointerEvents = 'none';
    document.documentElement.appendChild(probe);
    const computed = window.getComputedStyle(probe).color;
    document.documentElement.removeChild(probe);

    if (computed && computed.startsWith('rgb')) {
      const match = computed.match(/\d+/g);
      if (match && match.length >= 3) {
        const [r, g, b] = match.map(Number);
        const hex = rgbToHex(r, g, b);
        if (hex && hex !== '#0000ee' && hex !== '#000000' && hex !== '#ffffff') {
          return { hex, isNative: true };
        }
      }
    }
  } catch {}
  // Default to Pixel 9 Pro active Slate Blue from Wallpaper & style
  return { hex: '#485d8e', isNative: false };
}

/**
 * Returns dynamic Material 3 palette generated from Android system accent.
 */
export function getDynamicSystemPalette(): MaterialPalette {
  const { hex } = detectAndroidDynamicAccent();
  const palette = generateMaterial3Palette(
    hex,
    'dynamic_system',
    'Dynamic System (Material You)',
    'Auto-adapts to your Android Wallpaper & Style',
    ['#3b4866', '#d8e2ff']
  );
  palette.isDynamic = true;
  return palette;
}

// 7 Preset Dynamic Swatches exactly matching Android Pixel Wallpaper & style
export const MATERIAL_PALETTES: MaterialPalette[] = [
  // 1. DYNAMIC MATERIAL YOU (Default: Auto-samples Android OS & Chrome)
  {
    id: 'dynamic_system',
    name: 'Dynamic Material You',
    subtitle: 'Auto-adapts to Android Wallpaper & style',
    dualTone: ['#3b4866', '#d8e2ff'],
    isDynamic: true,
    dark: {
      background: '#10131a',
      onBackground: '#e0e2ec',
      surface: '#10131a',
      onSurface: '#e0e2ec',
      surfaceVariant: '#434751',
      onSurfaceVariant: '#c3c6d2',
      surfaceContainerLowest: '#0b0e14',
      surfaceContainerLow: '#181b22',
      surfaceContainer: '#1c2027',
      surfaceContainerHigh: '#272a31',
      surfaceContainerHighest: '#32353c',
      surfaceDim: '#10131a',
      surfaceBright: '#363941',
      primary: '#b0c6ff',
      onPrimary: '#142f60',
      primaryContainer: '#2e4577',
      onPrimaryContainer: '#d8e2ff',
      secondary: '#bec6dc',
      onSecondary: '#283042',
      secondaryContainer: '#3e4759',
      onSecondaryContainer: '#dae2f9',
      tertiary: '#debcdf',
      onTertiary: '#402843',
      tertiaryContainer: '#583e5b',
      onTertiaryContainer: '#fad8fb',
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      outline: '#8d919c',
      outlineVariant: '#434751',
      inverseSurface: '#e0e2ec',
      inverseOnSurface: '#2d3037',
      inversePrimary: '#475d92',
    },
    light: {
      background: '#f8f9ff',
      onBackground: '#181c22',
      surface: '#f8f9ff',
      onSurface: '#181c22',
      surfaceVariant: '#dfe2ee',
      onSurfaceVariant: '#434751',
      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: '#f2f3fc',
      surfaceContainer: '#edf0fa',
      surfaceContainerHigh: '#e7eaf4',
      surfaceContainerHighest: '#e1e4ee',
      surfaceDim: '#d9dce5',
      surfaceBright: '#f8f9ff',
      primary: '#475d92',
      onPrimary: '#ffffff',
      primaryContainer: '#d8e2ff',
      onPrimaryContainer: '#001a43',
      secondary: '#565f71',
      onSecondary: '#ffffff',
      secondaryContainer: '#dae2f9',
      onSecondaryContainer: '#131c2c',
      tertiary: '#705574',
      onTertiary: '#ffffff',
      tertiaryContainer: '#fad8fb',
      onTertiaryContainer: '#29132d',
      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',
      outline: '#747782',
      outlineVariant: '#c3c6d2',
      inverseSurface: '#2d3037',
      inverseOnSurface: '#eff0f9',
      inversePrimary: '#b0c6ff',
    },
  },

  // 2. Pixel Swatch 4: Slate Blue & Lavender (User's active Wallpaper & style selection)
  {
    id: 'pixel_slate_blue',
    name: 'Slate Blue & Lavender',
    subtitle: 'Pixel 9 Pro Wallpaper Colors',
    dualTone: ['#3b4866', '#d8e2ff'],
    dark: {
      background: '#10131a',
      onBackground: '#e0e2ec',
      surface: '#10131a',
      onSurface: '#e0e2ec',
      surfaceVariant: '#434751',
      onSurfaceVariant: '#c3c6d2',
      surfaceContainerLowest: '#0b0e14',
      surfaceContainerLow: '#181b22',
      surfaceContainer: '#1c2027',
      surfaceContainerHigh: '#272a31',
      surfaceContainerHighest: '#32353c',
      surfaceDim: '#10131a',
      surfaceBright: '#363941',
      primary: '#b0c6ff',
      onPrimary: '#142f60',
      primaryContainer: '#2e4577',
      onPrimaryContainer: '#d8e2ff',
      secondary: '#bec6dc',
      onSecondary: '#283042',
      secondaryContainer: '#3e4759',
      onSecondaryContainer: '#dae2f9',
      tertiary: '#debcdf',
      onTertiary: '#402843',
      tertiaryContainer: '#583e5b',
      onTertiaryContainer: '#fad8fb',
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      outline: '#8d919c',
      outlineVariant: '#434751',
      inverseSurface: '#e0e2ec',
      inverseOnSurface: '#2d3037',
      inversePrimary: '#475d92',
    },
    light: {
      background: '#f8f9ff',
      onBackground: '#181c22',
      surface: '#f8f9ff',
      onSurface: '#181c22',
      surfaceVariant: '#dfe2ee',
      onSurfaceVariant: '#434751',
      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: '#f2f3fc',
      surfaceContainer: '#edf0fa',
      surfaceContainerHigh: '#e7eaf4',
      surfaceContainerHighest: '#e1e4ee',
      surfaceDim: '#d9dce5',
      surfaceBright: '#f8f9ff',
      primary: '#475d92',
      onPrimary: '#ffffff',
      primaryContainer: '#d8e2ff',
      onPrimaryContainer: '#001a43',
      secondary: '#565f71',
      onSecondary: '#ffffff',
      secondaryContainer: '#dae2f9',
      onSecondaryContainer: '#131c2c',
      tertiary: '#705574',
      onTertiary: '#ffffff',
      tertiaryContainer: '#fad8fb',
      onTertiaryContainer: '#29132d',
      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',
      outline: '#747782',
      outlineVariant: '#c3c6d2',
      inverseSurface: '#2d3037',
      inverseOnSurface: '#eff0f9',
      inversePrimary: '#b0c6ff',
    },
  },

  // 3. Pixel Swatch 1: Taupe & Muted Plum
  {
    id: 'plum_taupe',
    name: 'Plum & Taupe',
    subtitle: 'Subtle earthy warmth',
    dualTone: ['#4a3e3d', '#e8dcdb'],
    dark: {
      background: '#161212',
      onBackground: '#e7e0df',
      surface: '#161212',
      onSurface: '#e7e0df',
      surfaceVariant: '#4c4544',
      onSurfaceVariant: '#cfc4c3',
      surfaceContainerLowest: '#100d0d',
      surfaceContainerLow: '#1e1919',
      surfaceContainer: '#221d1d',
      surfaceContainerHigh: '#2d2727',
      surfaceContainerHighest: '#383232',
      surfaceDim: '#161212',
      surfaceBright: '#3d3737',
      primary: '#e4bdba',
      onPrimary: '#432928',
      primaryContainer: '#5b3f3e',
      onPrimaryContainer: '#ffdada',
      secondary: '#d6c2c0',
      onSecondary: '#3a2d2c',
      secondaryContainer: '#524342',
      onSecondaryContainer: '#f3dedd',
      tertiary: '#d9c4a4',
      onTertiary: '#3c2f18',
      tertiaryContainer: '#54452c',
      onTertiaryContainer: '#f6e0c0',
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      outline: '#988e8d',
      outlineVariant: '#4c4544',
      inverseSurface: '#e7e0df',
      inverseOnSurface: '#332e2e',
      inversePrimary: '#765655',
    },
    light: {
      background: '#fff8f7',
      onBackground: '#201a19',
      surface: '#fff8f7',
      onSurface: '#201a19',
      surfaceVariant: '#ebdcdb',
      onSurfaceVariant: '#4c4544',
      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: '#fbf1f0',
      surfaceContainer: '#f5ebea',
      surfaceContainerHigh: '#efe5e4',
      surfaceContainerHighest: '#e9dfde',
      surfaceDim: '#e1d7d6',
      surfaceBright: '#fff8f7',
      primary: '#765655',
      onPrimary: '#ffffff',
      primaryContainer: '#ffdada',
      onPrimaryContainer: '#2c1514',
      secondary: '#6a5a58',
      onSecondary: '#ffffff',
      secondaryContainer: '#f3dedd',
      onSecondaryContainer: '#241817',
      tertiary: '#6c5c42',
      onTertiary: '#ffffff',
      tertiaryContainer: '#f6e0c0',
      onTertiaryContainer: '#251a06',
      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',
      outline: '#7f7473',
      outlineVariant: '#cfc4c3',
      inverseSurface: '#362f2e',
      inverseOnSurface: '#f9eee9',
      inversePrimary: '#e4bdba',
    },
  },

  // 4. Pixel Swatch 2: Crimson & Rose Pink
  {
    id: 'burgundy_rose',
    name: 'Crimson & Rose',
    subtitle: 'Barca Crimson tone',
    dualTone: ['#461523', '#f3b4c6'],
    dark: {
      background: '#221016',
      onBackground: '#efe0e3',
      surface: '#221016',
      onSurface: '#efe0e3',
      surfaceVariant: '#514347',
      onSurfaceVariant: '#d4c2c7',
      surfaceContainerLowest: '#1a0b10',
      surfaceContainerLow: '#27111a',
      surfaceContainer: '#2f1420',
      surfaceContainerHigh: '#391827',
      surfaceContainerHighest: '#441d2e',
      surfaceDim: '#221016',
      surfaceBright: '#4b2133',
      primary: '#f3b4c6',
      onPrimary: '#4c1423',
      primaryContainer: '#672637',
      onPrimaryContainer: '#ffd9e2',
      secondary: '#e0bdc5',
      onSecondary: '#412930',
      secondaryContainer: '#593f46',
      onSecondaryContainer: '#fed9e1',
      tertiary: '#f0ba9a',
      onTertiary: '#472714',
      tertiaryContainer: '#623c29',
      onTertiaryContainer: '#ffdcc6',
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      outline: '#9d8c91',
      outlineVariant: '#514347',
      inverseSurface: '#efe0e3',
      inverseOnSurface: '#362f32',
      inversePrimary: '#8e4a5d',
    },
    light: {
      background: '#fff0f3',
      onBackground: '#26161b',
      surface: '#fff0f3',
      onSurface: '#26161b',
      surfaceVariant: '#f2dde2',
      onSurfaceVariant: '#514347',
      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: '#fae9ed',
      surfaceContainer: '#f4e3e7',
      surfaceContainerHigh: '#eedde1',
      surfaceContainerHighest: '#e8d7dc',
      surfaceDim: '#e2d1d6',
      surfaceBright: '#fff0f3',
      primary: '#8e4a5d',
      onPrimary: '#ffffff',
      primaryContainer: '#ffd9e2',
      onPrimaryContainer: '#3b0817',
      secondary: '#72575f',
      onSecondary: '#ffffff',
      secondaryContainer: '#fed9e1',
      onSecondaryContainer: '#2b151c',
      tertiary: '#7f553e',
      onTertiary: '#ffffff',
      tertiaryContainer: '#ffdcc6',
      onTertiaryContainer: '#311405',
      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',
      outline: '#837377',
      outlineVariant: '#d4c2c7',
      inverseSurface: '#3b2b30',
      inverseOnSurface: '#faebee',
      inversePrimary: '#f3b4c6',
    },
  },

  // 5. Pixel Swatch 3: Terracotta & Cyan
  {
    id: 'peach_teal',
    name: 'Terracotta & Cyan',
    subtitle: 'Warm sunset & cool teal contrast',
    dualTone: ['#6b3a2a', '#a0eff0'],
    dark: {
      background: '#1d120f',
      onBackground: '#f0dfdc',
      surface: '#1d120f',
      onSurface: '#f0dfdc',
      surfaceVariant: '#534340',
      onSurfaceVariant: '#d7c2be',
      surfaceContainerLowest: '#170d0b',
      surfaceContainerLow: '#251a17',
      surfaceContainer: '#291e1b',
      surfaceContainerHigh: '#342825',
      surfaceContainerHighest: '#3f3330',
      surfaceDim: '#1d120f',
      surfaceBright: '#463935',
      primary: '#ffb59f',
      onPrimary: '#5f1807',
      primaryContainer: '#7d2e1b',
      onPrimaryContainer: '#ffdbd1',
      secondary: '#63dac5',
      onSecondary: '#003830',
      secondaryContainer: '#005045',
      onSecondaryContainer: '#82f7e1',
      tertiary: '#dec48c',
      onTertiary: '#3e2e04',
      tertiaryContainer: '#564419',
      onTertiaryContainer: '#fbe0a6',
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      outline: '#a08c87',
      outlineVariant: '#534340',
      inverseSurface: '#f0dfdc',
      inverseOnSurface: '#362b28',
      inversePrimary: '#9a4530',
    },
    light: {
      background: '#fff8f6',
      onBackground: '#221917',
      surface: '#fff8f6',
      onSurface: '#221917',
      surfaceVariant: '#f5ded9',
      onSurfaceVariant: '#534340',
      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: '#fff1ee',
      surfaceContainer: '#faebe7',
      surfaceContainerHigh: '#f4e5e1',
      surfaceContainerHighest: '#eedfdb',
      surfaceDim: '#e6d7d4',
      surfaceBright: '#fff8f6',
      primary: '#9a4530',
      onPrimary: '#ffffff',
      primaryContainer: '#ffdbd1',
      onPrimaryContainer: '#3b0a01',
      secondary: '#006a5d',
      onSecondary: '#ffffff',
      secondaryContainer: '#82f7e1',
      onSecondaryContainer: '#00201a',
      tertiary: '#705c2e',
      onTertiary: '#ffffff',
      tertiaryContainer: '#fbe0a6',
      onTertiaryContainer: '#261a00',
      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',
      outline: '#85736f',
      outlineVariant: '#d7c2be',
      inverseSurface: '#382e2c',
      inverseOnSurface: '#feedea',
      inversePrimary: '#ffb59f',
    },
  },

  // 6. Pixel Swatch 5: Charcoal & Cool Lavender
  {
    id: 'charcoal_lavender',
    name: 'Charcoal & Lavender',
    subtitle: 'Muted modern contrast',
    dualTone: ['#3c3f4a', '#e0e1f0'],
    dark: {
      background: '#121318',
      onBackground: '#e2e2e8',
      surface: '#121318',
      onSurface: '#e2e2e8',
      surfaceVariant: '#44464f',
      onSurfaceVariant: '#c4c6d0',
      surfaceContainerLowest: '#0d0e12',
      surfaceContainerLow: '#191b20',
      surfaceContainer: '#1d1f24',
      surfaceContainerHigh: '#28292f',
      surfaceContainerHighest: '#33343a',
      surfaceDim: '#121318',
      surfaceBright: '#393940',
      primary: '#bfc6dc',
      onPrimary: '#283042',
      primaryContainer: '#3f4759',
      onPrimaryContainer: '#dbe2f9',
      secondary: '#c6c5d0',
      onSecondary: '#2f3038',
      secondaryContainer: '#45464f',
      onSecondaryContainer: '#e2e1ec',
      tertiary: '#e0bbdd',
      onTertiary: '#412742',
      tertiaryContainer: '#593d59',
      onTertiaryContainer: '#fcd7f9',
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      outline: '#8e909a',
      outlineVariant: '#44464f',
      inverseSurface: '#e2e2e8',
      inverseOnSurface: '#2f3036',
      inversePrimary: '#575f71',
    },
    light: {
      background: '#f9f9ff',
      onBackground: '#1a1b20',
      surface: '#f9f9ff',
      onSurface: '#1a1b20',
      surfaceVariant: '#e1e2ec',
      onSurfaceVariant: '#44464f',
      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: '#f3f3fb',
      surfaceContainer: '#edecf5',
      surfaceContainerHigh: '#e7e7ef',
      surfaceContainerHighest: '#e1e1e9',
      surfaceDim: '#dad9e2',
      surfaceBright: '#f9f9ff',
      primary: '#575f71',
      onPrimary: '#ffffff',
      primaryContainer: '#dbe2f9',
      onPrimaryContainer: '#131c2b',
      secondary: '#5d5d67',
      onSecondary: '#ffffff',
      secondaryContainer: '#e2e1ec',
      onSecondaryContainer: '#1a1b23',
      tertiary: '#725572',
      onTertiary: '#ffffff',
      tertiaryContainer: '#fcd7f9',
      onTertiaryContainer: '#2a132c',
      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',
      outline: '#757780',
      outlineVariant: '#c4c6d0',
      inverseSurface: '#2f3036',
      inverseOnSurface: '#f1f0f7',
      inversePrimary: '#bfc6dc',
    },
  },

  // 7. Pixel Swatch 6: Royal Blue & Magenta
  {
    id: 'royal_blue_magenta',
    name: 'Royal Blue & Magenta',
    subtitle: 'Vibrant punchy dual-tone',
    dualTone: ['#1a4488', '#ffb0cd'],
    dark: {
      background: '#0e1420',
      onBackground: '#dee3f2',
      surface: '#0e1420',
      onSurface: '#dee3f2',
      surfaceVariant: '#414755',
      onSurfaceVariant: '#c1c7d6',
      surfaceContainerLowest: '#090e18',
      surfaceContainerLow: '#151c28',
      surfaceContainer: '#19202d',
      surfaceContainerHigh: '#242b38',
      surfaceContainerHighest: '#2f3643',
      surfaceDim: '#0e1420',
      surfaceBright: '#353c4a',
      primary: '#a6c8ff',
      onPrimary: '#003060',
      primaryContainer: '#004787',
      onPrimaryContainer: '#d5e3ff',
      secondary: '#ffb0cd',
      onSecondary: '#5c1137',
      secondaryContainer: '#792a50',
      onSecondaryContainer: '#ffd8e4',
      tertiary: '#dec48c',
      onTertiary: '#3e2e04',
      tertiaryContainer: '#564419',
      onTertiaryContainer: '#fbe0a6',
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      outline: '#8b91a0',
      outlineVariant: '#414755',
      inverseSurface: '#dee3f2',
      inverseOnSurface: '#2b313c',
      inversePrimary: '#005faf',
    },
    light: {
      background: '#f8f9ff',
      onBackground: '#171c24',
      surface: '#f8f9ff',
      onSurface: '#171c24',
      surfaceVariant: '#dee3f2',
      onSurfaceVariant: '#414755',
      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: '#f0f3ff',
      surfaceContainer: '#eaeffc',
      surfaceContainerHigh: '#e4e9f6',
      surfaceContainerHighest: '#dee3f0',
      surfaceDim: '#d6dbe7',
      surfaceBright: '#f8f9ff',
      primary: '#005faf',
      onPrimary: '#ffffff',
      primaryContainer: '#d5e3ff',
      onPrimaryContainer: '#001b3b',
      secondary: '#984068',
      onSecondary: '#ffffff',
      secondaryContainer: '#ffd8e4',
      onSecondaryContainer: '#3b0021',
      tertiary: '#705c2e',
      onTertiary: '#ffffff',
      tertiaryContainer: '#fbe0a6',
      onTertiaryContainer: '#261a00',
      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',
      outline: '#727785',
      outlineVariant: '#c1c7d6',
      inverseSurface: '#2b313c',
      inverseOnSurface: '#eff1fc',
      inversePrimary: '#a6c8ff',
    },
  },

  // 8. Pixel Swatch 7: Cobalt & Emerald Teal
  {
    id: 'cobalt_emerald',
    name: 'Cobalt & Emerald',
    subtitle: 'High energy sports contrast',
    dualTone: ['#184b80', '#7ce5c4'],
    dark: {
      background: '#0d141e',
      onBackground: '#dde3ef',
      surface: '#0d141e',
      onSurface: '#dde3ef',
      surfaceVariant: '#414852',
      onSurfaceVariant: '#c1c7d2',
      surfaceContainerLowest: '#080f18',
      surfaceContainerLow: '#141c26',
      surfaceContainer: '#18202a',
      surfaceContainerHigh: '#232b35',
      surfaceContainerHighest: '#2d3540',
      surfaceDim: '#0d141e',
      surfaceBright: '#343b47',
      primary: '#a2c9ff',
      onPrimary: '#00315c',
      primaryContainer: '#004780',
      onPrimaryContainer: '#d3e4ff',
      secondary: '#5bdbb9',
      onSecondary: '#00382b',
      secondaryContainer: '#00513f',
      onSecondaryContainer: '#7bf8d4',
      tertiary: '#dec48c',
      onTertiary: '#3e2e04',
      tertiaryContainer: '#564419',
      onTertiaryContainer: '#fbe0a6',
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      outline: '#8b929c',
      outlineVariant: '#414852',
      inverseSurface: '#dde3ef',
      inverseOnSurface: '#2a313b',
      inversePrimary: '#0060a8',
    },
    light: {
      background: '#f7f9ff',
      onBackground: '#161c24',
      surface: '#f7f9ff',
      onSurface: '#161c24',
      surfaceVariant: '#dde3ef',
      onSurfaceVariant: '#414852',
      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: '#eff3fe',
      surfaceContainer: '#e9eef8',
      surfaceContainerHigh: '#e3e8f2',
      surfaceContainerHighest: '#dde2ec',
      surfaceDim: '#d5dae4',
      surfaceBright: '#f7f9ff',
      primary: '#0060a8',
      onPrimary: '#ffffff',
      primaryContainer: '#d3e4ff',
      onPrimaryContainer: '#001c38',
      secondary: '#006c55',
      onSecondary: '#ffffff',
      secondaryContainer: '#7bf8d4',
      onSecondaryContainer: '#002118',
      tertiary: '#705c2e',
      onTertiary: '#ffffff',
      tertiaryContainer: '#fbe0a6',
      onTertiaryContainer: '#261a00',
      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',
      outline: '#717882',
      outlineVariant: '#c1c7d2',
      inverseSurface: '#2a313b',
      inverseOnSurface: '#eff1fb',
      inversePrimary: '#a2c9ff',
    },
  },

  // 9. Forest Sage
  {
    id: 'forest_sage',
    name: 'Forest Sage',
    subtitle: 'Natural earthy botanicals',
    dualTone: ['#233827', '#a4d3a2'],
    dark: {
      background: '#111512',
      onBackground: '#e1e4de',
      surface: '#111512',
      onSurface: '#e1e4de',
      surfaceVariant: '#424941',
      onSurfaceVariant: '#c2c9bf',
      surfaceContainerLowest: '#0c0f0d',
      surfaceContainerLow: '#191d1a',
      surfaceContainer: '#1d211e',
      surfaceContainerHigh: '#272c28',
      surfaceContainerHighest: '#323733',
      surfaceDim: '#111512',
      surfaceBright: '#373d39',
      primary: '#9ecfa2',
      onPrimary: '#063917',
      primaryContainer: '#20502b',
      onPrimaryContainer: '#b9ebbcd',
      secondary: '#b9ccb8',
      onSecondary: '#243427',
      secondaryContainer: '#3b4b3c',
      onSecondaryContainer: '#d5e8d4',
      tertiary: '#a0cfd2',
      onTertiary: '#00373a',
      tertiaryContainer: '#1f4e51',
      onTertiaryContainer: '#bcebee',
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      outline: '#8c938a',
      outlineVariant: '#424941',
      inverseSurface: '#e1e4de',
      inverseOnSurface: '#2e312e',
      inversePrimary: '#376940',
    },
    light: {
      background: '#f7faf4',
      onBackground: '#191d1a',
      surface: '#f7faf4',
      onSurface: '#191d1a',
      surfaceVariant: '#dee5db',
      onSurfaceVariant: '#424941',
      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: '#f1f5ee',
      surfaceContainer: '#ebefe8',
      surfaceContainerHigh: '#e6e9e3',
      surfaceContainerHighest: '#e0e4dd',
      surfaceDim: '#d8dcd5',
      surfaceBright: '#f7faf4',
      primary: '#376940',
      onPrimary: '#ffffff',
      primaryContainer: '#b9ebbcd',
      onPrimaryContainer: '#00210b',
      secondary: '#516353',
      onSecondary: '#ffffff',
      secondaryContainer: '#d5e8d4',
      onSecondaryContainer: '#101f13',
      tertiary: '#396568',
      onTertiary: '#ffffff',
      tertiaryContainer: '#bcebee',
      onTertiaryContainer: '#002022',
      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',
      outline: '#727970',
      outlineVariant: '#c2c9bf',
      inverseSurface: '#2e312e',
      inverseOnSurface: '#eff2ec',
      inversePrimary: '#9ecfa2',
    },
  },
];

export const PALETTE_STORAGE_KEY = 'reco_m3_palette_id';
export const DEFAULT_PALETTE_ID = 'dynamic_system';

export function getActivePalette(paletteId?: string): MaterialPalette {
  const id = paletteId || (typeof localStorage !== 'undefined' ? localStorage.getItem(PALETTE_STORAGE_KEY) : null) || DEFAULT_PALETTE_ID;

  if (id === 'dynamic_system') {
    return getDynamicSystemPalette();
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

  // If this is dynamic system, generate fresh tokens based on live OS AccentColor
  const activeTokens = palette.id === 'dynamic_system'
    ? (isDark ? getDynamicSystemPalette().dark : getDynamicSystemPalette().light)
    : (isDark ? palette.dark : palette.light);

  const root = document.documentElement;

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

  // Critical for Android Status Bar & Overscroll window blending
  document.documentElement.style.backgroundColor = activeTokens.background;
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  if (document.body) {
    document.body.style.backgroundColor = activeTokens.background;
  }

  // Update Status Bar theme-color meta tags
  updateStatusBarThemeColor(activeTokens.background, isDark, themeMode, palette);
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
    const darkBg = palette?.dark.background ?? (isDark ? targetColor : '#10131a');
    const lightBg = palette?.light.background ?? (!isDark ? targetColor : '#f8f9ff');

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
    faviconLink.setAttribute('href', isDark ? '/icons/icon-dark-32.png' : '/favicon.png');
  }

  const appleIcon = document.getElementById('apple-touch-icon') || document.querySelector('link[rel="apple-touch-icon"]');
  if (appleIcon) {
    appleIcon.setAttribute('href', isDark ? '/icons/icon-dark-180.png' : '/apple-touch-icon.png');
  }
}
