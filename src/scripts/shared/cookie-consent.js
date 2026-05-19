const CONSENT_KEY = "cognifocus_cookie_consent";
const ACCEPTED_VALUE = "accepted";
const DECLINED_VALUE = "declined";

function readConsent() {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === ACCEPTED_VALUE || value === DECLINED_VALUE ? value : null;
  } catch {
    return null;
  }
}

function writeConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // The banner can still close even if storage is blocked.
  }
}

export function initCookieConsent() {
  const banner = document.getElementById("cf-cookie-consent");
  if (!banner) return;

  if (readConsent()) {
    banner.hidden = true;
    return;
  }

  const acceptButton = banner.querySelector("[data-cookie-consent-accept]");
  const declineButton = banner.querySelector("[data-cookie-consent-decline]");

  function hideBanner() {
    banner.classList.remove("is-visible");
    window.setTimeout(() => {
      banner.hidden = true;
    }, 180);
  }

  function accept() {
    writeConsent(ACCEPTED_VALUE);
    hideBanner();
    window.dispatchEvent(new CustomEvent("cognifocus:analytics-consent-accepted"));
  }

  function decline() {
    writeConsent(DECLINED_VALUE);
    hideBanner();
  }

  acceptButton?.addEventListener("click", accept);
  declineButton?.addEventListener("click", decline);

  banner.hidden = false;
  window.requestAnimationFrame(() => {
    banner.classList.add("is-visible");
  });
}
