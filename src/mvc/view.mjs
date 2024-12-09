/**
 * @file view.mjs
 * Defines the class that stores a client session.
 */

import RandExp from "randexp";

import { ClientMessageType, sendMessage, ServerMessageType, sessionKeyRegex } from "#shared/protocol.mjs";
import { newLogger } from "#src/logger.mjs";

/**
 * Stores data pertaining to a single client session.
 * As with models, any public method starting with `on` is registered as an event handler, however, views can't register
 * commands.
 */
export default class View {
    /**
     * Creates a new client session with a unique session key.
     * @param {Controller} controller Reference to the controller that owns this view.
     * @param {WebSocket} ws The web socket connection associated with this client session.
     * @param {Array<String>} existingSessionKeys The session keys that already exist according to the controller.
     */
    constructor(controller, ws, existingSessionKeys) {
        this.#controller = controller;
        let newSessionKey;
        while (true) {
            newSessionKey = new RandExp(sessionKeyRegex).gen();
            if (existingSessionKeys.indexOf(newSessionKey) < 0) {
                break;
            }
        }
        this.#sessionKey = newSessionKey;
        this.#logger = newLogger(`View-${this.sessionKey}`);
        // Since the view doesn't have a web socket connection yet, this will always work.
        this.attemptToReplaceWebSocket(ws);
    }

    /**
     * Attempts to assign a new web socket connection to this view.
     * This view will reject the new web socket if its current one hasn't closed yet.
     * @param {WebSocket} ws The new web socket connection associated with this view.
     * @returns {Boolean} True if the new web socket was assigned successfully, false if not.
     */
    attemptToReplaceWebSocket(ws) {
        // WEB-6:
        // A note on this implementation: whilst it does combat against a malicious actor hijacking an existing client
        // connection, it doesn't stop them from taking the session if the real client isn't connected. Tying session
        // keys to some browser and/or hardware ID would make this a lot harder. Or we could use an account system, but
        // I don't foresee the server being run when all clients aren't actively playing. If this style of play is
        // desired (e.g. AWBW), another server should be responsible for this kind of security and scalability (it would
        // manage instances of this server program, and there'd need to be multiple for each game in play).
        if (this.#ws && !this.#closed) {
            return false;
        }
        this.#ws = ws;
        this.#closed = false;
        this.#ws.on("message", msg => {
            this.#logger.log("trace", "Client has sent a message:", msg);
            try {
                this.#handleMessage(msg);
            } catch (e) {
                this.#logger.log("error", "Client's message caused an error:", msg, e);
            }
        });
        this.#ws.on("close", () => {
            this.#logger.log("info", "Client has disconnected");
            this.#closed = true;
        });
        sendMessage(this.#ws, ServerMessageType.Verified, { sessionKey: this.sessionKey });
        return true;
    }

    /**
     * The client message handler.
     * @param {String} msg The message sent by the client.
     * @throws Any errors thrown from this handler will be caught and logged.
     */
    #handleMessage(msg) {
        const decodedMessage = JSON.parse(msg);
        this.#logger.log("trace", "Client's message has been decoded:", decodedMessage);
        switch (msg.type) {
            case ClientMessageType.Command:
                this.#controller.command(msg.payload.name, ...msg.payload.data);
                break;
            default:
                this.#logger.log("error", "Client sent a message of an unrecognized type:", msg.type);
        }
    }

    #logger = null;
    #sessionKey = "";
    get sessionKey() {
        return this.#sessionKey;
    }
    #ws = null;
    #closed = true;
    #controller = null;
}
