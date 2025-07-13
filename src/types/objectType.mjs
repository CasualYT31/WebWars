/**
 * @file objectType.mjs
 * Defines the properties required for all game object types.
 */

/**
 * @typedef {Object} Coordinate
 * @property {Number} x The x coordinate.
 * @property {Number} y The y coordinate.
 */

/**
 * @typedef {Object} Context
 * @property {Array<String>} commanders The name/s of the commander/s that are in some way tied to the property request.
 * @property {Array<String>} weathers The name/s of the weather/s that are in some way tied to the property request.
 * @property {Array<String>} environments The name/s of the environment/s that are in some way tied to the property
 *           request. Note that this array will never be larger than one in the current implementation of the core
 *           engine.
 * @property {Array<String>} factions The name/s of the faction/s that are in some way tied to the property request.
 * @property {Array<String>} movements The name/s of the movement type/s that are in some way tied to the property
 *           request.
 * @property {Array<String>} structures The name/s of the structure/s that are in some way tied to the property request.
 * @property {Array<String>} tiles The name/s of the tile type/s that are in some way tied to the property request.
 * @property {Array<String>} terrains The name/s of the terrain/s that are in some way tied to the property request.
 * @property {Array<String>} units The name/s of the unit type/s that are in some way tied to the property request.
 * @property {Array<String>} weapons The name/s of the weapon/s that are in some way tied to the property request.
 * TODO: These types needs to be defined properly.
 * @property {import("#src/map/map.mjs").Map | undefined} map The map, if any, that the object type is within.
 * @property {UnitID | undefined} unit An identifier for a unit, if any, that is in some way tied to the property
 *           request.
 * @property {Coordinate | undefined} tile The coordinates of a tile, if any, that is in some way tied to the property
 *           request.
 * @property {ArmyID | undefined} army An identifier for an army, if any, that is in some way tied to the property
 *           request.
 */

/**
 * @typedef {Array} LanguageKey
 * Usually a name or a description for the game object; it must contain at least an I18Next key that points to the
 * actual name or description written in the locale files.
 * The array is expected to be the parameters given directly to the `i18next.t()` call, opening up support for
 * interpolation.
 */

/**
 * @typedef {String} URL
 * A path to an asset given in the map pack.
 * Will always be relative to `/path/`.
 */

/**
 * @typedef {any} Sprite
 * An identifier for the front end to know what sprite to use for a given object type.
 * It can take on any format, allowing for map packs to store sprite identifiers in a way that works best for their
 * front-end Scene code.
 */

/**
 * @typedef {any} SpriteSheet
 * An identifier for the front end to know what sprite sheet to use for a given object type.
 * It can take on any format, allowing for map packs to store sprite sheet identifiers in a way that works best for
 * their front-end Scene code.
 */

/**
 * @typedef {any} Particles
 * An identifier for the front end to know what particles to use for a given object type.
 * It can take on any format, allowing for map packs to store particle identifiers in a way that works best for their
 * front-end Scene code.
 */

/**
 * @typedef {any} Audio
 * An identifier for the front end to know what audio to use for a given object type.
 * It can take on any format, allowing for map packs to store audio identifiers in a way that works best for their
 * front-end Scene code.
 */

/**
 * @typedef {Object} Color
 * Contains `r`, `g`, `b`, and `a` (optional) keys with number values between 0 and 255.
 */

/**
 * The properties that should be defined across all object type categories.
 * @interface
 */
export default class ObjectType {
    /**
     * Computes the full name of an object type.
     * @param {Context} context The context the object type is being accessed within.
     * @returns {LanguageKey} The full name of the object type.
     * @abstract
     */
    longName(context) {}

    /**
     * Computes the short name of an object type.
     * Useful when screen real estate is limited.
     * @param {Context} context The context the object type is being accessed within.
     * @returns {LanguageKey} The short name of the object type.
     * @abstract
     */
    shortName(context) {}

    /**
     * Computes the description of an object type.
     * @param {Context} context The context the object type is being accessed within.
     * @returns {LanguageKey} The description of the object type.
     * @abstract
     */
    description(context) {}
}
