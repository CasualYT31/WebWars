/**
 * @file protocol.mjs
 * Defines the WebSocket communication protocol shared between the server and its clients.
 */

/**
 * The types of message that can be sent from a client to the server.
 */
export const ClientMessageType = {
    Command: 1,
};

/**
 * The types of message that can be sent from the server to a client.
 */
export const ServerMessageType = {
    Verified: 1,
};

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
export const sessionKeyRegex = /^[0-9a-f]{16}$/g;

/**
 * Test if a given variable could contain a valid session key.
 * This function only tests the format of the session key.
 * @param {String} keyToTest The session key to test.
 * @returns {Boolean} Is the given string in a valid session key format?
 */
export function isValidSessionKey(keyToTest) {
    return sessionKeyRegex.test(keyToTest);
}
