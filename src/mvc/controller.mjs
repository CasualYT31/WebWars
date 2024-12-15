/**
 * @file controller.mjs
 * The controller code for the server.
 * Also responsible for spinning up the server.
 */

import { cwd } from "node:process";
import { join } from "node:path";

import express from "express";
import expressWs from "express-ws";

import { newLogger } from "#src/logging/logger.mjs";
import Model from "#src/mvc/model.mjs";
import View from "#src/mvc/view.mjs";

/**
 * Manages the server that allows connected clients to submit commands and receive updates.
 */
export default class Controller {
    /**
     * Hooks up all of the given models, sets up the client session pool (the views), and starts the server.
     * ~~ Options ~~
     * port {Number} (Default: 80) The port to open the server on.
     * files {Array<Object>} (Default: []) The files to serve.
     *     path {String} The relative path to the file on disk to serve.
     *     root {String} Where the path is relative to.
     *     url {String} The URL path to the file.
     * folders {Array<Object>} (Default: []) The folders to serve static files from.
     *     path {String} The folder on disk to serve.
     *     url {String} The URL path to map to the folder.
     * noServer {Boolean} (Default: false) Pass true to stop the server from spinning up.
     * onServerUp {Function} (Default: (port) => {}) Execute custom code when the server has been fully set up.
     * models {Set<Class|Function>} (Default: Set()) A list of Model-based classes (or functions that return Model
     *                              instances) to instantiate and attach to this controller.
     * eventDispatchRate {Number} (Default: 40) Milliseconds that must elapse between event dispatches at a minimum.
     *                            Directly dictates how fast the game should run.
     * maxClientSessions {Number} (Default: 16) The maximum number of clients that can be connected to the server at a
     *                            time.
     * mapPackPath {String} (Default: "") A path to a map pack to load with this server. It must be relative to the CWD.
     * @param {Object} options Configures the controller.
     */
    constructor(options) {
        this.#logger.log("trace", "Setting up with options:", options);
        this.#setupModels(options.models ?? new Set());
        if (typeof options.mapPackPath === "string" && options.mapPackPath.length > 0) {
            options.mapPackPath = join(cwd(), options.mapPackPath);
            this.#loadMapPack(options.mapPackPath);
        }
        if (!options.hasOwnProperty("noServer") || !Boolean(options.noServer)) {
            this.#setupServer(options);
        }
        this.#eventDispatchingInterval = setInterval(this.#dispatchEvents.bind(this), options.eventDispatchRate ?? 40);
    }

    /**
     * Stops the event dispatching loop.
     * Normally, this method should not be required. However, Jest will complain if you leave an interval running after
     * tests have finished, so once you're done with a controller in a test fixture, be sure to shutdown its event
     * dispatching loop using this method.
     */
    stopDispatchingEvents() {
        clearInterval(this.#eventDispatchingInterval);
    }

    /**
     * Sends a command to the controller.
     * @param {String} name The name of the command. Must be in PascalCase.
     * @param {...any} data The data to send to the command.
     * @returns {any} The value returned by the command.
     */
    command(name, ...data) {
        const indexedName = `when${name}`;
        this.#logger.log("trace", "Command:", indexedName, ...data);
        return this.#commandIndex[indexedName](...data);
    }

    /**
     * Find out if a command wants a session key as its first argument.
     * @param {String} name The name of the command to test.
     * @returns {Boolean} True if the command must be given a session key as the first argument, false if not.
     */
    mustGiveSessionKeyWithCommand(name) {
        return this.#commandsToPrependWithSessionKeys.includes(name);
    }

    /**
     * Used by models to emit events to the rest of the system.
     * @param {String} name The name of the event. Must be in PascalCase.
     * @param {...any} data The data to attach to the event.
     */
    event(name, ...data) {
        const indexedName = `on${name}`;
        this.#logger.log("trace", "Queueing event:", indexedName, ...data);
        this.#eventQueue.push([indexedName, data]);
    }

    /**
     * Retrieve a model that was instantiated by this controller.
     * @param {String} name The name of the model (i.e. its class name in string form).
     * @returns {Model} Reference to the model instance owned by this controller.
     */
    getModel(name) {
        return this.#models[name];
    }

    /**
     * Does a view with the given session key already exist?
     * @param {String} key Session key to test.
     */
    doesSessionKeyExist(key) {
        return Object.keys(this.#views).includes(key);
    }

    // MARK: Private

    /**
     * Periodically dispatches all of the events in the queue so far.
     * Any events emitted as a result of those events will be dispatched on the next dispatchEvents() call.
     */
    #dispatchEvents() {
        const eventQueueLength = this.#eventQueue.length;
        if (eventQueueLength > 0) {
            this.#logger.log(
                "trace",
                `Dispatching ${eventQueueLength} event${eventQueueLength == 1 ? "" : "s"}:`,
                ...this.#eventQueue
            );
            // Go through the fixed length of the event queue as we know it now so that if any more events are added
            // during this loop, they won't be dispatched as part of this loop, mitigating against cyclical events
            // causing infinite loops.
            for (let i = 0; i < eventQueueLength; ++i) {
                const ev = this.#eventQueue.at(i);
                if (this.#eventIndex.hasOwnProperty(ev.at(0))) {
                    const handlerCount = this.#eventIndex[ev.at(0)].length;
                    this.#logger.log(
                        "trace",
                        `Dispatching event to ${handlerCount} handler${handlerCount == 1 ? "" : "s"}:`,
                        ev.at(0),
                        ...ev.at(1)
                    );
                    this.#eventIndex[ev.at(0)].forEach(handler => handler(...ev.at(1)));
                }
            }
            // Any new events will always be appended to the end of the queue,
            // so this will only get rid of events we've dispatched.
            this.#eventQueue.splice(0, eventQueueLength);
        }
        // Finally, loop through each client and publish any data changes they've encountered.
        for (const sessionKey in this.#views) {
            this.#views[sessionKey].publishData();
        }
    }

    /**
     * Sets up the backend models.
     * @param {Set<Function>} modelTypes The types of models to instantiate.
     */
    #setupModels(modelTypes) {
        this.#logger.log("trace", "Setting up the models");
        for (const modelType of modelTypes) {
            this.#addModel(modelType);
        }
    }

    /**
     * Creates a new model and attaches its event handlers and commands.
     * @param {Function} modelType The type of model to instantiate.
     */
    #addModel(modelType) {
        // If modelType isn't a class type (or function), name will just resolve to `undefined`,
        // so no need to include this in the error handler.
        this.#logger.log("debug", "Adding model:", modelType.name);
        let model;
        try {
            model = new modelType(this);
            if (!model instanceof Model) {
                throw new Error("The given model type did not inherit from the Model base class!");
            }
        } catch (e) {
            this.#logger.log("error", "Failed to add model:", modelType.name, e);
            return;
        }
        this.#models[modelType.name] = model;
        this.#indexMethods(model, true, true);
        this.#commandsToPrependWithSessionKeys.push(...model.prependSessionKeyToCommands);
    }

    /**
     * Scan an object's methods and index their event and command handlers.
     * @param {Object} object The object to scan.
     * @param {Boolean} events True to scan for event handlers.
     * @param {Boolean} commands True to scan for commands.
     */
    #indexMethods(object, events, commands) {
        const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(object));
        for (const methodName of methodNames) {
            if (events && methodName.startsWith("on")) {
                if (this.#eventIndex.hasOwnProperty(methodName)) {
                    this.#logger.log("trace", "Indexing event handler:", methodName);
                    this.#eventIndex[methodName].push(object[methodName].bind(object));
                } else {
                    this.#logger.log("trace", "Adding event to index:", methodName);
                    this.#eventIndex[methodName] = [object[methodName].bind(object)];
                }
            } else if (commands && methodName.startsWith("when")) {
                if (this.#commandIndex.hasOwnProperty(methodName)) {
                    this.#logger.log("error", `Tried to add a second command handler for ${methodName}!`);
                } else {
                    this.#logger.log("trace", "Adding command to index:", methodName);
                    this.#commandIndex[methodName] = object[methodName].bind(object);
                }
            }
        }
    }

    /**
     * Asynchronously loads the given map pack.
     * If the given map pack was valid, this method will emit a MapPackLoaded event after fully loading the pack. It
     * will be emitted with the full path of the map pack attached as well as its exports.mjs module.
     * @param {String} mapPackPath Path to the map pack to load.
     */
    #loadMapPack(mapPackPath) {
        this.#logger.log("info", "Loading map pack:", mapPackPath);
        // Try to load the given map pack's exports module.
        // TODO: Is file:// only required on Windows?
        import(`file://${join(mapPackPath, "exports.mjs")}`)
            .then(mapPackModule => {
                // Does this map pack define dynamic models? If so, import them.
                if (Array.isArray(mapPackModule.models)) {
                    this.#logger.log(
                        "debug",
                        "Found this many models in the map pack, adding them now:",
                        mapPackModule.models.length
                    );
                    mapPackModule.models.forEach(modelType => this.#addModel(modelType));
                }
                // Does this map pack define an entry point? If so, invoke it.
                if (typeof mapPackModule.default === "function") {
                    this.#logger.log("debug", "Found map pack's entry point, calling now");
                    try {
                        mapPackModule.default(this);
                    } catch (e) {
                        this.#logger.log("error", "An error occurred whilst invoking the map pack's entry point:", e);
                    }
                }
                this.event("MapPackLoaded", mapPackPath, mapPackModule);
            })
            .catch(e => this.#logger.log("error", "Failed to load map pack:", mapPackPath, e));
    }

    /**
     * Sets up the server.
     * @param {Object} options The options passed to the constructor.
     */
    #setupServer(options) {
        this.#logger.log("trace", "Setting up the server");

        // Set up the map pack public folder static folder.
        if (typeof options.mapPackPath === "string" && options.mapPackPath.length > 0) {
            const mapPackPublicFolder = {
                path: join(options.mapPackPath, "public"),
                url: "/pack",
            };
            this.#logger.log("debug", "Setting up map pack's static folder:", mapPackPublicFolder);
            if (Array.isArray(options.folders)) {
                options.folders.unshift(mapPackPublicFolder);
            } else {
                options.folders = [mapPackPublicFolder];
            }
        }

        // Set up the static folders.
        if (Array.isArray(options.folders)) {
            options.folders.forEach(folderConfig => {
                this.#logger.log("debug", "Setting up static folder with options:", folderConfig);
                this.#server.app.use(
                    folderConfig.url,
                    express.static(folderConfig.path, {
                        setHeaders: (res, path) => {
                            this.#logger.log(
                                "trace",
                                "Client made request for file within static folder:",
                                path,
                                folderConfig
                            );
                        },
                    })
                );
            });
        }

        // Set up the static files.
        if (Array.isArray(options.files)) {
            options.files.forEach(fileConfig => {
                this.#logger.log("debug", "Setting up static file with options:", fileConfig);
                this.#server.app.get(fileConfig.url, (req, res) => {
                    this.#logger.log("trace", "Client made request for file:", fileConfig);
                    res.sendFile(fileConfig.path, { root: fileConfig.root });
                });
            });
        }

        // Set up the view management code.
        // The first handler accepts clients who don't have any session key,
        // and the second handler accepts clients with a session key.
        this.#server.app.ws("/", (ws, req) => this.#setupView(ws, "", options.maxClientSessions ?? 16));
        this.#server.app.ws("/:sessionKey", (ws, req) =>
            this.#setupView(ws, req.params.sessionKey, options.maxClientSessions ?? 16)
        );

        // Log once the server is up and running.
        const port = options.port ?? 80;
        this.#server.app.listen(port, () => {
            this.#logger.log("debug", "The server has been opened on port:", port);
            if (typeof options.onServerUp === "function") {
                options.onServerUp(port);
            }
        });
    }

    /**
     * Either creates a new view for a new web socket connection, or attaches a new web socket connection to an existing
     * view.
     * @param {WebSocket} ws The new web socket connection to try to associate with this view.
     * @param {String} sessionKey The client's incoming session key.
     * @param {Number} maxClientCount The maximum number of views that can be present.
     */
    #setupView(ws, sessionKey, maxClientCount) {
        this.#logger.log("info", "New client connected. It has given the session key:", sessionKey);
        if (sessionKey in this.#views) {
            this.#logger.log("debug", "Verified new client connection's session key");
            if (this.#views[sessionKey].attemptToReplaceWebSocket(ws)) {
                this.#logger.log(
                    "debug",
                    "Successfully assigned new web socket connection to the existing client session"
                );
            } else {
                this.#logger.log(
                    "warn",
                    "Couldn't assign the new web socket connection to the existing client session because its " +
                        "existing web socket connection hasn't closed! Will close new web socket connection"
                );
                ws.close();
                return;
            }
        } else {
            this.#logger.log("debug", "Could not verify new client connection's session key");
            const existingSessionKeys = Object.keys(this.#views);
            if (existingSessionKeys.length >= maxClientCount) {
                this.#logger.log(
                    "warn",
                    "Can't create a new client session since the maximum number has been reached. Will close new " +
                        "web socket connection. There are currently this many client sessions:",
                    existingSessionKeys.length
                );
                ws.close();
                return;
            }
            this.#logger.log("info", "Creating new client session. Existing session keys:", existingSessionKeys);
            const newView = new View(this, ws, sessionKey);
            sessionKey = newView.sessionKey;
            this.#views[sessionKey] = newView;
            this.#indexMethods(newView, true, false);
            this.event("NewClient", sessionKey);
        }
    }

    #logger = newLogger("Controller");
    #server = expressWs(express());

    #views = {};
    #models = {};
    #commandIndex = {};
    #commandsToPrependWithSessionKeys = [];
    #eventIndex = {};
    #eventQueue = [];
    #eventDispatchingInterval = 0;
}
