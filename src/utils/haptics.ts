/**
 * Material 3 Haptic Feedback Engine using Web Vibration API
 * Provides subtle, tactile feedback on supported Android / Chrome / Mobile devices.
 */

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'scan'
  | 'success'
  | 'warning'
  | 'error'
  | 'delete';

const STORAGE_KEY = 'reco_haptics_enabled';

/**
 * Checks if Vibration API is available and supported in current environment
 */
export function isHapticsSupported(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Checks if haptics are enabled by user preference (defaults to true)
 */
export function getHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Sets user preference for haptic feedback
 */
export function setHapticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.warn('Failed to save haptics preference', e);
  }
}

/**
 * Executes a subtle haptic vibration pattern
 */
export function triggerHaptic(pattern: number | number[] = 12): boolean {
  if (!isHapticsSupported() || !getHapticsEnabled()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

/**
 * High-level semantic haptic feedback triggers
 */
export function hapticFeedback(type: HapticType = 'light'): boolean {
  if (!isHapticsSupported() || !getHapticsEnabled()) return false;

  try {
    switch (type) {
      case 'selection':
        // Extremely subtle 6ms tick for tab/filter/channel chip selection
        return navigator.vibrate(6);

      case 'light':
        // Subtle 12ms tap for standard buttons, accordions, and quick toggles
        return navigator.vibrate(12);

      case 'medium':
        // 25ms tactile bump for opening modals, actions, drawers
        return navigator.vibrate(25);

      case 'scan':
        // 35ms camera shutter/viewfinder capture tick
        return navigator.vibrate(35);

      case 'heavy':
        // 45ms pronounced pulse for major actions
        return navigator.vibrate(45);

      case 'success':
        // Double pulse [15ms, 40ms pause, 25ms] on OCR completed / save / export
        return navigator.vibrate([15, 40, 25]);

      case 'warning':
      case 'delete':
        // Distinct alert pattern [30ms, 45ms pause, 45ms] for deletion / item removal
        return navigator.vibrate([30, 45, 45]);

      case 'error':
        // Triple error pulse [25ms, 30ms pause, 25ms, 30ms pause, 40ms]
        return navigator.vibrate([25, 30, 25, 30, 40]);

      default:
        return navigator.vibrate(12);
    }
  } catch {
    return false;
  }
}
