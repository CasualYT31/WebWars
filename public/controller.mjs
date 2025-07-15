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
import StructuredObjectStore from "/structuredObjectStore.mjs";

import GameEngine from "/gameEngine.mjs";

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
        this.#addEventHandler("system", "onLanguageUpdated", () => {
            const newLanguage = this.getModel("FrontEndData").language;
            console.debug(`Changing language to ${newLanguage} from ${i18next.language}`);
            i18next.changeLanguage(newLanguage);
        });
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
        return this.#models.getObject(name);
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

    // MARK: Dynamic Import

    /**
     * Dynamically imports a module.
     * This implementation adds the boot timestamp to module URIs. The client always assumes that subsequent connections
     * require a complete reset of the game's state, as the server has rebooted and reset its own state, too. After
     * resetting its state, the client will try to import modules served from the server. They may have the same URIs as
     * the dynamically imported modules from before the client reset its state, meaning that without the boot timestamp
     * being attached as a query parameter to the URI, the module cache within the browser may hit on the same URIs and
     * end up serving outdated modules! However, we do still want caching during regular play, hence the use of the boot
     * timestamp and not an arbitrary one.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import#module_namespace_object.
     * @warning Note that this approach of dynamically importing modules leaks memory upon subsequent connections, but
     *          there's no way around this currently.
     * @param {String} uri The URI of the module to dynamically import.
     * @returns {Promise<Object>} Resolves to the dynamically imported module.
     */
    #import(uri) {
        return import(uri + `?t=${this.#bootTimestamp}`);
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
                    console.debug(`New session cookie will expire at ${d.getTime()}, ${d.toUTCString()}`);
                    document.cookie = `sessionKey=${newSessionKey}; expires=${d.toUTCString()}; path=/`;
                    this.#sessionKey = newSessionKey;
                    this.#serverVerified = true;
                    this.#hideDisconnectedOverlay();
                    // We could now be entering asynchronous code within the state machine, so lock the models.
                    this.#lockModels();
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
                    if (this.#modelLock > 0) {
                        console.debug(
                            `Deferring model updates, model lock counter is at ${this.#modelLock}`,
                            ...decodedMessage.payload.updates
                        );
                        this.#modelUpdateQueue.push(...decodedMessage.payload.updates);
                    } else {
                        this.#updateModels(...decodedMessage.payload.updates);
                    }
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
        this.#resetModels(incomingData);
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
     * @param {Object} incomingData The model data given by the server that the client must reset the structured object
     *        store with.
     */
    #onReconnection(incomingData) {
        this.#resetModels(incomingData);
        console.debug("Resuming the game engine");
        this.game.resume();
        this.#showReactRootElement();
        if (this.#mapPackEntryPoint) {
            console.debug("Invoking map pack's onReconnection handler");
            this.#mapPackEntryPoint.onReconnection();
            this.#unlockModels();
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
        this.#resetModels();
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
        this.#import("/pack/main.mjs")
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
            })
            .finally(() => this.#unlockModels());
    }

    // MARK: Model and Event Handling

    /**
     * Lock access to the models.
     * In one or two circumstances, we can't immediately handle a Data message from the server. For example, when we're
     * in the middle of handling a Verify message. Sometimes the code is synchronous and there are no issues, but the
     * subsequent connection handler contains asynchronous code (destroying the game engine, and also importing the
     * map pack's entry point module). For example, in between when:
     *  - the models are reset and the game engine is marked for destruction,
     *  - and when the game engine has finally been destroyed and we continue on with the onInitialConnection logic
     *    using the data provided by the Verify message,
     * a Data message may have arrived and been processed. But that Data message relies on the Verify message's data
     * having been applied already, which it hasn't, and it shouldn't be considered to be completely handled until the
     * map pack's entry point module has been imported and executed appropriately. So during the handling of a Verify
     * message, we increment the modelLock counter, which, when > 0, causes incoming Data messages to be queued instead
     * of handled immediately. Then, once we know the Verify message has been handled, we decrement the counter and
     * flush the queue once it reaches zero.
     */
    #lockModels() {
        ++this.#modelLock;
        console.debug(`Locking access to the models, counter is now at ${this.#modelLock}`);
    }

    /**
     * Unlocks access to the models.
     * Must be called once the Verify message from a server has been handled by the controller.
     */
    #unlockModels() {
        console.debug(`Unlocking access to the models, counter was ${this.#modelLock}`);
        if (--this.#modelLock <= 0) {
            this.#modelLock = 0;
            console.debug(
                `Unlocked access to the models. Applying ${this.#modelUpdateQueue.length} deferred model update/s`,
                this.#modelUpdateQueue
            );
            this.#updateModels(...this.#modelUpdateQueue);
            this.#modelUpdateQueue = [];
        }
    }

    /**
     * Update the front-end models, and emit events to the "views" via their registered handlers.
     * @param {...Object} incomingUpdates Incoming model changes to apply.
     */
    #updateModels(...incomingUpdates) {
        this.#models.update(...incomingUpdates);
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

    /**
     * Invoked when the structured object store (i.e. the model manager) wants to write to the logs.
     * @param {String} level The level to log at.
     * @param {...any} args The objects to log.
     */
    #modelLogHandler(level, ...args) {
        switch (level) {
            case "fatal":
            case "error":
                console.error(...args);
                break;
            case "warn":
                console.warn(...args);
                break;
            case "info":
                console.log(...args);
                break;
            case "debug":
                console.debug(...args);
                break;
            case "trace":
                console.trace(...args);
                break;
            default:
                console.log(...args);
        }
    }

    /**
     * Invoked when incoming model updates contain events that should be emitted to the front-end view code.
     * @param {...String} events The list of events to emit.
     */
    #emitModelEvents(...events) {
        for (let event of events) {
            event = `on${event}`;
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
     * Resets the state of the models, with the option to reinitialize it with a structured object store clone.
     * @param {Object | undefined} clone A structured object store clone sent by the server to initialize the front-end
     *        models with, if any.
     */
    #resetModels(clone) {
        if (clone) {
            console.debug("Resetting models using a clone provided by the server", clone);
        } else {
            console.debug("Erasing all models");
        }
        this.#models = new StructuredObjectStore(
            (...args) => this.#modelLogHandler(...args),
            (...events) => this.#emitModelEvents(...events),
            clone
        );
        this.#models.emitEventsAfterConstruction();
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
        const componentModulePath = this.getModel("FrontEndData").componentModulePath;
        if (!componentModulePath) {
            console.error(
                `Attempting to set the root React component to "${componentModulePath}", which is invalid. Taking no ` +
                    `action`
            );
            return;
        }
        console.debug(`Updating root React component to "${componentModulePath}" from "${this.#reactRootPath}"`);
        this.#import(componentModulePath)
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

    #models = null;
    #modelLock = 0;
    #modelUpdateQueue = [];

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
        window.WebWars = {};
        controller.controller = new Controller();
        // Global used by the E2E tests to figure out when the controller has been constructed.
        // None of those tests should continue until it has.
        window.WebWars.controllerLoaded = true;
        console.debug("Controller loaded");
    }
    return controller.controller;
})();
