/**
 * @file structureType.mjs
 * Documents the properties required for Structure types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * A structure is a group of tiles, made up of a root tile and zero or more dependent tiles.
 */
export default class StructureType extends ObjectType {
    /// {Sprite} A structure type's medium-sized icon.
    icon(context) {}
    /// {Object} A structure type's root tile configuration.
    ///     "tile" {String} The type of the root tile.
    ///     "destroyed" {String} The type of the root tile when the structure is destroyed.
    ///     "deleted" {String} The type to set the root tile when the structure is deleted in the map maker.
    root(context) {}
    /// {Array<Object>} A structure type's dependent tiles, if any.
    ///     Same fields as root(), with an additional field:
    ///     "offset" {Object} Contains "x" and "y", integers that describe where the dependent tile is located relative
    ///                       to the root tile. At least one of the integers must be non-zero, and the pairing must be
    ///                       unique across every dependent tile in the structure type.
    dependents(context) {}
    /// {Boolean} If true, and a structure is painted in the map maker, any units located on the structure's tiles will
    ///           not be deleted. They will be if false is returned.
    keepUnitsWhenPainted(context) {}
    /// {Object} Returns information on a structure's destroyed state.
    ///     "longName", "shortName", "description", "icon".
    destroyed(context) {}
}
