# CogniFocus Landing Page — Claude Context

Read `AI_CONTEXT.md` in this repo root for the full technical brain.
Shared product docs → `../cognifocus-docs/`

---

## Copy & Content Rules

- CogniFocus is a behavioral focus companion — never describe it as a generic productivity app
- Mention attention slips, app switching, doomscrolling, Shield, and Goblin accountability where relevant
- Prefer concrete behavior examples over vague claims
- Tone: internet-native, founder-authentic, emotionally aware
- Never write AI-slop blog copy — specific, human, useful only

## Brain — MANDATORY before any blog/CMS work

Before writing or editing any blog JSON, query the brain via QMD (collection: `obsidian-mind`):
- `CogniFocus_Writing_Rules` — no Oxford comma, no em dashes, direct voice
- `CogniFocus_CMS_Workflow` — JSON required fields, direction of truth, publish flags
- `CogniFocus_SEO_Brain` — keyword strategy, topic gaps, canonical rules

QMD query example:
```json
{
  "searches": [{"type": "lex", "query": "CogniFocus writing rules CMS blog"}],
  "intent": "get blog content constraints before writing",
  "collection": "obsidian-mind"
}
```

## CMS / Blog Rules

- Use `npm run sync:cms-content` and `npm run publish:cms-content` — do not manually edit `src/content/` files
- Preserve slug, metadata, sitemap, and build/publish automation
- Blog content must be useful and specific — no generic AI filler
- Add internal links where natural
- Keep titles, descriptions, OG data, and schema aligned with the article topic
- Avoid duplicate or cannibalized articles

## SEO Rules

- Semantic headings on every page
- Unique metadata per page
- Prefer question-based and intent-based blog topics
- Maintain sitemap filter and canonical behavior
- Never add pages to disallowed paths without updating both sitemap filter and robots config

## Avoid

- Generic productivity SaaS language
- Corporate tone
- Manually editing CMS-generated output unless explicitly required
- Bypassing publishing scripts
