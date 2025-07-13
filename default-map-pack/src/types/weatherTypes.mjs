/**
 * @file weatherTypes.mjs
 * Defines all the weathers of Advance Wars.
 */

import WeatherType from "#src/types/weaponType.mjs";

export class ClearWeather extends WeatherType {
    longName(context) {
        return ["CLEAR_WEATHER_longname"];
    }
    shortName(context) {
        return ["CLEAR_WEATHER_shortname"];
    }
    description(context) {
        return ["CLEAR_WEATHER_description"];
    }
    icon(context) {
        return {};
    }
    sound(context) {
        return "";
    }
    particles(context) {
        return "";
    }
}

export class RainWeather extends WeatherType {
    longName(context) {
        return ["RAIN_WEATHER_longname"];
    }
    shortName(context) {
        return ["RAIN_WEATHER_shortname"];
    }
    description(context) {
        return ["RAIN_WEATHER_description"];
    }
    icon(context) {
        return {};
    }
    sound(context) {
        return "";
    }
    particles(context) {
        return "";
    }
}

export class SandstormWeather extends WeatherType {
    longName(context) {
        return ["SANDSTORM_WEATHER_longname"];
    }
    shortName(context) {
        return ["SANDSTORM_WEATHER_shortname"];
    }
    description(context) {
        return ["SANDSTORM_WEATHER_description"];
    }
    icon(context) {
        return {};
    }
    sound(context) {
        return "";
    }
    particles(context) {
        return "";
    }
}

export class SnowWeather extends WeatherType {
    longName(context) {
        return ["SNOW_WEATHER_longname"];
    }
    shortName(context) {
        return ["SNOW_WEATHER_shortname"];
    }
    description(context) {
        return ["SNOW_WEATHER_description"];
    }
    icon(context) {
        return {};
    }
    sound(context) {
        return "";
    }
    particles(context) {
        return "";
    }
}
