/**
 * Newsletter entry — wires up the footer strip form and the delayed dialog.
 * Loaded on every page via BaseLayout.
 */

import { onReady } from "../shared/dom-ready.js";
import { initNewsletterForm } from "../newsletter/form.js";
import { initNewsletterDialog } from "../newsletter/dialog.js";

// Shared Turnstile modal IDs (one modal serves both strip and dialog)
const TURNSTILE_MODAL_ID = "newsletterTurnstileModal";
const TURNSTILE_WIDGET_ID = "newsletterTurnstileWidget";
const TURNSTILE_MESSAGE_ID = "newsletterTurnstileMessage";
const TURNSTILE_CLOSE_ID = "newsletterTurnstileClose";

function initNewsletterStrip() {
  initNewsletterForm({
    formId: "newsletterStripForm",
    emailInputId: "newsletterStripEmail",
    nameInputId: "newsletterStripName",
    websiteInputId: "newsletterStripWebsite",
    submitButtonId: "newsletterStripSubmit",
    messageId: "newsletterStripMessage",
    consentCheckboxId: "newsletterStripConsent",
    source: "footer_strip",
    interestType: "newsletter",
    turnstileModalId: TURNSTILE_MODAL_ID,
    turnstileWidgetId: TURNSTILE_WIDGET_ID,
    turnstileMessageId: TURNSTILE_MESSAGE_ID,
    turnstileCloseId: TURNSTILE_CLOSE_ID,
  });
}

function initNewsletterDialogFlow() {
  const dialogControl = initNewsletterDialog({
    containerId: "newsletterDialogContainer",
    closeButtonId: "newsletterDialogClose",
  });

  initNewsletterForm({
    formId: "newsletterDialogForm",
    emailInputId: "newsletterDialogEmail",
    nameInputId: "newsletterDialogName",
    websiteInputId: "newsletterDialogWebsite",
    submitButtonId: "newsletterDialogSubmit",
    messageId: "newsletterDialogMessage",
    consentCheckboxId: "newsletterDialogConsent",
    source: "newsletter_dialog",
    interestType: "newsletter",
    turnstileModalId: TURNSTILE_MODAL_ID,
    turnstileWidgetId: TURNSTILE_WIDGET_ID,
    turnstileMessageId: TURNSTILE_MESSAGE_ID,
    turnstileCloseId: TURNSTILE_CLOSE_ID,
    onSuccess() {
      dialogControl?.hideDialog(false);
    },
  });

  return dialogControl;
}

onReady(() => {
  initNewsletterStrip();
  const dialog = initNewsletterDialogFlow();

  // Wire [data-newsletter-open] links (e.g. footer "Updates") to open the modal manually.
  // Prevents default navigation, opens the dialog. Works even if auto-trigger was suppressed.
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-newsletter-open]");
    if (!trigger) return;
    event.preventDefault();
    dialog?.forceOpen();
  });
});
