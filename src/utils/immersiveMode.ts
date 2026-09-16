import { useState, useEffect, useCallback } from 'react';

export const IMMERSIVE_STORAGE_KEY = 'reco_immersive_mode';

/**
 * Checks if HTML5 Fullscreen API is available in the current browser/runtime
 */
export function isFullscreenAvailable(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  const docEl = document.documentElement as any;
  return Boolean(
    doc.fullscreenEnabled ||
    docEl?.requestFullscreen ||
    doc.webkitFullscreenEnabled ||
    docEl?.webkitRequestFullscreen ||
    doc.mozFullScreenEnabled ||
    docEl?.mozRequestFullScreen ||
    doc.msFullscreenEnabled ||
    docEl?.msRequestFullscreen
  );
}

/**
 * Checks if the document is currently in native Fullscreen mode
 */
export function isCurrentlyFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  return Boolean(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

/**
 * Requests immersive edge-to-edge fullscreen (hiding the status bar and navigation bar)
 */
export async function requestImmersiveFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const docEl = document.documentElement as any;

  try {
    if (docEl?.requestFullscreen) {
      try {
        // navigationUI: 'hide' requests hiding the Android status bar and navigation bar on Chromium
        await docEl.requestFullscreen({ navigationUI: 'hide' });
        return true;
      } catch {
        // Fallback without options
        await docEl.requestFullscreen();
        return true;
      }
    } else if (docEl?.webkitRequestFullscreen) {
      await docEl.webkitRequestFullscreen();
      return true;
    } else if (docEl?.mozRequestFullScreen) {
      await docEl.mozRequestFullScreen();
      return true;
    } else if (docEl?.msRequestFullscreen) {
      await docEl.msRequestFullscreen();
      return true;
    }
  } catch (err) {
    console.warn('Fullscreen request blocked or not allowed in current context:', err);
    return false;
  }
  return false;
}

/**
 * Exits fullscreen mode, restoring the system status bar
 */
export async function exitImmersiveFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const doc = document as any;

  try {
    if (doc.exitFullscreen && isCurrentlyFullscreen()) {
      await doc.exitFullscreen();
      return true;
    } else if (doc.webkitExitFullscreen && isCurrentlyFullscreen()) {
      await doc.webkitExitFullscreen();
      return true;
    } else if (doc.mozCancelFullScreen && isCurrentlyFullscreen()) {
      await doc.mozCancelFullScreen();
      return true;
    } else if (doc.msExitFullscreen && isCurrentlyFullscreen()) {
      await doc.msExitFullscreen();
      return true;
    }
  } catch (err) {
    console.warn('Exit fullscreen failed:', err);
    return false;
  }
  return false;
}

export interface ImmersiveToggleResult {
  enabled: boolean;
  nativeFullscreen: boolean;
}

/**
 * Hook to manage immersive status-bar hiding mode
 */
export function useImmersiveMode() {
  const [isImmersive, setIsImmersive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(IMMERSIVE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const isSupported = isFullscreenAvailable();

  // Sync DOM class whenever isImmersive changes
  useEffect(() => {
    const root = document.documentElement;
    if (isImmersive) {
      root.classList.add('app-immersive');
    } else {
      root.classList.remove('app-immersive');
    }
  }, [isImmersive]);

  // Sync with native fullscreen changes (e.g. user gestures, swipe down, esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = isCurrentlyFullscreen();
      if (!active && isImmersive) {
        // The user exited native fullscreen via gesture
        setIsImmersive(false);
        try {
          localStorage.setItem(IMMERSIVE_STORAGE_KEY, 'false');
        } catch {}
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isImmersive]);

  const toggleImmersive = useCallback(async (): Promise<ImmersiveToggleResult> => {
    const targetState = !isImmersive;

    if (targetState) {
      const nativeSuccess = await requestImmersiveFullscreen();
      setIsImmersive(true);
      try {
        localStorage.setItem(IMMERSIVE_STORAGE_KEY, 'true');
      } catch {}
      return { enabled: true, nativeFullscreen: nativeSuccess };
    } else {
      await exitImmersiveFullscreen();
      setIsImmersive(false);
      try {
        localStorage.setItem(IMMERSIVE_STORAGE_KEY, 'false');
      } catch {}
      return { enabled: false, nativeFullscreen: false };
    }
  }, [isImmersive]);

  return {
    isImmersive,
    isSupported,
    toggleImmersive,
  };
}
