/**
 * @file weatherType.mjs
 * Defines the back-end properties required for Weather types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * Describes how a map functions whilst it is experiencing the given weather.
 * Weathers usually influence the logic of the game in some way, but this logic isn't stored directly with the weather
 * subtype. Subtypes should at least document how they influence game play and where in the game's code they make that
 * influence (this will usually be via context objects or an `override()` function).
 * @interface
 */
export default class WeatherType extends ObjectType {}
