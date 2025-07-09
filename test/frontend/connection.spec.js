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
 * @param {Object} options The options configuring what actions to perform and what tests to run.
 * @param {Boolean} [options.expectConnection=true] If false, this function will expect the WebSocket created by the
 *        client to be closed by the end of the call, and that the disconnected overlay is visible. If true, the
 *        WebSocket must not be closed and the disconnected overlay must be hidden. If false, any cached session key's
 *        expiration date will also not be tested, as it is expected that its expiration date will not be updated by the
 *        client if it can't verify it with the server.
 * @param {Boolean} [options.reload=false] If false, the given page will be navigated to http://localhost:${port}. If
 *        true, the page will instead be reloaded.
 * @param {String} [options.expectWebSocketSessionKey=""] If given, the opened WebSocket's URL will be expected to
 *        include this session key. If a blank string is given, the WebSocket's URL must not contain a session key. Pass
 *        undefined to exclude this test.
 * @param {String} [options.expectSessionKey=""] If given, the session key given by the server is expected to be this.
 * @param {Boolean} [options.expectNoSessionKey=false] If true, no session key is expected to be cached within the
 *        browser context's cookies. Overrides the expectSessionKey option.
 * @param {String} [options.expectDisconnectedMessage=""] If given, the disconnected overlay's message must contain this
 *        text, and the expectConnection option will always be set to false.
 * @returns {String | undefined} The session key given by the server and cached in the browser context's cookies, or
 *          undefined if none was received or cached.
 */
async function connectAndTest(context, page, port, options = {}) {
    if (options.expectDisconnectedMessage) {
        options.expectConnection = false;
    } else if (!options.hasOwnProperty("expectConnection")) {
        options.expectConnection = true;
    }
    if (!options.hasOwnProperty("expectWebSocketSessionKey")) {
        options.expectWebSocketSessionKey = "";
    }

    let websocketConstructed = false;
    let websocketClosed = false;
    let websocketHandler = ws => {
        expect(websocketConstructed, "more than one WebSocket was constructed").toBeFalsy();
        websocketConstructed = true;
        if (typeof options.expectWebSocketSessionKey === "string") {
            expect(ws.url(), "the web socket connection didn't use the expected session key").toBe(
                `ws://localhost:${port}/${options.expectWebSocketSessionKey}`
            );
        }
        ws.on("close", () => {
            expect(websocketClosed, "the WebSocket was closed more than once").toBeFalsy();
            websocketClosed = true;
        });
    };
    page.on("websocket", websocketHandler);

    try {
        const loadTime = Date.now();

        if (options.reload) {
            await page.reload();
        } else {
            await openGame(page, `http://localhost:${port}`);
        }

        if (options.expectConnection) {
            await waitForConnection(page);
        } else {
            // Don't wait for connection, as that will only happen when the map pack's onInitialConnection handler is
            // invoked, which won't happen if the server refused to verify the client. Wait for the disconnected overlay
            // instead.
            await page.locator("#disconnectedOverlay").waitFor({ state: "visible" }, 5000);
        }

        const sessionKey = await getSessionKey(context);
        if (options.expectNoSessionKey) {
            expect(sessionKey, "a session key was cached").toBe(undefined);
        } else {
            expect(
                isValidSessionKey(sessionKey?.value),
                "the cached session key wasn't in a valid format"
            ).toBeTruthy();
            if (options.expectConnection) {
                // sessionKey.expires is stored in seconds, so remove milliseconds from the RHS.
                expect(
                    sessionKey?.expires,
                    "the cached session key wasn't given an adequate expiration date"
                ).toBeGreaterThanOrEqual(Math.floor((loadTime + 34560000000) / 1000));
            }
            if (options.expectSessionKey) {
                expect(sessionKey.value, "the expected session key wasn't used").toBe(options.expectSessionKey);
            }
        }

        if (options.expectConnection) {
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
        } else {
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
        }

        const message = page.getByTestId("message");
        if (options.expectConnection) {
            await expect(message, "the root React component wasn't attached").toBeVisible();
            await expect(message, "the root React component isn't in the current viewport").toBeInViewport({
                ratio: 1.0,
            });
            await expect(message, "i18next translations weren't loaded and/or applied").toHaveText("Hello, World");
        } else {
            await expect(message, "the root React component was visible").not.toBeVisible();
        }

        if (options.expectConnection) {
            await expect(page.locator("#disconnectedOverlay"), "disconnected overlay is visible").not.toBeVisible();
        } else if (options.expectDisconnectedMessage) {
            await expect(
                page.locator("#disconnectedMessage"),
                "disconnected overlay did not contain the expected message"
            ).toContainText(options.expectDisconnectedMessage);
        }

        expect(websocketConstructed, "no WebSocket was constructed").toBeTruthy();
        if (options.expectConnection) {
            expect(websocketClosed, "the WebSocket was closed").toBeFalsy();
        } else {
            expect(websocketClosed, "the WebSocket wasn't closed").toBeTruthy();
        }

        return sessionKey?.value;
    } finally {
        page.off("websocket", websocketHandler);
    }
}

test.describe("Successful connection", () => {
    /**
     * Perform connection tests as in performConnectionTests(), but with a given session key on initialization.
     * @param {import("@playwright/test").BrowserContext} context The browser the game is running in.
     * @param {import("@playwright/test").Page} page The page the game is running in.
     * @param {Number} port The port the server is running on.
     * @param {String} sessionKey The session key to initialize the browser with, if any.
     */
    async function performConnectionTests(context, page, port, sessionKey = "") {
        if (sessionKey) {
            await addSessionKey(context, sessionKey);
        }
        // Perform the first connection, retrieving the correct session key given by the server.
        sessionKey = await connectAndTest(context, page, port, {
            expectWebSocketSessionKey: sessionKey,
        });
        // Then perform the second connection, expecting the new connection to use the same session key.
        await connectAndTest(context, page, port, {
            reload: true,
            expectWebSocketSessionKey: sessionKey,
            expectSessionKey: sessionKey,
        });
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

test.describe("Failed connection", () => {
    test("when opened in a second tab", async ({ context, page }, testInfo) => {
        await bootServer(testInfo, 4075, "connection-map-pack", async port => {
            const sessionKey = await connectAndTest(context, page, port);
            const secondPage = await context.newPage();
            await connectAndTest(context, secondPage, port, {
                expectConnection: false,
                expectWebSocketSessionKey: sessionKey,
                expectDisconnectedMessage: `${ClientConnectionClosedReason.SimultaneousConnectionAttempt.reason}.${
                    ClientConnectionClosedInstruction[ClientConnectionClosedReason.SimultaneousConnectionAttempt.code]
                }.`,
            });
            // Now close first page and reload second page to ensure the latter can connect.
            await page.close();
            await connectAndTest(context, secondPage, port, {
                reload: true,
                expectWebSocketSessionKey: sessionKey,
                expectSessionKey: sessionKey,
            });
        });
    });

    test("when opened in a second browser with an identical session key", async ({ context, page }, testInfo) => {
        await bootServer(testInfo, 4100, "connection-map-pack", async port => {
            const sessionKey = await connectAndTest(context, page, port);
            const secondContext = await context.browser().newContext();
            try {
                await addSessionKey(secondContext, sessionKey);
                const secondPage = await secondContext.newPage();
                await connectAndTest(secondContext, secondPage, port, {
                    expectConnection: false,
                    expectWebSocketSessionKey: sessionKey,
                    expectDisconnectedMessage: `${ClientConnectionClosedReason.SimultaneousConnectionAttempt.reason}.${
                        ClientConnectionClosedInstruction[
                            ClientConnectionClosedReason.SimultaneousConnectionAttempt.code
                        ]
                    }.`,
                });
                // Now close first page and reload second page to ensure the latter can connect.
                await page.close();
                await connectAndTest(secondContext, secondPage, port, {
                    reload: true,
                    expectWebSocketSessionKey: sessionKey,
                    expectSessionKey: sessionKey,
                });
            } finally {
                await secondContext.close();
            }
        });
    });

    test("when opened in a second browser with max-client-sessions set to 1", async ({ context, page }, testInfo) => {
        await bootServer(testInfo, 4125, "connection-map-pack", ["--max-client-sessions", "1"], async port => {
            await connectAndTest(context, page, port);
            const secondContext = await context.browser().newContext();
            try {
                const secondPage = await secondContext.newPage();
                await connectAndTest(secondContext, secondPage, port, {
                    expectConnection: false,
                    expectNoSessionKey: true,
                    expectDisconnectedMessage: `${ClientConnectionClosedReason.TooMayClients.reason}.${
                        ClientConnectionClosedInstruction[ClientConnectionClosedReason.TooMayClients.code]
                    }.`,
                });
                // Now close first page and reload second page to ensure the latter can still not connect.
                // This is by design: once a client has connected, it will permanently take up a slot in the server
                // until the latter is rebooted.
                await page.close();
                await connectAndTest(secondContext, secondPage, port, {
                    expectConnection: false,
                    expectNoSessionKey: true,
                    expectDisconnectedMessage: `${ClientConnectionClosedReason.TooMayClients.reason}.${
                        ClientConnectionClosedInstruction[ClientConnectionClosedReason.TooMayClients.code]
                    }.`,
                });
            } finally {
                await secondContext.close();
            }
        });
    });
});
