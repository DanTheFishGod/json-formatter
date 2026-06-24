## Context

The project is a Chrome MV3 browser extension built with Bun + esbuild. There is currently no test infrastructure of any kind. The `security-audit-remediation` change introduced 8 verification tasks that are all manual. Playwright is the only widely-used test framework with documented, first-class support for loading Chrome extensions in headless mode and interacting with MV3 service workers.

The key constraint is that Chrome extensions cannot be tested with a standard `page.goto()` setup — they require a **persistent browser context** launched with `--load-extension` pointing at a built extension directory. This means tests must depend on a production build of `dist/` being present before any test run.

## Goals / Non-Goals

**Goals:**
- Playwright installed and configured for Chromium-only extension testing
- Reusable fixture that loads `dist/` as an extension and provides `context`, `extensionId`, and `serviceWorker` handles
- Security verification test suite covering all 8 remaining manual tasks from `security-audit-remediation`
- A mock HTTP server fixture for serving JSON responses with arbitrary `Content-Type` headers
- Docker image that builds the extension and runs the full test suite
- `package.json` `test` script wired to `playwright test`

**Non-Goals:**
- Cross-browser testing (Firefox/WebKit) — extension APIs are Chrome/Chromium-only
- UI/visual regression testing
- Testing the build toolchain itself
- Coverage reporting (can be a follow-on)
- End-to-end user flow tests beyond what the security specs require (can be a follow-on)

## Decisions

### Decision 1: Playwright over Puppeteer for extension testing

**Choice:** `@playwright/test` with `chromium.launchPersistentContext`.

**Rationale:** Playwright's test runner ships batteries-included (fixtures, assertions, parallelism, HTML reporter). Puppeteer requires a separate test framework. Playwright explicitly documents MV3 service worker handling including suspension/restart transparency. The `channel: 'chromium'` mode allows headless extension loading without Google Chrome installed.

**Alternative considered:** Puppeteer + Vitest. Rejected — requires more glue code, no built-in service worker transparency for MV3.

### Decision 2: Tests depend on a pre-built `dist/`

**Choice:** Tests do NOT build the extension — they expect `dist/` to exist. The `test` script in `package.json` will be: `bun run build && playwright test` (or separate `build` + `test` scripts for CI flexibility).

**Rationale:** Keeping the build and test concerns separate allows running tests without rebuilding when iterating on test code only. The Dockerfile will always run the full build before tests.

**Alternative considered:** Having a Playwright global setup hook run the build. Rejected — mixing build and test concerns makes failures harder to attribute.

### Decision 3: Two builds — prod + DEV — both tested

**Choice:** Run tests against both a `NODE_ENV=production` build and a `NODE_ENV=development` build. The `window.json` tests require both: absent in prod, present in DEV.

**Implementation:** Use two Playwright projects in `playwright.config.ts`:
- `extension-prod`: builds with `NODE_ENV=production`, runs all tests
- `extension-dev`: builds with `NODE_ENV=development`, runs DEV-specific tests only

### Decision 4: Mock HTTP server via Playwright `page.route()`

**Choice:** Use `page.route()` to intercept requests and return synthetic JSON responses with custom `Content-Type` headers, rather than spinning up a real HTTP server.

**Rationale:** `page.route()` is zero-infrastructure — no port management, no separate process, works inside the Docker container without network configuration. Sufficient for testing MIME type detection.

**Alternative considered:** Use `task/jsonServer.ts`. Rejected — it's a development tool, not a test fixture; its content-type handling is fixed.

### Decision 5: Service worker storage inspection via `serviceWorker.evaluate()`

**Choice:** To verify header filtering and LRU eviction, call `serviceWorker.evaluate(() => browser.storage.session.get(...))` inside the service worker context.

**Rationale:** This is the only way to inspect `browser.storage.session` from a test — it's extension-internal storage, inaccessible from page context. Playwright's MV3 service worker support makes this straightforward.

### Decision 6: Dockerfile uses official Playwright image

**Choice:** `FROM mcr.microsoft.com/playwright:v1.52.0-noble` as the base.

**Rationale:** This image ships with all Chromium system dependencies pre-installed (fonts, shared libs). Installing Chromium in a vanilla Ubuntu image requires 50+ packages and is fragile. The official image is maintained by the Playwright team and versioned alongside the npm package.

**Bun in Docker:** Install Bun inside the Playwright image using the official install script. Bun is needed only to run the build step.

### Decision 7: `extensionId` fixture resolves via service worker URL

**Choice:** Extract the extension ID from `serviceWorker.url().split('/')[2]` — the canonical Playwright pattern.

**Rationale:** The extension ID is assigned dynamically by Chrome at load time and is not known ahead of time. The service worker URL always has the form `chrome-extension://<id>/...`.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Chrome MV3 service worker suspension during tests | Playwright's service worker handle is transparent across restarts — existing `evaluate()` calls resume automatically |
| `dist/` stale between runs | CI always rebuilds before `playwright test`; local `test` script does `build && test` |
| Playwright version drift with Chromium | Pin both `@playwright/test` version and Docker image tag to the same version |
| `page.route()` may not trigger `webRequest.onHeadersReceived` (extension API) | Extension web request listeners fire at the browser level, not the page level — `page.route()` intercepts before Chrome dispatches to the extension. Solution: use a real local HTTP server response for header-capture tests, and `page.route()` only for MIME-type tests |
| Docker ARM64 (Apple Silicon dev machines) | `mcr.microsoft.com/playwright` provides `linux/arm64` variants; use `--platform linux/amd64` only if arm64 is unavailable |

## Migration Plan

1. Add `@playwright/test` to `devDependencies` via `bun add -D @playwright/test`
2. Add `playwright.config.ts` with two projects (prod + DEV)
3. Create `ext/_test/fixtures.ts` with `context`, `extensionId`, `serviceWorker` fixtures
4. Create `ext/_test/security.spec.ts` with tests for all 8 security verification tasks
5. Wire `test` script in `package.json`
6. Create `Dockerfile` and `.dockerignore`
7. Run tests locally, fix any issues
8. Mark all remaining `security-audit-remediation` tasks as complete once tests pass

## Open Questions

- Should the Playwright tests be run as part of the existing `bun run build` pipeline, or only explicitly via `bun test`? Leaning toward explicit only — building is fast, testing is slower.
- For the LRU eviction test (task 4.3), opening 11 tabs sequentially may be slow. Is parallelising tab creation acceptable (may affect LRU ordering)? Proposing sequential for correctness.
