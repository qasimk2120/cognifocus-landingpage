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
    cta.innerHTML = `
      <span class="download-store-cta__icon-wrap" aria-hidden="true">
        <span class="download-store-cta__icon">
          <svg viewBox="0 0 24 24" focusable="false" role="img">
            <path fill="#34A853" d="M3.4 3.2c-.4.3-.6.8-.6 1.4v14.8c0 .6.2 1.1.6 1.4l10-8.8z"/>
            <path fill="#EA4335" d="M15.4 10.9 18.5 9c1.4.8 2.2 1.5 2.2 3s-.8 2.2-2.2 3l-3.1-1.9z"/>
            <path fill="#FBBC05" d="M4 21c.5.4 1.2.5 1.9.1l11.5-6.6-4-2.5z"/>
            <path fill="#4285F4" d="M4 3l9.4 8.1 4-2.5L5.9 2.9C5.2 2.5 4.5 2.6 4 3z"/>
          </svg>
        </span>
      </span>
      <span class="download-store-cta__label">Start Free on Android</span>
    `;
  });
}
