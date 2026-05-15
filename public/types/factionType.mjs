/**
 * @file factionType.mjs
 * Defines the front-end properties required for Faction types.
 */

import ObjectType from "/types/objectType.mjs";

/**
 * The [largely] graphical representation of an army on the map (in Advance Wars these are called countries).
 * @interface
 */
export default class FactionType extends ObjectType {
    /**
     * Computes the faction's icon.
     * @param {Context} context The context the faction is being accessed within.
     * @returns {Sprite} Identifies the faction's icon.
     * @abstract
     */
    icon(context) {}

    /**
     * Computes the faction's primary color.
     * @param {Context} context The context the faction is being accessed within.
     * @returns {Color} Identifies the faction's primary color.
     * @abstract
     */
    color(context) {}
}
