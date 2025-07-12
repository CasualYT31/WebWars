import { writeFileSync } from "node:fs";

import RandExp from "randexp";
import { test, expect } from "@playwright/test";

import { addSessionKey, bootServer, getSessionKey, openGame, sendCommands, waitForConnection } from "./helpers.mjs";

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
 * @param {Boolean} [options.noNavigation=false] If true, the page won't be reloaded or navigated to.
 * @param {String} [options.expectConnectionFlag="onInitialConnection"] If expectConnection is true, this string stores
 *        the name of the window.WebWars flag to wait for. The flag will be set to true by the map pack once the client
 *        has fully connected. Must be one of "onInitialConnection" and "onReconnection".
 * @param {String} [options.expectWebSocketSessionKey=""] If given, the opened WebSocket's URL will be expected to
 *        include this session key. If a blank string is given, the WebSocket's URL must not contain a session key. Pass
 *        undefined to exclude this test.
 * @param {String} [options.expectSessionKey=""] If given, the session key given by the server is expected to be this.
 * @param {Boolean} [options.expectNoSessionKey=false] If true, no session key is expected to be cached within the
 *        browser context's cookies. Overrides the expectSessionKey option.
 * @param {Boolean} [options.expectSameGameEngineInstance=true] When run with the expectConnection option set to true,
 *        this function caches a reference to the game engine instance within window.WebWars. If this function is
 *        executed again in the same test with the same expectConnection flag, and window.WebWars still holds a
 *        reference to the game engine, it will be tested. By default, these tests assume that the game engine instance
 *        cached from the first call is the same as the instance that can be found in the controller in the second call.
 *        Set this to false to expect that they're different instances.
 * @param {String} [options.expectMapFileToEndWith="test.map"] If expectConnection is true, expect the one and only map
 *        file in the maps model to end with this string.
 * @param {String} [options.expectReactMessage="Hello, World"] If expectConnection is true, the map pack's React message
 *        component must be visible and must contain this text.
 * @param {String} [options.expectDisconnectedMessage=""] If given, the disconnected overlay's message must contain this
 *        text, and the expectConnection option will always be set to false.
 * @param {Boolean} options.expectWebSocketToClose If you expect the websocket to close by the end of the call, set this
 *        to true. If you expect it to remain open, set this to false. If not given, it will default to the inverse of
 *        options.expectConnection.
 * @returns {Promise<String | undefined>} The session key given by the server and cached in the browser context's
 *          cookies, or undefined if none was received or cached.
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
    if (!options.hasOwnProperty("expectWebSocketToClose")) {
        options.expectWebSocketToClose = !options.expectConnection;
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

        if (!options.noNavigation) {
            if (options.reload) {
                await page.reload();
            } else {
                await openGame(page, `http://localhost:${port}`);
            }
        }

        if (options.expectConnection) {
            await waitForConnection(page, options?.expectConnectionFlag ?? "onInitialConnection");
        } else {
            // Don't wait for connection, as that will only happen when the map pack's onInitialConnection handler is
            // invoked, which won't happen if the server refused to verify the client. Wait for the disconnected overlay
            // instead.
            await page.locator("#disconnectedOverlay").waitFor({ state: "visible", timeout: 5000 });
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
                await page.evaluate(
                    async function (options) {
                        const GameEngine = (await import("/gameEngine.mjs")).default;
                        const controller = (await import("/controller.mjs")).default;
                        const mapFiles = controller.getModel("mapPack").mapFiles;
                        if (window.WebWars.gameEngine) {
                            if (options.expectSameGameEngineInstance) {
                                if (controller.game !== window.WebWars.gameEngine) {
                                    console.error("Cached game engine and current game engine are different instances");
                                    return false;
                                } else {
                                    console.debug("Cached game engine and current game engine are the same instances");
                                }
                            } else {
                                if (controller.game === window.WebWars.gameEngine) {
                                    console.error("Cached game engine and current game engine are the same instance");
                                    return false;
                                } else {
                                    console.debug("Cached game engine and current game engine are different instances");
                                }
                            }
                        } else {
                            // Cache a reference to the game engine so that if this function is evaluated again in the
                            // same test, we can test if it's the same instance or not.
                            window.WebWars.gameEngine = controller.game;
                        }
                        console.debug(mapFiles, controller.game instanceof GameEngine, controller.game.isRunning);
                        return (
                            Array.isArray(mapFiles) &&
                            mapFiles.length === 1 &&
                            mapFiles.at(0).endsWith(options.expectMapFileToEndWith) &&
                            controller.game instanceof GameEngine &&
                            controller.game.isRunning
                        );
                    },
                    {
                        expectMapFileToEndWith: options?.expectMapFileToEndWith ?? "test.map",
                        expectSameGameEngineInstance: options?.expectSameGameEngineInstance ?? true,
                    }
                ),
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
            await expect(message, "i18next translations weren't loaded and/or applied").toHaveText(
                options?.expectReactMessage ?? "Hello, World"
            );
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
        if (options.expectWebSocketToClose) {
            expect(websocketClosed, "the WebSocket wasn't closed").toBeTruthy();
        } else {
            expect(websocketClosed, "the WebSocket was closed").toBeFalsy();
        }

        return sessionKey?.value;
    } finally {
        page.off("websocket", websocketHandler);
    }
}

/**
 * Tests that the game running in the given page is in a disconnected state.
 * @param {import("@playwright/test").Page} page The page the game is running in.
 */
async function expectDisconnected(page) {
    // First, expect the disconnected overlay to be visible and displaying the right message.
    await expect(page.locator("#disconnectedOverlay"), "disconnected overlay is not visible").toBeVisible({
        timeout: 2000,
    });
    await expect(
        page.locator("#disconnectedMessage"),
        "disconnected overlay did not contain the correct message"
    ).toContainText(/You are currently disconnected from the serverWill try to reconnect in \d+ seconds?\.\.\./);

    // Next, make sure the root React component is hidden, and that the game engine is paused.
    expect(page.getByTestId("message"), "the root React component was not hidden").not.toBeVisible({ timeout: 2000 });
    expect(
        await page.evaluate(async function () {
            const GameEngine = (await import("/gameEngine.mjs")).default;
            const controller = (await import("/controller.mjs")).default;
            console.debug(controller.game instanceof GameEngine, controller.game.isPaused);
            return controller.game instanceof GameEngine && controller.game.isPaused;
        }),
        "the game engine was destroyed, or not paused"
    ).toBeTruthy();
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

    test("when server responds with garbage data", async ({ context, page }, testInfo) => {
        await bootServer(testInfo, 4150, "connection-map-pack", async port => {
            // Intercept the message from the server to the client to send garbage data.
            // We're expecting the client to enter a known erroneous state where reconnection attempts will not occur.
            await page.routeWebSocket(`ws://localhost:${port}/`, ws => {
                const server = ws.connectToServer();
                server.onMessage(() => ws.send("{ bad json data"));
            });
            await connectAndTest(context, page, port, {
                expectConnection: false,
                expectNoSessionKey: true,
                expectDisconnectedMessage: "There was a problem with the server's verification message.",
                expectWebSocketToClose: false,
            });
        });
    });
});

/**
 * Invokes connectAndTest(), expecting a reconnection rather than a subsequent connection.
 * @param {import("@playwright/test").BrowserContext} context The context the game is running within.
 * @param {import("@playwright/test").Page} page The page the game is running within.
 * @param {Number} port The port the server is running on.
 * @param {String} sessionKey The session key that the client is expected to be using.
 * @param {Object} extraOptions Additional options to spread over the default options given to connectAndTest().
 * @returns {Promise<String | undefined>} The result of the connectAndTest() call.
 */
async function expectReconnection(context, page, port, sessionKey, extraOptions) {
    return await connectAndTest(context, page, port, {
        noNavigation: true,
        expectConnectionFlag: "onReconnection",
        expectWebSocketSessionKey: sessionKey,
        expectSessionKey: sessionKey,
        ...extraOptions,
    });
}

test.describe("Successful reconnection", () => {
    test("when client disconnects then reconnects automatically", async ({ context, page }, testInfo) => {
        await bootServer(testInfo, 4175, "connection-map-pack", async port => {
            // Set up a websocket route to allow us to grab the websocket so we can close it later.
            let websocket;
            await page.routeWebSocket(`ws://localhost:${port}/`, ws => {
                ws.connectToServer();
                websocket = ws;
            });
            const sessionKey = await connectAndTest(context, page, port);
            expect(websocket, "client websocket object could not be grabbed").toBeTruthy();
            await websocket.close();
            await expectDisconnected(page);
            // Tests that the state of the client is correctly synchronized on reconnect.
            await sendCommands(port, sessionKey, ["OpenMenu", "/pack/second-component.mjs"], ["SetLanguage", "de"]);
            await expectReconnection(context, page, port, sessionKey, {
                expectReactMessage: "Tschüss",
            });
        });
    });

    test("when client disconnects then reconnects automatically after failed attempts", async ({
        context,
        page,
    }, testInfo) => {
        await bootServer(testInfo, 4200, "connection-map-pack", async port => {
            // Set up a websocket route to allow us to grab the websocket so we can close it later.
            let websocket;
            await page.routeWebSocket(`ws://localhost:${port}/`, ws => {
                ws.connectToServer();
                websocket = ws;
            });
            const sessionKey = await connectAndTest(context, page, port);
            expect(websocket, "client websocket object could not be grabbed").toBeTruthy();
            await websocket.close();
            await expectDisconnected(page);
            // Connect to the server ourselves to keep the client disconnected.
            websocket = new WebSocket(`ws://localhost:${port}/${sessionKey}`);
            // Make sure the client keeps trying to connect.
            let timeout;
            let interval = setInterval(async () => {
                try {
                    await expectDisconnected(page);
                } catch (e) {
                    if (interval) {
                        clearInterval(interval);
                        interval = undefined;
                    }
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = undefined;
                    }
                    throw e;
                }
            }, 3000);
            try {
                // After a certain duration of time, cancel the test interval and close the websocket.
                await new Promise(resolve => {
                    timeout = setTimeout(() => {
                        try {
                            clearInterval(interval);
                            interval = undefined;
                            websocket.close();
                            timeout = undefined;
                        } catch (e) {
                            if (interval) {
                                clearInterval(interval);
                                interval = undefined;
                            }
                            if (timeout) {
                                clearTimeout(timeout);
                                timeout = undefined;
                            }
                            throw e;
                        }
                        resolve();
                    }, 10000);
                });
                await expectReconnection(context, page, port, sessionKey);
            } catch (e) {
                if (interval) {
                    clearInterval(interval);
                    interval = undefined;
                }
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = undefined;
                }
                throw e;
            }
        });
    });

    test("when server reboots", async ({ context, page }, testInfo) => {
        let sessionKey;
        await bootServer(testInfo, 4225, "connection-map-pack", async port => {
            sessionKey = await connectAndTest(context, page, port);
        });
        // Server has now been killed, make sure the client is in a disconnected state.
        await expectDisconnected(page);
        // We need to manually clear the onInitialConnection flag otherwise the test will think the client has
        // immediately connected with the new server.
        await page.evaluate(function () {
            window.WebWars.onInitialConnection = false;
        });
        // Reboot the server with a new map pack and some previously persisted session data.
        const clientSessionsFile = "test/frontend/connection-map-pack-2/client-sessions.json";
        writeFileSync(clientSessionsFile, `{"${sessionKey}":{"language":"de"}}`);
        await bootServer(
            testInfo,
            4225,
            "connection-map-pack-2",
            ["--client-sessions", clientSessionsFile, "--do-not-persist-client-sessions", "--keep-log-file"],
            async port => {
                await connectAndTest(context, page, port, {
                    noNavigation: true,
                    expectWebSocketSessionKey: sessionKey,
                    expectSessionKey: sessionKey,
                    expectSameGameEngineInstance: false,
                    expectMapFileToEndWith: "test2.map",
                    expectReactMessage: "2Deu",
                });
            }
        );
    });
});
