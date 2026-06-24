## Why

A manual OWASP Top 10 review combined with Snyk dependency and SAST scans revealed code-level security issues in the extension — primarily around how response headers are captured, stored, and exposed. While no dependency CVEs were found, several application-level patterns create real information exposure risks. These need to be addressed before the next public release.

## What Changes

- **Filter sensitive HTTP response headers** before storing them in `tabResponseCache` — strip `set-cookie`, `authorization`, `cookie`, `proxy-authorization`, and similar headers at the point of capture in the service worker
- **Remove `pre.dataset.responseInfo` DOM exposure** — response headers currently get written into a DOM data attribute readable by any script on the page (including third-party scripts); move this data through isolated-world-only channels
- **Implement LRU eviction** in `tabResponseCache` — the eviction logic is described in comments and the LRU timestamp tracking exists, but the eviction loop was never written; headers from every visited JSON tab accumulate indefinitely in session storage
- **Gate `window.json` behind DEV mode** — the `console.entry.ts` script exposes the full parsed JSON payload as `window.json` in the MAIN world, making it readable by any page script; restrict this to DEV builds or document the privacy tradeoff explicitly
- **Fix WebSocket message origin validation** — the DEV-mode `ws://localhost:8585` message handler doesn't validate the sender; add a nonce or origin check (flagged by Snyk Code)
- **Fix broken vendor MIME type regex** in `getDocumentInfo.ts` — the regex `/application\/\^(\b)+\+json/` is malformed and never matches; replace with a correct pattern for vendor JSON types like `application/vnd.api+json`
- **Drop `unlimitedStorage` permission** from manifest — the extension only stores a small preferences object and a bounded response cache; regular `storage` is sufficient
- **Deduplicate `host_permissions`** — both `"*://*/*"` and `"<all_urls>"` are listed; one implies the other
- **Add explicit CSP** to the manifest for extension pages
- **Add `snyk monitor`** to CI/build pipeline for ongoing dependency monitoring

## Capabilities

### New Capabilities

- `header-filtering`: Rules for which HTTP response headers may be captured, stored, and transmitted within the extension
- `response-info-channel`: Secure internal channel for passing response metadata from service worker to content script without DOM exposure

### Modified Capabilities

*(none — no existing specs to delta)*

## Impact

- `ext/worker/worker.entry.ts` — header capture filtering
- `ext/worker/tabResponseCache.ts` — LRU eviction implementation, schema validation in production
- `ext/content/core.entry.ts` — remove `pre.dataset.responseInfo` write, remove `window.__jf_pre` global
- `ext/content/console.entry.ts` — gate `window.json` behind DEV flag
- `ext/content/lib/getDocumentInfo.ts` — fix vendor MIME regex
- `ext/manifest.json` — drop `unlimitedStorage`, deduplicate host_permissions, add CSP
- `package.json` / CI config — add `snyk monitor`
