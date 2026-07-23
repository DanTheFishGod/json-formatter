import { test as base, chromium, type BrowserContext, type Worker } from '@playwright/test'
import path from 'path'

const distPath = path.resolve(__dirname, '../../dist')

/**
 * Extended Playwright fixtures for Chrome extension testing.
 *
 * - `context`       — persistent Chromium context with the extension loaded
 * - `extensionId`   — the runtime-assigned Chrome extension ID
 * - `serviceWorker` — the MV3 background service worker handle
 *
 * All tests should import `test` and `expect` from this file, not from
 * `@playwright/test` directly, so the extension fixtures are always available.
 */
export const test = base.extend<{
  context: BrowserContext
  extensionId: string
  serviceWorker: Worker
}>({
  // Override the default context with one that loads the extension.
  // scope: 'test' so each test gets its own fresh context (and thus fresh
  // extension session storage / service worker).
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      // channel: 'chromium' selects the full Chromium browser (not headless shell).
      // Extensions require the full browser — the headless shell does not support them.
      // See: https://playwright.dev/docs/chrome-extensions
      channel: 'chromium',
      headless: true,
      args: [
        `--disable-extensions-except=${distPath}`,
        `--load-extension=${distPath}`,
      ],
    })
    await use(context)
    await context.close()
  },

  extensionId: async ({ context }, use) => {
    let [sw] = context.serviceWorkers()
    if (!sw) sw = await context.waitForEvent('serviceworker')
    // Service worker URL is always chrome-extension://<id>/...
    const id = sw.url().split('/')[2]
    await use(id)
  },

  serviceWorker: async ({ context }, use) => {
    let [sw] = context.serviceWorkers()
    if (!sw) sw = await context.waitForEvent('serviceworker')
    await use(sw)
  },
})

export const expect = test.expect
