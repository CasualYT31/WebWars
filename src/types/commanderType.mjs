/**
 * @file commanderType.mjs
 * Defines the properties required for Commander types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * A commander represents a playable character that controls an army (in Advance Wars these are called COs).
 * @interface
 */
export default class CommanderType extends ObjectType {
    /**
     * Computes the small icons of a commander.
     * These icons typically just show the commander's eyes.
     * @param {import("#src/types/objectType.mjs").Context} context The context the commander is being accessed within.
     * @returns {Object<import("#src/types/objectType.mjs").Sprite>} List of sprites keyed on emotion (e.g. "neutral",
     *          "happy", "angry", etc.).
     * @abstract
     */
    eyes(context) {}

    /**
     * Computes the medium icons of a commander.
     * These icons typically just show the commander's profile.
     * @param {import("#src/types/objectType.mjs").Context} context The context the commander is being accessed within.
     * @returns {Object<import("#src/types/objectType.mjs").Sprite>} List of sprites keyed on emotion (e.g. "neutral",
     *          "happy", "angry", etc.).
     * @abstract
     */
    faces(context) {}

    /**
     * Computes the large icons of a commander.
     * These icons typically show the commander's entire body.
     * @param {import("#src/types/objectType.mjs").Context} context The context the commander is being accessed within.
     * @returns {Object<import("#src/types/objectType.mjs").Sprite>} List of sprites keyed on emotion (e.g. "neutral",
     *          "happy", "angry", etc.).
     * @abstract
     */
    portraits(context) {}

    /**
     * Computes the commander's background theme.
     * @param {import("#src/types/objectType.mjs").Context} context The context the commander is being accessed within.
     * @returns {import("#src/types/objectType.mjs").Audio} Identifies the commander's theme.
     * @abstract
     */
    theme(context) {}
}
