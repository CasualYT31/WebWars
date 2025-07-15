/**
 * @file utils.mjs
 * Defines common utility functions shared by both the front end and back end.
 */

/**
 * Recursively freezes a given object.
 * @param {Object} object The object to recursively freeze.
 * @returns {Object} The given object, frozen, with every child object also frozen.
 */
export function deepFreeze(object) {
    if (typeof object === "object" && object) {
        for (const key in object) {
            object[key] = deepFreeze(object[key]);
        }
    }
    return Object.freeze(object);
}

/**
 * Gets the names of all properties within a given object's prototype, including inherited ones.
 * Adapted from code written by airportyh and debaaryan: https://stackoverflow.com/a/8024294.
 * @param {Object} obj An object whose prototype/s are to be scanned.
 * @param {Object} options Additional options for this operation.
 * @param {Boolean} [options.includeRootObject=false] If true, the root Object prototype will be included. By default,
 *        it will be excluded.
 * @returns {Array<String>} The names of all of the properties found within the prototype chain of the given object.
 */
export function getAllPropertyNames(obj, options = {}) {
    if (!options.hasOwnProperty("includeRootObject")) {
        options.includeRootObject = false;
    }
    const props = new Set();
    while ((obj = Object.getPrototypeOf(obj))) {
        if (!options.includeRootObject && obj.constructor === Object) {
            break;
        }
        for (const propertyName of Object.getOwnPropertyNames(obj)) {
            props.add(propertyName);
        }
    }
    return Array.from(props);
}
