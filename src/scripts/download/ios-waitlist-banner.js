import {
  IOS_WAITLIST_ENDPOINT,
  IOS_WAITLIST_STORAGE_KEY,
} from "./constants.js";

const VERIFICATION_ERROR_MESSAGE =
  "The Goblin thinks you might be a bot. Try again.";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function initIosWaitlistBanner({
  iosWaitlistEmail,
  iosWaitlistForm,
  iosWaitlistMessage,
  iosWaitlistName,
  iosWaitlistSubmit,
  iosWaitlistWebsite,
}) {
  function setIosWaitlistMessage(text, type) {
    if (!iosWaitlistMessage) return;
    iosWaitlistMessage.textContent = text;
    iosWaitlistMessage.classList.toggle("is-error", type === "error");
    iosWaitlistMessage.hidden = false;
  }

  function showIosJoinedState(text) {
    try {
      localStorage.setItem(IOS_WAITLIST_STORAGE_KEY, "true");
    } catch (_error) {
      // The message is enough if storage is unavailable.
    }
    if (iosWaitlistForm) {
      iosWaitlistForm.classList.add("is-joined");
    }
    if (iosWaitlistEmail) {
      iosWaitlistEmail.hidden = true;
    }
    if (iosWaitlistSubmit) {
      iosWaitlistSubmit.hidden = true;
    }
    setIosWaitlistMessage(text, "success");
  }

  if (
    !iosWaitlistForm ||
    !iosWaitlistEmail ||
    !iosWaitlistWebsite ||
    !iosWaitlistSubmit ||
    !iosWaitlistMessage
  ) {
    return;
  }

  let iosWaitlistSubmitting = false;

  try {
    if (localStorage.getItem(IOS_WAITLIST_STORAGE_KEY) === "true") {
      showIosJoinedState("You are already on the iOS waitlist.");
      return;
    }
  } catch (_error) {
    // Browsers can block localStorage; the form still works.
  }

  iosWaitlistForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (iosWaitlistSubmitting) {
      return;
    }

    const email = iosWaitlistEmail.value.trim();
    const website = iosWaitlistWebsite.value.trim();
    const turnstileToken =
      iosWaitlistForm.querySelector('[name="cf-turnstile-response"]')?.value ||
      "";

    if (!isValidEmail(email)) {
      setIosWaitlistMessage(
        "Enter a real email for the iOS launch note.",
        "error",
      );
      iosWaitlistEmail.focus();
      return;
    }

    iosWaitlistSubmitting = true;
    iosWaitlistSubmit.disabled = true;
    iosWaitlistSubmit.setAttribute("aria-busy", "true");
    iosWaitlistMessage.hidden = true;

    try {
      const response = await fetch(IOS_WAITLIST_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name: iosWaitlistName ? iosWaitlistName.value.trim() : "",
          website,
          turnstileToken,
          source: "download_page_ios_banner",
          page: "/download.html",
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (_error) {
        data = {};
      }

      if (response.status === 403 || data.error === "Verification failed") {
        setIosWaitlistMessage(VERIFICATION_ERROR_MESSAGE, "error");
        window.turnstile?.reset();
        return;
      }

      if (!response.ok) {
        throw new Error("Waitlist request failed");
      }

      showIosJoinedState(
        data.alreadyJoined
          ? "You are already on the iOS waitlist."
          : "You are on the iOS waitlist. We will email you when it is ready.",
      );
      window.turnstile?.reset();
    } catch (_error) {
      setIosWaitlistMessage(
        "Could not join right now. Try again in a moment.",
        "error",
      );
    } finally {
      iosWaitlistSubmitting = false;
      iosWaitlistSubmit.disabled = false;
      iosWaitlistSubmit.removeAttribute("aria-busy");
    }
  });
}
