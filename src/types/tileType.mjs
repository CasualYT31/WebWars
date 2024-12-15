/**
 * @file tileType.mjs
 * Documents the properties required for Tile types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * Defines a visual representation of a terrain.
 */
export default class TileType extends ObjectType {
    /// {Sprite} The sprite to use for this tile type on a map.
    tile(context) {}
    /// {String} The terrain type that this tile type represents.
    terrain(context) {}
    /// {Sprite} The sprite to show when this tile is being captured (and capture animations are turned on).
    capturingSprite(context) {}
}
