/**
 * @file client.mjs
 * The entry point for a WebWars client.
 */

import { ClientMessageType, ServerMessageType, sendMessage, isValidSessionKey } from "./shared/protocol.mjs";
import { getSessionKey, setSessionKey } from "./src/ws/sessionKey.mjs";
import testing from "./testing.mjs";

const ws = new WebSocket(`ws://${location.host}/`);

/**
 * Once the connection has been established, the client tries to verify itself with the server.
 * @param {Event} ev The OnOpen event.
 */
ws.onopen = ev => {
    console.log("The client has connected with the server.", ev);
    const sessionKey = getSessionKey();
    if (sessionKey) {
        console.log(`Attempting to verify with the server using session key: ${sessionKey}.`);
    } else {
        console.log("The client does not have a session key saved, will request a new one from the server.");
    }
    sendMessage(ws, ClientMessageType.Verify, sessionKey);
};

/**
 * When the server sends a message to the client, it should be acted upon.
 * @param {Event} ev The OnMessage event.
 */
ws.onmessage = ev => {
    console.trace("The client has received a message from the server.", ev);
    const decodedMessage = JSON.parse(ev.data);
    console.trace("The client has decoded a message from the server.", decodedMessage);
    switch (decodedMessage.type) {
        case ServerMessageType.Acknowledgement:
            const newSessionKey = decodedMessage.sessionKey;
            if (isValidSessionKey(newSessionKey)) {
                console.debug(`The client has received the session key from the server: ${newSessionKey}.`);
                setSessionKey(newSessionKey);
                // TODO: WEB-3: Opening up the rest of the game should be handled via the MVC/MVVM framework.
                testing();
            } else {
                console.error(`Invalid session key received from the server: ${newSessionKey}!`);
            }
            break;
        default:
            console.error(`Unrecognized server message type ${decodedMessage.type}!`);
    }
};

/**
 * Log when errors occur with the WebSocket.
 * @param {Event} ev The OnError event.
 */
ws.onerror = ev => {
    console.error("The WebSocket connection with the server has encountered an error!", ev);
};

/**
 * Log when the WebSocket connection has been closed.
 * @param {Event} ev The OnClose event.
 */
ws.onclose = ev => {
    console.warn("The WebSocket connection with the server has been closed!", ev);
};
