/**
 * @file tileType.mjs
 * Defines the back-end properties required for Tile types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * Defines one of potentially many representations of a terrain on the map.
 * @interface
 */
export default class TileType extends ObjectType {
    /**
     * The name of the type of terrain this tile has.
     * @param {import("#src/types/objectType.mjs").Context} context The context the tile type is being accessed within.
     * @returns {String} Identifies the tile's terrain.
     * @abstract
     */
    terrain(context) {}
}
