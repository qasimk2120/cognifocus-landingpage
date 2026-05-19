export const JSON_FETCH_HEADERS = Object.freeze({
  "Content-Type": "application/json",
  Accept: "application/json",
});

const HANDLED_STATUS_MESSAGES = Object.freeze({
  429: "Too many attempts. Give the Goblin a minute.",
  403: "Verification failed. The Goblin thinks you might be a bot. Try again.",
  400: "Something looks off. Check your email and try again.",
  415: "Something looks off. Check your email and try again.",
});

export function isHandledWaitlistStatus(status) {
  return Object.prototype.hasOwnProperty.call(HANDLED_STATUS_MESSAGES, status);
}

export function getWaitlistMessageForStatus(status) {
  return HANDLED_STATUS_MESSAGES[status] ?? null;
}

export function isVerificationFailure(data) {
  return data?.error === "Verification failed";
}

export function resetTurnstileWidget() {
  window.turnstile?.reset?.();
}

export async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
