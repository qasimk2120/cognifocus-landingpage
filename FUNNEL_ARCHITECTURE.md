# CogniFocus Funnel Architecture

Audited: 2026-06-01 — Updated: 2026-06-01 (email templates audited, shared modules centralized)

---

## Email System — Cloudflare Email Routing (Free Tier)

These addresses are **receive and forward only**. We cannot send outbound from them without a paid SMTP provider.

| Address | Purpose |
|---|---|
| hello@cognifocus.app | General contact / founder inbox |
| support@cognifocus.app | Public-facing support |
| playstore@cognifocus.app | Google Play communications |

**Deferred:** Outbound automated emails (onboarding, launch, recovery, newsletter) require a paid provider (e.g. Resend, Postmark, SendGrid). Do not implement until chosen.

---

## Firebase Projects

Two separate Firebase projects:

| Project | Used by |
|---|---|
| cognifocus app project | Android app auth, Firestore user profiles, callable functions |
| cognifocuslandingpage | Landing page Cloud Functions (waitlist, support) |

This separation is correct. Do not merge them.

---

## Waitlist System

### iOS Waitlist

**Frontend:**
- Full page: `/ios-waitlist` (`src/pages/ios-waitlist.astro`)
- Download page banner: `src/scripts/download/ios-waitlist-banner.js`
- Turnstile bot protection on both

**Backend:**
- Cloud Function: `joinIosWaitlist` (cognifocuslandingpage project, europe-west1)
- Endpoint: `https://europe-west1-cognifocuslandingpage.cloudfunctions.net/joinIosWaitlist`

**Payload sent:**
```json
{
  "email": "...",
  "name": "...",
  "website": "...",         // honeypot field
  "turnstileToken": "...",
  "source": "ios_waitlist_page | download_page_ios_banner | utm_source value",
  "page": "/ios-waitlist.html",
  "utmSource": "...",
  "utmMedium": "...",
  "utmCampaign": "...",
  "referrer": "..."
}
```

**What the backend stores (Firestore `ios_waitlist/{email}`):**
- `email`, `name`, `source`, `page`, `userAgent`
- `utmSource`, `utmMedium`, `utmCampaign`, `referrer`
- `interestType: "ios_waitlist"`
- `status: "waitlisted"`
- `createdAt`, `updatedAt` (serverTimestamp)
- `confirmationEmailStatus`, `adminNotificationStatus`

**Dedup:** email is the document key — repeat submissions merge, no duplicate records.  
**Client dedup:** localStorage key `cognifocus_ios_waitlist_joined` prevents resubmit.

**Emails sent on first signup:**
- User confirmation: `"You're on the CogniFocus iOS waitlist"` → user's email
- Admin notification: `"New iOS waitlist signup"` → `getcognifocus@gmail.com`  
Both queued via `mail` collection → Firebase Mail Extension.

---

## Support System

### Landing Page Support Form

**Frontend:** `/support` (`src/pages/support.astro`)

**Backend:**
- Cloud Function: `submitSupportRequest` (cognifocuslandingpage project)
- Endpoint: `https://europe-west1-cognifocuslandingpage.cloudfunctions.net/submitSupportRequest`

**Topics accepted:** `bug`, `account`, `billing`, `privacy`, `delete_account`, `feature_request`, `other`

**What the backend stores (Firestore `support_requests/{autoId}`):**
- `ticketId` (format: `CF-XXXXXX`)
- `name`, `email`, `topic`, `message`, `page`, `userAgent`
- `status: "open"`
- `source: "website_support"`
- `createdAt`, `updatedAt`

**Emails sent on every submission:**
- User confirmation: `"We got your CogniFocus support request | CF-XXXXXX"` → user's email
- Admin notification: `"New support request | CF-XXXXXX"` → `getcognifocus@gmail.com`  
Both queued via `mail` collection → Firebase Mail Extension.

### In-App Support

**Service:** `src/app/services/infrastructure/support/settings-support.service.ts`

- Calls Firebase callable function `submitSupportRequest` on the **app Firebase project** (not the landing page project)
- Rate limited: 3 per day, 15 min cooldown between requests
- Attaches rich device/session/mood/streak context automatically
- Requires auth token (anonymous or Google)

**What it stores:** Context is sent to backend callable function. Backend should write to Firestore `supportRequests` collection.

---

## User Profile / Email Capture

**Service:** `src/app/services/infrastructure/profile/user-profile.service.ts`

**Firestore path:** `users/{uid}`

**Fields written:**
```
uid
authProvider         // 'anonymous' | 'google'
email                // Google users only. null for anonymous. NOT marketing-subscribed.
premium.isActive
premium.entitlementId
premium.lastSyncedAt
profile.displayName
profile.age
profile.personalityId
onboarding.completed
metadata.platform
metadata.appVersion
createdAt            // set once on first write
updatedAt            // updated on every sync
```

**Marketing consent:** NOT collected. No auto-subscription. `marketingConsent` field deferred until explicit opt-in UI is added.

---

## Email Sending — Firebase Mail Extension

The backend uses the `mail` Firestore collection as a queue for the Firebase Extensions "Trigger Email" pattern. Documents written to `mail/{autoId}` are processed by the extension and sent via the configured SMTP provider.

**Status:** The extension IS configured on the `cognifocuslandingpage` Firebase project. Confirmation emails to users and admin notifications to `getcognifocus@gmail.com` are sent via this mechanism on iOS waitlist and support requests.

**For Cloudflare Email Routing addresses (hello@, support@, playstore@):** These are receive/forward only. Outbound sending from these addresses requires separate SMTP configuration.

---

## Shared Backend Modules (Source of Truth)

All public form handlers share these modules in `cognifocusBackend/functions/src/shared/`:

| File | Exports | Purpose |
|---|---|---|
| `firebase.js` | `admin`, `db` | Firebase Admin init |
| `http.js` | `WEBSITE_CORS_ORIGINS`, `CMS_CORS_ORIGINS`, `hasJsonContentType`, `getBearerToken` | CORS allowlists + content-type check |
| `turnstile.js` | `TURNSTILE_SECRET_KEY`, `verifyTurnstile` | Cloudflare Turnstile bot verification |
| `rate-limit.js` | `checkRateLimit`, `normalizeIp` | IP rate limiting via Firestore |
| `validation.js` | `isValidEmail`, `normalizeEmail`, `checkHoneypot`, `extractUtmFields`, `escapeHtml`, `hasControlCharacters`, `hashValue`, `sanitizeString`, `sanitizeTextBlock`, `slugify` | All string validation + funnel-specific helpers |
| `notifications.js` | `writeNotification` | Writes Firestore `notifications` record (non-blocking) |
| `mail.js` | `queueMail` | Queues `mail` collection doc — supports `html`, `text`, `replyTo` |

---

## Email Template System

**Location:** `cognifocusBackend/functions/src/shared/email/`

```
shared/email/
  theme.js           — design tokens (colors, fonts, spacing, asset URLs)
  layout.js          — shared primitives: wrapEmail, emailHeader, emailFooter,
                       emailButton, goblinCallout, adminRow, emailDivider, p
  preview.js         — local preview script (renders all templates to /tmp/)
  templates/
    iosWaitlistConfirmation.js   — iOS waitlist user email (ACTIVE)
    supportConfirmation.js       — Support user email (ACTIVE)
    newsletterWelcome.js         — Newsletter welcome (EXISTS, NOT WIRED)
  admin/
    waitlistAdminNotification.js     — Waitlist admin email (ACTIVE)
    supportAdminNotification.js      — Support admin email (ACTIVE)
    newsletterAdminNotification.js   — Newsletter admin email (ACTIVE)
```

**Design:**
- Dark-first (dark background `#060a13`, light text `#e8f4f8`)
- CogniFocus cyan `#00c8e0` as primary accent
- Goblin green `#6abf3c` callout blocks for personality
- Table-based layout for Outlook compatibility
- Inline styles only (no class-based CSS — stripped by email clients)
- `@media (prefers-color-scheme: dark)` in `<style>` for Gmail/Apple Mail
- Max width 600px, mobile-friendly
- Logo served from `https://cognifocus.app/assets/logo/text-logo.png`

**To preview templates locally:**
```bash
cd F:\Project_folder\cognifocusBackend\functions
node src/shared/email/preview.js
# Opens: %TEMP%\email-previews\index.html
```

---

## Email Templates — Active

### 1. iOS Waitlist — User Confirmation
- **File:** `shared/email/templates/iosWaitlistConfirmation.js`
- **Subject:** `You're on the CogniFocus iOS waitlist`
- **Preview text:** `The Goblin noted your interest. No fake launch date — we'll email when it ships.`
- **To:** user's email address
- **Plaintext:** yes
- **Body:** Welcome, no fake launch date, Android CTA, Goblin callout, one-time confirmation note
- **Status: ACTIVE** — queued on first signup

### 2. iOS Waitlist — Admin Notification
- **File:** `shared/email/admin/waitlistAdminNotification.js`
- **Subject:** `[Waitlist] {email}`
- **To:** `getcognifocus@gmail.com`
- **Body:** Scannable table — Email, Name, Source, Page, UTM fields (when present)
- **Status: ACTIVE** — queued on first signup

### 3. Support Request — User Confirmation
- **File:** `shared/email/templates/supportConfirmation.js`
- **Subject:** `We got your request — {ticketId}`
- **Preview text:** `The Goblin's passing it to the team. Expect a reply at the email you provided.`
- **To:** user's email address
- **Plaintext:** yes
- **Body:** Ticket card (ID + topic + reply-to), support contact, Goblin callout
- **Status: ACTIVE** — queued on every support request

### 4. Support Request — Admin Notification
- **File:** `shared/email/admin/supportAdminNotification.js`
- **Subject:** `[Support] {ticketId} — {email}`
- **To:** `getcognifocus@gmail.com`
- **Body:** Compact header (ticket + topic), data rows, full message block, user agent
- **Status: ACTIVE** — queued on every support request

### 5. Newsletter — Admin Notification
- **File:** `shared/email/admin/newsletterAdminNotification.js`
- **Subject:** `[Newsletter] {email}`
- **To:** `getcognifocus@gmail.com`
- **Body:** Scannable — Email, Name, Type, Source, Consent, UTM fields
- **Status: ACTIVE** — queued on every newsletter signup

---

## Email Templates — Deferred / Not Yet Sent

### Newsletter Welcome
- **File:** `shared/email/templates/newsletterWelcome.js`
- **Status: EXISTS, NOT WIRED** — template is production-ready but never sent
- **Subject options:**
  - `"The Goblin noticed you signed up"`
  - `"You're in — here's what to expect from CogniFocus updates"`
  - `"Focus notes incoming — welcome to the list"` (launch_updates variant)
- **Preview text:** Goblin-flavored, anti-doomscrolling tone
- **Body:** Welcome, what subscribers get, Android CTA, Goblin callout, unsubscribe note

**To enable newsletter sending:**
1. Open `functions/src/newsletter.js`
2. Find the `NEWSLETTER WELCOME EMAIL (DISABLED)` comment block
3. Import `newsletterWelcome` from `./shared/email/templates/newsletterWelcome`
4. Uncomment the `queueMail()` call
5. Deploy: `firebase deploy --only functions:joinNewsletter`
6. Update this doc

### Onboarding / Recovery / Launch Emails (App)
- Not implemented anywhere
- Would require paid SMTP provider + separate email content design

---

## Email Sender Identity

The Firebase Mail Extension is configured on the `cognifocuslandingpage` project. The actual sender address is set in the Extension configuration in the Firebase Console — **not in source code**. To find or change it:

1. Firebase Console → `cognifocuslandingpage` → Extensions → Trigger Email
2. Look at "SMTP connection URI" and "Default FROM address"

**Do not** configure `hello@cognifocus.app`, `support@cognifocus.app`, or `playstore@cognifocus.app` as the FROM address unless a dedicated SMTP service (e.g. Google Workspace SMTP, Mailgun, Resend) is configured to send from those domains. Cloudflare Email Routing cannot send outbound.

---

## Backend Firebase Project Structure

**Project:** `cognifocuslandingpage`  
**Repo:** `cognifocusBackend/`  
**Functions deployed (`europe-west1`):**

| Function | Purpose |
|---|---|
| `joinIosWaitlist` | iOS waitlist signup — Turnstile, dedup, email queue, notifications |
| `submitSupportRequest` | Landing page support form — Turnstile, ticket ID, email queue, notifications |
| `joinNewsletter` | Newsletter / launch interest — Turnstile, dedup, consent tracking, notifications |
| `verifyCmsLoginChallenge` | CMS admin auth |
| `listCmsBlogPosts`, `getCmsBlogPost`, etc. | CMS blog management |
| `listCmsReleaseNotes`, `getCmsReleaseNote`, etc. | CMS release notes management |

**Firestore collections written by functions:**

| Collection | Written by |
|---|---|
| `ios_waitlist/{email}` | `joinIosWaitlist` |
| `support_requests/{autoId}` | `submitSupportRequest` |
| `newsletter/{email}` | `joinNewsletter` |
| `notifications/{autoId}` | All three above |
| `mail/{autoId}` | All three above (email queue) |
| `rate_limits/{key}` | All three (IP + email rate limiting) |

---

## Notifications Collection

Every new waitlist join, support request, or newsletter signup writes a record to `notifications/{autoId}`:

```json
{
  "type": "ios_waitlist_join | support_request_web | newsletter_join",
  "email": "...",
  "name": "...",
  "source": "...",
  "page": "...",
  "utmSource": "...",
  "utmMedium": "...",
  "utmCampaign": "...",
  "referrer": "...",
  "status": "unread",
  "createdAt": "<serverTimestamp>"
}
```

Founder can query `notifications` filtered by `status == "unread"` in the Firebase Console. No dashboard needed yet.

---

## Newsletter / Launch Interest

**Backend function:** `joinNewsletter`  
**Endpoint:** `https://europe-west1-cognifocuslandingpage.cloudfunctions.net/joinNewsletter`  
**Collection:** `newsletter/{email}`

**Firestore document schema:**
```
newsletter/{email} {
  email, name, interestType, tags: string[],
  source, page, userAgent,
  utmSource, utmMedium, utmCampaign, referrer,
  marketingConsent: bool, consentText, consentTimestamp,
  status: "subscribed" | "unsubscribed",
  unsubscribeToken: string,  // random base64url UUID, never in URLs directly
  unsubscribedAt: Timestamp | null,
  createdAt, updatedAt
}
```

**Segmentation (`tags`):** Derived from `interestType` at signup. Allowed values defined in `shared/newsletter/config.js → TAGS`. Future manual tags can be added per batch campaign.

**Marketing consent:** Only `true` when frontend explicitly passes `marketingConsent: true` from a visible checkbox. Never auto-set.

---

## Unsubscribe Architecture

**Function:** `unsubscribeNewsletter`  
**Endpoint:** `https://europe-west1-cognifocuslandingpage.cloudfunctions.net/unsubscribeNewsletter?t=<token>`

- Token is a random base64url string (24 bytes) stored on `newsletter/{email}.unsubscribeToken`
- Raw email is **never in the URL** — only the opaque token
- GET: returns branded HTML confirmation page
- POST: RFC 8058 one-click unsubscribe (Gmail unsubscribe button)
- Already-unsubscribed: graceful no-op with friendly message
- Token is rotated on unsubscribe (old links stop working)
- Token is also refreshed on re-subscribe

**List-Unsubscribe headers** (added by `queueMail()` when `listUnsubscribe` is passed):
```
List-Unsubscribe: <mailto:support@cognifocus.app?subject=unsubscribe>, <https://...?t=TOKEN>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

**Helper:** `shared/newsletter/unsubscribe.js` — `generateUnsubscribeToken()`, `findEmailByToken()`, `markUnsubscribed()`, `getListUnsubscribeHeaders()`

---

## Newsletter Philosophy

CogniFocus is a **behavioral focus product**. The newsletter must reflect that:

- **Rare updates only** — we email when something is worth your attention
- **Not a drip campaign** — no automated sequences, no re-engagement spam
- **Psychologically respectful** — your inbox is a focus environment too
- **Transparent** — explicit consent checkbox, one-click unsubscribe, honest tone

Consent text (must match `config.js → CONSENT_TEXT` and frontend checkbox):
> "Rare focus updates — launch milestones, product experiments, and Goblin dispatches. We email slowly. Unsubscribe anytime."

---

## Newsletter Feature Flags

All controlled in `shared/newsletter/config.js → FEATURES`:

| Flag | Default | What it controls |
|---|---|---|
| `NEWSLETTER_SENDING_ENABLED` | `false` | Master switch for welcome emails |
| `EMAIL_OPEN_TRACKING_ENABLED` | `false` | Tracking pixel injection |
| `EMAIL_CLICK_TRACKING_ENABLED` | `false` | Redirect-based click tracking |
| `CAMPAIGN_ANALYTICS_ENABLED` | `false` | Writes to `campaigns/` collection |

**To enable newsletter sending:**
1. Set `FEATURES.NEWSLETTER_SENDING_ENABLED = true` in `config.js`
2. Uncomment the block in `newsletter.js`
3. Deploy `joinNewsletter` and `unsubscribeNewsletter` functions
4. Verify `unsubscribeNewsletter` works first (test with a real token)
5. Update this doc

---

## Newsletter Analytics (Deferred)

When `FEATURES.CAMPAIGN_ANALYTICS_ENABLED = true`, analytics will write to:
- `campaigns/{campaignId}` — subject, sent count, unsubscribe count
- `newsletter/{email}.sendHistory` — per-subscriber send log

**Useful minimal metrics (no creepy tracking):**
- `sends` — total emails queued per campaign
- `delivery_failures` — from Firebase Mail Extension events
- `unsubscribes` — from `unsubscribeNewsletter` calls
- `unsubscribe_rate` = unsubscribes / sends

**Not tracked (privacy):**
- Open rates (no pixel by default)
- Click rates (no redirect tracking by default)
- Behavioral data beyond subscribe/unsubscribe

---

## Logo / Asset Note

Email templates use the hosted logo URL from `shared/email/theme.js → ASSETS.logoUrl`:
`https://cognifocus.app/assets/logo/text-logo.png`

To swap the logo: update `ASSETS.logoUrl` in `theme.js` only — all templates inherit it automatically.

---

## Newsletter UI — Locations and Behavior

### Primary: Centered Modal Dialog (`NewsletterDialog.astro`)
- **Location:** Fixed centered overlay (full-viewport scrim), injected in BaseLayout
- **Visual:** Dark semi-transparent backdrop + blur scrim, centered card, scale+fade-up entry animation
- **Trigger:** Whichever comes first — **45 seconds** on page OR **25% scroll depth**
- **Suppressed if:** user already joined OR dismissed within last 7 days
- **Dismiss:** Click X, click backdrop scrim, or press Escape
- **Mobile (≤479px):** slides up as a bottom sheet instead of centered card
- **localStorage keys:**
  - `cognifocus_newsletter_joined` — "true" when subscribed
  - `cognifocus_newsletter_dialog_dismissed` — timestamp (suppressed 7 days)

### Manual Open Trigger — `data-newsletter-open`
Any element with `data-newsletter-open` attribute opens the dialog on click. The entry script listens via event delegation — no per-element wiring needed.
- Footer "Updates" link uses this: `<a href="#" data-newsletter-open>Updates</a>`
- `forceOpen()` bypasses the 45s/scroll auto-trigger guard and dismiss suppression
- If user already joined: dialog opens and form.js shows "You're already on the list" — no form rendered
- To add another trigger anywhere on the site: add `data-newsletter-open` to any element

### Secondary: Footer Strip (`NewsletterStrip.astro`)
- **Status: DISABLED BY DEFAULT** — `showNewsletterStrip = false` in BaseLayout
- Component exists at `src/components/newsletter/NewsletterStrip.astro`
- To enable on a specific page: pass `showNewsletterStrip={true}` as a BaseLayout prop
- Not shown by default to avoid cluttering the page below "Featured on"
- Footer "Updates" link (`#newsletterStripForm`) only works when strip is enabled

### Shared Turnstile Modal
- Both strip and dialog share one Turnstile modal (`#newsletterTurnstileModal`)
- Turnstile script loaded globally in BaseLayout (`render=explicit` — no overhead until triggered)
- Sitekey: `0x4AAAAAADR7PaDsKmcbHtqJ` (same key as all other landing page forms)

### Consent
- Explicit checkbox required — `marketingConsent: true` only sent when checked
- `consentText` and `consentTimestamp` (ISO string) sent on submit
- Never auto-set from page load or Google sign-in

### Backend Endpoint
- `POST https://europe-west1-cognifocuslandingpage.cloudfunctions.net/joinNewsletter`
- Payload: `{ email, name, interestType, marketingConsent, consentText, consentTimestamp, source, page, utmSource, utmMedium, utmCampaign, referrer, turnstileToken, website }`
- `source` values: `"footer_strip"` | `"newsletter_dialog"`

### Script Entry
- `src/scripts/entries/newsletter.js` — loaded on every page
- Initializes both the strip form and the dialog form
- Imports `form.js` and `dialog.js` from `src/scripts/newsletter/`

### Newsletter Email Sending
**NOT implemented.** `joinNewsletter` writes to Firestore only. No welcome email is queued.  
Deferred until sending strategy is chosen (Resend/Postmark/Firebase Mail Extension config).

---

## What Works Now

- iOS waitlist form (landing page + download banner) ✅
- Support form (landing page) ✅
- In-app support request (Android app) ✅
- User profile creation/sync on sign-in ✅
- Google sign-in email stored in user profile ✅
- UTM param capture on waitlist forms (frontend + backend) ✅
- Turnstile bot protection on all public forms ✅
- Rate limiting (IP + email) on all public forms ✅
- Honeypot on all public forms ✅
- Founder notification records in Firestore on every signup/request ✅
- Email confirmation queue (mail collection) for waitlist + support ✅
- Ticket IDs on support requests ✅
- `joinNewsletter` backend function (ready to deploy) ✅
- Newsletter centered modal dialog (45s or 25% scroll, dismissible, every page) ✅
- Newsletter footer strip (built, disabled by default — enable with `showNewsletterStrip={true}`) ✅
- Explicit `marketingConsent` checkbox on all newsletter forms ✅
- `marketingConsent` field modelled in app profile (optional, not yet collected) ✅
- "Updates" link in footer Explore nav ✅

---

## What Is Deferred

| Feature | Blocker | Notes |
|---|---|---|
| Newsletter welcome email | No sending strategy chosen | Backend records Firestore only — no email queued |
| `joinNewsletter` deploy | Needs `firebase deploy` | New function, not yet live |
| Marketing consent opt-in in app | No in-app UI | Field modelled; activate when consent screen is added |
| Outbound from hello@/support@/playstore@ | Cloudflare Email Routing = receive only | Needs SMTP provider |
| Newsletter admin page/view | No CMS or dashboard | Query `notifications` collection in Firebase Console |

---

## Test Checklist

### iOS Waitlist
- [ ] Submit form on `/ios-waitlist` — success message appears
- [ ] Reload page — "already joined" state shown (localStorage)
- [ ] Submit with invalid email — validation error shown
- [ ] Submit from `/download` banner — success state shown
- [ ] Submit with `?utm_source=test&utm_campaign=launch` in URL — verify stored in Firestore

### Support Form (Landing Page)
- [ ] Submit form on `/support` — success message appears
- [ ] Check inbox — confirmation email subject reads `We got your CogniFocus support request | CF-XXXXXX` (no garbled characters)
- [ ] Check `getcognifocus@gmail.com` — admin notification received
- [ ] Check `notifications` collection — `support_request_web` record with `status: "unread"`
- [ ] Submit with missing topic — validation error shown
- [ ] Submit with missing message — validation error shown

### In-App Support
- [ ] Open support form from settings — form pre-fills name and email from Google account
- [ ] Submit — success state shown
- [ ] Submit again within 15 min — rate limit error shown
- [ ] Submit 4 times in one day — daily limit error shown

### Newsletter Strip (disabled by default)
- Strip is off by default — only test when `showNewsletterStrip={true}` is passed to BaseLayout
- [ ] When enabled: submit with no email — validation error shown
- [ ] When enabled: submit valid email + consent — Turnstile modal, then success

### Newsletter Dialog — Manual Open (footer "Updates" link)
- [ ] Click "Updates" in footer nav → dialog opens immediately (centered modal)
- [ ] Click "Updates" when already joined → dialog opens, shows "You're already on the list. Goblin remembered." — no form shown
- [ ] Click "Updates" after dismissing — dialog opens (manual open overrides dismiss suppression)
- [ ] `href="#"` on the link — no scroll jump, `event.preventDefault()` fires

### Newsletter Dialog — Auto Trigger
- [ ] Open any page — dialog does NOT appear immediately
- [ ] Wait 45 seconds — dialog appears centered with dark backdrop
- [ ] Click X — dialog hides; re-open page — dialog does NOT reappear for 7 days
- [ ] Click backdrop — dialog hides (same dismiss behavior)
- [ ] Press Escape — dialog hides
- [ ] Submit form in dialog — success, dialog closes automatically
- [ ] On mobile (≤479px) — dialog slides up from bottom of screen (full width)
- [ ] If already joined (localStorage) — dialog never shows

### User Profile
- [ ] Sign in with Google — check Firestore `users/{uid}` — `email` field present and correct
- [ ] Sign in anonymously — check Firestore `users/{uid}` — `email` field is `null`
- [ ] `authProvider` field is `'google'` for Google users, `'anonymous'` for anon users
