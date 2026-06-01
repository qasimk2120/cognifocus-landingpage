import {
  ALREADY_JOINED_MESSAGE,
  ENDPOINT,
  ERROR_MESSAGE,
  STORAGE_KEY,
  SUCCESS_MESSAGE,
} from "./constants.js";
import {
  getWaitlistMessageForStatus,
  isHandledWaitlistStatus,
  isVerificationFailure,
  JSON_FETCH_HEADERS,
  parseJsonResponse,
  removeTurnstileWidget,
  resetTurnstileWidget,
} from "../shared/waitlist-response.js";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const TURNSTILE_SITEKEY = "0x4AAAAAADR7PaDsKmcbHtqJ";

export function initIosWaitlistForm() {
  const form = document.getElementById("iosWaitlistForm");
  const emailInput = document.getElementById("iosWaitlistEmail");
  const nameInput = document.getElementById("iosWaitlistName");
  const websiteInput = document.getElementById("iosWaitlistWebsite");
  const submitButton = document.getElementById("iosWaitlistSubmit");
  const message = document.getElementById("iosWaitlistMessage");
  const intro = document.getElementById("iosWaitlistIntro");
  const waitlistCard = document.querySelector(".ios-waitlist-conversion-card");
  const turnstileModal = document.getElementById("iosWaitlistTurnstileModal");
  const turnstileCloseButton = document.getElementById("iosWaitlistTurnstileClose");
  const turnstileModalMessage = document.getElementById(
    "iosWaitlistTurnstileMessage",
  );
  const turnstileWidgetMount = document.getElementById("iosWaitlistTurnstileWidget");

  if (
    !form ||
    !emailInput ||
    !nameInput ||
    !websiteInput ||
    !submitButton ||
    !message
  ) {
    return;
  }

  let isSubmitting = false;
  let pendingSubmission = null;
  let turnstileWidgetId = null;
  // Trusted local button markup is restored after the loading text state.
  const submitButtonContent = submitButton.innerHTML;

  function setMessage(text, type) {
    message.textContent = text;
    message.classList.toggle("is-error", type === "error");
    message.hidden = false;
  }

  function setTurnstileModalMessage(text, type) {
    if (!turnstileModalMessage) return;
    turnstileModalMessage.textContent = text;
    turnstileModalMessage.hidden = !text;
    turnstileModal?.classList.toggle("is-error", type === "error");
  }

  function setBlurState(isBlurred) {
    waitlistCard?.classList.toggle("is-turnstile-active", isBlurred);
  }

  function clearTurnstileWidget() {
    if (turnstileWidgetId === null) {
      return;
    }

    removeTurnstileWidget(turnstileWidgetId);
    turnstileWidgetId = null;
  }

  function renderTurnstileWidget() {
    if (!turnstileWidgetMount || !window.turnstile?.render) {
      return null;
    }

    if (turnstileWidgetId !== null) {
      resetTurnstileWidget(turnstileWidgetId);
      return turnstileWidgetId;
    }

    turnstileWidgetId = window.turnstile.render(turnstileWidgetMount, {
      sitekey: TURNSTILE_SITEKEY,
      theme: "dark",
      callback(turnstileToken) {
        hideTurnstileModal();
        void submitPendingSubmission(turnstileToken);
      },
      "error-callback"() {
        if (turnstileModal) {
          turnstileModal.hidden = false;
          turnstileModal.classList.add("is-visible", "is-error");
        }
        setBlurState(true);
        setTurnstileModalMessage(
          "Verification failed. Try again.",
          "error",
        );
        isSubmitting = false;
        setLoading(false);
      },
      "expired-callback"() {
        if (turnstileModal) {
          turnstileModal.hidden = false;
          turnstileModal.classList.add("is-visible", "is-error");
        }
        setBlurState(true);
        setTurnstileModalMessage(
          "Verification expired. Try again.",
          "error",
        );
        isSubmitting = false;
        setLoading(false);
        resetTurnstileWidget(turnstileWidgetId);
      },
    });

    return turnstileWidgetId;
  }

  function showTurnstileModal() {
    if (!turnstileModal) return;
    turnstileModal.hidden = false;
    turnstileModal.classList.remove("is-error");
    setTurnstileModalMessage("", "info");
    setBlurState(true);
    window.requestAnimationFrame(() => {
      turnstileModal.classList.add("is-visible");
      renderTurnstileWidget();
    });
  }

  function hideTurnstileModal() {
    if (!turnstileModal) return;
    turnstileModal.classList.remove("is-visible", "is-error");
    setBlurState(false);
    window.setTimeout(() => {
      turnstileModal.hidden = true;
      setTurnstileModalMessage("", "info");
    }, 180);
  }

  function cancelTurnstileVerification() {
    pendingSubmission = null;
    isSubmitting = false;
    setLoading(false);
    clearTurnstileWidget();
    hideTurnstileModal();
    message.hidden = true;
  }

  function setLoading(isLoading, label = "Joining...") {
    submitButton.disabled = isLoading;
    submitButton.setAttribute("aria-busy", String(isLoading));
    submitButton.textContent = isLoading ? label : "";
    if (!isLoading) {
      submitButton.innerHTML = submitButtonContent;
    }
  }

  function showJoinedState(text) {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch (_error) {
      // The UI can still show success when storage is unavailable.
    }
    form.hidden = true;
    if (intro) {
      intro.textContent = "No need to poke the button again.";
    }
    setMessage(text, "success");
  }

  async function submitPendingSubmission(turnstileToken) {
    if (!pendingSubmission || isSubmitting) {
      return;
    }

    const { email, name, website } = pendingSubmission;
    isSubmitting = true;
    setLoading(true);
    message.hidden = true;

    try {
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get("utm_source") || null;
      const utmMedium = params.get("utm_medium") || null;
      const utmCampaign = params.get("utm_campaign") || null;
      const referrer = document.referrer || null;

      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: JSON_FETCH_HEADERS,
        body: JSON.stringify({
          email,
          name,
          website,
          turnstileToken,
          source: utmSource || "ios_waitlist_page",
          page: "/ios-waitlist.html",
          utmSource,
          utmMedium,
          utmCampaign,
          referrer,
        }),
      });

      const data = await parseJsonResponse(response);

      if (isVerificationFailure(data)) {
        showTurnstileModal();
        setTurnstileModalMessage(
          getWaitlistMessageForStatus(403) || "Verification failed. Try again.",
          "error",
        );
        setMessage(getWaitlistMessageForStatus(403), "error");
        resetTurnstileWidget(turnstileWidgetId);
        pendingSubmission = null;
        return;
      }

      if (isHandledWaitlistStatus(response.status)) {
        showTurnstileModal();
        const statusMessage = getWaitlistMessageForStatus(response.status);
        setTurnstileModalMessage(statusMessage || ERROR_MESSAGE, "error");
        setMessage(statusMessage || ERROR_MESSAGE, "error");
        resetTurnstileWidget(turnstileWidgetId);
        pendingSubmission = null;
        return;
      }

      if (!response.ok) {
        clearTurnstileWidget();
        throw new Error("Waitlist request failed");
      }

      showJoinedState(
        data.alreadyJoined ? ALREADY_JOINED_MESSAGE : SUCCESS_MESSAGE,
      );
      clearTurnstileWidget();
      hideTurnstileModal();
      pendingSubmission = null;
    } catch (_error) {
      clearTurnstileWidget();
      setTurnstileModalMessage(
        "Could not verify right now. Try again in a moment.",
        "error",
      );
      setMessage(ERROR_MESSAGE, "error");
      pendingSubmission = null;
    } finally {
      isSubmitting = false;
      setLoading(false);
    }
  }
  turnstileCloseButton?.addEventListener("click", cancelTurnstileVerification);

  try {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      showJoinedState(ALREADY_JOINED_MESSAGE);
      return;
    }
  } catch (_error) {
    // Browsers can block localStorage in strict privacy modes; the form still works.
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (isSubmitting || pendingSubmission) {
      return;
    }

    const email = emailInput.value.trim();
    const name = nameInput.value.trim();
    const website = websiteInput.value.trim();

    if (!isValidEmail(email)) {
      setMessage(
        "Use a real email so the Goblin knows where to yell politely.",
        "error",
      );
      emailInput.focus();
      return;
    }

    pendingSubmission = { email, name, website };
    message.hidden = true;
    setLoading(true, "Verifying...");
    showTurnstileModal();
  });
}
