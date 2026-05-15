/**
 * @file weatherType.mjs
 * Defines the front-end properties required for Weather types.
 */

import ObjectType from "/types/objectType.mjs";

/**
 * Describes how a map looks whilst it is experiencing the given weather.
 * @interface
 */
export default class WeatherType extends ObjectType {
    /**
     * Computes the weather's icon.
     * @param {Context} context The context the weather is being accessed within.
     * @returns {Sprite} Identifies the weather's icon.
     * @abstract
     */
    icon(context) {}

    /**
     * Computes the identifier of the weather's activation sound.
     * @param {Context} context The context the weather is being accessed within.
     * @returns {Audio} Identifies the weather's activation sound.
     * @abstract
     */
    sound(context) {}

    /**
     * The particles that are rendered over the map when the weather is in effect.
     * @param {Context} context The context the weather is being accessed within.
     * @returns {Particles} Identifies the weather's particles.
     * @abstract
     */
    particles(context) {}
}
