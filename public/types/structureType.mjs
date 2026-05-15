/**
 * @file structureType.mjs
 * Defines the front-end properties required for Structure types.
 */

import ObjectType from "/types/objectType.mjs";

/**
 * @typedef {Object} DestroyedProperties
 * @property {LanguageKey} longName The long name of the structure when it is destroyed.
 * @property {LanguageKey} shortName The short name of the structure when it is destroyed.
 * @property {LanguageKey} description The description of the structure when it is destroyed.
 * @property {Sprite} icon The icon of the structure when it is destroyed.
 */

/**
 * A structure is a group of tiles, made up of a root tile and zero or more dependent tiles.
 * @interface
 */
export default class StructureType extends ObjectType {
    /**
     * Computes the structure's medium-sized icon.
     * @param {Context} context The context the structure is being accessed within.
     * @returns {Sprite} Identifies the structure's icon.
     * @abstract
     */
    icon(context) {}

    /**
     * Computes the properties of the structure when it is in a destroyed state.
     * @param {Context} context The context the structure is being accessed within.
     * @returns {DestroyedProperties} The computed properties.
     * @abstract
     */
    destroyed(context) {}
}
