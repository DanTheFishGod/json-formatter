## 1. Header Filtering at Capture

- [x] 1.1 In `ext/worker/worker.entry.ts`, define a `SENSITIVE_HEADER_NAMES` set (lowercase) containing: `set-cookie`, `set-cookie2`, `cookie`, `authorization`, `proxy-authorization`, `www-authenticate`, `proxy-authenticate`
- [x] 1.2 In the `webRequest.onHeadersReceived` listener, filter the `details.responseHeaders` array to exclude any header whose lowercased name is in `SENSITIVE_HEADER_NAMES` before building the `headers` array passed to `addResponseInfoToCache`
- [x] 1.3 Verify by loading a page with auth headers and confirming `browser.storage.session` does not contain them

## 2. Remove DOM Exposure of Response Headers

- [x] 2.1 In `ext/content/core.entry.ts`, remove the line `pre.dataset.responseInfo = JSON.stringify(responseInfoResult.responseInfo)`
- [x] 2.2 Audit `ext/content/console.entry.ts` to determine what it actually uses from `pre.dataset.responseInfo` — it reads it for content-type display in DEV mode only
- [x] 2.3 If the content-type value is needed in `console.entry.ts`, write only `pre.dataset.contentType = <content-type-string>` instead of the full headers object
- [x] 2.4 Remove `window.__jf_pre = originalPreElement` from `core.entry.ts` and update any references to use a module-scoped variable instead

## 3. Gate window.json Behind DEV

- [x] 3.1 In `ext/content/console.entry.ts`, wrap the `Object.defineProperty(window, 'json', ...)` call in `if (DEV) { ... }`
- [x] 3.2 Verify that in a production build `window.json` is `undefined` on a formatted JSON page
- [x] 3.3 Verify that in a DEV build `window.json` still contains the parsed data

## 4. Implement LRU Eviction in tabResponseCache

- [x] 4.1 In `ext/worker/tabResponseCache.ts`, inside `addResponseInfoToCache`, after writing the new entry to `responseCache`, check if `Object.keys(responseCache).length > 10`
- [x] 4.2 If over limit, find the `tabId` with the smallest (oldest) value in `responseCache_lru` and delete it from both `responseCache` and `responseCache_lru`
- [x] 4.3 Verify that after visiting 11 JSON pages, session storage contains at most 10 entries

## 5. Fix Vendor MIME Type Regex

- [x] 5.1 In `ext/content/lib/getDocumentInfo.ts`, replace the malformed regex `/application\/\^(\b)+\+json/` with `/^application\/[a-z0-9!#$&\-^_.]+\+json$/i`
- [x] 5.2 Test that a response served as `application/vnd.api+json` is now detected and formatted correctly

## 6. Fix WebSocket Message Origin Validation

- [x] 6.1 In `ext/worker/worker.entry.ts`, in the DEV WebSocket `message` handler, add a validation check — only act on `reload_extension` messages if they also carry the expected build-time nonce value (define the nonce via the `define` build option alongside `DEV`)
- [x] 6.2 Update `task/watch.ts` (or the watch server) to send the nonce value alongside the `reload_extension` message

## 7. Tighten Manifest Permissions

- [x] 7.1 In `ext/manifest.json`, remove `"unlimitedStorage"` from the `permissions` array — keep only `"storage"` and `"webRequest"`
- [x] 7.2 In `ext/manifest.json`, remove `"*://*/*"` from `host_permissions` — `"<all_urls>"` alone is sufficient
- [x] 7.3 In `ext/manifest.json`, add an explicit `"content_security_policy"` key for `"extension_pages"` set to `"script-src 'self'; object-src 'self'"`
- [x] 7.4 Load unpacked extension and confirm it still functions after manifest changes

## 8. Snyk Monitoring

- [x] 8.1 Run `npx snyk monitor --dev` to register the project with Snyk for ongoing monitoring
- [x] 8.2 If a CI pipeline exists, add `npx snyk test --dev` as a step that fails the build on new HIGH or CRITICAL vulnerabilities
- [x] 8.3 Add a `.snyk` policy file to the repo to document any accepted risks or false-positive suppressions

## 9. Verification

- [x] 9.1 Re-run `npx snyk test --dev` — confirm still 0 vulnerabilities
- [x] 9.2 Re-run `npx snyk code test` — LOW finding remains; nonce mitigation applied and documented inline; Snyk SAST pattern-matching does not recognize nonce-based auth as origin validation
- [x] 9.3 Load the extension unpacked in Chrome, visit a JSON API endpoint, and verify the full formatted UI renders correctly (tree, expand/collapse, Raw/Parsed toggle)
- [x] 9.4 Confirm `pre.dataset.responseInfo` does not exist in the DOM after formatting
- [x] 9.5 Confirm `window.json` is `undefined` in a production build
- [x] 9.6 Bump version in `ext/manifest.json` (patch version)
