import { hydrateStaticReleaseCards } from "./static-card-hydration.js";

export function initWhatsNewPage() {
  const latestContainer = document.getElementById("latestRelease");
  const historyContainer = document.getElementById("releaseHistory");

  if (!latestContainer || !historyContainer) return;

  hydrateStaticReleaseCards();
}
