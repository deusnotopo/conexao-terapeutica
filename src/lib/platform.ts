/**
 * platform.ts — Central Web-Browser Global Declarations
 *
 * React Native (non-DOM tsconfig) does not include browser lib types.
 * We declare the minimal surface we actually USE here — once — instead of
 * scattering `declare const window: any` across every screen file.
 *
 * Runtime guards (typeof window === 'undefined') are still required
 * in every call-site because these globals do not exist on native.
 */

// ─── Window ───────────────────────────────────────────────────────────────────

/**
 * Typed subset of the browser `Window` object used across the app.
 * Only declare what we actually call — nothing more.
 */
export declare const webWindow:
  | {
      open: (url: string, target?: string) => void;
      confirm: (msg: string) => boolean;
      alert: (msg: string) => void;
    }
  | undefined;

/**
 * Safe accessor — returns `undefined` on native, typed WebWindow on web.
 * Usage: `getWebWindow()?.open(url, '_blank')`
 */
export function getWebWindow(): typeof webWindow {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    return (globalThis as unknown as { window: typeof webWindow }).window;
  }
  return undefined;
}

// ─── Notification API ─────────────────────────────────────────────────────────

/**
 * Typed minimal surface of the browser Notification API.
 * Runtime guard: always check `isNotificationSupported()` before use.
 */
export interface WebNotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
}

export function isNotificationSupported(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    'window' in globalThis &&
    'Notification' in (globalThis as unknown as Record<string, unknown>)
  );
}
