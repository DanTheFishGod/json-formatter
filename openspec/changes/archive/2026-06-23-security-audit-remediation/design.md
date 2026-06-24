## Context

The extension is a Chrome MV3 browser extension that formats JSON responses. A full security audit (manual OWASP Top 10 review + Snyk dependency scan + Snyk Code SAST) identified 10 code-level issues. No dependency CVEs were found (211 packages scanned clean). All issues are code-level and localized to specific files.

The most significant issues center on the lifecycle of HTTP response headers: the service worker captures ALL headers via `webRequest.onHeadersReceived`, stores them in `browser.storage.session`, then the content script retrieves them and writes them into a DOM data attribute (`pre.dataset.responseInfo`) that is accessible to any script running on the page — effectively bypassing the CORS header restrictions that normally protect this data.

Secondary concerns involve `window.json` being exposed in the MAIN world (intentional but privacy-impacting), a missing LRU eviction loop in `tabResponseCache`, a malformed vendor MIME regex, and over-broad manifest permissions.

## Goals / Non-Goals

**Goals:**
- Eliminate the DOM-level exposure of response headers to page scripts
- Filter sensitive headers before they enter the extension's storage layer
- Implement the already-designed LRU eviction in `tabResponseCache`
- Fix the broken vendor MIME type regex so those content types are detected
- Tighten the manifest permissions to what's actually needed
- Gate `window.json` and `window.__jf_pre` behind DEV builds
- Fix WebSocket message validation (Snyk Code LOW finding)
- Add Snyk monitoring to CI

**Non-Goals:**
- Changing the user-visible formatting behavior
- Adding authentication or user accounts
- Refactoring the messaging system architecture
- Encrypting extension storage (low value given extension storage isolation)

## Decisions

### Decision 1: Filter headers at capture time, not at retrieval time

**Choice:** Strip sensitive headers in `worker.entry.ts` inside `webRequest.onHeadersReceived`, before they ever enter `tabResponseCache`.

**Rationale:** Filtering at the source is the correct approach — it means sensitive headers never touch session storage, never cross the messaging boundary, and never reach the DOM. Filtering later (e.g., before writing to the DOM) would leave sensitive data in storage unnecessarily.

**Blocked headers list:** `set-cookie`, `set-cookie2`, `cookie`, `authorization`, `proxy-authorization`, `www-authenticate`, `proxy-authenticate` — these are the headers that CORS normally blocks from JavaScript access and that carry authentication state.

**Alternative considered:** Block-list vs. allow-list approach. An allow-list (only pass through `content-type`, `x-content-type-options`, `cache-control`, `content-length`) is more conservative but may block headers that future features legitimately need. A block-list of known-sensitive headers is less brittle for future development. Block-list chosen.

### Decision 2: Remove pre.dataset.responseInfo entirely — pass via isolated-world messaging

**Choice:** Do not write response headers to any DOM attribute. The `console.entry.ts` (MAIN world) script currently reads `pre.dataset.responseInfo` to get the content-type header for display. Instead, it should read it via `pre.dataset.contentTypeHeader` with only the specific value it needs (not the full header set), written by the isolated-world content script after filtering.

**Rationale:** DOM data attributes are shared between isolated and MAIN worlds. Any data written to the DOM is accessible to page scripts. The correct channel for sensitive data that only needs to reach the isolated content script is to keep it in extension messaging only, never touching the DOM.

**Concrete change:** 
- Remove `pre.dataset.responseInfo = JSON.stringify(...)` from `core.entry.ts`
- If `console.entry.ts` needs to display the content-type header, write only that one field to a dedicated `pre.dataset.contentType` attribute (not the full headers object)

### Decision 3: Gate window.json behind DEV

**Choice:** Wrap the `window.json = data` assignment in `if (DEV)` in `console.entry.ts`.

**Rationale:** Exposing the full JSON response body as a global on the page window is a significant privacy surface — any ad, analytics, or injected script can call `window.json`. This is a developer-convenience feature, not a user feature. Restricting it to DEV builds eliminates the risk in production with no user-visible impact.

**Alternative considered:** Keep it enabled but document the privacy tradeoff. Rejected — documentation doesn't reduce the attack surface.

### Decision 4: Implement LRU eviction as the code already describes

**Choice:** Add the eviction loop to `addResponseInfoToCache`. The LRU timestamp tracking is already written; only the eviction step is missing.

**Max cache size:** 10 tabs (already the stated intent in the comments). Evict the entry with the oldest `responseCache_lru` timestamp when the cache would exceed 10 items.

### Decision 5: Fix vendor MIME regex with a correct pattern

**Choice:** Replace `/application\/\^(\b)+\+json/` with `/^application\/[a-z0-9!#$&\-^_.]+\+json$/i` — the standard pattern for detecting `+json` suffix media types per RFC 6838.

**Examples matched:** `application/vnd.api+json`, `application/ld+json`, `application/geo+json`.

### Decision 6: Manifest permission tightening

- Remove `unlimitedStorage` — replace with just `storage`. The extension stores a single preferences object and a ≤10-entry response cache.
- Remove the redundant `"*://*/*"` from `host_permissions` — `"<all_urls>"` already covers it.
- Add `"content_security_policy"` for `extension_pages` explicitly, locking down to the MV3 default.

### Decision 7: WebSocket nonce check (Snyk LOW)

**Choice:** Add a shared build-time nonce to the DEV WebSocket protocol. The service worker sends a nonce when the connection opens; the watch server must echo it back before any `reload_extension` messages are honored.

**Alternative considered:** Simply ignore — this is DEV-only and localhost-only. Accepted risk given the low severity, but the fix is trivial.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Header block-list may be incomplete | Use a well-known list (CORS-restricted headers) as the baseline; document the list so it can be extended |
| Removing `pre.dataset.responseInfo` may break any external tooling that reads it | The attribute was never part of the public API; document the removal in the changelog |
| `window.json` removal may surprise developers who rely on it in DEV mode | Behavior is unchanged in DEV builds; note in README |
| LRU eviction changes storage write patterns | The mutex in `tabResponseCache` already serializes all writes; eviction fits inside the existing lock |
| Vendor MIME regex change may detect new pages as JSON | The `+json` pattern is the RFC-standard way to identify JSON-derived types; false positive risk is minimal |

## Migration Plan

All changes are contained within the extension bundle — no external service changes, no storage migrations, no breaking API changes.

1. Apply code changes in order: header filter → DOM removal → LRU fix → MIME regex → manifest → DEV gates
2. Test with a JSON API page to confirm formatted rendering still works
3. Test with a vendor MIME type (`application/vnd.api+json`) to confirm new detection
4. Load unpacked in Chrome and verify options page, dark mode preference, and Raw/Parsed toggle all function
5. Verify session storage does NOT contain `set-cookie` or `authorization` headers after browsing to an authenticated JSON API
6. Ship as a patch version bump

## Open Questions

- Should `window.json` be removed entirely from production builds, or should it remain as an intentional developer feature with a visible indicator (e.g., a console message saying "json available in DEV mode")? Currently proposing silent removal in production.
- The `snyk monitor` step requires a CI pipeline — does this project have one, or does it need to be created as part of this change?
