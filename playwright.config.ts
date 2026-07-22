import { defineConfig, devices } from "@playwright/test";

const frontendPort = process.env.TEST_FRONTEND_PORT;
if (!frontendPort) throw new Error("TEST_FRONTEND_PORT absent");

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: ".tmp/playwright-results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: "line",
  use: {
    baseURL: `http://127.0.0.1:${frontendPort}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "chromium-mobile", use: { ...devices["Pixel 7"] } },
    { name: "firefox-desktop", use: { ...devices["Desktop Firefox"] } },
    {
      name: "firefox-mobile",
      use: {
        browserName: "firefox",
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
