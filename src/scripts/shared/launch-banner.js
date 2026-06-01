export function initLaunchCountdown() {
  const el = document.getElementById("cf-countdown");
  if (!el) return;
  if (el.dataset.launchCountdownInitialized === "true") return;
  el.dataset.launchCountdownInitialized = "true";

  const banner = document.getElementById("cf-launch-banner");
  const launchDate = new Date("2026-06-01T00:00:00");

  function update() {
    const now = new Date();
    const diff = launchDate - now;

    if (diff <= 0) {
      el.textContent = "\u2014 live now!";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor(
      (diff % (1000 * 60 * 60)) / (1000 * 60),
    );

    if (days > 0) {
      el.textContent = `\u2014 ${days}d ${hours}h left`;
    } else {
      el.textContent = `\u2014 ${hours}h ${minutes}m left`;
    }
  }

  update();
  setInterval(update, 60000);
}

export function initLaunchBannerVisibility() {
  const banner = document.getElementById("cf-launch-banner");
  if (!banner) return;

  function updateVisibility() {
    const shouldHide = window.scrollY > 24;
    document.documentElement.classList.toggle(
      "cf-launch-banner-hidden",
      shouldHide,
    );
  }

  window.addEventListener("scroll", updateVisibility, { passive: true });
  updateVisibility();
}
