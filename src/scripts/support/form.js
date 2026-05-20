import { SUPPORT_ENDPOINT } from "./constants.js";
import {
  JSON_FETCH_HEADERS,
  parseJsonResponse,
  resetTurnstileWidget,
} from "../shared/waitlist-response.js";

const SUCCESS_MESSAGE = "Got it. The Goblin delivered your request.";
const ERROR_MESSAGE = "Couldn't send it. The Goblin tripped over a cable.";
const STATUS_MESSAGES = {
  429: "Too many attempts. Give the Goblin a minute.",
  403: "Verification failed. Try again.",
  400: "Something looks off. Check the form and try again.",
  415: "Something looks off. Check the form and try again.",
};

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getStatusMessage(status) {
  return STATUS_MESSAGES[status] ?? null;
}

export function initSupportForm() {
  const form = document.getElementById("supportForm");
  const supportCard = document.querySelector(".support-card");
  const nameInput = document.getElementById("supportName");
  const emailInput = document.getElementById("supportEmail");
  const topicSelect = document.getElementById("supportTopic");
  const messageInput = document.getElementById("supportMessage");
  const websiteInput = document.getElementById("supportWebsite");
  const submitButton = document.getElementById("supportSubmit");
  const statusMessage = document.getElementById("supportMessageStatus");
  const submitLabel = submitButton?.querySelector(".support-submit__label");
  const turnstileModal = document.getElementById("supportTurnstileModal");
  const turnstileModalMessage = document.getElementById("supportTurnstileMessage");
  const turnstileCloseButton = document.getElementById("supportTurnstileClose");

  if (
    !form ||
    !nameInput ||
    !emailInput ||
    !topicSelect ||
    !messageInput ||
    !websiteInput ||
    !submitButton ||
    !statusMessage ||
    !submitLabel
  ) {
    return;
  }

  const defaultLabel = submitLabel.textContent || "Send request";
  let isSubmitting = false;
  let pendingSubmission = null;
  const submitButtonContent = submitButton.innerHTML;

  function setStatus(text, type) {
    statusMessage.textContent = text;
    statusMessage.classList.toggle("is-error", type === "error");
    statusMessage.hidden = false;
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.setAttribute("aria-busy", String(isLoading));
    submitLabel.textContent = isLoading ? "Sending..." : defaultLabel;
  }

  function setTurnstileMessage(text, type) {
    if (!turnstileModalMessage) return;
    turnstileModalMessage.textContent = text;
    turnstileModalMessage.hidden = !text;
    turnstileModal?.classList.toggle("is-error", type === "error");
  }

  function setBlurState(isBlurred) {
    supportCard?.classList.toggle("is-turnstile-active", isBlurred);
  }

  function showTurnstileModal() {
    if (!turnstileModal) return;
    turnstileModal.hidden = false;
    turnstileModal.classList.remove("is-error");
    setTurnstileMessage("", "info");
    setBlurState(true);
    window.requestAnimationFrame(() => {
      turnstileModal.classList.add("is-visible");
    });
  }

  function hideTurnstileModal() {
    if (!turnstileModal) return;
    turnstileModal.classList.remove("is-visible", "is-error");
    setBlurState(false);
    window.setTimeout(() => {
      turnstileModal.hidden = true;
      setTurnstileMessage("", "info");
    }, 180);
  }

  function cancelTurnstileVerification() {
    pendingSubmission = null;
    isSubmitting = false;
    setLoading(false);
    resetTurnstileWidget();
    hideTurnstileModal();
    statusMessage.hidden = true;
  }

  function getTurnstileToken() {
    return (
      document.querySelector(
        "#supportTurnstileModal [name='cf-turnstile-response']",
      )?.value || ""
    );
  }

  function getFieldValue(field) {
    return typeof field.value === "string" ? field.value.trim() : "";
  }

  async function submitPendingSubmission(turnstileToken) {
    if (!pendingSubmission || isSubmitting) {
      return;
    }

    const { name, email, topic, message, website } = pendingSubmission;
    isSubmitting = true;
    setLoading(true);
    statusMessage.hidden = true;

    try {
      const response = await fetch(SUPPORT_ENDPOINT, {
        method: "POST",
        headers: JSON_FETCH_HEADERS,
        body: JSON.stringify({
          name,
          email,
          topic,
          message,
          page: window.location.pathname,
          website,
          turnstileToken,
        }),
      });

      await parseJsonResponse(response);

      if (response.ok) {
        form.reset();
        setStatus(SUCCESS_MESSAGE, "success");
        hideTurnstileModal();
        resetTurnstileWidget();
        pendingSubmission = null;
        return;
      }

      const statusText = getStatusMessage(response.status);
      resetTurnstileWidget();

      if (statusText) {
        setTurnstileMessage(statusText, "error");
        setStatus(statusText, "error");
        return;
      }

      setTurnstileMessage(ERROR_MESSAGE, "error");
      setStatus(ERROR_MESSAGE, "error");
    } catch (_error) {
      resetTurnstileWidget();
      setTurnstileMessage(ERROR_MESSAGE, "error");
      setStatus(ERROR_MESSAGE, "error");
    } finally {
      isSubmitting = false;
      setLoading(false);
      pendingSubmission = null;
    }
  }

  window.supportTurnstileOnSuccess = (turnstileToken) => {
    hideTurnstileModal();
    void submitPendingSubmission(turnstileToken);
  };

  window.supportTurnstileOnError = () => {
    if (turnstileModal) {
      turnstileModal.hidden = false;
      turnstileModal.classList.add("is-visible", "is-error");
    }
    setBlurState(true);
    setTurnstileMessage("Verification failed. Try again.", "error");
    isSubmitting = false;
    setLoading(false);
  };

  turnstileCloseButton?.addEventListener("click", cancelTurnstileVerification);

  window.supportTurnstileOnExpired = () => {
    if (turnstileModal) {
      turnstileModal.hidden = false;
      turnstileModal.classList.add("is-visible", "is-error");
    }
    setBlurState(true);
    setTurnstileMessage("Verification expired. Try again.", "error");
    isSubmitting = false;
    setLoading(false);
    resetTurnstileWidget();
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting || pendingSubmission) {
      return;
    }

    const name = getFieldValue(nameInput);
    const email = getFieldValue(emailInput);
    const topic = getFieldValue(topicSelect);
    const message = getFieldValue(messageInput);
    const website = getFieldValue(websiteInput);

    if (!isValidEmail(email)) {
      setStatus("Use a real email so we can reply.", "error");
      emailInput.focus();
      return;
    }

    if (!topic) {
      setStatus("Choose a topic so the Goblin knows where to aim.", "error");
      topicSelect.focus();
      return;
    }

    if (!message) {
      setStatus("Add a short message so we know what happened.", "error");
      messageInput.focus();
      return;
    }

    pendingSubmission = { name, email, topic, message, website };
    statusMessage.hidden = true;
    setLoading(true);
    showTurnstileModal();

    const turnstileToken = getTurnstileToken();
    if (turnstileToken) {
      hideTurnstileModal();
      void submitPendingSubmission(turnstileToken);
    }
  });
}
