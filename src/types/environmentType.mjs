/**
 * @file environmentType.mjs
 * Defines the properties required for Environment types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * Dictates what sprite sheets to use with a map in a singular location in a map pack's code base.
 * @interface
 */
export default class EnvironmentType extends ObjectType {
    /**
     * Computes the environment's icon.
     * @param {import("#src/types/objectType.mjs").Context} context The context the environment is being accessed
     *        within.
     * @returns {import("#src/types/objectType.mjs").Sprite} Identifies the environment's icon.
     * @abstract
     */
    icon(context) {}

    /**
     * Figures out what sprite sheet to use for the tiles on a map.
     * @param {import("#src/types/objectType.mjs").Context} context The context the environment is being accessed
     *        within.
     * @returns {import("#src/types/objectType.mjs").SpriteSheet} Identifies the environment's tile sprite sheet.
     * @abstract
     */
    tileSpriteSheet(context) {}

    /**
     * Figures out what sprite sheet to use for terrain pictures.
     * @param {import("#src/types/objectType.mjs").Context} context The context the environment is being accessed
     *        within.
     * @returns {import("#src/types/objectType.mjs").SpriteSheet} Identifies the environment's picture sprite sheet.
     * @abstract
     */
    pictureSpriteSheet(context) {}

    /**
     * Figures out what sprite sheet to use for structure icons.
     * @param {import("#src/types/objectType.mjs").Context} context The context the environment is being accessed
     *        within.
     * @returns {import("#src/types/objectType.mjs").SpriteSheet} Identifies the environment's structure icon sprite
     *          sheet.
     * @abstract
     */
    structureIconSpriteSheet(context) {}
}
