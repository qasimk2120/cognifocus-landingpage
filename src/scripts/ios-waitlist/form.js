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
  resetTurnstileWidget,
} from "../shared/waitlist-response.js";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function initIosWaitlistForm() {
  const form = document.getElementById("iosWaitlistForm");
  const emailInput = document.getElementById("iosWaitlistEmail");
  const nameInput = document.getElementById("iosWaitlistName");
  const websiteInput = document.getElementById("iosWaitlistWebsite");
  const submitButton = document.getElementById("iosWaitlistSubmit");
  const message = document.getElementById("iosWaitlistMessage");
  const intro = document.getElementById("iosWaitlistIntro");

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
  // Trusted local button markup is restored after the loading text state.
  const submitButtonContent = submitButton.innerHTML;

  function setMessage(text, type) {
    message.textContent = text;
    message.classList.toggle("is-error", type === "error");
    message.hidden = false;
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.setAttribute("aria-busy", String(isLoading));
    submitButton.textContent = isLoading ? "Joining..." : "";
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

    if (isSubmitting) {
      return;
    }

    const email = emailInput.value.trim();
    const name = nameInput.value.trim();
    const website = websiteInput.value.trim();
    const turnstileToken =
      form.querySelector('[name="cf-turnstile-response"]')?.value || "";

    if (!isValidEmail(email)) {
      setMessage(
        "Use a real email so the Goblin knows where to yell politely.",
        "error",
      );
      emailInput.focus();
      return;
    }

    isSubmitting = true;
    setLoading(true);
    message.hidden = true;

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: JSON_FETCH_HEADERS,
        body: JSON.stringify({
          email,
          name,
          website,
          turnstileToken,
          source: "ios_waitlist_page",
          page: "/ios-waitlist.html",
        }),
      });

      const data = await parseJsonResponse(response);

      if (isVerificationFailure(data)) {
        setMessage(getWaitlistMessageForStatus(403), "error");
        resetTurnstileWidget();
        return;
      }

      if (isHandledWaitlistStatus(response.status)) {
        setMessage(getWaitlistMessageForStatus(response.status), "error");
        resetTurnstileWidget();
        return;
      }

      if (!response.ok) {
        resetTurnstileWidget();
        throw new Error("Waitlist request failed");
      }

      showJoinedState(
        data.alreadyJoined ? ALREADY_JOINED_MESSAGE : SUCCESS_MESSAGE,
      );
      resetTurnstileWidget();
    } catch (_error) {
      resetTurnstileWidget();
      setMessage(ERROR_MESSAGE, "error");
    } finally {
      isSubmitting = false;
      setLoading(false);
    }
  });
}
