/**
 * @file movementType.mjs
 * Documents the properties required for Movement types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * Defines a movement type that is available to the unit types.
 * Typically, movement types dictate how units traverse over different terrain types. The terrain types will dictate how
 * these movement types actually influence movement.
 */
export default class MovementType extends ObjectType {
    /// {Sprite} A movement type's small icon.
    icon(context) {}
}
