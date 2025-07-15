/**
 * @file view.mjs
 * Defines the class that stores a client session.
 */

import RandExp from "randexp";

import { ClientMessageType, sendMessage, ServerMessageType, sessionKeyRegex } from "#shared/protocol.mjs";
import StructuredObjectStore from "#shared/structuredObjectStore.mjs";

import { newLogger } from "#src/logging/logger.mjs";

/**
 * Stores data pertaining to a single client session.
 * Views are essentially special models that are intended to store outgoing data. They can handle events, but cannot
 * register commands. They have full access to the controller, which means they can submit commands, but by design they
 * don't emit events.
 */
export default class View {
    /**
     * Creates a new client session with a unique session key.
     * @param {Controller} controller Reference to the controller that owns this view.
     * @param {WebSocket} ws The web socket connection associated with this client session.
     * @param {String} givenSessionKey The session key that the client gave on connection. Empty if they gave none.
     */
    constructor(controller, ws, givenSessionKey) {
        this.#controller = controller;
        let newSessionKey;
        if (this.#controller.command("SessionKeyExists", givenSessionKey)) {
            // This is a session key from a previous run, use the session key and accept the persisted data once the
            // events arrive.
            newSessionKey = givenSessionKey;
        } else {
            // This is a completely new client, generate a new session key.
            while (true) {
                newSessionKey = new RandExp(sessionKeyRegex).gen();
                if (!this.#controller.doesSessionKeyExist(newSessionKey)) {
                    break;
                }
            }
        }
        this.#sessionKey = newSessionKey;
        this.#logger = newLogger(`View-${this.sessionKey}`);
        // Since the view doesn't have a web socket connection yet, this will always work.
        this.attemptToReplaceWebSocket(ws);
    }

    /**
     * Finds out if the client associated with this session is still connected to the server via web socket.
     * @returns {Boolean} Is the client still connected to the server?
     */
    isConnected() {
        return this.#ws && !this.#closed;
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
        // manage instances of this server program, and there'd need to be one for each game in play).
        if (this.isConnected()) {
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
        // Apply any queued session data updates, but don't publish them. Instead, we publish the entirety of the
        // session data with the verification message.
        this.#applyQueuedSessionDataUpdates(false);
        sendMessage(this.#ws, ServerMessageType.Verified, {
            sessionKey: this.sessionKey,
            bootTimestamp: this.#controller.bootTimestamp,
            data: this.#sessionData.clone(),
        });
        return true;
    }

    /**
     * Applies any queued session data changes and publishes them to the client, if they're connected.
     */
    publishData() {
        this.#applyQueuedSessionDataUpdates(true);
    }

    // MARK: Event handlers

    /**
     * Replaces one of this view's front-end models if the given session key matches the one stored within the view.
     * @param {String} frontEndModelName The name of the front-end model being replaced (or added if it doesn't exist
     *        yet).
     * @param {String} sessionKey The session key of the client whose front-end model is being replaced.
     * @param {Object} dataStructure Tells the view what structure the front-end model has, dictating how it should
     *        perform spreading operations in the future.
     * @param {Object} data The new front-end model.
     * @param {Array<String>} events A list of server-side events that caused the front-end data replacement. These will
     *        be re-emitted on the client side.
     */
    onNewFrontEndData(frontEndModelName, sessionKey, dataStructure, data, events) {
        if (this.sessionKey === sessionKey) {
            const replacementUpdate = {
                type: StructuredObjectStore.UpdateType.Replace,
                name: frontEndModelName,
                events: events,
                structure: dataStructure,
                data: data,
            };
            this.#logger.log("trace", "Queued session data replacement:", JSON.stringify(replacementUpdate));
            this.#queuedSessionDataUpdates.push(replacementUpdate);
        }
    }

    /**
     * Updates one of this view's front-end models if the given session key matches the one stored within the view.
     * @param {String} frontEndModelName The name of the front-end model being updated. No update will occur if the
     *        model doesn't exist, so make sure a NewFrontEndData event is emitted first.
     * @param {String | undefined} sessionKey The session key of the client whose front-end model is being updated. If
     *        a non-string is given, session key checking is disabled and the front-end model will be updated by force.
     * @param {Object} data Either the new front-end model data, or a partial update for the front-end model.
     * @param {Array<String>} events A list of server-side events that caused the front-end data update. These will be
     *        re-emitted on the client side.
     */
    onFrontEndDataChange(frontEndModelName, sessionKey, data, events) {
        if (typeof sessionKey !== "string" || this.sessionKey === sessionKey) {
            const partialUpdate = {
                type: StructuredObjectStore.UpdateType.Update,
                name: frontEndModelName,
                events: events,
                updates: data,
            };
            this.#logger.log("trace", "Queued session data update:", JSON.stringify(partialUpdate));
            this.#queuedSessionDataUpdates.push(partialUpdate);
        }
    }

    // MARK: Private

    /**
     * The client message handler.
     * @param {String} msg The message sent by the client.
     * @throws Any errors thrown from this handler will be caught and logged.
     */
    #handleMessage(msg) {
        const decodedMessage = JSON.parse(msg);
        this.#logger.log("trace", "Client's message has been decoded:", decodedMessage);
        switch (decodedMessage.type) {
            case ClientMessageType.Command:
                const commandName = decodedMessage.payload.name;
                const commandArguments = decodedMessage.payload.data;
                if (this.#controller.mustGiveSessionKeyWithCommand(commandName)) {
                    commandArguments.unshift(this.sessionKey);
                }
                this.#controller.command(commandName, ...commandArguments);
                break;
            default:
                this.#logger.log("error", "Client sent a message of an unrecognized type:", decodedMessage.type);
        }
    }

    /**
     * Apply queued session data updates and clear the queue, optionally publishing the data updates.
     */
    #applyQueuedSessionDataUpdates(publish) {
        // If the queue is empty, return early and don't publish any message.
        if (this.#queuedSessionDataUpdates.length == 0) {
            return;
        }
        this.#logger.log(
            "trace",
            "Applying queued session data updates:",
            `Length: ${this.#queuedSessionDataUpdates.length}`,
            `Publish: ${publish}`,
            `Connected: ${this.isConnected()}`
        );

        this.#sessionData.update(...this.#queuedSessionDataUpdates);

        if (publish && this.isConnected()) {
            this.#logger.log(
                "debug",
                "Publishing data updates to the client:",
                JSON.stringify(this.#queuedSessionDataUpdates)
            );
            sendMessage(this.#ws, ServerMessageType.Data, { updates: this.#queuedSessionDataUpdates });
        }

        this.#queuedSessionDataUpdates = [];
    }

    #logger = null;
    #sessionKey = "";
    get sessionKey() {
        return this.#sessionKey;
    }
    #ws = null;
    #closed = true;
    #controller = null;
    #sessionData = new StructuredObjectStore((...args) => this.#logger.log(...args));
    #queuedSessionDataUpdates = [];
}
