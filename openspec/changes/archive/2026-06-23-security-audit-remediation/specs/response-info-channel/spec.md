## ADDED Requirements

### Requirement: Response metadata is not written to DOM attributes visible to page scripts
The extension SHALL NOT write HTTP response headers or any derived header data to DOM attributes on elements in the page document. Response metadata needed only by the isolated-world content script SHALL remain in extension messaging channels only.

#### Scenario: Response headers are not accessible to page scripts via the DOM
- **WHEN** the extension formats a JSON page that has an `Authorization` response header (filtered) or `Content-Type` response header
- **THEN** no DOM element in the document has a `data-*` attribute containing raw header values
- **THEN** a script running in the MAIN world cannot read response headers by querying DOM elements

#### Scenario: Content-type hint for console script is passed through a scoped attribute only
- **WHEN** the extension writes any response metadata to a DOM attribute for use by `console.entry.ts`
- **THEN** the attribute contains only the specific value needed (e.g., content-type string) and not the full headers object

### Requirement: window.json is not exposed in production builds
The extension SHALL NOT define `window.json` on the page's global scope in production builds. In DEV builds, `window.json` MAY be defined as a developer convenience.

#### Scenario: window.json is absent in production
- **WHEN** the extension is built in production mode and formats a JSON page
- **THEN** `window.json` is `undefined` in the page's JavaScript context

#### Scenario: window.json is present in DEV builds
- **WHEN** the extension is built in development mode and formats a JSON page
- **THEN** `window.json` contains the parsed JSON value from the response

### Requirement: window.__jf_pre is not exposed as a global
The extension SHALL NOT assign the original `<pre>` element to `window.__jf_pre` or any other named `window.*` property accessible from the MAIN world.

#### Scenario: Internal DOM reference is not accessible to page scripts
- **WHEN** the extension formats a JSON page
- **THEN** `window.__jf_pre` is `undefined` in the page's JavaScript context
