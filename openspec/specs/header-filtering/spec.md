## ADDED Requirements

### Requirement: Sensitive headers are stripped at capture time
The extension SHALL remove known-sensitive HTTP response headers before storing them in `tabResponseCache`. The block list SHALL include at minimum: `set-cookie`, `set-cookie2`, `cookie`, `authorization`, `proxy-authorization`, `www-authenticate`, `proxy-authenticate`. Comparison SHALL be case-insensitive.

#### Scenario: Sensitive header is stripped before storage
- **WHEN** `webRequest.onHeadersReceived` fires for a response that includes a `Set-Cookie` header
- **THEN** the header is not stored in `tabResponseCache`
- **THEN** the header is not transmitted over extension messaging
- **THEN** the header is not written to any DOM attribute

#### Scenario: Non-sensitive headers are preserved
- **WHEN** `webRequest.onHeadersReceived` fires for a response that includes `Content-Type` and `X-Content-Type-Options` headers
- **THEN** both headers are preserved in `tabResponseCache` and available for retrieval

#### Scenario: Header name comparison is case-insensitive
- **WHEN** a response includes a header named `Authorization` (mixed case)
- **THEN** the header is stripped just as if it were `authorization`

### Requirement: Cached response info does not exceed 10 entries
The extension SHALL evict the least-recently-used tab entry from `tabResponseCache` when adding a new entry would cause the cache to exceed 10 items. Eviction SHALL use the timestamps already tracked in `responseCache_lru`.

#### Scenario: Cache stays bounded when many tabs are visited
- **WHEN** the user visits 11 or more distinct JSON pages across different tabs
- **THEN** `browser.storage.session` contains response info for at most 10 tabs

#### Scenario: Most recently used entry is not evicted
- **WHEN** the cache is full and a new entry is added
- **THEN** the tab whose `responseCache_lru` timestamp is oldest is evicted
- **THEN** the tab most recently retrieved from the cache is retained
