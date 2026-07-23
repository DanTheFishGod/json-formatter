import { defineConfig } from '@playwright/test'
import path from 'path'

// BUILD_MODE is set by the npm test scripts:
//   test:prod  → BUILD_MODE=prod (default)
//   test:dev   → BUILD_MODE=dev
const buildMode = process.env.BUILD_MODE ?? 'prod'

export default defineConfig({
  testDir: path.join(__dirname, 'ext/_test'),
  globalSetup: path.join(__dirname, 'ext/_test/globalSetup.ts'),
  timeout: 45_000,
  // Extension tests cannot run in parallel — they share a single persistent
  // browser context per worker and Chrome only allows one instance per user data dir.
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    // Passed through to fixtures via process.env
  },

  projects: [
    {
      name: buildMode === 'dev' ? 'extension-dev' : 'extension-prod',
    },
  ],
})
