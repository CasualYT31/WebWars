/**
 * @file tileType.mjs
 * Defines the properties required for Tile types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * Defines a visual representation of a terrain on the map.
 * @interface
 */
export default class TileType extends ObjectType {
    /**
     * The sprite to use for this tile on the map.
     * @param {import("#src/types/objectType.mjs").Context} context The context the tile type is being accessed within.
     * @returns {import("#src/types/objectType.mjs").Sprite} Identifies the tile's sprite. The actual representation of
     *          this sprite can be further changed depending on the environment in play.
     * @abstract
     */
    tile(context) {}

    /**
     * The name of the type of terrain this tile has.
     * @param {import("#src/types/objectType.mjs").Context} context The context the tile type is being accessed within.
     * @returns {String} Identifies the tile's terrain.
     * @abstract
     */
    terrain(context) {}

    /**
     * The medium-sized sprite to show when this tile is being captured (and capture animations are turned on).
     * @param {import("#src/types/objectType.mjs").Context} context The context the tile type is being accessed within.
     * @returns {import("#src/types/objectType.mjs").Sprite} Identifies the tile's capturing sprite.
     * @abstract
     */
    capturingSprite(context) {}
}
