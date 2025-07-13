/**
 * @file weaponType.mjs
 * Defines the properties required for Weapon types.
 */

import ObjectType from "#src/types/objectType.mjs";

/**
 * Units may wield at least one type of weapon; this base class defines the properties that weapons are required to
 * provide.
 * @interface
 */
export default class WeaponType extends ObjectType {}
