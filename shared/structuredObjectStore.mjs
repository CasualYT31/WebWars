/**
 * @file structuredObjectStore.mjs
 * Defines a class that stores a collection of named structured objects.
 */

import StructuredObject from "./structuredObject.mjs";
import { deepFreeze } from "./utils.mjs";

/**
 * @typedef {Object} StructuredObjectReplacement
 * @property {String} [type=StructuredObjectStore.UpdateType.Replace] The type of StructuredObjectUpdate.
 * @property {String} name The name of the StructuredObject to add/replace.
 * @property {Array<String>} events A list of events that caused the replacement.
 * @property {Object} structure The structure of the object.
 * @property {Object} data The data of the object.
 */

/**
 * @typedef {Object} StructuredObjectUpdate
 * @property {String} [type=StructuredObjectStore.UpdateType.Update] The type of StructuredObjectUpdate.
 * @property {String} name The name of the StructuredObject to update.
 * @property {Array<String>} events A list of events that caused the update.
 * @property {Object} updates The updates to apply.
 */

/**
 * A collection of named StructuredObjects.
 */
export default class StructuredObjectStore {
    /**
     * A StructuredObjectStore will treat updates differently depending on their type.
     */
    static UpdateType = Object.freeze({
        /**
         * The data object and its structure will be completely replaced.
         */
        Replace: "replace",
        /**
         * The data object will either be wholly or partially updated, retaining its structure.
         */
        Update: "update",
    });

    /**
     * Constructs a new collection of named StructuredObjects.
     * @param {Function<String, ...any>} onLog Callback invoked when this class wants to log something. The level is
     *        given, then the objects to log. By default requests to log are ignored.
     * @param {Function<...String>} onEvents Callback invoked after an update object is processed, where the events
     *        array of that update object is spread into the callback's arguments. By default events are ignored.
     * @param {Object | undefined} [clone=undefined] If given, the store will be initialized with the given structured
     *        objects. This argument must receive the result of a call to clone(). Any events given to structured
     *        objects upon construction (i.e. via a replacement) must be emitted via a separate call to
     *        emitEventsAfterConstruction().
     */
    constructor(onLog = () => {}, onEvents = () => {}, clone = undefined) {
        this.#onLog = onLog;
        this.#onEvents = onEvents;
        if (typeof clone === "object" && clone) {
            for (const [objectName, objectArgs] of Object.entries(clone)) {
                this.#store[objectName] = new StructuredObject(...objectArgs);
            }
        }
    }

    /**
     * Retrieves a StructuredObject's data.
     * @param {String} name The name of the StructuredObject to retrieve the read-only data of.
     * @returns {Object} The underlying StructuredObject's data attribute.
     */
    getObject(name) {
        return this.#store[name].data;
    }

    /**
     * Generates a clone of this store that can be used to construct a new StructuredObjectStore.
     * @returns {Object} A clone of each structured object in the store. Each structured object will have an entry in
     *          the clone under their name, and each entry will be an array of arguments that are to be given to the
     *          StructuredObject constructor. The clone will be deep frozen.
     */
    clone() {
        const cloned = {};
        for (const [objectName, object] of Object.entries(this.#store)) {
            cloned[objectName] = [structuredClone(object.structure), structuredClone(object.data)].concat(
                object.eventsGivenAtConstruction
            );
        }
        return deepFreeze(cloned);
    }

    /**
     * Either adds, replaces, or updates a series of named StructuredObjects.
     * @param {...StructuredObjectReplacement | StructuredObjectUpdate} updateObjects A list of replacement or update
     *        objects, dictating what the method should update, and how.
     */
    update(...updateObjects) {
        for (const updateObject of updateObjects) {
            const name = updateObject.name;
            switch (updateObject.type) {
                case StructuredObjectStore.UpdateType.Replace:
                    if (name in this.#store) {
                        this.#onLog("debug", `Replacing structured object ${name}:`, updateObject);
                    } else {
                        this.#onLog("debug", `Adding new structured object ${name}:`, updateObject);
                    }
                    this.#store[name] = new StructuredObject(
                        updateObject.structure,
                        updateObject.data,
                        ...updateObject.events
                    );
                    break;
                case StructuredObjectStore.UpdateType.Update:
                    if (name in this.#store) {
                        this.#onLog("debug", `Updating structured object ${name}:`, updateObject);
                        this.#store[name].update(updateObject.updates);
                    } else {
                        this.#onLog(
                            "warn",
                            `Ignoring update for non-existent structured object ${name}:`,
                            updateObject,
                            { existingFrontEndModels: Object.keys(this.#store) }
                        );
                        continue;
                    }
                    break;
            }
            this.#onLog("debug", `Emitting events from structured object update:`, ...updateObject.events);
            this.#emitEvents(...updateObject.events);
        }
    }

    /**
     * Iterates through each structured object and emits the events they received at construction/replacement.
     */
    emitEventsAfterConstruction() {
        for (const structuredObjectName in this.#store) {
            const structuredObject = this.#store[structuredObjectName];
            const events = structuredObject.eventsGivenAtConstruction;
            if (events.length == 0) {
                this.#onLog(
                    "debug",
                    `No construction events to emit for structured object ${structuredObjectName}`,
                    structuredObject
                );
                continue;
            }
            this.#onLog(
                "debug",
                `Emitting construction events for structured object ${structuredObjectName}`,
                events,
                structuredObject
            );
            this.#emitEvents(...events);
        }
    }

    #emitEvents(...events) {
        try {
            this.#onEvents(...events);
        } catch (e) {
            this.#onLog("error", "An error occurred whilst emitting events", e, events);
        }
    }

    #store = {};
    #onLog = (level, ...args) => {};
    #onEvents = events => {};
}
