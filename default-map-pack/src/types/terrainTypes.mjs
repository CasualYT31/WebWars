/**
 * @file terrainTypes.mjs
 * Defines all the terrains of Advance Wars.
 */

import TerrainType from "#src/types/terrainType.mjs";

export class Plains extends TerrainType {
    longName(context) {
        return ["PLAINS_TERRAIN_longname"];
    }
    shortName(context) {
        return ["PLAINS_TERRAIN_shortname"];
    }
    description(context) {
        return ["PLAINS_TERRAIN_description"];
    }
}

export class Sea extends TerrainType {
    longName(context) {
        return ["SEA_TERRAIN_longname"];
    }
    shortName(context) {
        return ["SEA_TERRAIN_shortname"];
    }
    description(context) {
        return ["SEA_TERRAIN_description"];
    }
}

export class Road extends TerrainType {
    longName(context) {
        return ["ROAD_TERRAIN_longname"];
    }
    shortName(context) {
        return ["ROAD_TERRAIN_shortname"];
    }
    description(context) {
        return ["ROAD_TERRAIN_description"];
    }
}

export class Bridge extends TerrainType {
    longName(context) {
        return ["BRIDGE_TERRAIN_longname"];
    }
    shortName(context) {
        return ["BRIDGE_TERRAIN_shortname"];
    }
    description(context) {
        return ["BRIDGE_TERRAIN_description"];
    }
}

export class Mountain extends TerrainType {
    longName(context) {
        return ["MOUNTAIN_TERRAIN_longname"];
    }
    shortName(context) {
        return ["MOUNTAIN_TERRAIN_shortname"];
    }
    description(context) {
        return ["MOUNTAIN_TERRAIN_description"];
    }
}

export class Woods extends TerrainType {
    longName(context) {
        return ["WOODS_TERRAIN_longname"];
    }
    shortName(context) {
        return ["WOODS_TERRAIN_shortname"];
    }
    description(context) {
        return ["WOODS_TERRAIN_description"];
    }
}

export class River extends TerrainType {
    longName(context) {
        return ["RIVER_TERRAIN_longname"];
    }
    shortName(context) {
        return ["RIVER_TERRAIN_shortname"];
    }
    description(context) {
        return ["RIVER_TERRAIN_description"];
    }
}

export class Reef extends TerrainType {
    longName(context) {
        return ["REEF_TERRAIN_longname"];
    }
    shortName(context) {
        return ["REEF_TERRAIN_shortname"];
    }
    description(context) {
        return ["REEF_TERRAIN_description"];
    }
}

// TODO: I should really get Chat-GPT to do this.
