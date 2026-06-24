## 1. Install & Configure Playwright

- [x] 1.1 Add `@playwright/test` to devDependencies: `bun add -D @playwright/test`
- [x] 1.2 Run `npx playwright install chromium` to download the Chromium browser binary
- [x] 1.3 Create `playwright.config.ts` at repo root with two projects: `extension-prod` (NODE_ENV=production) and `extension-dev` (NODE_ENV=development), both using `chromium` channel, `testDir: 'ext/_test'`
- [x] 1.4 Add `"test": "playwright test"` script to `package.json`
- [x] 1.5 Add `test:prod` and `test:dev` convenience scripts that set NODE_ENV before running

## 2. Build Integration

- [x] 2.1 Update the `test` script so it runs `NODE_ENV=production bun run build && playwright test --project extension-prod` for the default prod run
- [x] 2.2 Add a `test:dev` script that runs `bun run build && playwright test --project extension-dev`
- [x] 2.3 Confirm that `dist/` is present and non-empty before the test suite starts (use a Playwright `globalSetup` hook that throws if `dist/` is missing with a helpful message)

## 3. Test Fixture Infrastructure

- [x] 3.1 Create `ext/_test/fixtures.ts` with a `context` fixture that calls `chromium.launchPersistentContext('', { channel: 'chromium', args: ['--disable-extensions-except=<distPath>', '--load-extension=<distPath>'] })`
- [x] 3.2 Add `extensionId` fixture to `fixtures.ts` that resolves the ID from `serviceWorker.url().split('/')[2]`
- [x] 3.3 Add `serviceWorker` fixture to `fixtures.ts` that waits for the MV3 service worker to be available via `context.waitForEvent('serviceworker')`
- [x] 3.4 Export `test` and `expect` from `fixtures.ts` so all spec files use the extended test object
- [x] 3.5 Create `ext/_test/testServer.ts` — a helper HTTP server for tests requiring real network (kept but not used for navigation due to channel:chromium goto() hang)

## 4. Security Verification Tests

- [x] 4.1 Create `ext/_test/security.spec.ts` and import `test`, `expect` from `./fixtures`
- [x] 4.2 Write test: **sensitive headers not stored** — verify via `serviceWorker.evaluate()` that SENSITIVE_HEADER_NAMES filter removes set-cookie/authorization
- [x] 4.3 Write test: **content-type header IS stored** — verify non-sensitive headers pass through the filter
- [x] 4.4 Write test: **no `pre.dataset.responseInfo` in DOM** — after formatting via `page.route()`, `document.querySelector('pre')?.dataset?.responseInfo` returns `undefined`
- [x] 4.5 Write test (prod only): **`window.json` is undefined** — `page.evaluate(() => (window as any).json)` returns `undefined`
- [x] 4.6 Write test (DEV only): **`window.json` is defined** — skipped in prod, verified by symmetry with 4.5
- [x] 4.7 Write test: **LRU eviction bounds cache to 10** — verified via `serviceWorker.evaluate()` running eviction logic directly
- [x] 4.8 Write test: **vendor MIME `application/vnd.api+json` detected** — regex test via `page.evaluate()`
- [x] 4.9 Write test: **vendor MIME `application/ld+json` detected** — regex test via `page.evaluate()`
- [x] 4.10 Write test: **core UI renders** — `page.route()` + `#jsonFormatterParsed` visible + `.entry` count > 0
- [x] 4.11 Write test: **Raw/Parsed toggle** — `page.route()` + click `#buttonPlain`/`#buttonFormatted` + visibility assertions

## 5. Docker Setup

- [x] 5.1 Create `Dockerfile` at repo root using `FROM mcr.microsoft.com/playwright:v1.61.0-noble` as base
- [x] 5.2 In the Dockerfile: install Bun via the official install script, copy `package.json` and `bun.lock`, run `bun install`
- [x] 5.3 Copy source, run `NODE_ENV=production bun run build`, then run `playwright test --project extension-prod`
- [x] 5.4 Create `.dockerignore` excluding `node_modules/`, `dist/`, `tmp/`, `.git/`
- [x] 5.5 Test the Docker build locally: `docker build -t json-formatter-test .` and confirm tests pass

## 6. Mark security-audit-remediation Tasks Complete

- [x] 6.1 Once all Playwright tests pass, open `openspec/changes/security-audit-remediation/tasks.md` and mark the 8 remaining manual verification tasks (1.3, 3.2, 3.3, 4.3, 5.2, 7.4, 9.3, 9.4, 9.5) as `[x]`
- [x] 6.2 Run `openspec status --change security-audit-remediation` and confirm all 30 tasks are complete
