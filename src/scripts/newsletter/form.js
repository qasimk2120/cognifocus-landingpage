/**
 * Newsletter form handler — reusable across strip and dialog.
 *
 * Both the footer strip and the delayed dialog share this logic.
 * A shared Turnstile modal is used (only one form can be active at a time).
 */

import {
  NEWSLETTER_ENDPOINT,
  NEWSLETTER_JOINED_KEY,
  CONSENT_TEXT,
  SUCCESS_MESSAGE,
  ALREADY_JOINED_MESSAGE,
  ERROR_MESSAGE,
  TURNSTILE_SITEKEY,
} from "./constants.js";
import {
  JSON_FETCH_HEADERS,
  parseJsonResponse,
  resetTurnstileWidget,
  removeTurnstileWidget,
} from "../shared/waitlist-response.js";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const STATUS_MESSAGES = {
  429: "Too many attempts. Give the Goblin a minute.",
  403: "Verification failed. Try again.",
  400: "Something looks off. Check your email and try again.",
  415: "Something looks off. Check your email and try again.",
};

function getStatusMessage(status) {
  return STATUS_MESSAGES[status] ?? null;
}

/**
 * @param {object} config
 * @param {string} config.formId
 * @param {string} config.emailInputId
 * @param {string} config.nameInputId
 * @param {string} config.websiteInputId
 * @param {string} config.submitButtonId
 * @param {string} config.messageId
 * @param {string} config.consentCheckboxId
 * @param {string} config.source          — "footer_strip" | "newsletter_dialog"
 * @param {string} config.interestType    — "newsletter" | "launch_updates"
 * @param {string} config.turnstileModalId
 * @param {string} config.turnstileWidgetId
 * @param {string} config.turnstileMessageId
 * @param {string} config.turnstileCloseId
 * @param {Function} [config.onSuccess]   — called after successful join
 */
export function initNewsletterForm(config) {
  const form = document.getElementById(config.formId);
  const emailInput = document.getElementById(config.emailInputId);
  const nameInput = document.getElementById(config.nameInputId);
  const websiteInput = document.getElementById(config.websiteInputId);
  const submitButton = document.getElementById(config.submitButtonId);
  const messageEl = document.getElementById(config.messageId);
  const consentCheckbox = document.getElementById(config.consentCheckboxId);
  const turnstileModal = document.getElementById(config.turnstileModalId);
  const turnstileWidgetMount = document.getElementById(config.turnstileWidgetId);
  const turnstileMessageEl = document.getElementById(config.turnstileMessageId);
  const turnstileCloseBtn = document.getElementById(config.turnstileCloseId);

  if (!form || !emailInput || !websiteInput || !submitButton || !messageEl || !consentCheckbox) {
    return;
  }

  let isSubmitting = false;
  let pendingSubmission = null;
  let widgetId = null;
  const submitButtonContent = submitButton.innerHTML;

  function setMessage(text, type) {
    messageEl.textContent = text;
    messageEl.classList.toggle("is-error", type === "error");
    messageEl.classList.toggle("is-success", type === "success");
    messageEl.hidden = false;
  }

  function setLoading(isLoading, label = "Sending…") {
    submitButton.disabled = isLoading;
    submitButton.setAttribute("aria-busy", String(isLoading));
    submitButton.textContent = isLoading ? label : "";
    if (!isLoading) {
      submitButton.innerHTML = submitButtonContent;
    }
  }

  function setTurnstileMessage(text, type) {
    if (!turnstileMessageEl) return;
    turnstileMessageEl.textContent = text;
    turnstileMessageEl.hidden = !text;
    turnstileModal?.classList.toggle("is-error", type === "error");
  }

  function clearWidget() {
    if (widgetId === null) return;
    removeTurnstileWidget(widgetId);
    widgetId = null;
  }

  function renderWidget() {
    if (!turnstileWidgetMount || !window.turnstile?.render) return null;
    if (widgetId !== null) {
      resetTurnstileWidget(widgetId);
      return widgetId;
    }
    widgetId = window.turnstile.render(turnstileWidgetMount, {
      sitekey: TURNSTILE_SITEKEY,
      theme: "dark",
      callback(token) {
        hideTurnstileModal();
        void submitPending(token);
      },
      "error-callback"() {
        setTurnstileMessage("Verification failed. Try again.", "error");
        isSubmitting = false;
        setLoading(false);
      },
      "expired-callback"() {
        setTurnstileMessage("Verification expired. Try again.", "error");
        isSubmitting = false;
        setLoading(false);
        resetTurnstileWidget(widgetId);
      },
    });
    return widgetId;
  }

  function showTurnstileModal() {
    if (!turnstileModal) return;
    turnstileModal.hidden = false;
    turnstileModal.classList.remove("is-error");
    setTurnstileMessage("", "info");
    window.requestAnimationFrame(() => {
      turnstileModal.classList.add("is-visible");
      renderWidget();
    });
  }

  function hideTurnstileModal() {
    if (!turnstileModal) return;
    turnstileModal.classList.remove("is-visible", "is-error");
    window.setTimeout(() => {
      turnstileModal.hidden = true;
      setTurnstileMessage("", "info");
    }, 180);
  }

  function cancelVerification() {
    pendingSubmission = null;
    isSubmitting = false;
    setLoading(false);
    clearWidget();
    hideTurnstileModal();
    messageEl.hidden = true;
  }

  function showJoinedState(text) {
    try {
      localStorage.setItem(NEWSLETTER_JOINED_KEY, "true");
    } catch {}
    form.hidden = true;
    setMessage(text, "success");
    config.onSuccess?.();
  }

  async function submitPending(turnstileToken) {
    if (!pendingSubmission || isSubmitting) return;

    const { email, name, marketingConsent } = pendingSubmission;
    isSubmitting = true;
    setLoading(true);
    messageEl.hidden = true;

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source") || null;
    const utmMedium = params.get("utm_medium") || null;
    const utmCampaign = params.get("utm_campaign") || null;
    const referrer = document.referrer || null;

    try {
      const response = await fetch(NEWSLETTER_ENDPOINT, {
        method: "POST",
        headers: JSON_FETCH_HEADERS,
        body: JSON.stringify({
          email,
          name,
          interestType: config.interestType || "newsletter",
          marketingConsent,
          consentText: marketingConsent ? CONSENT_TEXT : null,
          consentTimestamp: marketingConsent ? new Date().toISOString() : null,
          source: config.source || "footer_strip",
          page: window.location.pathname,
          utmSource,
          utmMedium,
          utmCampaign,
          referrer,
          turnstileToken,
          website: "",
        }),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        const statusText = getStatusMessage(response.status);
        clearWidget();
        hideTurnstileModal();
        setMessage(statusText || ERROR_MESSAGE, "error");
        pendingSubmission = null;
        return;
      }

      showJoinedState(data.alreadyJoined ? ALREADY_JOINED_MESSAGE : SUCCESS_MESSAGE);
      clearWidget();
      hideTurnstileModal();
      pendingSubmission = null;
    } catch {
      clearWidget();
      hideTurnstileModal();
      setMessage(ERROR_MESSAGE, "error");
      pendingSubmission = null;
    } finally {
      isSubmitting = false;
      setLoading(false);
    }
  }

  turnstileCloseBtn?.addEventListener("click", cancelVerification);

  // Check if already joined
  try {
    if (localStorage.getItem(NEWSLETTER_JOINED_KEY) === "true") {
      showJoinedState(ALREADY_JOINED_MESSAGE);
      return;
    }
  } catch {}

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isSubmitting || pendingSubmission) return;

    const email = emailInput.value.trim();
    const name = nameInput ? nameInput.value.trim() : "";
    const website = websiteInput.value.trim();
    const marketingConsent = consentCheckbox.checked;

    // Honeypot — silently reject
    if (website) return;

    if (!isValidEmail(email)) {
      setMessage("Use a real email so the Goblin knows where to send updates.", "error");
      emailInput.focus();
      return;
    }

    if (!marketingConsent) {
      setMessage("Check the box to confirm you're okay receiving updates.", "error");
      consentCheckbox.focus();
      return;
    }

    pendingSubmission = { email, name, marketingConsent };
    messageEl.hidden = true;
    setLoading(true, "Verifying…");
    showTurnstileModal();
  });
}
