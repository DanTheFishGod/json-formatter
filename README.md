> # ARCHIVED
> 
> I am no longer developing JSON Formatter as an open source project. I'm moving to a closed-source, commercial model in order to build a more comprehensive API-browsing tool with premium features.
>
> I know some users (especially here on GitHub) will always prefer open source tools, so I’m leaving this repo online for others to use/fork, and I’ve published the final open source version as [JSON Formatter Classic](https://chromewebstore.google.com/detail/json-formatter-classic/caacnjeoikecoeepknkbjdcaediamaej) – you can switch to that if you just want a simple, open source, local-only JSON-formatting extension that won't receive updates.

---

# JSON Formatter

Chrome extension that helps you view and explore JSON API responses.

## Features

- **Fast**, even on very long JSON pages
- Dark mode
- Syntax highlighting
- Collapsible trees, with indent guides
- Clickable URLs
- Negligible performance impact on non-JSON pages (less than 1 millisecond)
- Works on any valid JSON page – URL doesn't matter
- Buttons for toggling between raw and parsed JSON
- In development builds, parsed JSON is exported as `window.json` so you can inspect it in the DevTools console

## Installation

**Option 1** – Install [JSON Formatter Classic](https://chromewebstore.google.com/detail/json-formatter-classic/caacnjeoikecoeepknkbjdcaediamaej) from the Chrome Web Store.

**Option 2** – Install it from source (see below).

### Development

Clone repo and run `bun install`.

Commands:

- `bun run build` - single DEV build
- `bun run build:prod` - production build
- `bun run watch` - watch-driven DEV build
- `npm run test` - production build + Playwright test suite
- `npm run test:dev` - DEV build + DEV-mode tests

You can install `dist` as a local, unpacked extension in Chrome with developer mode enabled.

### Testing

Tests use [Playwright](https://playwright.dev) with the `channel: 'chromium'` browser (full Chromium, required for extension loading). The suite covers security properties, core UI behaviour, and MIME type detection.

```bash
npm run test          # production build + full test suite
npm run test:dev      # DEV build + DEV-specific tests (e.g. window.json)
```

Test files live in `ext/_test/`:

| File | Purpose |
|---|---|
| `fixtures.ts` | Playwright fixtures: `context`, `extensionId`, `serviceWorker` |
| `globalSetup.ts` | Fails fast with a helpful message if `dist/` is not built |
| `security.spec.ts` | Security verification tests (header filtering, DOM exposure, LRU, MIME, core UI) |
| `testServer.ts` | Minimal HTTP server for tests that need real network responses |

> **Note:** `page.goto()` to real TCP addresses hangs when using `channel: 'chromium'` + extension loading. Navigation tests use `page.route()` (Playwright's CDP-level intercept) instead, which resolves immediately and still runs extension content scripts correctly.

### Docker

A `Dockerfile` is provided for running the full test suite in a clean container (useful for CI):

```bash
docker build -t json-formatter-test .
```

This uses `mcr.microsoft.com/playwright:v1.61.0-noble` as the base (Chromium and all dependencies pre-installed), installs Bun, builds the extension in production mode, and runs the test suite.

### Change management (OpenSpec)

This project uses [OpenSpec](https://openspec.dev) for structured change tracking. Changes live in `openspec/changes/` during development and are archived to `openspec/changes/archive/` when complete. Reusable capability specs live in `openspec/specs/`.

Common commands:

```bash
openspec new change "my-change-name"   # scaffold a new change
openspec status --change "name"        # check artifact completion
openspec list                          # list active changes
```

The VS Code Copilot skills in `.github/skills/` support the full workflow:
- `/opsx:explore` — thinking/discovery mode
- `/opsx:propose` — generate proposal + design + specs + tasks in one step
- `/opsx:apply` — implement tasks from an active change
- `/opsx:archive` — finalise and archive a completed change

### Releasing

1. Bump the version in `ext/manifest.json`
2. Push a tag matching the version: `git tag v0.9.5 && git push origin v0.9.5`
3. GitHub Actions builds, tests, and creates a release automatically
4. The release includes a `json-formatter-v{version}.zip` that users can load as an unpacked extension

The release workflow verifies the tag matches `manifest.json` version before publishing.

To add Snyk vulnerability scanning to CI, set a `SNYK_TOKEN` repository secret (Settings → Secrets → Actions). Without it the Snyk step is skipped; with it the build fails on HIGH or CRITICAL findings.

## FAQ

### How does it detect JSON?

This turns out to be a complex thing to get right in a bulletproof way. In most cases it's based on the `Content-Type` header but in some cases it's necessary to inspect the 'page' strucure and see if it looks like a JSON endpoint. This is designed to work as fast as possible with no perceivable impact on browsing.

### Why are large numbers not displayed accurately?

This is a [limitation of JavaScript](http://www.ecma-international.org/ecma-262/5.1/#sec-15.7.3.2) and therefore a limitation of JSON as interpreted by your web browser.

- Anything over `Number.MAX_SAFE_INTEGER` (`2^53 - 1` or `9007199254740991`) is adjusted down to that number.
- Anything below `Number.MIN_SAFE_INTEGER` (`-2^53 + 1` or `-9007199254740991`) is adjusted up to that number.
- Extremely precise floating point numbers are rounded to 16 digits.

It's not JSON Formatter doing this, it's the native `JSON.parse` in V8. JSON Formatter shows you the **parsed** values, exactly the same as what you'll see if you fetch your JSON from any web application.

If your API endpoint really needs to represent numbers outside JavaScript's safe range, it should **quote them as strings**.

### Why are object keys sometimes in the wrong order?

What you see in JSON Formatter is a representation of the **parsed** object/array. It's the same order you'll get with `Object.keys( JSON.parse(json) )` in JavaScript.

Historically, the JavaScript standard explicitly stated that object keys can be iterated in any order, and V8 took advantage of this by moving numeric string keys (like `"1"` or `"99999"`) to the top to facilitate a small performance optimisation. This V8 implementation detail has since become standardised.

##### But I just want to see exactly what the server spits out

For now, your best option is to just use the "Raw" button to see the raw JSON. This is what the server sent. The "Parsed" buttons represents what you'll get from `JSON.parse`.

In future JSON Formatter might switch from using `JSON.parse` to a custom parser (if performance allows) in order to detect when a value has been 'changed' by parsing and show an appropriate warning.
