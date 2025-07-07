import RandExp from "randexp";

import { test, expect } from "@playwright/test";

import { addSessionKey, bootServer, getSessionKey, openGame, waitForConnection } from "./helpers.mjs";

import {
    ClientConnectionClosedInstruction,
    ClientConnectionClosedReason,
    isValidSessionKey,
    sessionKeyRegex,
} from "#shared/protocol.mjs";

/**
 * Perform connection tests.
 * @param {import("@playwright/test").BrowserContext} context The browser the game is running in.
 * @param {import("@playwright/test").Page} page The page the game is running in.
 * @param {Number} port The port the server is running on.
 * @param {String} expectSessionKey If given, the session key given by the server is expected to be this. The page will
 *        also be reload()ed instead of goto()ed if this argument is given.
 * @returns {String} The session key given by the server.
 */
async function connectAndExpectSuccess(context, page, port, expectSessionKey) {
    const loadTime = Date.now();
    if (expectSessionKey) {
        await page.reload();
    } else {
        await openGame(page, `http://localhost:${port}`);
    }
    await waitForConnection(page);
    const sessionKey = await getSessionKey(context);
    expect(isValidSessionKey(sessionKey?.value), "the cached session key wasn't in a valid format").toBeTruthy();
    // sessionKey.expires is stored in seconds, so remove milliseconds from the RHS.
    expect(
        sessionKey?.expires,
        "the cached session key wasn't given an adequate expiration date"
    ).toBeGreaterThanOrEqual(Math.floor((loadTime + 34560000000) / 1000));
    if (expectSessionKey) {
        expect(sessionKey.value, "the expected session key wasn't used").toBe(expectSessionKey);
    }
    expect(
        await page.evaluate(async function () {
            const GameEngine = (await import("/gameEngine.mjs")).default;
            const controller = (await import("/controller.mjs")).default;
            const mapFiles = controller.getModel("mapPack").mapFiles;
            console.debug(mapFiles, Boolean(controller.game));
            return (
                Array.isArray(mapFiles) &&
                mapFiles.length === 1 &&
                mapFiles.at(0).endsWith("test.map") &&
                controller.game instanceof GameEngine
            );
        }),
        "the front-end models and/or game engine weren't initialized"
    ).toBeTruthy();
    const message = page.getByTestId("message");
    await expect(message, "the root React component wasn't attached").toBeVisible();
    await expect(message, "the root React component isn't in the current viewport").toBeInViewport({
        ratio: 1.0,
    });
    await expect(message, "i18next translations weren't loaded and/or applied").toHaveText("Hello, World");
    await expect(page.locator("#disconnectedOverlay"), "disconnected overlay is visible").not.toBeVisible();
    return sessionKey.value;
}

/**
 * Attempt to perform a connection, but expect the connection to fail due to the server refusing to verify the client.
 * @param {import("@playwright/test").BrowserContext} context The browser the game is running in.
 * @param {import("@playwright/test").Page} page The page the game is running in.
 * @param {Number} port The port the server is running on.
 * @param {String} expectDisconnectedMessage Expect the disconnected overlay's message to contain this text.
 * @param {String} expectSessionKey If given, the session key given by the server is expected to be this. The page will
 *        also be reload()ed instead of goto()ed if this argument is given.
 * @returns {String} The session key given by the server.
 */
async function connectAndExpectFailure(context, page, port, expectDisconnectedMessage, expectSessionKey) {
    if (expectSessionKey) {
        await page.reload();
    } else {
        await openGame(page, `http://localhost:${port}`);
    }
    // Don't wait for connection, as that will only happen when the map pack's onInitialConnection handler is invoked,
    // which won't happen if the server refused to verify the client. Wait for the disconnected overlay instead.
    await page.locator("#disconnectedOverlay").waitFor({ state: "visible" }, 5000);
    const sessionKey = await getSessionKey(context);
    expect(isValidSessionKey(sessionKey?.value), "the cached session key wasn't in a valid format").toBeTruthy();
    if (expectSessionKey) {
        expect(sessionKey.value, "the expected session key wasn't used").toBe(expectSessionKey);
    }
    expect(
        await page.evaluate(async function () {
            const controller = (await import("/controller.mjs")).default;
            let modelsHaveNotArrived = false;
            try {
                controller.getModel("mapPack");
            } catch {
                modelsHaveNotArrived = true;
            }
            console.debug(modelsHaveNotArrived, controller.game === null);
            return modelsHaveNotArrived && controller.game === null;
        }),
        "the front-end models and/or game engine were initialized"
    ).toBeTruthy();
    await expect(page.getByTestId("message"), "the root React component was visible").not.toBeVisible();
    await expect(
        page.locator("#disconnectedMessage"),
        "disconnected overlay did not contain the expected message"
    ).toContainText(expectDisconnectedMessage);
    return sessionKey.value;
}

test.describe("Successful connection", () => {
    /**
     * Perform connection tests as in performConnectionTests(), but with a given session key on initialization.
     * @param {import("@playwright/test").BrowserContext} context The browser the game is running in.
     * @param {import("@playwright/test").Page} page The page the game is running in.
     * @param {Number} port The port the server is running on.
     * @param {String} sessionKey The session key to initialize the browser with, if any
     */
    async function performConnectionTests(context, page, port, sessionKey = "") {
        if (sessionKey) {
            await addSessionKey(context, sessionKey);
        }
        // Sanity check that the session key was actually assigned and used by the controller.
        // Also conveniently checks that the session key given by the server was used in the second connection test.
        page.on("websocket", ws => {
            expect(ws.url(), "the web socket connection didn't use the expected session key").toBe(
                `ws://localhost:${port}/${sessionKey}`
            );
        });
        // Perform the first connection, retrieving the correct session key given by the server.
        sessionKey = await connectAndExpectSuccess(context, page, port);
        // Then perform the second connection, expecting the new connection to use the same session key.
        await connectAndExpectSuccess(context, page, port, sessionKey);
    }

    test("when no session key is cached", async ({ context, page }, testInfo) => {
        await bootServer(testInfo, 4000, "connection-map-pack", async port => {
            await performConnectionTests(context, page, port);
        });
    });

    test("when garbage key is cached", async ({ context, page }, testInfo) => {
        await bootServer(testInfo, 4025, "connection-map-pack", async port => {
            const sessionKey = "qwerty";
            expect(isValidSessionKey(sessionKey), "this test requires the first session key to be garbage").toBeFalsy();
            await performConnectionTests(context, page, port, sessionKey);
        });
    });

    test("when invalid key is cached", async ({ context, page }, testInfo) => {
        await bootServer(testInfo, 4050, "connection-map-pack", async port => {
            const sessionKey = new RandExp(sessionKeyRegex).gen();
            expect(
                isValidSessionKey(sessionKey),
                "this test requires the first session key to be invalid"
            ).toBeTruthy();
            await performConnectionTests(context, page, port, sessionKey);
        });
    });
});

// TODO: when we test for a failed connection, we should ensure the websocket is actually closed.
test.describe("Failed connection", () => {
    test("when opened in a second tab", async ({ context, page }, testInfo) => {
        await bootServer(testInfo, 4075, "connection-map-pack", async port => {
            const sessionKey = await connectAndExpectSuccess(context, page, port);
            const secondPage = await context.newPage();
            await connectAndExpectFailure(
                context,
                secondPage,
                port,
                `${ClientConnectionClosedReason.SimultaneousConnectionAttempt.reason}.${
                    ClientConnectionClosedInstruction[ClientConnectionClosedReason.SimultaneousConnectionAttempt.code]
                }.`
            );
            // Now close first page and reload second page to ensure the latter can connect.
            await page.close();
            await connectAndExpectSuccess(context, secondPage, port, sessionKey);
        });
    });

    test("when opened in a second browser with an identical session key", async ({ context, page }, testInfo) => {
        await bootServer(testInfo, 4100, "connection-map-pack", async port => {
            const sessionKey = await connectAndExpectSuccess(context, page, port);
            const secondContext = await context.browser().newContext();
            try {
                await addSessionKey(secondContext, sessionKey);
                const secondPage = await secondContext.newPage();
                await connectAndExpectFailure(
                    secondContext,
                    secondPage,
                    port,
                    `${ClientConnectionClosedReason.SimultaneousConnectionAttempt.reason}.${
                        ClientConnectionClosedInstruction[
                            ClientConnectionClosedReason.SimultaneousConnectionAttempt.code
                        ]
                    }.`
                );
                // Now close first page and reload second page to ensure the latter can connect.
                await page.close();
                await connectAndExpectSuccess(secondContext, secondPage, port, sessionKey);
            } finally {
                await secondContext.close();
            }
        });
    });
});
