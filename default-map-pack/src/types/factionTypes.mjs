/**
 * @file factionTypes.mjs
 * Defines all the factions of Advance Wars.
 */

import FactionType from "#src/types/factionType.mjs";

export class OrangeStar extends FactionType {
    defaultTurnOrder(context) {
        return 100;
    }
}

export class BlueMoon extends FactionType {
    defaultTurnOrder(context) {
        return 200;
    }
}

export class GreenEarth extends FactionType {
    defaultTurnOrder(context) {
        return 300;
    }
}

export class YellowComet extends FactionType {
    defaultTurnOrder(context) {
        return 400;
    }
}

export class BlackHole extends FactionType {
    defaultTurnOrder(context) {
        return 500;
    }
}

export class TwelfthBattalion extends FactionType {
    defaultTurnOrder(context) {
        return 150;
    }
}

export class LazurianArmy extends FactionType {
    defaultTurnOrder(context) {
        return 250;
    }
}

export class NewRubinelleArmy extends FactionType {
    defaultTurnOrder(context) {
        return 350;
    }
}

export class IntelligentDefenseSystems extends FactionType {
    defaultTurnOrder(context) {
        return 450;
    }
}

export class BanditRaiders extends FactionType {
    defaultTurnOrder(context) {
        return 550;
    }
}
