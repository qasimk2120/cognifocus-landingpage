# Agent Discovery Deployment Notes

CogniFocus is currently served from GitHub Pages behind Cloudflare. GitHub Pages does not apply `public/_headers`, so response headers that scanners require must be configured at Cloudflare.

## Cloudflare Response Header Transform Rules

Create these in Cloudflare Dashboard > Rules > Transform Rules > Response Header Transform Rules.

### Homepage Link header

- Rule name: `Agent discovery Link header`
- Match expression: `(http.host eq "cognifocus.app" and http.request.uri.path eq "/")`
- Operation: `Set static`
- Header name: `Link`
- Value:

```text
</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json", </openapi.json>; rel="service-desc"; type="application/json", </llms.txt>; rel="service-doc"; type="text/plain", </.well-known/agent-skills/index.json>; rel="service-desc"; type="application/json"
```

### API catalog content type

- Rule name: `API catalog content type`
- Match expression: `(http.host eq "cognifocus.app" and http.request.uri.path eq "/.well-known/api-catalog")`
- Operation: `Set static`
- Header name: `Content-Type`
- Value:

```text
application/linkset+json; charset=utf-8
```

### OpenAPI content type

- Rule name: `OpenAPI content type`
- Match expression: `(http.host eq "cognifocus.app" and http.request.uri.path eq "/openapi.json")`
- Operation: `Set static`
- Header name: `Content-Type`
- Value:

```text
application/json; charset=utf-8
```

### Agent skills index content type

- Rule name: `Agent skills index content type`
- Match expression: `(http.host eq "cognifocus.app" and http.request.uri.path eq "/.well-known/agent-skills/index.json")`
- Operation: `Set static`
- Header name: `Content-Type`
- Value:

```text
application/json; charset=utf-8
```

## Markdown for Agents

The static fallback already exists at `/index.md`, and `llms.txt` is generated at `/llms.txt`.

True `Accept: text/markdown` negotiation for `/` is a Cloudflare zone setting, not a static-site file. Enable it in Cloudflare Dashboard:

- Open the `cognifocus.app` zone.
- Go to AI Crawl Control, or create a Configuration Rule for the matching hostname/path.
- Add setting: `Markdown for Agents`
- Set it to `On`

After enabling, this request should return `Content-Type: text/markdown` instead of HTML:

```bash
curl -I -H "Accept: text/markdown" https://cognifocus.app/
```
