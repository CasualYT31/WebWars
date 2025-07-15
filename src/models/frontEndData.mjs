/**
 * @file frontEndData.mjs
 * Defines the model responsible for storing front-end exclusive data.
 */

import { readFileSync, writeFileSync } from "node:fs";

import { isValidSessionKey } from "#shared/protocol.mjs";
import Model from "#src/mvc/model.mjs";

/**
 * Stores data specific to the front end on a per-client session basis.
 * This will contain data that only one client will care about. This ranges from what menu they have open, to what
 * language they have selected. Everything the server doesn't care about is stored here.
 */
export default class FrontEndData extends Model {
    /**
     * @override
     */
    prependSessionKeyToCommands = ["SessionKeyExists", "OpenMenu", "SetLanguage"];

    /**
     * Computes the complete front-end version of this model.
     * @param {String} sessionKey The session key of the client whose front-end model is to be returned.
     * @returns {Object} The front-end data's front-end model.
     * @override
     */
    frontEndData(sessionKey) {
        return this.#frontEndData[sessionKey] ?? {};
    }

    /**
     * Set up the front end data model.
     * @param {Controller} controller The controller to pass to the super constructor.
     * @param {String} [clientSessionFile="client-sessions.json"] The path to read client session data from. Session
     *        data will also be written to this file. If a blank string is given, client session data will not be
     *        persisted nor will it be loaded from anywhere.
     * @param {Boolean} [persistClientSessionChanges=true] If true, and a file is given, client sessions will be
     *        persisted to the file every time they are updated. If false, or if no file is given, client session
     *        changes will never be persisted.
     */
    constructor(controller, clientSessionFile = "client-sessions.json", persistClientSessionChanges = true) {
        super(controller);
        // Populate the new client event list with the events stored in the registered front-end data fields object.
        this.emitOnNewClient = Object.values(this.#dataKeyProperties).map(dataKey => dataKey.event);
        this.#persistChanges = persistClientSessionChanges;
        // Try to load the persisted session data.
        // If the file can't be opened, assume there is no persisted session data.
        this.#clientSessionFile = clientSessionFile;
        if (!this.#clientSessionFile) {
            this.log("info", "Client session data will not be loaded or persisted");
            return;
        } else if (!this.#persistChanges) {
            this.log("info", "Client session data changes will not be persisted");
        }
        try {
            this.#frontEndData = JSON.parse(readFileSync(this.#clientSessionFile, { encoding: "utf-8" }));
            this.log("info", `Loaded client session file at ${this.#clientSessionFile}:`, this.#frontEndData);
            if (typeof this.#frontEndData !== "object") {
                this.log("warn", `Client session file at ${this.#clientSessionFile} did not store an object`);
                this.#frontEndData = {};
            }
            // Now validate the data within it.
            for (const sessionKey in this.#frontEndData) {
                if (!isValidSessionKey(sessionKey)) {
                    this.log(
                        "warn",
                        `Loaded a session data entry stored under a faulty session key "${sessionKey}", deleting...`,
                        this.#frontEndData[sessionKey]
                    );
                    delete this.#frontEndData[sessionKey];
                    continue;
                }
                for (const dataKey in this.#frontEndData[sessionKey]) {
                    const props = this.#dataKeyProperties[dataKey];
                    const data = this.#frontEndData[sessionKey][dataKey];
                    if (!props) {
                        this.log(
                            "warn",
                            `Loaded data of key "${dataKey}" (which is invalid) and value ${data}, for session ` +
                                `"${sessionKey}". Will delete the faulty data entry`,
                            this.#frontEndData[sessionKey]
                        );
                        delete this.#frontEndData[sessionKey][dataKey];
                        continue;
                    }
                    if (!props.isValid(data)) {
                        this.log(
                            "warn",
                            `Loaded data of key "${dataKey}" and value ${data} (which is invalid), for session ` +
                                `"${sessionKey}". Will delete the faulty data entry`,
                            this.#frontEndData[sessionKey]
                        );
                        delete this.#frontEndData[sessionKey][dataKey];
                        continue;
                    }
                }
            }
        } catch (e) {
            if (e.code === "ENOENT") {
                this.log("info", `There was no client session file at ${this.#clientSessionFile}:`, e);
            } else {
                this.log("error", `Couldn't load client session file from ${this.#clientSessionFile}:`, e);
            }
        }
    }

    /**
     * Finds out if a given session key is associated with persisted session data.
     * @param {String} sessionKey The session key to check.
     * @returns {Boolean} True if the session key has persisted data associated with it, false otherwise.
     */
    whenSessionKeyExists(sessionKey) {
        return sessionKey in this.#frontEndData;
    }

    /**
     * Instructs the front end to open a new menu.
     * @param {String} sessionKey The session key of the client who must open a new menu.
     * @param {String} newComponent The path (relative to `public`) of the JS module script that exports the component
     *                              to load.
     * @param {Boolean} forceOpen If false, and the client's session data already has a menu open, don't open the given
     *                            menu.
     */
    whenOpenMenu(sessionKey, newComponent, forceOpen = true) {
        if (!forceOpen && sessionKey in this.#frontEndData && "componentModulePath" in this.#frontEndData[sessionKey]) {
            return;
        }
        this.#setFrontEndData(sessionKey, "componentModulePath", newComponent);
    }

    /**
     * Instructs the front end to change their language.
     * @param {String} sessionKey The session key of the client whose language is being updated.
     * @param {String} newLanguage The language to set.
     */
    whenSetLanguage(sessionKey, newLanguage) {
        this.#setFrontEndData(sessionKey, "language", newLanguage);
    }

    /**
     * Updates a client's front-end data and emits a matching event.
     * @param {String} sessionKey The session key of the client whose data must be updated.
     * @param {String} dataKey The key of the data that must be updated.
     * @param {any} newData The new data to assign.
     */
    #setFrontEndData(sessionKey, dataKey, newData) {
        const props = this.#dataKeyProperties[dataKey];
        if (!props) {
            // This would indicate a developer error and not an error caused by the client.
            this.log(
                "error",
                `Attempted to update data of key "${dataKey}", which is invalid, to value ${newData}, for session ` +
                    `"${sessionKey}"`
            );
            return;
        }
        if (!props.isValid(newData)) {
            this.log(
                "error",
                `Attempted to update data of key "${dataKey}" to an invalid value ${newData}, for session ` +
                    `"${sessionKey}"`
            );
            return;
        }
        if (!(sessionKey in this.#frontEndData)) {
            this.#frontEndData[sessionKey] = {};
        }
        this.log(
            "debug",
            "Setting data item (dataKey, newData, oldData, event, sessionKey):",
            dataKey,
            newData,
            this.#frontEndData[sessionKey][dataKey],
            props.event,
            sessionKey
        );
        this.#frontEndData[sessionKey][dataKey] = newData;
        const frontEndDataUpdate = {};
        frontEndDataUpdate[dataKey] = newData;
        this.updateFrontEndData(sessionKey, frontEndDataUpdate, [props.event, sessionKey, newData]);
        this.#persistSessionData();
    }

    /**
     * Persists client session data to the previously given file.
     */
    #persistSessionData() {
        if (!this.#persistChanges) {
            this.log("debug", "Will not write client session data to file as the model was configured not to");
            return;
        }
        if (!this.#clientSessionFile) {
            this.log("debug", "Will not write client session data to file as no file was configured");
            return;
        }
        const persistedData = {};
        for (const sessionKey in this.#frontEndData) {
            persistedData[sessionKey] = {};
            for (const dataKey in this.#frontEndData[sessionKey]) {
                if (!this.#dataKeyProperties[dataKey].volatile) {
                    persistedData[sessionKey][dataKey] = this.#frontEndData[sessionKey][dataKey];
                }
            }
        }
        try {
            writeFileSync(this.#clientSessionFile, JSON.stringify(persistedData), { encoding: "utf-8" });
        } catch (e) {
            this.log("error", `Couldn't write client session data to ${this.#clientSessionFile}:`, e);
        }
    }

    /**
     * Front-end specific data, keyed on session key.
     */
    #frontEndData = {};

    /**
     * Path of the file that persists some front-end data.
     */
    #clientSessionFile = "";

    /**
     * Persist changes to client session data if a file was given at construction.
     */
    #persistChanges = true;

    /**
     * The events associated with each data key, along with the type of data they should hold and if they should be
     * persisted or not.
     */
    #dataKeyProperties = {
        componentModulePath: {
            event: "MenuOpened",
            isValid: data => typeof data === "string",
            volatile: true,
        },
        language: {
            event: "LanguageUpdated",
            isValid: data => typeof data === "string",
            volatile: false,
        },
    };
}
