// Newsletter / launch interest capture — constants
// Backend: joinNewsletter Cloud Function (cognifocuslandingpage project)
// NOTE: Newsletter email sending is deferred. No emails are sent from this function.
// Records are written to Firestore: newsletter/{email} + notifications/{autoId}.

export const NEWSLETTER_ENDPOINT =
  "https://europe-west1-cognifocuslandingpage.cloudfunctions.net/joinNewsletter";

// localStorage keys
export const NEWSLETTER_JOINED_KEY = "cognifocus_newsletter_joined";
export const NEWSLETTER_DIALOG_DISMISSED_KEY = "cognifocus_newsletter_dialog_dismissed";

// How long to suppress the dialog after dismissal (7 days)
export const NEWSLETTER_DIALOG_DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// How long to wait before showing the dialog on first visit (45 seconds)
export const NEWSLETTER_DIALOG_DELAY_MS = 45_000;

// Cloudflare Turnstile sitekey (same key used across all landing page forms)
export const TURNSTILE_SITEKEY = "0x4AAAAAADR7PaDsKmcbHtqJ";

// Consent text shown next to the checkbox.
// MUST match the CONSENT_TEXT constant in:
//   cognifocusBackend/functions/src/shared/newsletter/config.js
export const CONSENT_TEXT =
  "Rare focus updates — launch milestones, product experiments, and Goblin dispatches. We email slowly. Unsubscribe anytime.";

export const SUCCESS_MESSAGE =
  "You’re in. The Goblin noted your email. It emails rarely.";
export const ALREADY_JOINED_MESSAGE =
  "You’re already on the list. The Goblin remembered.";
export const ERROR_MESSAGE =
  "Couldn’t add you right now. Try again in a moment.";
