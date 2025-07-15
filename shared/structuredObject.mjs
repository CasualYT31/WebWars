/**
 * @file structuredObject.mjs
 * Defines a class which stores an object—with a custom structure—whose fields cannot be updated individually.
 */

import { deepFreeze } from "./utils.mjs";

/**
 * A structured object with free read access and guarded write access.
 */
export default class StructuredObject {
    /**
     * Constructs a new structured object.
     * @param {Object} structure Defines the structure of the object.
     * @param {Object} data The data to initialize the object with.
     * @param {...String} events An arbitrary list of events that caused the creation of this structured object.
     *        Optional.
     */
    constructor(structure, data, ...events) {
        this.#structure = deepFreeze(structuredClone(structure));
        this.#data = deepFreeze(structuredClone(data));
        this.#events = deepFreeze(events);
    }

    /**
     * Grants read-only access to the underlying object structure.
     * @returns {Object} Read-only reference to this object's structure.
     */
    get structure() {
        return this.#structure;
    }

    /**
     * Grants read-only access to the underlying data object.
     * @returns {Object} Read-only reference to this object's data.
     */
    get data() {
        return this.#data;
    }

    /**
     * Retrieves the initial event list given to this object at construction.
     * Can be used to recall what events caused the construction of this structured object.
     * @returns {Array<String>} Read-only reference to this object's events list.
     */
    get eventsGivenAtConstruction() {
        return this.#events;
    }

    /**
     * Updates this structured object.
     * The given data will be spread over the object's existing data. The exceptions to this are defined by the object's
     * structure, where inner objects are permitted to have their own spreading operation. Consider the following
     * examples:
     *
     * Example 1.
     * Data: {
     *     "bye": "keep",
     *     "hi": 7,
     *     "object": {
     *         "a": 6,
     *         "b": 7,
     *     },
     * }
     * Structure: {}
     * An update of: {
     *     "hi": -4,
     *     "object": {
     *         "a": 9,
     *     },
     * }
     * Will result in the following data: {
     *     "bye": "keep",
     *     "hi": -4,
     *     "object": {
     *         "a": 9,
     *     },
     * }
     * Because the update is spread over the root object, so the original "object" will be completely replaced.
     *
     * Example 2.
     * Data: {
     *     "bye": "keep",
     *     "hi": 7,
     *     "object": {
     *         "a": 6,
     *         "b": 7,
     *     },
     * }
     * Structure: {
     *     "object": {},
     * }
     * An update of: {
     *     "hi": -4,
     *     "object": {
     *         "a": 9,
     *     },
     * }
     * Will result in the following data: {
     *     "bye": "keep",
     *     "hi": -4,
     *     "object": {
     *         "a": 9,
     *         "b": 7,
     *     },
     * }
     * Because the inner "object" is spread separately, whilst the rest of the properties in the root data object still
     * have the same spreading behavior as can be seen in the first example.
     * @param {Object} updates A partial update to apply to this object's data, or completely new data to apply to the
     *        object that maintains the previously configured structure.
     */
    update(updates) {
        // Deep copying the existing structure lets us freely edit it in the auxiliary method.
        // Deep copy the updates as we'll be removing keys as we progress through the structure.
        const newData = this.#update(structuredClone(this.data), structuredClone(updates), this.structure);
        // Apply the new data object.
        this.#data = deepFreeze(newData);
    }

    // MARK: Private

    /**
     * Applies updates to a given data object recursively according to its defined structure.
     * @param {Object} data The data object to update.
     * @param {Object} updates The updates to apply to the data object.
     * @param {Object} structure Are there any inner objects which must be updated individually? If so, define them in
     *        this structure object.
     * @returns {Object} The updated data object.
     */
    #update(data, updates, structure) {
        // First, iterate through the known structure of the data and individually spread those inner objects, if they
        // exist in the given updates. We perform this depth first.
        for (const innerObjectName in structure) {
            if (innerObjectName in updates) {
                data[innerObjectName] = this.#update(
                    data[innerObjectName],
                    updates[innerObjectName],
                    structure[innerObjectName]
                );
                // We've finished spreading the inner object, delete it from the updates object so that when it is
                // spread over the data later, the inner object within updates doesn't completely replace the inner
                // object within data.
                delete updates[innerObjectName];
            }
        }
        // We've either finishing spreading the inner object, or there were no inner objects to spread. Spread the
        // remainder of the updates object onto data.
        return { ...data, ...updates };
    }

    #structure = Object.freeze({});
    #data = Object.freeze({});
    #events = Object.freeze([]);
}
