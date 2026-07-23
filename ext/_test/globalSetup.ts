import path from 'path'
import fs from 'fs'

/**
 * Playwright global setup — runs once before the test suite.
 * Verifies that dist/ exists and contains the built extension.
 */
export default async function globalSetup() {
  const distPath = path.resolve(__dirname, '../../dist')
  const manifestPath = path.join(distPath, 'manifest.json')

  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `\n\n❌ Extension not built.\n` +
        `   dist/manifest.json not found at: ${distPath}\n\n` +
        `   Run one of:\n` +
        `     npm run build:prod   (for test:prod)\n` +
        `     npm run build        (for test:dev)\n\n`,
    )
  }
}
