/**
 * @file movementType.mjs
 * Defines the properties required for Movement types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * Defines a movement type that is available to the unit types.
 * Typically, movement types dictate how units traverse over different terrain types. The terrain types will dictate how
 * these movement types actually influence movement.
 * @interface
 */
export default class MovementType extends ObjectType {
    /**
     * Computes the movement type's icon.
     * @param {import("#src/types/objectType.mjs").Context} context The context the movement type is being accessed
     *        within.
     * @returns {import("#src/types/objectType.mjs").Sprite} Identifies the movement type's icon.
     * @abstract
     */
    icon(context) {}
}
