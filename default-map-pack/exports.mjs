/**
 * @file exports.mjs
 * The default map pack containing the base Advance Wars games.
 */

import PlayableMaps from "./src/playableMaps.mjs";

export const commanders = [];
export const environments = [];
export const factions = [];
export const movements = [];
export const structures = [];
export const terrains = [];
export const tiles = [];
export const units = [];
export const weapons = [];
export const weathers = [];
export function overrides(objectTypeName, objectType, context) {}

/**
 * The models that this map pack is dynamically importing.
 */
export const models = [PlayableMaps];
