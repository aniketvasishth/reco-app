import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

const SESSION_DISMISS_STORAGE_KEY = 'reco_pwa_prompt_dismissed_session';
const PERMANENT_INSTALLED_KEY = 'reco_pwa_installed_permanent';
const HOMESCREEN_ADDED_KEY = 'reco_pwa_homescreen_added';
const LEGACY_INSTALLED_KEY = 'reco_pwa_installed';
const PERMANENT_DISMISS_KEY = 'reco_pwa_prompt_dismissed_permanent';

/**
 * Checks if the application is currently running in standalone display mode
 * (launched from phone homescreen icon or desktop standalone window)
 */
export function isAppRunningInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;

  const isStandaloneMedia =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)')?.matches ||
    window.matchMedia?.('(display-mode: fullscreen)')?.matches ||
    window.matchMedia?.('(display-mode: minimal-ui)')?.matches;

  const isIosStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  const isReferrerAndroidApp =
    typeof document !== 'undefined' && document.referrer.includes('android-app://');

  const isQueryStandalone =
    typeof window !== 'undefined' && window.location.search.includes('mode=standalone');

  return Boolean(isStandaloneMedia || isIosStandalone || isReferrerAndroidApp || isQueryStandalone);
}

/**
 * Checks if the user has previously installed the PWA or added a shortcut to Home Screen
 */
export function isAppMarkedAsInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  if (isAppRunningInStandaloneMode()) return true;

  try {
    const permanentInstalled = localStorage.getItem(PERMANENT_INSTALLED_KEY) === 'true';
    const homescreenAdded = localStorage.getItem(HOMESCREEN_ADDED_KEY) === 'true';
    const legacyInstalled = localStorage.getItem(LEGACY_INSTALLED_KEY) === 'true';
    const permanentDismiss = localStorage.getItem(PERMANENT_DISMISS_KEY) === 'true';

    return permanentInstalled || homescreenAdded || legacyInstalled || permanentDismiss;
  } catch {
    return false;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window !== 'undefined' ? window.__pwaDeferredPrompt || null : null)
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isAppMarkedAsInstalled());
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAutoPrompt, setShowAutoPrompt] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);

  useEffect(() => {
    // 1. Initial Synchronous Check for Standalone Mode & Persistent Storage Flags
    const initialStandalone = isAppRunningInStandaloneMode();
    const previouslyInstalled = isAppMarkedAsInstalled();

    if (initialStandalone || previouslyInstalled) {
      setIsInstalled(true);
    }

    // 2. Detect device platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/i.test(ua);
    const isMobileDevice =
      isIOSDevice ||
      isAndroidDevice ||
      /webos|blackberry|iemobile|opera mini/i.test(ua) ||
      window.innerWidth <= 768;

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsMobile(isMobileDevice);

    // 3. Check session and permanent dismiss flags
    let isDismissed = false;
    try {
      const sessionDismissed = sessionStorage.getItem(SESSION_DISMISS_STORAGE_KEY) === 'true';
      const permanentDismissed = localStorage.getItem(PERMANENT_DISMISS_KEY) === 'true';
      isDismissed = sessionDismissed || permanentDismissed;
    } catch {
      // Ignore
    }
    setUserDismissed(isDismissed);

    // 4. Query native Android / Chrome getInstalledRelatedApps() API
    let isCancelled = false;
    const queryRelatedApps = async () => {
      if (typeof navigator !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
        try {
          const getInstalled = (
            navigator as Navigator & {
              getInstalledRelatedApps?: () => Promise<Array<{ id?: string; platform?: string; url?: string }>>;
            }
          ).getInstalledRelatedApps;

          if (typeof getInstalled === 'function') {
            const relatedApps = await getInstalled.call(navigator);
            if (!isCancelled && Array.isArray(relatedApps) && relatedApps.length > 0) {
              // The app is already installed on the user's Android / Chrome device!
              setIsInstalled(true);
              setShowAutoPrompt(false);
              try {
                localStorage.setItem(PERMANENT_INSTALLED_KEY, 'true');
                localStorage.setItem(LEGACY_INSTALLED_KEY, 'true');
              } catch {}
              return true;
            }
          }
        } catch (err) {
          console.debug('getInstalledRelatedApps check non-fatal error:', err);
        }
      }
      return false;
    };

    // Run the native installed related apps check
    queryRelatedApps();

    // 5. Auto-show prompt banner ONLY if NOT running standalone, NOT already marked as installed, and NOT dismissed
    let autoPromptTimer: number | null = null;
    if (!initialStandalone && !previouslyInstalled && !isDismissed) {
      autoPromptTimer = window.setTimeout(() => {
        if (!isCancelled && !isAppMarkedAsInstalled()) {
          setShowAutoPrompt(true);
        }
      }, 1200);
    }

    // 6. Listen for browser install prompt event (Chrome / Edge / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pwaDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);

      // If user has not installed and not dismissed, show prompt
      if (!isAppMarkedAsInstalled() && !isDismissed) {
        setShowAutoPrompt(true);
      }
    };

    // 7. Listen for successful installation event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__pwaDeferredPrompt = null;
      setShowAutoPrompt(false);
      try {
        localStorage.setItem(PERMANENT_INSTALLED_KEY, 'true');
        localStorage.setItem(LEGACY_INSTALLED_KEY, 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      isCancelled = true;
      if (autoPromptTimer !== null) {
        clearTimeout(autoPromptTimer);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios_guide' | 'android_guide' | 'unsupported'> => {
    const activePrompt = deferredPrompt || window.__pwaDeferredPrompt;

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setShowAutoPrompt(false);
          setDeferredPrompt(null);
          window.__pwaDeferredPrompt = null;
          try {
            localStorage.setItem(PERMANENT_INSTALLED_KEY, 'true');
            localStorage.setItem(LEGACY_INSTALLED_KEY, 'true');
          } catch {}
          return 'accepted';
        } else {
          return 'dismissed';
        }
      } catch (err) {
        console.warn('Native PWA prompt execution error:', err);
      }
    }

    // If on iOS Safari, show Safari share -> Add to Home Screen guide
    if (isIOS) {
      return 'ios_guide';
    }

    // If on Android and native prompt was not intercepted, show manual guide
    if (isAndroid) {
      return 'android_guide';
    }

    return 'unsupported';
  }, [deferredPrompt, isIOS, isAndroid]);

  const dismissPrompt = useCallback((permanent = false) => {
    setShowAutoPrompt(false);
    setUserDismissed(true);
    try {
      sessionStorage.setItem(SESSION_DISMISS_STORAGE_KEY, 'true');
      if (permanent) {
        localStorage.setItem(PERMANENT_DISMISS_KEY, 'true');
      }
    } catch {
      // Ignore
    }
  }, []);

  const markAsAddedToHomeScreen = useCallback(() => {
    setIsInstalled(true);
    setShowAutoPrompt(false);
    setUserDismissed(true);
    try {
      localStorage.setItem(HOMESCREEN_ADDED_KEY, 'true');
      localStorage.setItem(PERMANENT_INSTALLED_KEY, 'true');
      localStorage.setItem(LEGACY_INSTALLED_KEY, 'true');
    } catch {
      // Ignore
    }
  }, []);

  const resetInstallState = useCallback(() => {
    try {
      localStorage.removeItem(PERMANENT_INSTALLED_KEY);
      localStorage.removeItem(HOMESCREEN_ADDED_KEY);
      localStorage.removeItem(LEGACY_INSTALLED_KEY);
      localStorage.removeItem(PERMANENT_DISMISS_KEY);
      sessionStorage.removeItem(SESSION_DISMISS_STORAGE_KEY);
    } catch {}
    setIsInstalled(isAppRunningInStandaloneMode());
    setUserDismissed(false);
    setShowAutoPrompt(!isAppRunningInStandaloneMode());
  }, []);

  const openPromptManually = useCallback(() => {
    setShowAutoPrompt(true);
  }, []);

  return {
    isInstallable: !!deferredPrompt || isIOS || isAndroid,
    hasDeferredPrompt: !!deferredPrompt || !!window.__pwaDeferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    isMobile,
    showAutoPrompt,
    userDismissed,
    triggerInstall,
    dismissPrompt,
    markAsAddedToHomeScreen,
    resetInstallState,
    openPromptManually,
    setShowAutoPrompt,
  };
}
