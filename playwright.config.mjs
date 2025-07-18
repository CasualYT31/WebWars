// @ts-check
import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: "./test/frontend",
    /* Run tests in files in parallel */
    // fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [["html", { open: "never" }]],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "retain-on-failure",
    },
    /* Configure projects for major browsers */
    projects: [
        {
            name: "chromium",
            metadata: {
                portOffset: 0,
            },
            use: { ...devices["Desktop Chrome"] },
        },

        {
            name: "firefox",
            metadata: {
                portOffset: 1,
            },
            use: { ...devices["Desktop Firefox"] },
        },

        {
            name: "webkit",
            metadata: {
                portOffset: 2,
            },
            use: { ...devices["Desktop Safari"] },
        },

        /* Test against mobile viewports. */
        // TODO: Will look into this very soon, hopefully it shouldn't be
        // as much work in the core codebase to support these nicely.
        // But it might require a rework of the way GameEngine sets up Phaser.
        // E.g. maybe it should resize dynamically to always fit the window/viewport.
        // https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser.
        // {
        //     name: "Mobile Chrome",
        //     metadata: {
        //         portOffset: 3,
        //     },
        //     use: { ...devices["Pixel 5"] },
        // },
        // {
        //     name: "Mobile Safari",
        //     metadata: {
        //         portOffset: 4,
        //     },
        //     use: { ...devices["iPhone 12"] },
        // },

        /* Test against branded browsers. */
        {
            name: "Microsoft Edge",
            metadata: {
                portOffset: 5,
            },
            use: { ...devices["Desktop Edge"], channel: "msedge" },
        },
        {
            name: "Google Chrome",
            metadata: {
                portOffset: 6,
            },
            use: { ...devices["Desktop Chrome"], channel: "chrome" },
        },
    ],
});
