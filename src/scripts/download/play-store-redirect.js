import { PLAY_STORE_URL } from "./constants.js";

export function initPlayStoreRedirect({
  isAndroid,
  isIOS,
  isInAppBrowser,
  platformTitle,
  playStoreCta,
  redirectStatus,
  retryHint,
}) {
  let redirectInFlight = false;
  let clickLocked = false;

function setStatus(message) {
    redirectStatus.textContent = message;
  }

  function createIcon(className) {
    const icon = document.createElement("i");
    icon.className = className;
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function createLabel(text) {
    const label = document.createElement("span");
    label.textContent = text;
    return label;
  }

  function setPlayStoreButton() {
    playStoreCta.href = PLAY_STORE_URL;
    playStoreCta.target = "_blank";
    playStoreCta.rel = "noopener noreferrer";
    playStoreCta.replaceChildren(
      createIcon("bi bi-google-play"),
      createLabel("Open in Google Play"),
      createIcon("bi bi-box-arrow-up-right"),
    );
  }

  function setIosWaitlistButton() {
    playStoreCta.href = "/ios-waitlist.html";
    playStoreCta.removeAttribute("target");
    playStoreCta.removeAttribute("rel");
    playStoreCta.replaceChildren(
      createIcon("bi bi-apple"),
      createLabel("Join the iOS waitlist"),
    );
  }

  function attemptRedirect(triggerSource) {
    if (redirectInFlight) {
      return;
    }

    redirectInFlight = true;
    playStoreCta.setAttribute("aria-busy", "true");

    if (triggerSource === "auto") {
      setStatus("Launching Google Play...");
    } else {
      setStatus("Trying again... opening Google Play.");
    }

    // Keep the fallback button visible from the beginning for slow devices.
    playStoreCta.hidden = false;

    try {
      window.location.assign(PLAY_STORE_URL);
      if (isInAppBrowser) {
        window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
      }
    } catch (_error) {
      redirectInFlight = false;
      playStoreCta.removeAttribute("aria-busy");
      retryHint.hidden = false;
      setStatus("Redirect was blocked. Tap the button to open Google Play.");
      return;
    }

    window.setTimeout(function () {
      if (document.visibilityState === "visible") {
        redirectInFlight = false;
        playStoreCta.removeAttribute("aria-busy");
        retryHint.hidden = false;
        setStatus(
          "Still here? Your browser may block app redirects. Tap Open in Google Play.",
        );
      }
    }, 1800);
  }

  playStoreCta.addEventListener("click", function (event) {
    if (playStoreCta.dataset.ctaMode === "link") {
      return;
    }

    event.preventDefault();

    if (clickLocked) {
      return;
    }

    clickLocked = true;
    window.setTimeout(function () {
      clickLocked = false;
    }, 700);

    attemptRedirect("manual");
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      setStatus("Nice. Sending you to Google Play now.");
    }
  });

  if (isAndroid) {
    setPlayStoreButton();
    playStoreCta.dataset.ctaMode = "redirect";
    platformTitle.textContent = "Opening Google Play";
    setStatus("The Goblin is sending you to the app.");
    playStoreCta.hidden = false;
    retryHint.hidden = false;

    window.setTimeout(function () {
      attemptRedirect("auto");
    }, 500);

    return;
  }

  if (isIOS) {
    setIosWaitlistButton();
    playStoreCta.dataset.ctaMode = "link";
    playStoreCta.hidden = false;
    retryHint.hidden = false;
    retryHint.textContent =
      "CogniFocus is live on Android now. The iPhone version is still on the way.";
    platformTitle.textContent = "iOS is coming next";
    setStatus("Join the waitlist. The Goblin will notify you.");
    return;
  }

  setPlayStoreButton();
  playStoreCta.dataset.ctaMode = "link";
  playStoreCta.hidden = false;
  retryHint.hidden = false;
  retryHint.textContent =
    "On desktop? Open this listing, or revisit this page from your Android phone.";
  platformTitle.textContent = "Open CogniFocus on Google Play";
  setStatus(
    "You are on desktop or an unsupported device, so the automatic mobile redirect is paused.",
  );
}
