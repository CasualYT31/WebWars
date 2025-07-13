/**
 * @file weatherType.mjs
 * Defines the properties required for Weather types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * Describes how a map looks whilst it is experiencing the given weather.
 * Weathers usually influence the logic of the game in some way, but this logic isn't stored directly with the weather
 * subtype. Subtypes should at least document how they influence game play and where in the game's code they make that
 * influence (this will usually be via context objects or an `override()` function).
 * @interface
 */
export default class WeatherType extends ObjectType {
    /**
     * Computes the weather's icon.
     * @param {import("#src/types/objectType.mjs").Context} context The context the weather is being accessed within.
     * @returns {import("#src/types/objectType.mjs").Sprite} Identifies the weather's icon.
     * @abstract
     */
    icon(context) {}

    /**
     * Computes the identifier of the weather's activation sound.
     * @param {import("#src/types/objectType.mjs").Context} context The context the weather is being accessed within.
     * @returns {import("#src/types/objectType.mjs").Audio} Identifies the weather's activation sound.
     * @abstract
     */
    sound(context) {}

    /**
     * The particles that are rendered over the map when the weather is in effect.
     * @param {import("#src/types/objectType.mjs").Context} context The context the weather is being accessed within.
     * @returns {import("#src/types/objectType.mjs").Particles} Identifies the weather's particles.
     * @abstract
     */
    particles(context) {}
}
