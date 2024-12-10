/**
 * @file frontEndData.mjs
 * Defines the model responsible for storing front-end exclusive data.
 */

import Model from "#src/mvc/model.mjs";

/**
 * Stores data specific to the front-end on a per-client session basis.
 * This will contain data that only one client will care about. This ranges from what menu they have open, to what
 * language they have selected. Everything the server doesn't care about is stored here.
 */
export default class FrontEndData extends Model {
    prependSessionKeyToCommands = ["OpenMenu", "SetLanguage"];

    /**
     * Instructs the front-end to open a new menu.
     * @param {String} sessionKey The session key of the client who must open a new menu.
     * @param {String} newComponent The path (relative to `public`) of the JS module script that exports the component
     *                              to load.
     */
    whenOpenMenu(sessionKey, newComponent) {
        this.#setFrontEndData(sessionKey, "componentModulePath", newComponent, "MenuOpened");
    }

    /**
     * Instructs the front-end to change their language.
     * @param {String} sessionKey The session key of the client whose language is being updated.
     * @param {String} newLanguage The language to set.
     */
    whenSetLanguage(sessionKey, newLanguage) {
        this.#setFrontEndData(sessionKey, "language", newLanguage, "LanguageUpdated");
    }

    /**
     * Updates a client's front-end data and emits a matching event.
     * @param {String} sessionKey The session key of the client whose data must be updated.
     * @param {String} dataKey The key of the data that must be updated.
     * @param {any} newData The new data to assign.
     * @param {String} event The event to emit after making the update.
     */
    #setFrontEndData(sessionKey, dataKey, newData, event) {
        if (!(sessionKey in this.#frontEndData)) {
            this.#frontEndData[sessionKey] = {};
        }
        this.#frontEndData[sessionKey][dataKey] = newData;
        this.event(event, sessionKey, newData);
    }

    /**
     * Front-end specific data, keyed on session key.
     */
    #frontEndData = {};
}
