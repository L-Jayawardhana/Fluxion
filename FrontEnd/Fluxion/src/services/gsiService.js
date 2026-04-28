/**
 * gsiService.js — Shared Google Sign-In (GSI) initialization helper.
 *
 * Problem: `google.accounts.id.initialize()` must only be called ONCE per page
 * load. React StrictMode unmounts/remounts components in dev, resetting any
 * component-level ref guard to `false` and triggering a second init call.
 * Navigating between pages that both render a Google button compounds this.
 *
 * Solution: A module-level flag that persists for the entire JS session.
 * All pages share this module, so init is guaranteed to run exactly once.
 */

import { GOOGLE_CLIENT_ID } from './authService';

// Persists across component mount/unmount cycles and page navigations
let _initialized = false;

/**
 * Initialize GSI once. Subsequent calls are no-ops.
 * @param {function} callbackRef - A React ref whose `.current` always points to
 *   the latest callback function. Using a ref avoids stale closures without
 *   needing to re-initialize GSI.
 */
export function initializeGSI(callbackRef) {
    if (_initialized || !window.google) return;

    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => callbackRef.current?.(response),
    });

    _initialized = true;
}

/**
 * Render (or re-render) the Google Sign-In button inside the given container.
 * Safe to call multiple times — GSI handles re-renders gracefully.
 */
export function renderGSIButton(containerRef, options = {}) {
    if (!window.google || !containerRef.current) return;

    containerRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 420,
        ...options,
    });
}
