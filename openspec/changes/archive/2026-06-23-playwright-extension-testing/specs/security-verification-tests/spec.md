## ADDED Requirements

### Requirement: Sensitive headers are not stored in session storage
The test suite SHALL verify that HTTP response headers in `SENSITIVE_HEADER_NAMES` (as defined in `security-audit-remediation`) are absent from `browser.storage.session` after the extension processes a JSON response that included those headers.

#### Scenario: Set-Cookie header not stored after JSON page load
- **WHEN** the extension processes a JSON response whose HTTP headers include `set-cookie`
- **THEN** `browser.storage.session.get('responseCache')` does not contain a `set-cookie` entry in any tab's stored headers array

#### Scenario: Authorization header not stored after JSON page load
- **WHEN** the extension processes a JSON response whose HTTP headers include `authorization`
- **THEN** `browser.storage.session.get('responseCache')` does not contain an `authorization` entry in any tab's stored headers array

#### Scenario: Content-Type header is stored (non-sensitive)
- **WHEN** the extension processes a JSON response with a `content-type` header
- **THEN** the `content-type` header IS present in the stored headers for that tab

### Requirement: Response headers are not present in the DOM
The test suite SHALL verify that no DOM element on a formatted JSON page exposes raw response header data in a `data-*` attribute accessible to page scripts.

#### Scenario: pre.dataset.responseInfo does not exist
- **WHEN** the extension formats a JSON page
- **THEN** `document.querySelector('pre')?.dataset?.responseInfo` evaluates to `undefined` in the page context

### Requirement: window.json is undefined in production builds
The test suite SHALL verify that `window.json` is not defined on the page global in a production build.

#### Scenario: window.json absent in production
- **WHEN** a production build of the extension formats a JSON page
- **THEN** `page.evaluate(() => (window as any).json)` returns `undefined`

### Requirement: window.json is defined in DEV builds
The test suite SHALL verify that `window.json` is set to the parsed JSON value in a DEV build.

#### Scenario: window.json present in DEV
- **WHEN** a DEV build of the extension formats a JSON page
- **THEN** `page.evaluate(() => (window as any).json)` returns the parsed JSON object matching the response body

### Requirement: Response cache is bounded to 10 entries
The test suite SHALL verify that after navigating to more than 10 JSON pages, `browser.storage.session` contains response info for at most 10 tabs.

#### Scenario: Cache evicts oldest entry when limit exceeded
- **WHEN** the extension processes JSON responses from 11 distinct tabs sequentially
- **THEN** `browser.storage.session.get('responseCache')` contains entries for exactly 10 tabs

### Requirement: Vendor JSON MIME types are detected and formatted
The test suite SHALL verify that a JSON response served with a `+json` suffix content-type (e.g. `application/vnd.api+json`) is detected and rendered by the extension.

#### Scenario: application/vnd.api+json is formatted
- **WHEN** a page serves valid JSON with `Content-Type: application/vnd.api+json`
- **THEN** the extension renders the formatted tree (`#jsonFormatterParsed` exists in the DOM)

#### Scenario: application/ld+json is formatted
- **WHEN** a page serves valid JSON with `Content-Type: application/ld+json`
- **THEN** the extension renders the formatted tree (`#jsonFormatterParsed` exists in the DOM)

### Requirement: Core formatted UI renders correctly
The test suite SHALL verify that a standard JSON response is fully formatted with a working interactive tree.

#### Scenario: JSON page renders formatted tree
- **WHEN** the extension formats a JSON page
- **THEN** `#jsonFormatterParsed` exists in the DOM and contains at least one `.entry` span

#### Scenario: Raw/Parsed toggle works
- **WHEN** the user clicks the "Raw" button
- **THEN** `#jsonFormatterRaw` becomes visible and `#jsonFormatterParsed` is hidden
- **WHEN** the user clicks the "Parsed" button
- **THEN** `#jsonFormatterParsed` becomes visible and `#jsonFormatterRaw` is hidden
