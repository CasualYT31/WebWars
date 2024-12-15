/**
 * @file environmentType.mjs
 * Documents the properties required for Environment types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * Essentially dictates what sprite sheets to use with a map in a singular location in a map pack's code base.
 * TODO: I'm not sure yet how this will work with Phaser. For now, I'm identifying sprite sheets using a string.
 */
export default class EnvironmentType extends ObjectType {
    /// {Sprite} An environment's small icon.
    icon(context) {}
    /// {String} The sprite sheet to use with map tiles.
    tileSpriteSheet(context) {}
    /// {String} The sprite sheet to use with terrain pictures.
    pictureSpriteSheet(context) {}
    /// {String} The sprite sheet to use with structure icons.
    structureIconSpriteSheet(context) {}
}
