import { initBackToTopArrow } from "./back-to-top.js";
import { initCookieConsent } from "./cookie-consent.js";
import { upgradeDownloadCtas } from "./download-cta.js";
import {
  initLaunchBannerVisibility,
  initLaunchCountdown,
} from "./launch-banner.js";
import { initNav } from "./nav.js";
import { initThemeToggles } from "./theme.js";

export function initSharedSiteChrome() {
  [
    initNav,
    initLaunchCountdown,
    initLaunchBannerVisibility,
    initThemeToggles,
    initCookieConsent,
    upgradeDownloadCtas,
    // initBackToTopArrow, // removed
  ].forEach((init) => {
    try {
      init();
    } catch (error) {
      console.error("[CogniFocus] Shared site initializer failed", error);
    }
  });
}
