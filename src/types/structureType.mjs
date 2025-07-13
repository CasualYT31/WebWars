/**
 * @file structureType.mjs
 * Defines the properties required for Structure types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * @typedef {Object} RootTile
 * @property {String} tile The type of the root tile.
 * @property {String} destroyed The type of the root tile when the structure is destroyed.
 * @property {String} deleted The type to set the root tile to when the structure is deleted in the map maker.
 */

/**
 * @typedef {Object} DependentTile
 * @extends RootTile
 * @property {import("#src/types/objectType.mjs").Coordinate} offset The coordinate of the dependent tile relative to
 *           the root tile. E.g. { x: 1, y: 0 } means this dependent tile is one tile to the right of the root tile. At
 *           least one of the coordinates must be non-zero, and the X and Y coordinate pair must be unique across every
 *           dependent tile in the structure.
 */

/**
 * @typedef {Object} DestroyedProperties
 * @property {import("#src/types/objectType.mjs").LanguageKey} longName The long name of the structure when it is
 *           destroyed.
 * @property {import("#src/types/objectType.mjs").LanguageKey} shortName The short name of the structure when it is
 *           destroyed.
 * @property {import("#src/types/objectType.mjs").LanguageKey} description The description of the structure when it is
 *           destroyed.
 * @property {import("#src/types/objectType.mjs").Sprite} icon The icon of the structure when it is destroyed.
 */

/**
 * A structure is a group of tiles, made up of a root tile and zero or more dependent tiles.
 * @interface
 */
export default class StructureType extends ObjectType {
    /**
     * Computes the structure's medium-sized icon.
     * @param {import("#src/types/objectType.mjs").Context} context The context the structure is being accessed within.
     * @returns {import("#src/types/objectType.mjs").Sprite} Identifies the structure's icon.
     * @abstract
     */
    icon(context) {}

    /**
     * Computes the properties of the structure's root tile.
     * @param {import("#src/types/objectType.mjs").Context} context The context the structure is being accessed within.
     * @returns {RootTile} The configuration of the structure's root tile.
     * @abstract
     */
    root(context) {}

    /**
     * Computes the properties of the structure's dependent tiles.
     * @param {import("#src/types/objectType.mjs").Context} context The context the structure is being accessed within.
     * @returns {Array<DependentTile>} The structure's dependent tiles, if any.
     * @abstract
     */
    dependents(context) {}

    /**
     * Determines whether or not units in the map maker that occupy one of a newly painted structure's tile should be
     * deleted.
     * @param {import("#src/types/objectType.mjs").Context} context The context the structure is being accessed within.
     * @returns {Boolean} If false, units that occupy the structure's tiles will be deleted. If true, they will not be
     *          deleted.
     * @abstract
     */
    keepUnitsWhenPainted(context) {}

    /**
     * Computes the properties of the structure when it is in a destroyed state.
     * @param {import("#src/types/objectType.mjs").Context} context The context the structure is being accessed within.
     * @returns {DestroyedProperties} The computed properties.
     * @abstract
     */
    destroyed(context) {}
}
