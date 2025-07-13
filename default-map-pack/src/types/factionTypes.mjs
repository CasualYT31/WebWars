/**
 * @file factionTypes.mjs
 * Defines all the factions of Advance Wars.
 */

import FactionType from "#src/types/factionType.mjs";

export class OrangeStar extends FactionType {
    longName(context) {
        return ["ORANGE_COUNTRY_longname"];
    }
    shortName(context) {
        return ["ORANGE_COUNTRY_shortname"];
    }
    description(context) {
        return ["ORANGE_COUNTRY_description"];
    }
    icon(context) {
        return {};
    }
    color(context) {
        return {
            r: 255,
            g: 80,
            b: 80,
        };
    }
    palette(context) {
        return {};
    }
    defaultTurnOrder(context) {
        return 100;
    }
}

export class BlueMoon extends FactionType {
    longName(context) {
        return ["BLUE_COUNTRY_longname"];
    }
    shortName(context) {
        return ["BLUE_COUNTRY_shortname"];
    }
    description(context) {
        return ["BLUE_COUNTRY_description"];
    }
    icon(context) {
        return {};
    }
    color(context) {
        return {
            r: 70,
            g: 110,
            b: 255,
        };
    }
    palette(context) {
        return {};
    }
    defaultTurnOrder(context) {
        return 200;
    }
}

export class GreenEarth extends FactionType {
    longName(context) {
        return ["GREEN_COUNTRY_longname"];
    }
    shortName(context) {
        return ["GREEN_COUNTRY_shortname"];
    }
    description(context) {
        return ["GREEN_COUNTRY_description"];
    }
    icon(context) {
        return {};
    }
    color(context) {
        return {
            r: 60,
            g: 200,
            b: 40,
        };
    }
    palette(context) {
        return {};
    }
    defaultTurnOrder(context) {
        return 300;
    }
}

export class YellowComet extends FactionType {
    longName(context) {
        return ["YELLOW_COUNTRY_longname"];
    }
    shortName(context) {
        return ["YELLOW_COUNTRY_shortname"];
    }
    description(context) {
        return ["YELLOW_COUNTRY_description"];
    }
    icon(context) {
        return {};
    }
    color(context) {
        return {
            r: 200,
            g: 190,
            b: 0,
        };
    }
    palette(context) {
        return {};
    }
    defaultTurnOrder(context) {
        return 400;
    }
}

export class BlackHole extends FactionType {
    longName(context) {
        return ["BLACK_COUNTRY_longname"];
    }
    shortName(context) {
        return ["BLACK_COUNTRY_shortname"];
    }
    description(context) {
        return ["BLACK_COUNTRY_description"];
    }
    icon(context) {
        return {};
    }
    color(context) {
        return {
            r: 130,
            g: 110,
            b: 160,
        };
    }
    palette(context) {
        return {};
    }
    defaultTurnOrder(context) {
        return 500;
    }
}

export class TwelfthBattalion extends FactionType {
    longName(context) {
        return ["12TH_BATTALION_longname"];
    }
    shortName(context) {
        return ["12TH_BATTALION_shortname"];
    }
    description(context) {
        return ["12TH_BATTALION_description"];
    }
    icon(context) {
        return {};
    }
    color(context) {
        return {
            r: 189,
            g: 107,
            b: 107,
        };
    }
    palette(context) {
        return {};
    }
    defaultTurnOrder(context) {
        return 150;
    }
}

export class LazurianArmy extends FactionType {
    longName(context) {
        return ["LAZURIAN_ARMY_longname"];
    }
    shortName(context) {
        return ["LAZURIAN_ARMY_shortname"];
    }
    description(context) {
        return ["LAZURIAN_ARMY_description"];
    }
    icon(context) {
        return {};
    }
    color(context) {
        return {
            r: 66,
            g: 123,
            b: 148,
        };
    }
    palette(context) {
        return {};
    }
    defaultTurnOrder(context) {
        return 250;
    }
}

export class NewRubinelleArmy extends FactionType {
    longName(context) {
        return ["NEW_RUBINELLE_ARMY_longname"];
    }
    shortName(context) {
        return ["NEW_RUBINELLE_ARMY_shortname"];
    }
    description(context) {
        return ["NEW_RUBINELLE_ARMY_description"];
    }
    icon(context) {
        return {};
    }
    color(context) {
        return {
            r: 165,
            g: 140,
            b: 49,
        };
    }
    palette(context) {
        return {};
    }
    defaultTurnOrder(context) {
        return 350;
    }
}

export class IntelligentDefenseSystems extends FactionType {
    longName(context) {
        return ["INTELLIGENT_DEFENSE_SYSTEMS_longname"];
    }
    shortName(context) {
        return ["INTELLIGENT_DEFENSE_SYSTEMS_shortname"];
    }
    description(context) {
        return ["INTELLIGENT_DEFENSE_SYSTEMS_description"];
    }
    icon(context) {
        return {};
    }
    color(context) {
        return {
            r: 82,
            g: 82,
            b: 82,
        };
    }
    palette(context) {
        return {};
    }
    defaultTurnOrder(context) {
        return 450;
    }
}

export class BanditRaiders extends FactionType {
    longName(context) {
        return ["BANDIT_RAIDERS_longname"];
    }
    shortName(context) {
        return ["BANDIT_RAIDERS_shortname"];
    }
    description(context) {
        return ["BANDIT_RAIDERS_description"];
    }
    icon(context) {
        return {};
    }
    color(context) {
        return {
            r: 82,
            g: 82,
            b: 82,
        };
    }
    palette(context) {
        return {};
    }
    defaultTurnOrder(context) {
        return 550;
    }
}
