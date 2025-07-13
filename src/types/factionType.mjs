/**
 * @file factionType.mjs
 * Defines the properties required for Faction types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * The graphical representation of an army on the map (in Advance Wars these are called countries).
 * @interface
 */
export default class FactionType extends ObjectType {
    /**
     * Computes the faction's icon.
     * @param {import("#src/types/objectType.mjs").Context} context The context the faction is being accessed within.
     * @returns {import("#src/types/objectType.mjs").Sprite} Identifies the faction's icon.
     * @abstract
     */
    icon(context) {}

    /**
     * Computes the faction's primary color.
     * @param {import("#src/types/objectType.mjs").Context} context The context the faction is being accessed within.
     * @returns {import("#src/types/objectType.mjs").Color} Identifies the faction's primary color.
     * @abstract
     */
    color(context) {}

    /**
     * Computes the faction's default turn order.
     * The higher the turn order number, the later the faction will be in the turn order.
     * The actual turn order of a faction can change on a per map basis.
     * @param {import("#src/types/objectType.mjs").Context} context The context the faction is being accessed within.
     * @returns {Number} The faction's default turn order.
     * @abstract
     */
    defaultTurnOrder(context) {}
}
