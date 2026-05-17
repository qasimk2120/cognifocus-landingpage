(function () {
  const PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=io.ionic.cognifocus";
  const IOS_WAITLIST_ENDPOINT =
    "https://europe-west1-cognifocuslandingpage.cloudfunctions.net/joinIosWaitlist";
  const IOS_WAITLIST_STORAGE_KEY = "cognifocus_ios_waitlist_joined";

  const platformTitle = document.getElementById("platformTitle");
  const redirectStatus = document.getElementById("redirectStatus");
  const playStoreCta = document.getElementById("playStoreCta");
  const retryHint = document.getElementById("retryHint");
  const iosWaitlistForm = document.getElementById("downloadIosWaitlistForm");
  const iosWaitlistEmail = document.getElementById("downloadIosWaitlistEmail");
  const iosWaitlistWebsite = document.getElementById(
    "downloadIosWaitlistWebsite",
  );
  const iosWaitlistSubmit = document.getElementById(
    "downloadIosWaitlistSubmit",
  );
  const iosWaitlistMessage = document.getElementById(
    "downloadIosWaitlistMessage",
  );

  if (!platformTitle || !redirectStatus || !playStoreCta || !retryHint) {
    return;
  }
  const iosWaitlistName = document.getElementById("downloadIosWaitlistName");
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

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

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

  function initIosWaitlistBanner() {
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

        if (!response.ok) {
          throw new Error("Waitlist request failed");
        }

        showIosJoinedState(
          data.alreadyJoined
            ? "You are already on the iOS waitlist."
            : "You are on the iOS waitlist. We will email you when it is ready.",
        );
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

  function setPlayStoreButton() {
    playStoreCta.href = PLAY_STORE_URL;
    playStoreCta.target = "_blank";
    playStoreCta.rel = "noopener noreferrer";
    playStoreCta.innerHTML =
      '<i class="bi bi-google-play" aria-hidden="true"></i><span>Open in Google Play</span><i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>';
  }

  function setIosWaitlistButton() {
    playStoreCta.href = "/ios-waitlist.html";
    playStoreCta.removeAttribute("target");
    playStoreCta.removeAttribute("rel");
    playStoreCta.innerHTML =
      '<i class="bi bi-apple" aria-hidden="true"></i><span>Join the iOS waitlist</span>';
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

  initIosWaitlistBanner();

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
})();
