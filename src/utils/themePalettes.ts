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
  dark: ColorTokens;
  light: ColorTokens;
}

export const MATERIAL_PALETTES: MaterialPalette[] = [
  {
    id: 'burgundy_rose',
    name: 'Burgundy & Rose',
    subtitle: 'Matches your active Wallpaper Colors',
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
  {
    id: 'peach_teal',
    name: 'Peach & Teal',
    subtitle: 'Warm sunset & cool contrast',
    dualTone: ['#763420', '#63dac5'],
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
  {
    id: 'ice_blue',
    name: 'Ice Blue & Lavender',
    subtitle: 'Cool crisp Nordic tones',
    dualTone: ['#183a54', '#b5c8e8'],
    dark: {
      background: '#101418',
      onBackground: '#e0e2e8',
      surface: '#101418',
      onSurface: '#e0e2e8',
      surfaceVariant: '#41474d',
      onSurfaceVariant: '#c1c7ce',
      surfaceContainerLowest: '#0b0e12',
      surfaceContainerLow: '#181c20',
      surfaceContainer: '#1c2024',
      surfaceContainerHigh: '#272a2f',
      surfaceContainerHighest: '#31353a',
      surfaceDim: '#101418',
      surfaceBright: '#363a3f',
      primary: '#97cbff',
      onPrimary: '#003353',
      primaryContainer: '#004a75',
      onPrimaryContainer: '#cfe5ff',
      secondary: '#b9c8da',
      onSecondary: '#233240',
      secondaryContainer: '#3a4857',
      onSecondaryContainer: '#d5e4f6',
      tertiary: '#d4bfe7',
      onTertiary: '#392a4a',
      tertiaryContainer: '#514062',
      onTertiaryContainer: '#efdbff',
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      outline: '#8b9198',
      outlineVariant: '#41474d',
      inverseSurface: '#e0e2e8',
      inverseOnSurface: '#2d3135',
      inversePrimary: '#006399',
    },
    light: {
      background: '#f7f9ff',
      onBackground: '#181c20',
      surface: '#f7f9ff',
      onSurface: '#181c20',
      surfaceVariant: '#dde3ea',
      onSurfaceVariant: '#41474d',
      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: '#f1f4fa',
      surfaceContainer: '#ebedf4',
      surfaceContainerHigh: '#e5e8ee',
      surfaceContainerHighest: '#dfe2e8',
      surfaceDim: '#d8dae0',
      surfaceBright: '#f7f9ff',
      primary: '#006399',
      onPrimary: '#ffffff',
      primaryContainer: '#cfe5ff',
      onPrimaryContainer: '#001d32',
      secondary: '#51606f',
      onSecondary: '#ffffff',
      secondaryContainer: '#d5e4f6',
      onSecondaryContainer: '#0e1d2a',
      tertiary: '#69587b',
      onTertiary: '#ffffff',
      tertiaryContainer: '#efdbff',
      onTertiaryContainer: '#241534',
      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',
      outline: '#71787e',
      outlineVariant: '#c1c7ce',
      inverseSurface: '#2d3135',
      inverseOnSurface: '#eff1f7',
      inversePrimary: '#97cbff',
    },
  },
  {
    id: 'forest_sage',
    name: 'Forest Sage & Mint',
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
      surfaceBright: '#373c38',
      primary: '#a4d3a2',
      onPrimary: '#0f3817',
      primaryContainer: '#28502b',
      onPrimaryContainer: '#bfeec0',
      secondary: '#b9ccb6',
      onSecondary: '#243425',
      secondaryContainer: '#3a4b3a',
      onSecondaryContainer: '#d5e8d1',
      tertiary: '#a2ced9',
      onTertiary: '#023640',
      tertiaryContainer: '#214d57',
      onTertiaryContainer: '#bdeaf5',
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      outline: '#8c938a',
      outlineVariant: '#424941',
      inverseSurface: '#e1e4de',
      inverseOnSurface: '#2e312d',
      inversePrimary: '#3f6841',
    },
    light: {
      background: '#f7faf4',
      onBackground: '#191d19',
      surface: '#f7faf4',
      onSurface: '#191d19',
      surfaceVariant: '#dee5db',
      onSurfaceVariant: '#424941',
      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: '#f1f5ee',
      surfaceContainer: '#ebefe9',
      surfaceContainerHigh: '#e6eae3',
      surfaceContainerHighest: '#e0e4dd',
      surfaceDim: '#d9ddd6',
      surfaceBright: '#f7faf4',
      primary: '#3f6841',
      onPrimary: '#ffffff',
      primaryContainer: '#bfeec0',
      onPrimaryContainer: '#002107',
      secondary: '#516351',
      onSecondary: '#ffffff',
      secondaryContainer: '#d5e8d1',
      onSecondaryContainer: '#101f11',
      tertiary: '#39656f',
      onTertiary: '#ffffff',
      tertiaryContainer: '#bdeaf5',
      onTertiaryContainer: '#001f26',
      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',
      outline: '#727971',
      outlineVariant: '#c2c9bf',
      inverseSurface: '#2e312e',
      inverseOnSurface: '#eff2ec',
      inversePrimary: '#a4d3a2',
    },
  },
  {
    id: 'royal_violet',
    name: 'Royal Violet & Orchid',
    subtitle: 'Deep dusk & amethyst tones',
    dualTone: ['#3b2650', '#d8b9f7'],
    dark: {
      background: '#16121b',
      onBackground: '#e6e0e9',
      surface: '#16121b',
      onSurface: '#e6e0e9',
      surfaceVariant: '#49454f',
      onSurfaceVariant: '#cbc4cf',
      surfaceContainerLowest: '#100c15',
      surfaceContainerLow: '#1e1a23',
      surfaceContainer: '#221e27',
      surfaceContainerHigh: '#2d2832',
      surfaceContainerHighest: '#38333d',
      surfaceDim: '#16121b',
      surfaceBright: '#3e3843',
      primary: '#d8b9f7',
      onPrimary: '#3c2357',
      primaryContainer: '#533b6e',
      onPrimaryContainer: '#eedcff',
      secondary: '#cec2db',
      onSecondary: '#352d40',
      secondaryContainer: '#4c4357',
      onSecondaryContainer: '#ebdef8',
      tertiary: '#f1b7c3',
      onTertiary: '#4a2530',
      tertiaryContainer: '#633b46',
      onTertiaryContainer: '#ffd9df',
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      outline: '#948f99',
      outlineVariant: '#49454f',
      inverseSurface: '#e6e0e9',
      inverseOnSurface: '#322f36',
      inversePrimary: '#6c5387',
    },
    light: {
      background: '#fdf7ff',
      onBackground: '#1d1a22',
      surface: '#fdf7ff',
      onSurface: '#1d1a22',
      surfaceVariant: '#e7e0eb',
      onSurfaceVariant: '#49454f',
      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: '#f7f1fb',
      surfaceContainer: '#f1ecf5',
      surfaceContainerHigh: '#ebe6f0',
      surfaceContainerHighest: '#e5e0ea',
      surfaceDim: '#dfdbe4',
      surfaceBright: '#fdf7ff',
      primary: '#6c5387',
      onPrimary: '#ffffff',
      primaryContainer: '#eedcff',
      onPrimaryContainer: '#260e40',
      secondary: '#645b70',
      onSecondary: '#ffffff',
      secondaryContainer: '#ebdef8',
      onSecondaryContainer: '#20182a',
      tertiary: '#7e525d',
      onTertiary: '#ffffff',
      tertiaryContainer: '#ffd9df',
      onTertiaryContainer: '#32101b',
      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',
      outline: '#7a757f',
      outlineVariant: '#cbc4cf',
      inverseSurface: '#322f37',
      inverseOnSurface: '#f5eff8',
      inversePrimary: '#d8b9f7',
    },
  },
  {
    id: 'ocean_cyan',
    name: 'Ocean & Emerald',
    subtitle: 'Deep sea & vibrant aqua',
    dualTone: ['#123d42', '#72d8dc'],
    dark: {
      background: '#0e1515',
      onBackground: '#dee4e4',
      surface: '#0e1515',
      onSurface: '#dee4e4',
      surfaceVariant: '#3f4848',
      onSurfaceVariant: '#bec8c8',
      surfaceContainerLowest: '#090f10',
      surfaceContainerLow: '#171d1e',
      surfaceContainer: '#1b2122',
      surfaceContainerHigh: '#252c2c',
      surfaceContainerHighest: '#303737',
      surfaceDim: '#0e1515',
      surfaceBright: '#363d3e',
      primary: '#72d8dc',
      onPrimary: '#00373a',
      primaryContainer: '#004f53',
      onPrimaryContainer: '#90f4f8',
      secondary: '#b1cbcc',
      onSecondary: '#1b3435',
      secondaryContainer: '#324b4c',
      onSecondaryContainer: '#cde7e8',
      tertiary: '#b6c8e8',
      onTertiary: '#20324b',
      tertiaryContainer: '#374863',
      onTertiaryContainer: '#d6e3ff',
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      outline: '#899393',
      outlineVariant: '#3f4848',
      inverseSurface: '#dee4e4',
      inverseOnSurface: '#2b3132',
      inversePrimary: '#00696e',
    },
    light: {
      background: '#f4fbfb',
      onBackground: '#161d1d',
      surface: '#f4fbfb',
      onSurface: '#161d1d',
      surfaceVariant: '#dae5e5',
      onSurfaceVariant: '#3f4848',
      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: '#eef5f5',
      surfaceContainer: '#e8eff0',
      surfaceContainerHigh: '#e2eaeb',
      surfaceContainerHighest: '#dce4e5',
      surfaceDim: '#d6dedf',
      surfaceBright: '#f4fbfb',
      primary: '#00696e',
      onPrimary: '#ffffff',
      primaryContainer: '#90f4f8',
      onPrimaryContainer: '#002022',
      secondary: '#4a6263',
      onSecondary: '#ffffff',
      secondaryContainer: '#cde7e8',
      onSecondaryContainer: '#051f20',
      tertiary: '#4e607c',
      onTertiary: '#ffffff',
      tertiaryContainer: '#d6e3ff',
      onTertiaryContainer: '#071c35',
      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',
      outline: '#6f7979',
      outlineVariant: '#bec8c8',
      inverseSurface: '#2b3132',
      inverseOnSurface: '#ecf2f2',
      inversePrimary: '#72d8dc',
    },
  },
  {
    id: 'charcoal_neutral',
    name: 'Charcoal & Slate',
    subtitle: 'Classic balanced monochrome',
    dualTone: ['#2b2d30', '#c6c6c8'],
    dark: {
      background: '#121315',
      onBackground: '#e2e2e5',
      surface: '#121315',
      onSurface: '#e2e2e5',
      surfaceVariant: '#44474b',
      onSurfaceVariant: '#c4c7cc',
      surfaceContainerLowest: '#0d0e10',
      surfaceContainerLow: '#1a1b1d',
      surfaceContainer: '#1e1f21',
      surfaceContainerHigh: '#292a2c',
      surfaceContainerHighest: '#333537',
      surfaceDim: '#121315',
      surfaceBright: '#393a3d',
      primary: '#c4c6cb',
      onPrimary: '#2d3034',
      primaryContainer: '#44474b',
      onPrimaryContainer: '#e1e3e7',
      secondary: '#c5c6ca',
      onSecondary: '#2e3134',
      secondaryContainer: '#44474a',
      onSecondaryContainer: '#e1e2e6',
      tertiary: '#c7c6cb',
      onTertiary: '#303034',
      tertiaryContainer: '#46464b',
      onTertiaryContainer: '#e4e2e7',
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      outline: '#8e9195',
      outlineVariant: '#44474b',
      inverseSurface: '#e2e2e5',
      inverseOnSurface: '#2f3033',
      inversePrimary: '#5c5e63',
    },
    light: {
      background: '#fbf8fa',
      onBackground: '#1a1b1e',
      surface: '#fbf8fa',
      onSurface: '#1a1b1e',
      surfaceVariant: '#e1e2e6',
      onSurfaceVariant: '#44474b',
      surfaceContainerLowest: '#ffffff',
      surfaceContainerLow: '#f5f3f6',
      surfaceContainer: '#efeef1',
      surfaceContainerHigh: '#eae8eb',
      surfaceContainerHighest: '#e4e2e5',
      surfaceDim: '#dedde0',
      surfaceBright: '#fbf8fa',
      primary: '#5c5e63',
      onPrimary: '#ffffff',
      primaryContainer: '#e1e3e7',
      onPrimaryContainer: '#191c1f',
      secondary: '#5d5f62',
      onSecondary: '#ffffff',
      secondaryContainer: '#e1e2e6',
      onSecondaryContainer: '#1a1c1e',
      tertiary: '#5f5e63',
      onTertiary: '#ffffff',
      tertiaryContainer: '#e4e2e7',
      onTertiaryContainer: '#1b1b20',
      error: '#ba1a1a',
      onError: '#ffffff',
      errorContainer: '#ffdad6',
      onErrorContainer: '#410002',
      outline: '#75777a',
      outlineVariant: '#c4c7cc',
      inverseSurface: '#2f3033',
      inverseOnSurface: '#f1f0f3',
      inversePrimary: '#c4c6cb',
    },
  },
];

export const PALETTE_STORAGE_KEY = 'reco_m3_palette_id';
export const DEFAULT_PALETTE_ID = 'burgundy_rose'; // Matches user's Pixel Barca Wallpaper Colors

export function getActivePalette(paletteId?: string): MaterialPalette {
  const id = paletteId || (typeof localStorage !== 'undefined' ? localStorage.getItem(PALETTE_STORAGE_KEY) : null) || DEFAULT_PALETTE_ID;
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

  const tokens = isDark ? palette.dark : palette.light;
  const root = document.documentElement;

  // Set CSS Variables on root
  root.style.setProperty('--md-sys-color-background', tokens.background);
  root.style.setProperty('--md-sys-color-on-background', tokens.onBackground);
  root.style.setProperty('--md-sys-color-surface', tokens.surface);
  root.style.setProperty('--md-sys-color-on-surface', tokens.onSurface);
  root.style.setProperty('--md-sys-color-surface-variant', tokens.surfaceVariant);
  root.style.setProperty('--md-sys-color-on-surface-variant', tokens.onSurfaceVariant);

  root.style.setProperty('--md-sys-color-surface-container-lowest', tokens.surfaceContainerLowest);
  root.style.setProperty('--md-sys-color-surface-container-low', tokens.surfaceContainerLow);
  root.style.setProperty('--md-sys-color-surface-container', tokens.surfaceContainer);
  root.style.setProperty('--md-sys-color-surface-container-high', tokens.surfaceContainerHigh);
  root.style.setProperty('--md-sys-color-surface-container-highest', tokens.surfaceContainerHighest);
  root.style.setProperty('--md-sys-color-surface-dim', tokens.surfaceDim);
  root.style.setProperty('--md-sys-color-surface-bright', tokens.surfaceBright);

  root.style.setProperty('--md-sys-color-primary', tokens.primary);
  root.style.setProperty('--md-sys-color-on-primary', tokens.onPrimary);
  root.style.setProperty('--md-sys-color-primary-container', tokens.primaryContainer);
  root.style.setProperty('--md-sys-color-on-primary-container', tokens.onPrimaryContainer);

  root.style.setProperty('--md-sys-color-secondary', tokens.secondary);
  root.style.setProperty('--md-sys-color-on-secondary', tokens.onSecondary);
  root.style.setProperty('--md-sys-color-secondary-container', tokens.secondaryContainer);
  root.style.setProperty('--md-sys-color-on-secondary-container', tokens.onSecondaryContainer);

  root.style.setProperty('--md-sys-color-tertiary', tokens.tertiary);
  root.style.setProperty('--md-sys-color-on-tertiary', tokens.onTertiary);
  root.style.setProperty('--md-sys-color-tertiary-container', tokens.tertiaryContainer);
  root.style.setProperty('--md-sys-color-on-tertiary-container', tokens.onTertiaryContainer);

  root.style.setProperty('--md-sys-color-error', tokens.error);
  root.style.setProperty('--md-sys-color-on-error', tokens.onError);
  root.style.setProperty('--md-sys-color-error-container', tokens.errorContainer);
  root.style.setProperty('--md-sys-color-on-error-container', tokens.onErrorContainer);

  root.style.setProperty('--md-sys-color-outline', tokens.outline);
  root.style.setProperty('--md-sys-color-outline-variant', tokens.outlineVariant);

  root.style.setProperty('--md-sys-color-inverse-surface', tokens.inverseSurface);
  root.style.setProperty('--md-sys-color-inverse-on-surface', tokens.inverseOnSurface);
  root.style.setProperty('--md-sys-color-inverse-primary', tokens.inversePrimary);

  // Critical for Android Status Bar & Overscroll window blending
  document.documentElement.style.backgroundColor = tokens.background;
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  if (document.body) {
    document.body.style.backgroundColor = tokens.background;
  }

  // Update Status Bar theme-color meta tags
  updateStatusBarThemeColor(tokens.background, isDark, themeMode, palette);
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
  // In explicit light mode, setting color-scheme to 'light' signals to Android Chrome
  // that the document is solely in light mode, preventing UA auto-darkening and dark bar enforcement.
  let colorSchemeMeta = document.getElementById('color-scheme-meta') as HTMLMetaElement | null;
  if (!colorSchemeMeta) {
    colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  }
  if (colorSchemeMeta) {
    colorSchemeMeta.setAttribute('content', themeMode === 'system' ? 'light dark' : (isDark ? 'dark' : 'light'));
  }

  // 3. Update theme-color meta tags
  // CRITICAL RULE FOR CHROME ON ANDROID:
  // When an Android device has system Dark Mode enabled and the user selects Light Mode:
  // If ANY meta tag with media="(prefers-color-scheme: dark)" is present in the document,
  // Chrome on Android will MATCH that tag. If that tag's content is set to a light color (like #fff0f3),
  // Chrome rejects the light color for dark mode and forces the status bar to solid black (#000000),
  // while concurrently setting status bar icons to dark (black on black!).
  //
  // Therefore, in EXPLICIT mode ('light' or 'dark'):
  // There must be ONE and ONLY ONE <meta name="theme-color"> tag with NO media attribute.
  // Any media-specific tags (theme-color-dark, theme-color-light) must be removed.
  // Additionally, we do NOT wipe/recreate the canonical base tag, but rather update its content attribute
  // in-place so Chromium's native WebContentsObserver immediately applies the change without fallback flash.

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
    // In System Auto mode: provide matching media query tags
    // prefers-color-scheme: dark gets the palette's genuine dark background
    // prefers-color-scheme: light gets the palette's genuine light background
    const darkBg = palette?.dark.background ?? (isDark ? targetColor : '#221016');
    const lightBg = palette?.light.background ?? (!isDark ? targetColor : '#fff0f3');

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

    // Fallback base tag matches current active state
    baseMeta.removeAttribute('media');
    baseMeta.setAttribute('content', targetColor);
  } else {
    // In EXPLICIT mode ('light' or 'dark'):
    // Remove media query tags so Chrome for Android cannot match system dark mode query.
    if (darkMeta) darkMeta.remove();
    if (lightMeta) lightMeta.remove();

    // Clean up any other stray theme-color tags with media queries
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
}
