import { initIosWaitlistBanner } from "./ios-waitlist-banner.js";
import { detectDownloadPlatform } from "./platform-detect.js";
import { initPlayStoreRedirect } from "./play-store-redirect.js";

export function initDownloadPage() {
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
  const platform = detectDownloadPlatform();

  initIosWaitlistBanner({
    iosWaitlistEmail,
    iosWaitlistForm,
    iosWaitlistMessage,
    iosWaitlistName,
    iosWaitlistSubmit,
    iosWaitlistWebsite,
  });

  initPlayStoreRedirect({
    ...platform,
    platformTitle,
    playStoreCta,
    redirectStatus,
    retryHint,
  });
}
