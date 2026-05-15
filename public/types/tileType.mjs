/**
 * @file tileType.mjs
 * Defines the front-end properties required for Tile types.
 */

import ObjectType from "/types/objectType.mjs";

/**
 * Defines a visual representation of a terrain on the map.
 * @interface
 */
export default class TileType extends ObjectType {
    /**
     * The sprite to use for this tile on the map.
     * @param {Context} context The context the tile type is being accessed within.
     * @returns {Sprite} Identifies the tile's sprite. The actual representation of this sprite can be further changed
     *          depending on the environment in play.
     * @abstract
     */
    tile(context) {}

    /**
     * The medium-sized sprite to show when this tile is being captured (and capture animations are turned on).
     * @param {Context} context The context the tile type is being accessed within.
     * @returns {Sprite} Identifies the tile's capturing sprite.
     * @abstract
     */
    capturingSprite(context) {}
}
