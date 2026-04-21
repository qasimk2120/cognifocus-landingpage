(function () {
  const PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=io.ionic.cognifocus";

  const platformTitle = document.getElementById("platformTitle");
  const redirectStatus = document.getElementById("redirectStatus");
  const playStoreCta = document.getElementById("playStoreCta");
  const retryHint = document.getElementById("retryHint");

  if (!platformTitle || !redirectStatus || !playStoreCta || !retryHint) {
    return;
  }

  const ua = navigator.userAgent || "";
  const uaData = navigator.userAgentData;
  const isAndroid =
    /android/i.test(ua) ||
    Boolean(
      uaData &&
      typeof uaData.platform === "string" &&
      /android/i.test(uaData.platform),
    );
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const isInAppBrowser =
    /(instagram|fb_iab|fban|fbav|line|micromessenger|wv)/i.test(ua);

  let redirectInFlight = false;
  let clickLocked = false;

  function setStatus(message) {
    redirectStatus.textContent = message;
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
    platformTitle.textContent = "Android detected";
    setStatus(
      "Trying to save you from wasting time... redirecting in a moment.",
    );
    playStoreCta.hidden = false;
    retryHint.hidden = false;

    window.setTimeout(function () {
      attemptRedirect("auto");
    }, 500);

    return;
  }

  playStoreCta.hidden = true;
  retryHint.hidden = true;

  if (isIOS) {
    platformTitle.textContent = "Android only for now";
    setStatus("CogniFocus download is currently available on Android only.");
    return;
  }

  platformTitle.textContent = "Android only for now";
  setStatus(
    "You are on desktop or an unsupported device. Please open this page on Android.",
  );
})();
