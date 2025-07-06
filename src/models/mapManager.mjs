/**
 * @file mapManager.mjs
 * Defines the model responsible for managing map files loaded via map packs.
 */

import { join } from "node:path";

import scanDirectory from "node-recursive-directory";

import Model from "#src/mvc/model.mjs";

import CommanderType from "#src/types/commanderType.mjs";
import EnvironmentType from "#src/types/environmentType.mjs";
import FactionType from "#src/types/factionType.mjs";
import MovementType from "#src/types/movementType.mjs";
import StructureType from "#src/types/structureType.mjs";
import TerrainType from "#src/types/terrainType.mjs";
import TileType from "#src/types/tileType.mjs";
import UnitType from "#src/types/unitType.mjs";
import WeaponType from "#src/types/weaponType.mjs";
import WeatherType from "#src/types/weatherType.mjs";

/**
 * Loads map files found in map packs and serves them to the rest of the system.
 */
export default class MapManager extends Model {
    /**
     * When a new client connects, we need to publish our map list to it.
     * It will be published to everyone but there's no harm in doing so.
     * @param {String} sessionKey The new client's session key.
     */
    onNewClient(sessionKey) {
        this.#emitMapFiles();
    }

    /**
     * Allows the map pack to define what types of units, terrains, etc. it supports, and where its map files are
     * stored.
     * @param {String} mapPackPath The full path to the loaded map pack.
     * @param {Object} mapPackModule The exports defined by the loaded map pack.
     */
    onMapPackLoaded(mapPackPath, mapPackModule) {
        this.log("info", "Loading map pack:", mapPackPath);

        // 1. Go through each object type category and cache the exported object types that are valid.
        for (const [arrayName, category] of Object.entries({
            commanders: CommanderType,
            environments: EnvironmentType,
            factions: FactionType,
            movements: MovementType,
            structures: StructureType,
            terrains: TerrainType,
            tiles: TileType,
            units: UnitType,
            weapons: WeaponType,
            weathers: WeatherType,
        })) {
            this.#objectTypes[arrayName] = {};
            if (!Array.isArray(mapPackModule[arrayName])) {
                this.log("warn", "Map pack does not export an array for:", arrayName);
                continue;
            }
            this.log(
                "debug",
                "Found array of object types for category:",
                arrayName,
                `length: ${mapPackModule[arrayName].length}`
            );
            mapPackModule[arrayName].forEach(type => {
                if (!type.prototype instanceof category) {
                    this.log(
                        "error",
                        `Object type ${type.name} does not extend ${category.name} even though it is of category ` +
                            `${arrayName}. It will not be cached`
                    );
                    return;
                }
                this.log("debug", "Caching:", type.name);
                this.#objectTypes[arrayName][type.name] = type;
            });
        }

        // 2. Look for the overrides() exported function and cache that if it exists.
        if (typeof mapPackModule.overrides === "function") {
            this.log("debug", "Found overrides() function from map pack");
            this.#overrides = mapPackModule.overrides;
        }

        // 3. Emit the paths to the map pack's map files.
        const mapsFolder = join(mapPackPath, "maps");
        scanDirectory(mapsFolder)
            .then(files => {
                this.log("debug", "Found files within maps folder:", mapsFolder, files);
                this.#mapFiles = files.filter(file => file.endsWith(".map"));
                this.#emitMapFiles();
            })
            .catch(e => this.log("error", "Couldn't scan maps folder within map pack:", mapsFolder, e));
    }

    /**
     * Loads a binary map file using the current map pack's exported information.
     * @param {String} mapFilePath Path to the map file to load.
     */
    whenLoadMap(mapFilePath) {
        console.log(mapFilePath);
    }

    /**
     * Emits each map file found within the loaded map pack.
     */
    #emitMapFiles() {
        this.log("debug", "Emitting map files:", this.#mapFiles);
        this.event("MapsFolderScanned", this.#mapFiles);
    }

    #objectTypes = {};
    #overrides = null;
    #mapFiles = [];
}
