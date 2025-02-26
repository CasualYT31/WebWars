/**
 * @file exports.mjs
 * The default map pack containing the base Advance Wars games.
 */

import * as Environments from "./src/types/environmentTypes.mjs";
import * as Factions from "./src/types/factionTypes.mjs";
import * as Movements from "./src/types/movementTypes.mjs";
import * as Terrains from "./src/types/terrainTypes.mjs";
import * as Weathers from "./src/types/weatherTypes.mjs";

import PlayableMaps from "./src/playableMaps.mjs";

export const commanders = [];
export const environments = Object.values(Environments);
export const factions = Object.values(Factions);
export const movements = Object.values(Movements);
export const structures = [];
export const terrains = Object.values(Terrains);
export const tiles = [];
export const units = [];
export const weapons = [];
export const weathers = Object.values(Weathers);
export function overrides(objectTypeName, objectType, context) {}

/**
 * The models that this map pack is dynamically importing.
 */
export const models = [PlayableMaps];
