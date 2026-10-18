import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        // Headless Chromium has no GPU; SwiftShader provides software WebGL.
        launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
      },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    // Deterministic offline AI provider: no API key, no cost. Failure paths are covered by route interception.
    env: { INTERPRETATION_PROVIDER: "mock" },
  },
});
