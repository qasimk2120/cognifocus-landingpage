# CogniFocus Landing Page — AI Agent Context

> Canonical brain for the `cognifocus-landingpage` repo.
> All AI tool config files in this repo reference this file.
> Shared product docs (brand, personality, design) live in `../cognifocus-docs/`

---

## What This Repo Is

The public-facing marketing site and content hub for CogniFocus.
Live at: `https://cognifocus.app`
Output: fully static (Astro `output: "static"`)

---

## Tech Stack

- **Framework:** Astro 5
- **Output:** Static — no SSR, no server routes
- **Analytics:** PostHog (`posthog-js`)
- **Data/Auth:** Firebase 12 (waitlist + signup flows only)
- **Icons:** astro-icon + Iconify (MDI + SimpleIcons)
- **SEO:** astro-sitemap, astro-robots-txt
- **LLM optimization:** astro-llms-md — generates `llms.txt`, `llms-full.txt`, per-page `.md` at build time
- **Build format:** `file` (e.g. `/page.html` not `/page/index.html`)

**Commands:**
```
npm run dev                  # local dev server
npm run build                # production build (runs mojibake check pre/post)
npm run preview              # preview built output
npm run add:badge            # copy badge embed HTML first; imports it from the Windows clipboard
npm run sync:cms-content     # pull blog + release notes from CMS into src/content/
npm run publish:cms-content  # publish CMS content via PowerShell script
```

**Content sources:**
- `src/content/blog/` — JSON files pulled from CMS via `sync:cms-content`
- `src/content/releases/` — JSON files pulled from CMS via `sync:cms-content`
- CMS backend is in `../cognifocus-backend/` (Cloud Functions for Firebase project `cognifocuslandingpage`)

---

## CMS Integration

Content is NOT hardcoded. Blog posts and release notes live in Firestore, managed via Cloud Functions in `cognifocus-backend`.

**To update content locally:**
```
CMS_FUNCTION_BASE_URL=<url> CMS_BUILD_AUTH_TOKEN=<token> npm run sync:cms-content
```

**`sync-cms-content.mjs` calls:**
- `listCmsBlogPosts` → writes `src/content/blog/{slug}.json`
- `listCmsReleaseNotes` → writes `src/content/releases/{slug}.json`

Only `published` status content is pulled during builds. Drafts are admin-only.

**Mojibake guard:** pre/post build script checks for encoding corruption in content files. Do not bypass it.

---

## Site Structure

| Path | Purpose |
|---|---|
| `/` | Homepage |
| `/blog/` | Blog index + individual posts |
| `/whats-new/` | Release notes |
| `/download.html` | App download page |
| `/ios-waitlist.html` | iOS waitlist signup |
| `/privacy.html` | Privacy policy |
| `/terms.html` | Terms of service |
| `/404` | 404 page |
| `/admin` | CMS admin (excluded from sitemap + robots) |

**Redirects:**
- `/blog/stop-app-switching.html` → `/blog/how-to-stop-app-switching.html` (301)

---

## Firebase Usage (landing page only)

Firebase is used **only** for form submissions (waitlist, newsletter). No auth session, no Firestore reads from the browser for content.

All form endpoints go through Cloud Functions in `cognifocus-backend`:
- `joinIosWaitlist` — iOS waitlist signup
- `joinNewsletter` — newsletter / launch interest
- `unsubscribeNewsletter` — token-based unsubscribe
- `submitSupportRequest` — support form

All forms use Cloudflare Turnstile for bot protection.

---

## SEO / LLM Rules

- Every page must have a proper `<title>`, meta description, canonical, and OG tags
- The `llms.txt` and per-page `.md` files are auto-generated — do not manually edit them
- Sitemap excludes: `/admin`, `/blog/per-page/`, `/per-page/`, `/drafts/`, and the old redirect slug
- `robots.txt` disallows: `/drafts/`, `/internal/`, `/dev/`, `/test/`, `/tmp/`, `/private/`, `/admin/`
- Do not add pages to disallowed paths without updating both sitemap filter and robots config

---

## Brand & Content Rules

Read `../cognifocus-docs/` for full brand context. Key rules for this repo:

- CogniFocus is a **behavioral focus companion** — never describe it as a generic productivity app
- Copy must feel premium, emotionally aware, slightly chaotic — not corporate
- The Goblin is a core mechanic — reference it confidently in copy, not as a gimmick
- Blog posts and release notes come from the CMS — do not hardcode content
- iOS is waitlist only — do not imply iOS is currently available
- Android is live — link to Play Store

---

## Non-Negotiables

- Never commit `.env` files or tokens
- Never edit `src/content/blog/` or `src/content/releases/` files manually — they are CMS-synced
- Never bypass the mojibake check
- Keep sitemap filter and robots in sync when adding new routes
- All new pages need `<title>`, canonical, meta description, and OG tags from day one
- Static output only — do not add SSR adapters

---

## Shared Docs Reference

All product context (brand, personality, tier system, design guidelines) → `../cognifocus-docs/`

Key docs for landing page work:
- `../cognifocus-docs/brand-design-guidelines.md`
- `../cognifocus-docs/ui-text-guidelines.md`
- `../cognifocus-docs/personality-definitions.md`
- `../cognifocus-docs/cms-content-workflow.md`
