## Why

All verification tasks for the security remediation (`security-audit-remediation`) are currently manual — load the extension in Chrome, exercise it by hand, inspect DevTools. This is slow, error-prone, and not repeatable in CI. The project has no automated test suite at all. Playwright has first-class support for testing Chrome MV3 extensions (including service worker access and headless loading via `--load-extension`), and the official Playwright Docker image makes containerized runs straightforward.

## What Changes

- **Add Playwright as a dev dependency** and configure it for Chromium-only extension testing
- **Add a test fixture** (`ext/_test/fixtures.ts`) that loads the built `dist/` extension into a persistent Chromium context and exposes `context`, `extensionId`, and `serviceWorker` to all tests
- **Add security verification tests** (`ext/_test/security.spec.ts`) that automate every remaining manual task from `security-audit-remediation`: header filtering, DOM exposure, `window.json`, LRU eviction, MIME detection
- **Add a Dockerfile** for running the full test suite in a containerized environment (build + test in one `docker build` or `docker run`)
- **Add a `test` script** to `package.json` that runs `playwright test`
- **Add a mock JSON server fixture** that can serve responses with arbitrary `Content-Type` headers (needed for vendor MIME type tests)

## Capabilities

### New Capabilities

- `extension-test-harness`: Playwright fixture infrastructure for loading and testing the built Chrome extension
- `security-verification-tests`: Automated test coverage for the security properties established in `security-audit-remediation`

### Modified Capabilities

*(none)*

## Impact

- `package.json` — add `@playwright/test` devDependency
- `playwright.config.ts` — new config file at repo root
- `ext/_test/` — new directory: `fixtures.ts`, `security.spec.ts`
- `Dockerfile` — new file at repo root
- `.dockerignore` — new file
- Build pipeline: tests depend on a successful `dist/` build first
