/**
 * @file controller.mjs
 * The entry point of the client code.
 */

import {
    ClientConnectionClosedInstruction,
    ClientMessageType,
    ServerMessageType,
    isValidSessionKey,
    sendMessage,
} from "/protocol.mjs";
import GameEngine from "./gameEngine.mjs";
import Model from "/model.mjs";

/**
 * Manages the web socket connection between the client and the server.
 */
class Controller {
    /**
     * Create a new web socket connection and attempt to connect to the server.
     */
    constructor() {
        // Register system handlers now (these are never cleared).
        this.#addEventHandler("system", "onMenuOpened", this.#updateRootComponent.bind(this));
        this.#addEventHandler("system", "onLanguageUpdated", () =>
            i18next.changeLanguage(this.getModel("ui").language)
        );
        // Set up I18Next.
        i18next
            .use(i18nextHttpBackend)
            .use(ReactI18next.initReactI18next)
            .init({
                backend: {
                    loadPath: "/pack/locales/{{lng}}/{{ns}}.json",
                },
                fallbackLng: "en",
                debug: true,
            });
        // Set up the web socket connection.
        this.#attemptToConnectToServer();
    }

    // MARK: Public API

    /**
     * Retrieves a reference to the given model's read-only data.
     * @param {String} name The name of the front-end model to retrieve.
     * @returns {Object} The front-end model's read-only data.
     */
    getModel(name) {
        return this.#models[name].data;
    }

    /**
     * When your React component needs to respond to an event from the server, add a handler for it using this method.
     * The event name must be prepended with "on", but the controller will prepend it for you if you don't.
     * Note that the controller will automatically remove a component's event handler if it knows that the component has
     * been unloaded, so there's no need to remove it yourself or worry about if the handler is already present when
     * your component is reloaded (in this case it will add it again like normal).
     * @param {String | Array<String>} events The name/s of the event/s to handle.
     * @param {Function} handler The function to call when the server emits these events.
     */
    updateComponentWhen(events, handler) {
        if (!Array.isArray(events)) {
            events = [events];
        }
        for (const event of events) {
            this.#addEventHandler("component", event, handler);
        }
    }

    /**
     * When some component of a Phaser scene needs to respond to an event from the server, add a handler for it using
     * this method.
     * The event name must be prepended with "on", but the controller will prepend it for you if you don't.
     * Note that the controller will only ever remove scene handlers whenever the game engine is reinitialized. As soon
     * as you add a scene handler it will be present for the duration of the game. Also note that scene events will
     * always be emitted even if the scene/s the handler is logically associated with is/are inactive.
     * @param {String | Array<String>} events The name/s of the event/s to handle.
     * @param {Function} handler The function to call when the server emits these events.
     */
    updateSceneWhen(events, handler) {
        if (!Array.isArray(events)) {
            events = [events];
        }
        for (const event of events) {
            this.#addEventHandler("scene", event, handler);
        }
    }

    /**
     * Sends a command to the server.
     * @param {String} name The name of the command to execute.
     * @param {...any} data The parameters to send with the command.
     */
    command(name, ...data) {
        if (this.#ws.readyState === WebSocket.OPEN) {
            console.trace(`Sending command "${name}"`, data);
            sendMessage(this.#ws, ClientMessageType.Command, {
                name: name,
                data: data,
            });
        } else {
            console.error(`Tried to send command "${name}" whilst disconnected from the server`, data);
        }
    }

    /**
     * Gives direct access to the GameEngine object.
     * @returns {GameEngine} The GameEngine.
     */
    get game() {
        return this.#gameEngine;
    }

    // MARK: Web Socket Handling

    /**
     * Replaces any existing web socket connection with a new one.
     */
    #attemptToConnectToServer() {
        if (this.#sessionKey) {
            console.log(`Attempting to verify with the server using session key: ${this.#sessionKey}`);
        } else {
            console.log("The client does not have a session key saved, will request a new one from the server");
        }
        this.#ws = new WebSocket(`ws://${location.host}/${this.#sessionKey}`);
        this.#ws.onopen = ev => this.#onConnected(ev);
        this.#ws.onmessage = ev => this.#onServerMessage(ev);
        this.#ws.onerror = ev => this.#onError(ev);
        this.#ws.onclose = ev => this.#onDisconnected(ev);
    }

    /**
     * Invoked whenever the client connects to the web server via web socket.
     * The connection has not been verified yet, so no logic will be carried out.
     * @param {Event} ev The web socket's open event.
     */
    #onConnected(ev) {
        console.log("The client has connected to the server", ev);
    }

    /**
     * Invoked whenever the client receives a message from the server.
     * @param {Event} ev The web socket's message event.
     */
    #onServerMessage(ev) {
        console.debug("The client has received a message from the server", ev);
        try {
            const decodedMessage = JSON.parse(ev.data);
            console.debug("The client has decoded the message from the server", decodedMessage);
            switch (decodedMessage.type) {
                case ServerMessageType.Verified:
                    const newSessionKey = decodedMessage.payload.sessionKey;
                    if (!isValidSessionKey(newSessionKey)) {
                        throw new Error(`Invalid session key received from the server: "${newSessionKey}"!`);
                    }
                    console.debug(`The client has received the session key from the server: ${newSessionKey}`);
                    const d = new Date();
                    d.setTime(d.getTime() + 34560000000); // Expires in 400 days, which is the default cap on cookies.
                    document.cookie =
                        `sessionKey=${newSessionKey}; expires=${d.toUTCString()}; ` +
                        `path=/; SameSite=None; Secure=None`;
                    this.#sessionKey = newSessionKey;
                    this.#serverVerified = true;
                    this.#hideDisconnectedOverlay();
                    if (this.#bootTimestamp === null) {
                        // This is the client's first time connecting to a server, simply record the server's boot
                        // timestamp so that if the client disconnects then reconnects to the server, it will know
                        // whether or not the server has rebooted.
                        this.#bootTimestamp = decodedMessage.payload.bootTimestamp;
                        console.debug("First time connecting to the server: execute onInitialConnection handler");
                        this.#onInitialConnection(decodedMessage.payload.data);
                    } else if (this.#bootTimestamp !== decodedMessage.payload.bootTimestamp) {
                        // The client has reconnected to the server after a server reboot. Reset the state of the
                        // client.
                        this.#bootTimestamp = decodedMessage.payload.bootTimestamp;
                        console.debug("The server has rebooted: execute onSubsequentConnection handler");
                        this.#onSubsequentConnection(decodedMessage.payload.data);
                    } else {
                        // The client has reconnected to the server and it hasn't rebooted. The client will now try to
                        // synchronize its state with that of the server.
                        console.debug("The client has reconnected to the server: execute onReconnection handler");
                        this.#onReconnection(decodedMessage.payload.data);
                    }
                    break;
                case ServerMessageType.Data:
                    this.#updateModelsAndEmitEvents(decodedMessage.payload.data, decodedMessage.payload.events);
                    break;
                default:
                    throw new Error(`Unrecognized server message type ${decodedMessage.type}!`);
            }
        } catch (e) {
            console.error("An error occurred whilst processing a message sent from the server!", e, ev);
            if (!this.#serverVerified) {
                this.#showDisconnectedOverlay(
                    "There was a problem with the server's verification message.",
                    "Please refresh the page to attempt to verify the client with the server again."
                );
            }
        }
    }

    /**
     * When the client disconnects from the server due to an error, this handler will be invoked.
     * The close event/#onDisconnected() call will follow.
     * @param {Event} ev The web socket's error event.
     */
    #onError(ev) {
        console.error("The client has disconnected from the server due to an error", ev);
    }

    /**
     * Invoked whenever the client's web socket disconnects from the server for any reason.
     * @param {Event} ev The web socket's close event containing the reason for the closure.
     */
    #onDisconnected(ev) {
        console.warn("The client has been disconnected from the server", ev);
        this.#onDisconnection();
        if (this.#serverVerified) {
            let interval;
            const me = this;
            function reconnect(onReconnect) {
                if (reconnect.countdown === undefined) {
                    reconnect.countdown = 3;
                } else {
                    --reconnect.countdown;
                }
                me.#showDisconnectedOverlay(
                    "You are currently disconnected from the server",
                    `Will try to reconnect in ${reconnect.countdown} second${reconnect.countdown == 1 ? "" : "s"}...`
                );
                if (reconnect.countdown <= 0) {
                    clearInterval(interval);
                    onReconnect();
                }
            }
            reconnect();
            interval = setInterval(() => reconnect(this.#attemptToConnectToServer.bind(this)), 1000);
        } else {
            this.#showDisconnectedOverlay(`${ev.reason}.`, `${ClientConnectionClosedInstruction[ev.code]}.`);
        }
    }

    // MARK: State Machine

    /**
     * Invoked when the client connects to the server for the first time.
     * Sets up the game engine and tries to import the current map pack's main entry point module. Then, it will try to
     * invoke its onInitialConnection() handler, but it won't if it or the onReconnection() handler aren't defined.
     * This method assumes that the controller's state is as it was on construction (i.e. default initialized).
     * @param {Object} incomingData The model data given by the server that the client must store.
     */
    #onInitialConnection(incomingData) {
        this.#updateModelsAndEmitEventsOnConnection(incomingData);
        console.debug("Initializing the game engine");
        this.#gameEngine = new GameEngine();
        this.#importMapPackEntryPoint();
    }

    /**
     * Invoked whenever the client loses its connection to the server.
     * Pauses the game engine if it was initialized, and hides the root React component if it exists.
     * The disconnected overlay is managed by the #onDisconnected() method.
     */
    #onDisconnection() {
        if (this.game) {
            console.debug("Pausing the game engine");
            this.game.pause();
        }
        if (this.#reactRootElement) {
            this.#hideReactRootElement();
        }
    }

    /**
     * Invoked when the client reconnects to the server and the client detects that the server has not rebooted.
     * Resumes the game engine (this method assumes it has been initialized) and shows the root React component. The
     * previously imported map pack's main entry point module, if it exists, will be called upon to synchronize the
     * state of the client with the new state of the server. If it doesn't exist, another attempt to import it will be
     * made, and the onInitialConnection() handler will be invoked instead if the module could be imported.
     * @param {Object} incomingData The model data given by the server that the client must apply to what it has stored
     *        already.
     */
    #onReconnection(incomingData) {
        this.#updateModelsAndEmitEventsOnConnection(incomingData);
        console.debug("Resuming the game engine");
        this.game.resume();
        this.#showReactRootElement();
        if (this.#mapPackEntryPoint) {
            console.debug("Invoking map pack's onReconnection handler");
            this.#mapPackEntryPoint.onReconnection();
        } else {
            this.#importMapPackEntryPoint();
        }
    }

    /**
     * Invoked when the client reconnects to the server and the client detects that the server has rebooted.
     * The client must reset its entire state before executing the #onInitialConnection() logic.
     * @param {Object} incomingData The model data given by the server. The client must completely replace any existing
     *        model data it has with this data.
     */
    #onSubsequentConnection(incomingData) {
        console.debug("Deleting all front-end models");
        this.#models = {};
        this.#unloadRootComponent();
        this.#showReactRootElement();
        console.debug("Deleting stale map pack entry point module");
        this.#mapPackEntryPoint = null;
        console.debug("Reloading i18next resources");
        i18next.reloadResources();
        this.#clearEventHandlers("scene");
        console.debug("Destroying the game engine");
        this.game.events.on("destroy", () => {
            // Destruction is asynchronous, so only continue with connection logic once we know it's been destroyed.
            this.#gameEngine = null;
            this.#onInitialConnection(incomingData);
        });
        this.game.destroy(true);
    }

    /**
     * Tries to asynchronously import the currently loaded map pack's entry point module.
     * If it couldn't import it, an error will be logged. If it could, its onInitialConnection handler will be invoked.
     */
    #importMapPackEntryPoint() {
        console.debug("Importing map pack's entry point module");
        import("/pack/main.mjs")
            .then(entryPointModule => {
                console.debug("Imported map pack's entry point module", entryPointModule);
                if (typeof entryPointModule.onReconnection === "function") {
                    if (typeof entryPointModule.onInitialConnection === "function") {
                        this.#mapPackEntryPoint = entryPointModule;
                        console.debug(
                            "Validated map pack's entry point module, now invoking its onInitialConnection handler",
                            this.#mapPackEntryPoint
                        );
                        this.#mapPackEntryPoint.onInitialConnection();
                    } else {
                        throw new Error(
                            "The map pack's entry point module doesn't have a valid onInitialConnection() handler!"
                        );
                    }
                } else {
                    throw new Error("The map pack's entry point module doesn't have a valid onReconnection() handler!");
                }
            })
            .catch(reason => {
                console.error("Failed to import the map pack's main.mjs entry point module!", reason);
                this.#hideReactRootElement();
                this.#showDisconnectedOverlay(
                    "The loaded map pack's main module could not be imported.",
                    "Check the browser logs for more details.",
                    "Once the error has been corrected, you will need to refresh the page to try importing the " +
                        "module again."
                );
            });
    }

    // MARK: Model and Event Handling

    /**
     * Update the front-end models whenever the client [re]connects to the server.
     * The map pack will have its own connection handlers responsible for reading the incoming model data and updating
     * the state of the client, so there's no need to emit many events right now. We still emit the onLanguageUpdated
     * event to update the language used by i18next which will always be initialized regardless of the connection
     * transition in play. And we also emit the onMenuOpened event to allow the controller to initialize the root React
     * component based on the currently assigned menu, if any.
     * @param {Object} incomingData Incoming model changes to apply.
     */
    #updateModelsAndEmitEventsOnConnection(incomingData) {
        this.#updateModelsAndEmitEvents(incomingData, ["onLanguageUpdated", "onMenuOpened"]);
    }

    /**
     * Update the front-end models, then emit events to the "views" via their registered handlers.
     * @param {Object} incomingData Incoming model changes to apply.
     * @param {Array<String>} incomingEvents The server-side events that caused the model changes.
     */
    #updateModelsAndEmitEvents(incomingData, incomingEvents = []) {
        for (const modelName in incomingData) {
            if (this.#models.hasOwnProperty(modelName)) {
                console.debug(`Updating model "${modelName}"`, incomingData[modelName]);
                this.#models[modelName].update(incomingData[modelName]);
            } else {
                console.debug(`Creating model "${modelName}"`, incomingData[modelName]);
                this.#models[modelName] = new Model(incomingData[modelName]);
            }
        }
        for (const event of incomingEvents) {
            console.debug(`Dispatching event "${event}"`);
            for (const handlerType in this.#eventHandlers) {
                const handlers = this.#eventHandlers[handlerType];
                if (event in handlers) {
                    for (const handler of handlers[event]) {
                        handler();
                    }
                }
            }
        }
    }

    /**
     * Adds an event handler.
     * @param {String} handlerType "system", "component" or "scene".
     * @param {String} event The name of the event to add a handler for.
     * @param {Function} handler The callback that is invoked when the event is fired.
     */
    #addEventHandler(handlerType, event, handler) {
        if (!event.startsWith("on")) {
            event = `on${event}`;
        }
        console.trace(`Adding ${handlerType} handler for event "${event}"`, handler);
        const handlers = this.#eventHandlers[`${handlerType}Handlers`];
        if (event in handlers) {
            handlers[event].push(handler);
        } else {
            handlers[event] = [handler];
        }
    }

    /**
     * Removes all existing component or scene event handlers.
     * Component event handlers should be removed whenever an existing root component is removed.
     * Scene event handlers should be removed whenever the game engine is destroyed.
     * @param {String} handlerType "component" or "scene" ("system" handlers must never be cleared).
     */
    #clearEventHandlers(handlerType) {
        console.debug(`Clearing ${handlerType} event handlers`);
        this.#eventHandlers[`${handlerType}Handlers`] = {};
    }

    // MARK: React Component Management

    /**
     * Gets the element used as the root React node.
     * @returns {HTMLElement} The element used as the root React node.
     */
    get #reactRootElement() {
        return document.querySelector("#root>div");
    }

    /**
     * Shows the root React component.
     */
    #showReactRootElement() {
        console.debug("Showing the root React component");
        this.#reactRootElement.style.visibility = "visible";
    }

    /**
     * Hides the root React component.
     */
    #hideReactRootElement() {
        console.debug("Hiding the root React component");
        this.#reactRootElement.style.visibility = "hidden";
    }

    /**
     * Unmounts the current root React node/component and clears all of the component event handlers.
     */
    #unloadRootComponent() {
        console.debug("Unmounting the root React component");
        this.#clearEventHandlers("component");
        if (this.#reactRoot) {
            this.#reactRoot.unmount();
        }
        this.#reactRoot = null;
        this.#reactRootPath = "";
    }

    /**
     * Whenever the user opens a new menu, unload the current root component, and render the new root component that is
     * stored in the "ui" model.
     */
    #updateRootComponent() {
        // Dynamically import the new root component.
        const componentModulePath = this.getModel("ui").componentModulePath;
        if (!componentModulePath) {
            console.error(
                `Attempting to set the root React component to "${componentModulePath}", which is invalid. Taking no ` +
                    `action`
            );
            return;
        }
        console.debug(`Updating root React component to "${componentModulePath}" from "${this.#reactRootPath}"`);
        import(componentModulePath)
            .then(componentModule => {
                this.#unloadRootComponent();
                this.#reactRoot = ReactDOM.createRoot(this.#reactRootElement);
                this.#reactRoot.render(React.createElement(componentModule.default, null, null));
                console.debug(`Rendered new root React component "${componentModulePath}"`);
                this.#reactRootPath = componentModulePath;
            })
            .catch(reason => {
                console.error(`Failed to update root React component to "${componentModulePath}"!`, reason);
            });
    }

    // MARK: Disconnected Overlay

    /**
     * Retrieves the disconnected overlay element that's rendered over the root element.
     * @returns {HTMLElement} The disconnected overlay element.
     */
    get #disconnectedOverlay() {
        return document.getElementById("disconnectedOverlay");
    }

    /**
     * Retrieves the disconnected message element that's rendered within the disconnected overlay.
     * @returns {HTMLElement} The disconnected message element.
     */
    get #disconnectedMessage() {
        return document.getElementById("disconnectedMessage");
    }

    /**
     * Shows the disconnected overlay.
     * @param {...String} messages If given, the disconnected overlay's message will also be updated. Each string will
     *        be joined with two newline characters.
     */
    #showDisconnectedOverlay(...messages) {
        if (messages.length > 0) {
            console.debug("Updating the disconnected overlay to contain the following lines", messages);
            this.#disconnectedMessage.innerText = messages.join("\n\n");
        }
        console.debug("Showing the disconnected overlay");
        this.#disconnectedOverlay.style.visibility = "visible";
    }

    /**
     * Hides the disconnected overlay.
     */
    #hideDisconnectedOverlay() {
        console.debug("Hiding the disconnected overlay");
        this.#disconnectedOverlay.style.visibility = "hidden";
    }

    // MARK: Data

    #sessionKey = (function () {
        // Grabs the session key from the browser's cookies, if one is there.
        const decodedCookie = decodeURIComponent(document.cookie);
        if (decodedCookie.length > 0) {
            return decodedCookie.split("=").at(1);
        }
        return "";
    })();
    #bootTimestamp = null;
    #ws = null;
    #serverVerified = false;

    #models = {};
    #eventHandlers = {
        systemHandlers: {},
        componentHandlers: {},
        sceneHandlers: {},
    };

    #mapPackEntryPoint = null;

    #reactRootPath = "";
    #reactRoot = null;

    #gameEngine = null;
}

/**
 * Stores the single instance of the controller that is globally available.
 */
export default (function controller() {
    if (controller.controller === undefined) {
        console.debug("Loading controller");
        controller.controller = new Controller();
        console.debug("Controller loaded");
    }
    return controller.controller;
})();
