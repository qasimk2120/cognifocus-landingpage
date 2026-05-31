---
name: cognifocus-site-discovery
type: documentation
description: Discover CogniFocus public content, markdown mirrors, and browser-facing support or waitlist endpoints.
---

# CogniFocus Site Discovery

Use this skill when an agent needs to understand CogniFocus public pages, app availability, support entry points, or the public web API used by the site.

## Resources

- Homepage: https://cognifocus.app/
- LLM index: https://cognifocus.app/llms.txt
- Full LLM text: https://cognifocus.app/llms-full.txt
- Homepage markdown: https://cognifocus.app/index.md
- API catalog: https://cognifocus.app/.well-known/api-catalog
- OpenAPI description: https://cognifocus.app/openapi.json
- RSS feed: https://cognifocus.app/feed.xml
- Sitemap: https://cognifocus.app/sitemap.xml

## Expected agent behavior

Prefer `llms.txt` and page-level markdown files for content extraction. Use `openapi.json` before calling browser-facing endpoints, and do not assume protected OAuth, MCP, or paid API capabilities unless a future discovery document advertises them.
