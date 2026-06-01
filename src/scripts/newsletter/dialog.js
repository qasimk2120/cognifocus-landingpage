/**
 * Newsletter dialog — centered modal overlay, delayed trigger.
 *
 * Shows when EITHER condition is met first:
 *   1. User has been on the page for 45 seconds, OR
 *   2. User has scrolled ≥ 25% of the document height
 *
 * Suppressed entirely if:
 *   - User already joined  (localStorage: cognifocus_newsletter_joined = "true")
 *   - User dismissed within the last 7 days
 *     (localStorage: cognifocus_newsletter_dialog_dismissed = <timestamp ms>)
 */

import {
  NEWSLETTER_JOINED_KEY,
  NEWSLETTER_DIALOG_DISMISSED_KEY,
  NEWSLETTER_DIALOG_DELAY_MS,
  NEWSLETTER_DIALOG_DISMISS_DURATION_MS,
} from "./constants.js";

const SCROLL_THRESHOLD = 0.25; // 25% of document height

function tryLocalStorage(fn) {
  try {
    return fn();
  } catch {
    return null;
  }
}

function hasAlreadyJoined() {
  return tryLocalStorage(() => localStorage.getItem(NEWSLETTER_JOINED_KEY)) === "true";
}

function wasDismissedRecently() {
  const raw = tryLocalStorage(() => localStorage.getItem(NEWSLETTER_DIALOG_DISMISSED_KEY));
  if (!raw) return false;
  const ts = Number(raw);
  return !isNaN(ts) && Date.now() - ts < NEWSLETTER_DIALOG_DISMISS_DURATION_MS;
}

function recordDismissal() {
  tryLocalStorage(() =>
    localStorage.setItem(NEWSLETTER_DIALOG_DISMISSED_KEY, String(Date.now()))
  );
}

export function initNewsletterDialog({ containerId, closeButtonId, onShow }) {
  const container = document.getElementById(containerId);
  const closeButton = document.getElementById(closeButtonId);

  if (!container) return;

  let triggered = false;

  // forceOpen: manual trigger (bypasses the triggered guard — used by footer link).
  // Works even after auto-trigger already fired.
  function forceOpen() {
    window.removeEventListener("scroll", onScroll, { passive: true });
    triggered = true;
    container.hidden = false;
    window.requestAnimationFrame(() => {
      container.classList.add("is-visible");
      const firstInput = container.querySelector("input, button");
      firstInput?.focus();
    });
  }

  function showDialog() {
    if (triggered) return;
    triggered = true;

    // Cleanup scroll listener once triggered
    window.removeEventListener("scroll", onScroll, { passive: true });

    container.hidden = false;
    window.requestAnimationFrame(() => {
      container.classList.add("is-visible");
      // Focus trap: move focus into the modal
      const firstInput = container.querySelector("input, button");
      firstInput?.focus();
    });
    onShow?.();
  }

  function hideDialog(recordDismiss = true) {
    container.classList.remove("is-visible");
    if (recordDismiss) {
      recordDismissal();
    }
    window.setTimeout(() => {
      container.hidden = true;
    }, 280);
  }

  // Close button
  closeButton?.addEventListener("click", () => hideDialog(true));

  // Close on backdrop click (clicking the scrim, not the card)
  container.addEventListener("click", (event) => {
    if (event.target === container) {
      hideDialog(true);
    }
  });

  // Close on Escape
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && container.classList.contains("is-visible")) {
      hideDialog(true);
    }
  });

  // Suppress auto-trigger if already joined or dismissed recently.
  // Manual open (forceOpen) is still available via the returned object.
  if (hasAlreadyJoined() || wasDismissedRecently()) {
    return { hideDialog, forceOpen };
  }

  // Scroll trigger: show when user has scrolled ≥ 25% of page height
  function onScroll() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const scrolled = window.scrollY / docHeight;
    if (scrolled >= SCROLL_THRESHOLD) {
      showDialog();
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  // Timer trigger: show after 45 seconds regardless of scroll position
  window.setTimeout(showDialog, NEWSLETTER_DIALOG_DELAY_MS);

  // Expose hideDialog (for form onSuccess) and forceOpen (for manual triggers)
  return { hideDialog, forceOpen };
}
