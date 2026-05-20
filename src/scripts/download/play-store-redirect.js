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
  const playStoreIcon = playStoreCta.querySelector(
    "[data-download-playstore-icon]",
  );
  const appleIcon = playStoreCta.querySelector("[data-download-apple-icon]");
  const externalIcon = playStoreCta.querySelector(
    "[data-download-external-icon]",
  );
  const label = playStoreCta.querySelector("[data-download-cta-label]");

  function setStatus(message) {
    redirectStatus.textContent = message;
  }

  function setCtaIcons({ showPlayStore, showApple, showExternal }) {
    if (playStoreIcon) {
      playStoreIcon.hidden = !showPlayStore;
    }

    if (appleIcon) {
      appleIcon.hidden = !showApple;
    }

    if (externalIcon) {
      externalIcon.hidden = !showExternal;
    }

    if (label) {
      label.hidden = false;
    }
  }

  function setPlayStoreButton() {
    playStoreCta.href = PLAY_STORE_URL;
    playStoreCta.target = "_blank";
    playStoreCta.rel = "noopener noreferrer";
    if (label) {
      label.textContent = "Open in Google Play";
    }
    setCtaIcons({ showPlayStore: true, showApple: false, showExternal: true });
  }

  function setIosWaitlistButton() {
    playStoreCta.href = "/ios-waitlist.html";
    playStoreCta.removeAttribute("target");
    playStoreCta.removeAttribute("rel");
    if (label) {
      label.textContent = "Join the iOS waitlist";
    }
    setCtaIcons({ showPlayStore: false, showApple: true, showExternal: false });
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
