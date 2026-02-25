// Run with: npx playwright test
// Start app first: python run.py (backend 8000, frontend 5173)
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests/browser',
  timeout: 15000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    headless: true,
  },
  webServer: null, // start app manually: python run.py
});
