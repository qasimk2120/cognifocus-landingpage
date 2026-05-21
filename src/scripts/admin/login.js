import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { clearAdminSession, isAuthorizedAdmin } from "./auth.js";
import { getAdminAuth } from "./firebase.js";

const form = document.querySelector("[data-admin-login-form]");
const message = document.querySelector("[data-admin-login-message]");
const submitButton = document.querySelector("[data-admin-login-submit]");
const turnstileMount = document.querySelector("[data-admin-turnstile]");
const provider = new GoogleAuthProvider();
const ACCESS_DENIED_MESSAGE = "Access denied. Sign in with an authorized admin account.";
const TURNSTILE_SITEKEY = "0x4AAAAAADR7PaDsKmcbHtqJ";
const TURNSTILE_LOAD_TIMEOUT_MS = 8000;

let turnstileToken = "";
let turnstileWidgetId = null;

provider.setCustomParameters({
  prompt: "select_account",
});

function setMessage(text, type = "info") {
  if (!message) {
    return;
  }

  message.textContent = text;
  message.dataset.type = type;
}

function setLoading(isLoading) {
  if (!form) {
    return;
  }

  for (const element of form.elements) {
    element.disabled = isLoading;
  }
}

function setSubmitEnabled(isEnabled) {
  if (submitButton) {
    submitButton.disabled = !isEnabled;
  }
}

function getFriendlyAuthError(error) {
  switch (error?.code) {
    case "auth/account-exists-with-different-credential":
      return "That Google account cannot be used for this CMS.";
    case "auth/popup-closed-by-user":
      return "Sign in was cancelled. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a bit and try again.";
    case "auth/network-request-failed":
      return "Could not reach Firebase Auth. Check your connection and try again.";
    default:
      return error?.message || "Sign in failed. Please try again.";
  }
}

function hasHoneypotValue() {
  if (!form) {
    return true;
  }

  return ["website", "company", "url"].some((name) =>
    Boolean(String(form.elements[name]?.value || "").trim()),
  );
}

function resetTurnstile() {
  turnstileToken = "";
  setSubmitEnabled(false);

  if (turnstileWidgetId !== null && window.turnstile?.reset) {
    window.turnstile.reset(turnstileWidgetId);
  }
}

function waitForTurnstile() {
  if (window.turnstile?.render) {
    return Promise.resolve(window.turnstile);
  }

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      if (window.turnstile?.render) {
        window.clearInterval(intervalId);
        resolve(window.turnstile);
        return;
      }

      if (Date.now() - startedAt > TURNSTILE_LOAD_TIMEOUT_MS) {
        window.clearInterval(intervalId);
        reject(new Error("Security check could not load. Please refresh and try again."));
      }
    }, 100);
  });
}

async function initTurnstile() {
  if (!turnstileMount) {
    setMessage("Security check is not available. Please refresh and try again.", "error");
    setSubmitEnabled(false);
    return;
  }

  try {
    const turnstile = await waitForTurnstile();
    turnstileWidgetId = turnstile.render(turnstileMount, {
      sitekey: TURNSTILE_SITEKEY,
      callback(token) {
        turnstileToken = token;
        setSubmitEnabled(true);
        setMessage("", "info");
      },
      "expired-callback"() {
        turnstileToken = "";
        setSubmitEnabled(false);
        setMessage("Security check expired. Please verify again.", "error");
      },
      "error-callback"() {
        turnstileToken = "";
        setSubmitEnabled(false);
        setMessage("Security check failed. Please refresh and try again.", "error");
      },
    });
  } catch (error) {
    setMessage(error?.message || "Security check could not load. Please refresh and try again.", "error");
    setSubmitEnabled(false);
  }
}

function isPopupFallbackError(error) {
  return [
    "auth/cancelled-popup-request",
    "auth/operation-not-supported-in-this-environment",
    "auth/popup-blocked",
  ].includes(error?.code);
}

async function finishLogin(user) {
  if (!user) {
    return false;
  }

  if (!isAuthorizedAdmin(user)) {
    await clearAdminSession();
    setMessage(ACCESS_DENIED_MESSAGE, "error");
    setLoading(false);
    return false;
  }

  window.location.assign("/admin");
  return true;
}

async function initLogin() {
  if (!form) {
    return;
  }

  let auth;

  try {
    auth = await getAdminAuth();
  } catch (error) {
    setMessage(getFriendlyAuthError(error), "error");
    setLoading(true);
    return;
  }

  if (new URLSearchParams(window.location.search).has("denied")) {
    setMessage(ACCESS_DENIED_MESSAGE, "error");
  }

  try {
    const result = await getRedirectResult(auth);

    if (result?.user) {
      await finishLogin(result.user);
      return;
    }
  } catch (error) {
    setMessage(getFriendlyAuthError(error), "error");
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await finishLogin(user);
    }
  });

  await initTurnstile();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (hasHoneypotValue()) {
      await clearAdminSession();
      resetTurnstile();
      setMessage(ACCESS_DENIED_MESSAGE, "error");
      return;
    }

    if (!turnstileToken) {
      setMessage("Complete the security check before signing in.", "error");
      setSubmitEnabled(false);
      return;
    }

    setLoading(true);
    setMessage("Opening Google sign-in...", "info");
    turnstileToken = "";

    try {
      const result = await signInWithPopup(auth, provider);
      await finishLogin(result.user);
    } catch (error) {
      if (isPopupFallbackError(error)) {
        setMessage("Redirecting to Google sign-in...", "info");
        await signInWithRedirect(auth, provider);
        return;
      }

      setMessage(getFriendlyAuthError(error), "error");
      setLoading(false);
      resetTurnstile();
    }
  });
}

initLogin();
