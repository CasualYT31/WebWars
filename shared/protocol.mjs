/**
 * @file protocol.mjs
 * Defines the WebSocket communication protocol shared between the server and its clients.
 */

import { deepFreeze } from "./utils.mjs";

/**
 * The types of message that can be sent from a client to the server.
 */
export const ClientMessageType = Object.freeze({
    /// The client asks the server to run a given command.
    Command: 1,
});

/**
 * The types of message that can be sent from the server to a client.
 */
export const ServerMessageType = Object.freeze({
    /// The server tells a client that it is verified and has the given session key.
    /// The server's boot timestamp, and the entirety of the client's session data, are also pushed.
    Verified: 1,
    /// The server pushes an update to the client's session data, and tells it what events to fire.
    Data: 2,
});

/**
 * Send a message over a WebSocket connection.
 * @param {WebSocket} ws The WebSocket to send the message over.
 * @param {String} type The type of client message to send.
 * @param {Object} payload The JSON object to serialize.
 */
export function sendMessage(ws, type, payload = {}) {
    ws.send(
        JSON.stringify({
            type: type,
            payload: payload,
        })
    );
}

/**
 * The regex for a valid session key.
 */
export const sessionKeyRegex = /^[0-9a-f]{16}$/;

/**
 * Test if a given variable could contain a valid session key.
 * This function only tests the format of the session key.
 * @param {String} keyToTest The session key to test.
 * @returns {Boolean} Is the given string in a valid session key format?
 */
export function isValidSessionKey(keyToTest) {
    return sessionKeyRegex.test(keyToTest);
}

/**
 * The different reasons given by the server for rejecting/closing a client connection.
 * The error codes used comply with RFC 6455: https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.
 * Note that reason strings must be no longer than 123 bytes (not characters)!
 */
export const ClientConnectionClosedReason = deepFreeze({
    /// The server cannot accept the client's connection without exceeding its maximum client connection count setting.
    TooMayClients: {
        code: 4000,
        reason: "You cannot connect to this server has it has reached its maximum player count",
    },
    /**
     * A client cannot connect to the server with a session key that's already being used by an existing client
     * connection.
     * The reason assumes that the user is opening the game in a second browser tab, but it could also be an attempt
     * from a malicious actor to steal an existing client session.
     */
    SimultaneousConnectionAttempt: {
        code: 4001,
        reason: "You cannot have the game open in more than one browser tab",
    },
});

/**
 * Maps ClientConnectionClosedReason web socket close codes to instruction messages to display to the user.
 */
export const ClientConnectionClosedInstruction = Object.freeze({
    4000: "Please close the server, increase the max client sessions setting, then reboot the server",
    4001: "Please close your old tab and refresh this page to pick up where you left off",
});
