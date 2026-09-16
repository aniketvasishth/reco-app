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

const DISMISS_STORAGE_KEY = 'reco_pwa_prompt_dismissed_session';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window !== 'undefined' ? window.__pwaDeferredPrompt || null : null)
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAutoPrompt, setShowAutoPrompt] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA or launched via homescreen)
    const checkIsInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://') ||
        window.location.search.includes('mode=standalone');
      return isStandalone;
    };

    const standalone = checkIsInstalled();
    setIsInstalled(standalone);

    // Detect device platform
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

    // Check if user dismissed in this session
    let dismissedInSession = false;
    try {
      dismissedInSession = sessionStorage.getItem(DISMISS_STORAGE_KEY) === 'true';
    } catch {
      // Ignore
    }
    setUserDismissed(dismissedInSession);

    // Auto-show prompt banner if not already installed and not dismissed
    let autoPromptTimer: number | null = null;
    if (!standalone && !dismissedInSession) {
      autoPromptTimer = window.setTimeout(() => {
        setShowAutoPrompt(true);
      }, 800);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pwaDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      if (!standalone && !dismissedInSession) {
        setShowAutoPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__pwaDeferredPrompt = null;
      setShowAutoPrompt(false);
      try {
        localStorage.setItem('reco_pwa_installed', 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
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
            localStorage.setItem('reco_pwa_installed', 'true');
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

  const dismissPrompt = useCallback(() => {
    setShowAutoPrompt(false);
    setUserDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
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
    openPromptManually,
    setShowAutoPrompt,
  };
}
