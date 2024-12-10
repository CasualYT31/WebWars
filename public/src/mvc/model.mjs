/**
 * @file model.mjs
 * Defines the client-side model class.
 */

/**
 * Models on the client-side are essentially plain objects that are updated by the server.
 * Views are permitted to read data from models via the controller.
 */
export default class Model {
    /// You can access the data directly, but it will always be frozen, so you cannot change it directly.
    #data = null;
    get data() {
        return this.#data;
    }

    /**
     * Initializes a model with data.
     * @param {Object} data The data to initialize the model with.
     */
    constructor(data) {
        this.update(data);
    }

    /**
     * Updates the data in a model.
     * @param {Object} newData The data to spread onto the existing data.
     */
    update(newData) {
        this.#data = Object.freeze({ ...this.#data, ...newData });
    }
}
