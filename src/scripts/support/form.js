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
  const nameInput = document.getElementById("supportName");
  const emailInput = document.getElementById("supportEmail");
  const topicSelect = document.getElementById("supportTopic");
  const messageInput = document.getElementById("supportMessage");
  const websiteInput = document.getElementById("supportWebsite");
  const submitButton = document.getElementById("supportSubmit");
  const statusMessage = document.getElementById("supportMessageStatus");
  const submitLabel = submitButton?.querySelector(".support-submit__label");

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

  function getFieldValue(field) {
    return typeof field.value === "string" ? field.value.trim() : "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const name = getFieldValue(nameInput);
    const email = getFieldValue(emailInput);
    const topic = getFieldValue(topicSelect);
    const message = getFieldValue(messageInput);
    const website = getFieldValue(websiteInput);
    const turnstileToken =
      form.querySelector('[name="cf-turnstile-response"]')?.value || "";

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
        resetTurnstileWidget();
        return;
      }

      const statusText = getStatusMessage(response.status);
      resetTurnstileWidget();

      if (statusText) {
        setStatus(statusText, "error");
        return;
      }

      setStatus(ERROR_MESSAGE, "error");
    } catch (_error) {
      resetTurnstileWidget();
      setStatus(ERROR_MESSAGE, "error");
    } finally {
      isSubmitting = false;
      setLoading(false);
    }
  });
}
