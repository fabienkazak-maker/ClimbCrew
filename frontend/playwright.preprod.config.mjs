import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/preprod",
  timeout: 45_000,
  retries: 1,
  reporter: "list",
  use: {
    baseURL: "https://pre-climbcrew.dip-tcs.com",
    browserName: "chromium",
    locale: "fr-FR",
    screenshot: "off",
    trace: "off",
    video: "off",
  },
});
