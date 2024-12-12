/**
 * @file mapManager.mjs
 * Defines the model responsible for managing map files loaded via map packs.
 */

import Model from "#src/mvc/model.mjs";

/**
 * Loads map files found in map packs and serves them to the rest of the system.
 */
export default class MapManager extends Model {
    /**
     * Allows the map pack to define what types of units, terrains, etc. it supports, and then loads its map files based
     * on that information.
     * @param {String} mapPackPath The full path to the loaded map pack.
     * @param {Object} mapPackModule The exports defined by the loaded map pack.
     */
    onMapPackLoaded(mapPackPath, mapPackModule) {}

    /**
     * Resets the state of the map manager, ready for another map pack.
     */
    onMapPackUnloaded() {}
}
