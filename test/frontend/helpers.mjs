/**
 * @file helpers.mjs
 * Contains E2E test helper functions.
 */

import { spawn } from "node:child_process";

import { expect } from "@playwright/test";

/**
 * Boots the web server.
 * Unfortunately, it isn't possible to boot web servers on a per project basis via configuration alone:
 * https://github.com/microsoft/playwright/issues/22496. I need this to ensure one project doesn't influence the state
 * of the server in a way that could cause another project to fail. Even if it were possible, some tests require the
 * server to reboot with a different configuration, which also doesn't seem possible to achieve without having manual
 * control over the boot process.
 * @param {import("@playwright/test").TestInfo} testInfo Information on the currently running test.
 * @param {Number} basePort The base port the server will be running on. An offset based on the project the test is
 *        running in will be applied. Aim to have your base ports be divisible by 25 to account for this.
 * @param {String} mapPack Path to the map pack to load, relative to test/frontend.
 * @param {Array<String>} options Additional options. The testCallback parameter can take its place if you have no need
 *        for them.
 * @param {Function} testCallback Invoked after the server has booted. It will include all of the tests you wish to run
 *        whilst the server is running. Once the callback finishes, successfully or due to an error, the server will be
 *        killed. Any errors will be re-raised once the shutdown has finished. The callback will be given the port the
 *        server was opened on.
 */
export async function bootServer(testInfo, basePort, mapPack, options, testCallback) {
    const portOffset = testInfo.project.metadata.portOffset;
    expect(
        typeof portOffset === "number" && !isNaN(portOffset),
        "your project doesn't have a port offset, make sure to add one that is unique from every other project's " +
            "port offset"
    ).toBeTruthy();
    expect(basePort % 25, "base ports must be divisible by 25").toBe(0);
    basePort += portOffset;
    if (testCallback === undefined && typeof options === "function") {
        testCallback = options;
        options = [];
    }
    const server = spawn(
        "node",
        [
            "server.mjs",
            "--port",
            `${basePort}`,
            "--log-level",
            "trace",
            "--log-file",
            `test-results/server-logs/${testInfo.project.name}/${testInfo.titlePath.join("/")}.log`,
            "--client-sessions",
            "--map-pack",
            `test/frontend/${mapPack}`,
        ].concat(options)
    );
    try {
        await testCallback(basePort);
    } finally {
        server.kill();
    }
}

/**
 * Opens the game in a given page and waits for the controller to initialize.
 * All E2E tests should invoke this function before anything else.
 * @param {import("@playwright/test").Page} page The page to open the game in.
 * @param {String} [url=""] The host pointing to the server to connect to. Defaults to the baseURL.
 */
export async function openGame(page, url = "") {
    await page.goto(url);
    await page.waitForFunction(() => window?.WebWars?.controllerLoaded, undefined, { timeout: 5000 });
}

/**
 * Adds a session key to the browser's cookies.
 * @param {import("@playwright/test").BrowserContext} context The browser context running the game.
 * @param {String} key The key to add to the browser's cookies.
 */
export async function addSessionKey(context, key) {
    await context.addCookies([
        {
            domain: "localhost",
            path: "/",
            name: "sessionKey",
            expires: Math.floor((Date.now() + 34560000000) / 1000),
            value: key,
        },
    ]);
}

/**
 * Retrieves the session key stored in the browser's cookies, if it exists.
 * @param {import("@playwright/test").BrowserContext} context The browser context running the game.
 * @returns {import("@playwright/test").Cookie | undefined} The session key if it exists, undefined if it doesn't.
 */
export async function getSessionKey(context) {
    const cookies = await context.cookies();
    for (const cookie of cookies) {
        if (cookie.name === "sessionKey") {
            return cookie;
        }
    }
}

/**
 * Waits for the client to connect to and be verified with the server.
 * @param {import("@playwright/test").Page} page The page running the game.
 */
export async function waitForConnection(page) {
    await page.waitForFunction(() => window?.WebWars?.onInitialConnection, undefined, { timeout: 5000 });
}

/**
 * Allows test fixtures to make calls on the controller within a given page.
 * These wrapper functions were written in this way because it's not possible to:
 * 1. Serialize the controller from the front end to the back end without losing its prototype and other functions
 *    (since Playwright has to convert the result of the evaluate() callback into JSON so that the back end can receive
 *    it).
 * 2. Serialize a generic callback that could hypothetically accept the controller from the back end to the front end
 *    for the same reason.
 * The public API of the controller is very minimal anyway, so duplicating it here is not too cumbersome.
 * @param {import("@playwright/test").Page} page The page the controller is running in.
 */
export function controller(page) {
    return {
        /**
         * Retrieves a copy of a read-only front-end model by name.
         * Front-end models will never contain data that can't be serialized using JSON since the back end sent it to
         * the front end using JSON to begin with.
         * @param {String} name The name of the model.
         * @returns {Object} The model's data.
         */
        getModel: async name =>
            await page.evaluate(async function (name) {
                const controller = await import("/controller.mjs");
                return controller.default.getModel(name);
            }, name),
    };
}
