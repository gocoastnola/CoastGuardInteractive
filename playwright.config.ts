import { defineConfig, devices } from '@playwright/test'

const production = process.env.E2E_PRODUCTION === '1'
const PORT = production ? 5175 : 5174
const BASE_URL = `http://127.0.0.1:${PORT}${production ? '/CoastGuardInteractive/' : '/'}`

export default defineConfig({
  testDir: './e2e',
  timeout: 35_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--enable-unsafe-swiftshader'] } } },
    ...(process.env.E2E_WEBKIT === '1' ? [{ name: 'webkit', testMatch: '**/compatibility.spec.ts', use: {
      ...devices['Desktop Safari'],
      // Optional reversible cloud-only launcher for user-space native libraries.
      // CI and ordinary installs retain Playwright's standard executable.
      launchOptions: process.env.E2E_WEBKIT_EXECUTABLE_PATH ? { executablePath: process.env.E2E_WEBKIT_EXECUTABLE_PATH } : {},
    } }] : []),
  ],
  webServer: {
    command: production ? 'npm run preview -- --base=/CoastGuardInteractive/' : 'npm run dev',
    url: BASE_URL,
    // A preview started with the wrong base can serve index.html while every
    // project-subpath script fails. Own the production server instead of reusing it.
    reuseExistingServer: !production && !process.env.CI,
    timeout: 60_000,
  },
})
