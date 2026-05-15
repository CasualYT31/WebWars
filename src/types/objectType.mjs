/**
 * @file objectType.mjs
 * Defines the back-end properties required for all game object types.
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
 * @property {import("#src/map/map.mjs").Map | undefined} map The map, if any, that the object type is within.
 * @property {UnitID | undefined} unit An identifier for a unit, if any, that is in some way tied to the property
 *           request.
 * @property {Coordinate | undefined} tile The coordinates of a tile, if any, that is in some way tied to the property
 *           request.
 * @property {FactionID | undefined} faction An identifier for a faction, if any, that is in some way tied to the
 *           property request.
 */

/**
 * The properties that should be defined across all object type categories.
 * @interface
 */
export default class ObjectType {}
