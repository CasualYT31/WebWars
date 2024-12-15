/**
 * @file commanderType.mjs
 * Documents the properties required for Commander types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * A commander represents a playable character that controls an army (in Advance Wars these are called COs).
 */
export default class CommanderType extends ObjectType {
    /// {Object<Sprite>} A commander's small icons, typically showing their eyes.
    //                   Keyed on emotion (e.g. neutral, happy, etc.).
    eyes(context) {}
    /// {Object<Sprite>} A commander's medium icons, typically showing their profile.
    //                   Keyed on emotion (e.g. neutral, happy, etc.).
    faces(context) {}
    /// {Object<Sprite>} A commander's large icons, typically showing their entire body.
    //                   Keyed on emotion (e.g. neutral, happy, etc.).
    portraits(context) {}
    /// {URL} A commander's theme that plays in the background whilst they're having their turn.
    theme(context) {}
}
