/**
 * @file weatherType.mjs
 * Documents the properties required for Weather types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * Describes how a map looks whilst it is experiencing the given weather.
 * Weathers usually influence the logic of the game in some way, but this logic isn't stored directly with the weather
 * subtype. Subtypes should at least document how they influence game play and where in the game's code they make that
 * influence (this will usually be via context objects or an override() function).
 */
export default class WeatherType extends ObjectType {
    /// {Sprite} A weather's small icon.
    icon(context) {}
    /// {URL} The sound that plays when the weather is activated.
    sound(context) {}
    /// {URL} The particles that are rendered over the map whilst the weather is in effect.
    particles(context) {}
}
