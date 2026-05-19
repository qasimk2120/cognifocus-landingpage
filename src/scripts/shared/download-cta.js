export function upgradeDownloadCtas() {
  const downloadCtas = document.querySelectorAll(
    'a.primary-cta[href*="download.html"]',
  );

  downloadCtas.forEach((cta) => {
    if (cta.dataset.keepLabel === "true") return;
    if (cta.dataset.playStoreEnhanced === "true") return;

    cta.dataset.playStoreEnhanced = "true";
    cta.classList.add("download-store-cta");
    cta.setAttribute("aria-label", "Start CogniFocus free on Android");
    cta.replaceChildren(createPlayStoreIcon(), createCtaLabel());
  });
}

function createPlayStoreIcon() {
  const iconWrap = document.createElement("span");
  iconWrap.className = "download-store-cta__icon-wrap";
  iconWrap.setAttribute("aria-hidden", "true");

  const icon = document.createElement("span");
  icon.className = "download-store-cta__icon";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("role", "img");

  [
    ["#34A853", "M3.4 3.2c-.4.3-.6.8-.6 1.4v14.8c0 .6.2 1.1.6 1.4l10-8.8z"],
    ["#EA4335", "M15.4 10.9 18.5 9c1.4.8 2.2 1.5 2.2 3s-.8 2.2-2.2 3l-3.1-1.9z"],
    ["#FBBC05", "M4 21c.5.4 1.2.5 1.9.1l11.5-6.6-4-2.5z"],
    ["#4285F4", "M4 3l9.4 8.1 4-2.5L5.9 2.9C5.2 2.5 4.5 2.6 4 3z"],
  ].forEach(([fill, d]) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", fill);
    path.setAttribute("d", d);
    svg.append(path);
  });

  icon.append(svg);
  iconWrap.append(icon);
  return iconWrap;
}

function createCtaLabel() {
  const label = document.createElement("span");
  label.className = "download-store-cta__label";
  label.textContent = "Start Free on Android";
  return label;
}
