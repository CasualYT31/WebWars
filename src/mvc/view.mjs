/**
 * @file view.mjs
 * Defines the class that stores a client session.
 */

import RandExp from "randexp";

import { ClientMessageType, sendMessage, ServerMessageType, sessionKeyRegex } from "#shared/protocol.mjs";
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
        if (this.#controller.command("ReplayPersistedSessionDataIfSessionKeyExists", givenSessionKey)) {
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
            data: this.#sessionData,
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
    // These handlers will convert server-side events into session data updates.

    /**
     * A client must open a new menu.
     * @param {String} sessionKey The session key of the client that must open a new menu.
     * @param {String} newComponent The path (relative to `public`) of the JS module script that exports the component
     *                              to load.
     */
    onMenuOpened(sessionKey, newComponent) {
        if (this.sessionKey === sessionKey) {
            this.#queueSessionDataUpdate("ui", { componentModulePath: newComponent }, "onMenuOpened");
        }
    }

    /**
     * A client must change its language.
     * @param {String} sessionKey The session key of the client whose language is changing.
     * @param {String} newLanguage The I18Next key of the language to set.
     */
    onLanguageUpdated(sessionKey, newLanguage) {
        if (this.sessionKey === sessionKey) {
            this.#queueSessionDataUpdate("ui", { language: newLanguage }, "onLanguageUpdated");
        }
    }

    /**
     * A client will receive the list of map files available for loading.
     * @param {Array<String>} files The paths to the map files in the loaded map pack.
     */
    onMapsFolderScanned(files) {
        this.#queueSessionDataUpdate("mapPack", { mapFiles: files }, "onMapsFolderScanned");
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
     * Queues a session data update.
     * @param {String} partition Name of the partition (i.e. the front-end model) to update.
     * @param {Object} updates The updates to apply to the partition.
     * @param {String} event The server-side event that caused the update.
     */
    #queueSessionDataUpdate(partition, updates, event) {
        this.#logger.log("trace", "Queued session data update:", partition, updates, event);
        this.#queuedSessionDataUpdates.push({
            partition: partition,
            updates: updates,
            event: event,
        });
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
        let sessionDataUpdates = {};
        let sessionDataEvents = new Set();
        // For each queued update...
        for (const sessionDataUpdate of this.#queuedSessionDataUpdates) {
            const partition = sessionDataUpdate.partition;
            const updates = sessionDataUpdate.updates;
            const event = sessionDataUpdate.event;
            // 1. add the update to the combined object to be sent to the client,
            if (partition in sessionDataUpdates) {
                sessionDataUpdates[partition] = { ...sessionDataUpdates[partition], ...updates };
            } else {
                sessionDataUpdates[partition] = updates;
            }
            // 2. apply the update to the server's copy of the session data
            //    (NOTE: whenever you want to create a new front-end model, add it to #sessionData!),
            this.#sessionData[partition] = { ...this.#sessionData[partition], ...updates };
            // 3. and keep track of the events that caused the updates.
            sessionDataEvents.add(event);
        }
        sessionDataEvents = Array.from(sessionDataEvents);
        this.#logger.log("trace", "Applied queued session data updates:", sessionDataUpdates, sessionDataEvents);
        // Once we've collated every update, push them to the client, and clear the queue.
        this.#queuedSessionDataUpdates = [];
        if (publish && this.isConnected()) {
            this.#logger.log("trace", "Publishing data updates");
            sendMessage(this.#ws, ServerMessageType.Data, {
                data: sessionDataUpdates,
                events: sessionDataEvents,
            });
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
    #sessionData = {
        /// Stores data on the UI of the client.
        ui: {},
        /// Stores data on the currently loaded map pack.
        mapPack: {},
    };
    #queuedSessionDataUpdates = [];
}
