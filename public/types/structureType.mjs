/**
 * @file structureType.mjs
 * Defines the front-end properties required for Structure types.
 */

import ObjectType from "/types/objectType.mjs";

/**
 * @typedef {object} DestroyedProperties
 * @property {import("./objectType.mjs").LanguageKey} longName The long name of the structure when it is destroyed.
 * @property {import("./objectType.mjs").LanguageKey} shortName The short name of the structure when it is destroyed.
 * @property {import("./objectType.mjs").LanguageKey} description The description of the structure when it is destroyed.
 * @property {import("./objectType.mjs").Sprite} icon The icon of the structure when it is destroyed.
 */

/**
 * A structure is a group of tiles, made up of a root tile and zero or more dependent tiles.
 * @interface
 */
export default class StructureType extends ObjectType {
    /**
     * Computes the structure's medium-sized icon.
     * @param {import("./objectType.mjs").Context} context The context the structure is being accessed within.
     * @returns {import("./objectType.mjs").Sprite} Identifies the structure's icon.
     * @abstract
     */
    icon(context) {}

    /**
     * Computes the properties of the structure when it is in a destroyed state.
     * @param {import("./objectType.mjs").Context} context The context the structure is being accessed within.
     * @returns {DestroyedProperties} The computed properties.
     * @abstract
     */
    destroyed(context) {}
}
