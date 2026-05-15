/**
 * @file commanderType.mjs
 * Defines the front-end properties required for Commander types.
 */

import ObjectType from "/types/objectType.mjs";

/**
 * A commander represents a playable character that controls an army (in Advance Wars these are called COs).
 * @interface
 */
export default class CommanderType extends ObjectType {
    /**
     * Computes the small icons of a commander.
     * These icons typically just show the commander's eyes.
     * @param {Context} context The context the commander is being accessed within.
     * @returns {Object<Sprite>} List of sprites keyed on emotion (e.g. "neutral", "happy", "angry", etc.).
     * @abstract
     */
    eyes(context) {}

    /**
     * Computes the medium icons of a commander.
     * These icons typically just show the commander's profile.
     * @param {Context} context The context the commander is being accessed within.
     * @returns {Object<Sprite>} List of sprites keyed on emotion (e.g. "neutral", "happy", "angry", etc.).
     * @abstract
     */
    faces(context) {}

    /**
     * Computes the large icons of a commander.
     * These icons typically show the commander's entire body.
     * @param {Context} context The context the commander is being accessed within.
     * @returns {Object<Sprite>} List of sprites keyed on emotion (e.g. "neutral", "happy", "angry", etc.).
     * @abstract
     */
    portraits(context) {}

    /**
     * Computes the commander's background theme.
     * @param {Context} context The context the commander is being accessed within.
     * @returns {Audio} Identifies the commander's theme.
     * @abstract
     */
    theme(context) {}
}
