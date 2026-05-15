/**
 * @file factionType.mjs
 * Defines the back-end properties required for Faction types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * The [largely] graphical representation of an army on the map (in Advance Wars these are called countries).
 * @interface
 */
export default class FactionType extends ObjectType {
    /**
     * Computes the faction's default turn order.
     * The higher the turn order number, the later the faction will be in the turn order.
     * The actual turn order of a faction can change on a per map basis.
     * @param {import("#src/types/objectType.mjs").Context} context The context the faction is being accessed within.
     * @returns {number} The faction's default turn order.
     * @abstract
     */
    defaultTurnOrder(context) {}
}
