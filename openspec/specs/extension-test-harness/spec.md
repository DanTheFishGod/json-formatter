## ADDED Requirements

### Requirement: Extension test fixture loads built extension into Chromium
The test harness SHALL provide a Playwright `context` fixture that launches a persistent Chromium context with the built `dist/` extension loaded via `--load-extension`. The fixture SHALL also provide an `extensionId` fixture derived from the service worker URL and a `serviceWorker` fixture that resolves the MV3 background service worker handle.

#### Scenario: Context fixture loads extension successfully
- **WHEN** a Playwright test uses the `context` fixture
- **THEN** a persistent Chromium context is created with the extension loaded
- **THEN** the extension's service worker is accessible via `context.serviceWorkers()`

#### Scenario: extensionId fixture resolves dynamically
- **WHEN** a Playwright test uses the `extensionId` fixture
- **THEN** the fixture returns the runtime-assigned Chrome extension ID as a string
- **THEN** the ID can be used to construct `chrome-extension://<id>/...` URLs

#### Scenario: serviceWorker fixture resolves MV3 worker
- **WHEN** a Playwright test uses the `serviceWorker` fixture
- **THEN** the fixture returns the Playwright `Worker` handle for the extension's background service worker
- **THEN** `serviceWorker.evaluate()` can call extension APIs such as `browser.storage.session.get()`

### Requirement: Fixture supports both production and DEV builds
The fixture infrastructure SHALL support being parameterised with a build mode so that prod-build and DEV-build tests can be run in separate Playwright projects.

#### Scenario: Tests run against production build
- **WHEN** Playwright runs the `extension-prod` project
- **THEN** the fixture uses the `dist/` output of a `NODE_ENV=production` build

#### Scenario: Tests run against DEV build
- **WHEN** Playwright runs the `extension-dev` project
- **THEN** the fixture uses the `dist/` output of a default (DEV) build
