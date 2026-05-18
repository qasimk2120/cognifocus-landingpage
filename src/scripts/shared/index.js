import { initBackToTopArrow } from "./back-to-top.js";
import { upgradeDownloadCtas } from "./download-cta.js";
import {
  initLaunchBannerVisibility,
  initLaunchCountdown,
} from "./launch-banner.js";
import { initNav } from "./nav.js";

export function initSharedSiteChrome() {
  initLaunchCountdown();
  initLaunchBannerVisibility();
  initNav();
  upgradeDownloadCtas();
  initBackToTopArrow();
}
