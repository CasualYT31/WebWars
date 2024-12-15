/**
 * @file objectType.mjs
 * Documents properties required for all game object types.
 */

/**
 * The properties that should be defined across all object type categories.
 */
export default class ObjectType {
    /// {Language Key} The full name of the object type.
    longName(context) {}
    /// {Language Key} A shortened form of the full name, used when screen real estate is limited.
    shortName(context) {}
    /// {Language Key} A description of the object type.
    description(context) {}
}
