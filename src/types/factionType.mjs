/**
 * @file factionType.mjs
 * Documents the properties required for Faction types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * The graphical representation of an army on the map (in Advance Wars these are called countries).
 */
export default class FactionType extends ObjectType {
    /// {Sprite} A faction's small icon.
    icon(context) {}
    /// {Color} A country's primary color.
    color(context) {}
    /// {Object<Color>} By default, units all use the same sprites, typically using greyscale.
    ///                 Factions then have the ability to replace specific grey colors with colors of their own, with
    ///                 the keys in the object storing hex representations of said colors.
    palette(context) {}
    /// {Number} The default turn order of the faction (the turn order can change on a per map-basis).
    ///          Lower numbers means they have their turn before factions that have higher numbers.
    defaultTurnOrder(context) {}
}
