import { useState, useEffect } from 'react';

/**
 * Cross-Platform Detection and UI Adaptation Utility
 * Supports iOS, iPhone, iPad, Android (14/15/16/17+), macOS, Windows, Linux, and Web.
 */

export type PlatformType = 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'other';
export type DeviceType = 'iPhone' | 'iPad' | 'Android Phone' | 'Android Tablet' | 'Mac' | 'Windows PC' | 'Computer';
export type BrowserType = 'Safari' | 'Chrome' | 'Edge' | 'Firefox' | 'Samsung Internet' | 'Browser';

export interface PlatformInfo {
  platform: PlatformType;
  device: DeviceType;
  osName: string;
  browser: BrowserType;
  isIOS: boolean;
  isIPhone: boolean;
  isIPad: boolean;
  isAndroid: boolean;
  isMacOS: boolean;
  isWindows: boolean;
  isLinux: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  isDesktopOS: boolean;
  isStandalone: boolean;
  installPromptLabel: string;
  installGuideTitle: string;
  installGuideSubtitle: string;
  ecosystemStorageLabel: string;
  cloudSyncLabel: string;
  themeEngineLabel: string;
}

export type ViewModePreference = 'auto' | 'desktop' | 'mobile';
const VIEW_MODE_KEY = 'reco_view_mode_pref';

export function getViewModePreference(): ViewModePreference {
  if (typeof window === 'undefined') return 'auto';
  try {
    const val = localStorage.getItem(VIEW_MODE_KEY);
    if (val === 'desktop' || val === 'mobile' || val === 'auto') return val;
  } catch {}
  return 'auto';
}

export function setViewModePreference(mode: ViewModePreference): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode);
  } catch {}
}

export function detectPlatformInfo(): PlatformInfo {
  if (typeof window === 'undefined') {
    return {
      platform: 'android',
      device: 'Android Phone',
      osName: 'Android',
      browser: 'Chrome',
      isIOS: false,
      isIPhone: false,
      isIPad: false,
      isAndroid: true,
      isMacOS: false,
      isWindows: false,
      isLinux: false,
      isMobile: true,
      isDesktop: false,
      isDesktopOS: false,
      isStandalone: false,
      installPromptLabel: 'Install App',
      installGuideTitle: 'Install on Android',
      installGuideSubtitle: 'Add to Home Screen & App Drawer',
      ecosystemStorageLabel: 'Android Local App Storage',
      cloudSyncLabel: 'Google Drive & Cloud Sync',
      themeEngineLabel: 'Material 3 Monet Dynamic System',
    };
  }

  const ua = window.navigator.userAgent.toLowerCase();
  const platformStr = (window.navigator.platform || '').toLowerCase();

  // iOS detection (including iPad on iOS 13+ which reports MacIntel with touch points)
  const isIPhone = /iphone/.test(ua);
  const isIPad = /ipad/.test(ua) || (platformStr.includes('mac') && window.navigator.maxTouchPoints > 1);
  const isIOS = isIPhone || isIPad || /ipod/.test(ua);

  // Android detection
  const isAndroid = /android/i.test(ua);

  // Desktop OS detection (macOS, Windows, Linux, ChromeOS)
  const isMacOS = !isIOS && (platformStr.includes('mac') || /macintosh|mac os x/i.test(ua));
  const isWindows = platformStr.includes('win') || /windows/i.test(ua);
  const isLinux = !isAndroid && (platformStr.includes('linux') || /linux|x11/i.test(ua));
  const isChromeOS = /cros/i.test(ua);
  const isDesktopOS = isMacOS || isWindows || isLinux || isChromeOS;

  // Mobile User Agent signature
  const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua) || (/mobile/i.test(ua) && !isIPad);

  // Tablet detection (iPad, Android tablets, touch tablets)
  const isAndroidTablet = isAndroid && !/mobile/i.test(ua);
  const isTablet = isIPad || isAndroidTablet || (window.navigator.maxTouchPoints > 0 && Math.min(window.innerWidth, window.innerHeight) >= 600 && Math.min(window.innerWidth, window.innerHeight) <= 1024);

  // Orientation: portrait (vertical screen) vs landscape
  const isPortrait = window.innerHeight > window.innerWidth ||
    Boolean(window.matchMedia?.('(orientation: portrait)')?.matches);

  // View mode manual preference check
  const viewPref = getViewModePreference();

  // Desktop check based on User Agent, orientation, and viewport
  let isDesktop = false;
  if (viewPref === 'desktop') {
    isDesktop = true;
  } else if (viewPref === 'mobile') {
    isDesktop = false;
  } else {
    // Auto detection:
    // When in tablet mode vertical screen (portrait), KEEP UI SAME AS MOBILE UI (isDesktop = false).
    if (isPortrait && (isTablet || window.innerWidth <= 1080)) {
      isDesktop = false;
    } else if (isTablet) {
      // Tablet in landscape mode with adequate width -> Desktop layout
      isDesktop = !isPortrait && window.innerWidth >= 900;
    } else if (isDesktopOS) {
      // Desktop operating system in landscape / wide viewport -> Desktop layout
      isDesktop = window.innerWidth >= 960 && !isPortrait;
    } else {
      // Standard mobile vs wide viewport
      isDesktop = !isMobileUA && !isPortrait && window.innerWidth >= 1024;
    }
  }

  const isMobile = !isDesktop;

  // Browser detection
  let browser: BrowserType = 'Browser';
  if (/samsungbrowser/i.test(ua)) {
    browser = 'Samsung Internet';
  } else if (/edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  }

  // Standalone detection
  const isStandalone = Boolean(
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)')?.matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://') ||
    window.location.search.includes('mode=standalone')
  );

  let platform: PlatformType = 'other';
  let device: DeviceType = 'Computer';
  let osName = 'Device';
  let installPromptLabel = 'Install App';
  let installGuideTitle = 'Install Reco App';
  let installGuideSubtitle = 'Fast offline access & home screen shortcut';
  let ecosystemStorageLabel = 'On-Device Encrypted Storage';
  let cloudSyncLabel = 'Cloud & Google Drive Sync';
  let themeEngineLabel = 'Dynamic System Adaptation';

  if (isIOS) {
    platform = 'ios';
    device = isIPhone ? 'iPhone' : 'iPad';
    osName = isIPhone ? 'iOS / iPhone' : 'iPadOS';
    installPromptLabel = isIPhone ? 'Add to iPhone Home Screen' : 'Add to iPad Home Screen';
    installGuideTitle = isIPhone ? 'Install on iPhone' : 'Install on iPad';
    installGuideSubtitle = 'Add Reco directly to your iOS Home Screen';
    ecosystemStorageLabel = 'iOS Sandbox & Apple Keychain Private Storage';
    cloudSyncLabel = 'Google Drive & Apple Files Sync';
    themeEngineLabel = 'iOS Liquid Glass & System Color Adaptation';
  } else if (isAndroid) {
    platform = 'android';
    device = /mobile/i.test(ua) ? 'Android Phone' : 'Android Tablet';
    osName = 'Android';
    installPromptLabel = 'Install on Android';
    installGuideTitle = 'Install on Android';
    installGuideSubtitle = 'Adds Reco to your Home Screen & App Drawer';
    ecosystemStorageLabel = 'Android App Sandbox & Local SQLite/Storage';
    cloudSyncLabel = 'Google Drive & Cloud Sync';
    themeEngineLabel = 'Android 17 / Material 3 Monet Dynamic System';
  } else if (isMacOS) {
    platform = 'macos';
    device = 'Mac';
    osName = 'macOS';
    installPromptLabel = 'Install on Mac';
    installGuideTitle = 'Install Reco for macOS';
    installGuideSubtitle = 'Standalone Mac Dock & Launchpad Web App';
    ecosystemStorageLabel = 'macOS Local Application Sandbox';
    cloudSyncLabel = 'Google Drive & Local File System';
    themeEngineLabel = 'macOS Dynamic Accent & Liquid Glass';
  } else if (isWindows) {
    platform = 'windows';
    device = 'Windows PC';
    osName = 'Windows';
    installPromptLabel = 'Install on Windows';
    installGuideTitle = 'Install Reco on Windows';
    installGuideSubtitle = 'Pin to Windows Taskbar & Start Menu';
    ecosystemStorageLabel = 'Windows Local Storage & File System';
    cloudSyncLabel = 'Google Drive & Cloud Sync';
    themeEngineLabel = 'Windows Dynamic System Accent';
  } else if (isLinux) {
    platform = 'linux';
    device = 'Computer';
    osName = 'Linux';
    installPromptLabel = 'Install on Linux';
    installGuideTitle = 'Install Reco on Linux';
    installGuideSubtitle = 'Desktop Launcher & Application Menu';
    ecosystemStorageLabel = 'Linux File System & Local Storage';
    cloudSyncLabel = 'Google Drive & Local File System';
    themeEngineLabel = 'Dynamic System Colors';
  }

  return {
    platform,
    device,
    osName,
    browser,
    isIOS,
    isIPhone,
    isIPad,
    isAndroid,
    isMacOS,
    isWindows,
    isLinux,
    isMobile,
    isDesktop,
    isDesktopOS,
    isStandalone,
    installPromptLabel,
    installGuideTitle,
    installGuideSubtitle,
    ecosystemStorageLabel,
    cloudSyncLabel,
    themeEngineLabel,
  };
}

let cachedInfo: PlatformInfo | null = null;

export function getPlatformInfo(): PlatformInfo {
  if (!cachedInfo && typeof window !== 'undefined') {
    cachedInfo = detectPlatformInfo();
  }
  return cachedInfo || detectPlatformInfo();
}

/**
 * React hook that dynamically provides platform and screen info.
 * Updates on window resize or when view mode preference changes.
 */
export function usePlatformInfo(): PlatformInfo {
  const [info, setInfo] = useState<PlatformInfo>(() => getPlatformInfo());

  useEffect(() => {
    const handleUpdate = () => {
      cachedInfo = detectPlatformInfo();
      setInfo(cachedInfo);
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('orientationchange', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    let mql: MediaQueryList | null = null;
    try {
      mql = window.matchMedia?.('(orientation: portrait)');
      if (mql && mql.addEventListener) {
        mql.addEventListener('change', handleUpdate);
      }
    } catch {}

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('orientationchange', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      try {
        if (mql && mql.removeEventListener) {
          mql.removeEventListener('change', handleUpdate);
        }
      } catch {}
    };
  }, []);

  return info;
}

/**
 * React hook returning true when on desktop viewport & user agent.
 */
export function useIsDesktop(): boolean {
  const platform = usePlatformInfo();
  return platform.isDesktop;
}
