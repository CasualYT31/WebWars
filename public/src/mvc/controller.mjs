/**
 * @file controller.mjs
 * The controller code for the client.
 */

import { ClientMessageType, ServerMessageType, isValidSessionKey, sendMessage } from "../../shared/protocol.mjs";
import MenuScene from "../scenes/menuScene.mjs";
import Model from "./model.mjs";

/**
 * Manages the web socket connection between the client and the server.
 */
class Controller {
    /**
     * Create a new web socket connection and attempt to connect to the server.
     */
    constructor() {
        // Set up the web socket connection.
        if (this.#sessionKey) {
            console.log(`Attempting to verify with the server using session key: ${this.#sessionKey}`);
        } else {
            console.log("The client does not have a session key saved, will request a new one from the server");
        }
        this.#ws = new WebSocket(`ws://${location.host}/${this.#sessionKey}`);
        this.#ws.onopen = ev => this.#onConnected(ev);
        this.#ws.onmessage = ev => this.#onServerMessage(ev);
        this.#ws.onerror = ev => this.#onError(ev);
        this.#ws.onclose = ev => this.#onClose(ev);
        // Set up I18Next.
        i18next.use(i18nextHttpBackend).use(ReactI18next.initReactI18next).init({
            fallbackLng: "en",
            debug: true,
        });
        // Set up Phaser and React's root element.
        this.#reactRoot = ReactDOM.createRoot(document.getElementById("root"));
        const game = new Phaser.Game({
            type: Phaser.AUTO,
            width: 1920,
            height: 1080,
            // Credit where it's due: https://stackoverflow.com/a/60216568.
            scale: {
                // Fit to window.
                mode: Phaser.Scale.FIT,
                // Center vertically and horizontally.
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            scene: MenuScene,
            physics: {
                default: "arcade",
                arcade: {
                    gravity: { y: 200 },
                },
            },
        });
        // Resize the React root to match Phaser's canvas whenever the latter resizes.
        game.renderer.onResize = function () {
            const reactRoot = document.getElementById("root");
            const phaserCanvas = document.querySelector("canvas");
            reactRoot.style.width = phaserCanvas.style.width;
            reactRoot.style.height = phaserCanvas.style.height;
            reactRoot.style.marginLeft = phaserCanvas.style.marginLeft;
            reactRoot.style.marginTop = phaserCanvas.style.marginTop;
        };
        // Register system handlers now (these are never cleared).
        this.#addEventHandler("system", "onLoad", this.#initGame.bind(this));
        this.#addEventHandler("system", "onMenuOpened", this.#updateRootComponent.bind(this));
        this.#addEventHandler("system", "onLanguageUpdated", () =>
            i18next.changeLanguage(this.getModel("ui").language)
        );
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
     * @param {String} event The name of the event to handle.
     * @param {Function} handler The function to call when the server emit this event.
     */
    updateComponentWhen(event, handler) {
        this.#addEventHandler("component", event, handler);
    }

    /**
     * When some component of a Phaser scene needs to respond to an event from the server, add a handler for it using
     * this method.
     * The event name must be prepended with "on", but the controller will prepend it for you if you don't.
     * Note that the controller will automatically remove a scene handler if it knows that the scene has been removed,
     * so there's no need to remove it yourself or worry about if the handler is already present when your scene is
     * reloaded (in this case it will add it again like normal).
     * @param {String} event The name of the event to handle.
     * @param {Function} handler The function to call when the server emit this event.
     */
    updateSceneWhen(event, handler) {
        this.#addEventHandler("scene", event, handler);
    }

    /**
     * Sends a command to the server.
     * @param {String} name The name of the command to execute.
     * @param {...any} data The parameters to send with the command.
     */
    command(name, ...data) {
        console.trace(`Sending command "${name}"`, data);
        sendMessage(this.#ws, ClientMessageType.Command, {
            name: name,
            data: data,
        });
    }

    // MARK: Web Socket Handling

    #onConnected(ev) {
        console.log("The client has connected with the server", ev);
    }

    #onServerMessage(ev) {
        console.debug("The client has received a message from the server", ev);
        const decodedMessage = JSON.parse(ev.data);
        console.debug("The client has decoded the message from the server", decodedMessage);
        switch (decodedMessage.type) {
            case ServerMessageType.Verified:
                const newSessionKey = decodedMessage.payload.sessionKey;
                if (isValidSessionKey(newSessionKey)) {
                    console.debug(`The client has received the session key from the server: ${newSessionKey}`);
                    const d = new Date();
                    d.setTime(d.getTime() + 86400000); // Expires in one day.
                    document.cookie =
                        `sessionKey=${newSessionKey}; expires=${d.toUTCString()}; ` +
                        `path=/; SameSite=None; Secure=None`;
                    this.#sessionKey = newSessionKey;
                    this.#serverVerified = true;
                    this.#updateModelsAndEmitEvents(decodedMessage.payload.data, ["onLoad", "onLanguageUpdated"]);
                } else {
                    console.error(`Invalid session key received from the server: ${newSessionKey}!`);
                }
                break;
            case ServerMessageType.Data:
                this.#updateModelsAndEmitEvents(decodedMessage.payload.data, decodedMessage.payload.events);
                break;
            default:
                console.error(`Unrecognized server message type ${decodedMessage.type}!`);
        }
    }

    #onError(ev) {
        console.error("The client has disconnected from the server due to an error", ev);
        this.#onDisconnected();
    }

    #onClose(ev) {
        console.warn("The client has been disconnected from the server", ev);
        this.#onDisconnected();
    }

    #onDisconnected() {
        if (this.#serverVerified) {
            // TODO: Block user input and display Disconnected overlay.
        } else {
            alert(
                "You cannot have the game open in more than one browser tab. " +
                    "Please close your old tab and refresh this tab to pick up where you left off."
            );
        }
    }

    // MARK: Model and Event Handling

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
     * Removes all existing component event handlers or scene event handlers.
     * Component event handlers should be removed when a new root component is added and the old root component is
     * removed.
     * Scene event handlers should be removed when a new Phaser scene is selected.
     * @param {String} handlerType "component" or "scene" ("system" handlers must never be cleared).
     */
    #clearEventHandlers(handlerType) {
        console.debug(`Clearing ${handlerType} event handlers`);
        this.#eventHandlers[`${handlerType}Handlers`] = {};
    }

    // MARK: React Component Management

    /**
     * Whenever the user opens a new menu, unload the current root component, and render the new root component that is
     * stored in the "ui" model.
     */
    #updateRootComponent() {
        // Dynamically import the new root component.
        const componentModulePath = this.getModel("ui").componentModulePath;
        console.debug(`Updating root React component to "${componentModulePath}"`);
        import(componentModulePath)
            .then(componentModule => {
                // Remove the component event handlers that were added by the current root component and its children.
                // If importing the new root component throws an error, this WILL break the existing root component!
                this.#clearEventHandlers("component");
                this.#reactRoot.render(React.createElement(componentModule.default, null, null));
                console.debug(`Rendered new root React component "${componentModulePath}"`);
            })
            .catch(reason => {
                console.error(`Failed to update root React component to "${componentModulePath}"!`, reason);
            });
    }

    // MARK: Game Initialization

    /**
     * The client has now received its session data; load the game.
     */
    #initGame() {
        // 1. Load the stored root component. If one is not stored, default to the main menu.
        if (this.getModel("ui").componentModulePath) {
            this.#updateRootComponent();
        } else {
            console.debug("There is no menu currently open! Opening the main menu");
            this.command("OpenMenu", "/src/components/mainMenu/root.mjs");
        }
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
    #ws = null;
    #serverVerified = false;
    #models = {};
    #eventHandlers = {
        systemHandlers: {},
        componentHandlers: {},
        sceneHandlers: {},
    };
    #reactRoot = null;
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
