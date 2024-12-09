/**
 * @file client.mjs
 * The entry point for a WebWars client.
 */

import { ClientMessageType, ServerMessageType, sendMessage, isValidSessionKey } from "./shared/protocol.mjs";
import { getSessionKey, setSessionKey } from "./src/ws/sessionKey.mjs";
import testing from "./testing.mjs";

const sessionKey = getSessionKey();
if (sessionKey) {
    console.log(`Attempting to verify with the server using session key: ${sessionKey}`);
} else {
    console.log("The client does not have a session key saved, will request a new one from the server");
}
const ws = new WebSocket(`ws://${location.host}/${sessionKey}`);
let verified = false;

/**
 * Log when the WebSocket connection has been opened.
 * @param {Event} ev The OnOpen event.
 */
ws.onopen = ev => {
    console.log("The client has connected with the server", ev);
};

/**
 * When the server sends a message to the client, it should be acted upon.
 * @param {Event} ev The OnMessage event.
 */
ws.onmessage = ev => {
    console.trace("The client has received a message from the server", ev);
    const decodedMessage = JSON.parse(ev.data);
    console.trace("The client has decoded the message from the server", decodedMessage);
    switch (decodedMessage.type) {
        case ServerMessageType.Verified:
            const newSessionKey = decodedMessage.payload.sessionKey;
            if (isValidSessionKey(newSessionKey)) {
                console.debug(`The client has received the session key from the server: ${newSessionKey}`);
                setSessionKey(newSessionKey);
                verified = true;
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
    if (!verified) {
        // TODO: there needs to be a page explaining that you can only have the game open in one browser tab at a time.
        //       The user should never encounter this error if they're opening the game in a separate browser. If they
        //       do, it will likely mean they're purposefully tampering with their cookies in order to send the same
        //       session key across multiple browsers. It's almost impossible for them to encounter this otherwise.
    }
};
