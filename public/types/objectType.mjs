/**
 * @file objectType.mjs
 * Defines the front-end properties required for all game object types.
 */

/**
 * @typedef {object} Coordinate
 * @property {number} x The x coordinate.
 * @property {number} y The y coordinate.
 */

/**
 * @typedef {object} Context
 * @property {string[]} commanders The name/s of the commander/s that are in some way tied to the property request.
 * @property {string[]} weathers The name/s of the weather/s that are in some way tied to the property request.
 * @property {string[]} environments The name/s of the environment/s that are in some way tied to the property
 *           request. Note that this array will never be larger than one in the current implementation of the core
 *           engine.
 * @property {string[]} factions The name/s of the faction/s that are in some way tied to the property request.
 * @property {string[]} movements The name/s of the movement type/s that are in some way tied to the property
 *           request.
 * @property {string[]} structures The name/s of the structure/s that are in some way tied to the property request.
 * @property {string[]} tiles The name/s of the tile type/s that are in some way tied to the property request.
 * @property {string[]} terrains The name/s of the terrain/s that are in some way tied to the property request.
 * @property {string[]} units The name/s of the unit type/s that are in some way tied to the property request.
 * @property {string[]} weapons The name/s of the weapon/s that are in some way tied to the property request.
 * @property {object | undefined} map The front-end model of the map, if any, that the object type is within.
 * @property {UnitID | undefined} unit An identifier for a unit, if any, that is in some way tied to the property
 *           request.
 * @property {Coordinate | undefined} tile The coordinates of a tile, if any, that is in some way tied to the property
 *           request.
 * @property {FactionID | undefined} faction An identifier for a faction, if any, that is in some way tied to the
 *           property request.
 */

/**
 * @typedef {any[]} LanguageKey
 * Usually a name or a description for the game object; it must contain at least an I18Next key that points to the
 * actual name or description written in the locale files.
 * The array is expected to be the parameters given directly to the `i18next.t()` call, opening up support for
 * interpolation.
 */

/**
 * @typedef {string} URL
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
 * @typedef {object} Color
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
