import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import pino from "pino";

export const defaultLogLevel = "trace";
export const logLevels = ["fatal", "error", "warn", "info", "debug", "trace", "silent"];

let logLevel = defaultLogLevel;
let logFilepath = undefined;

/**
 * Creates a new logger object.
 * @param {String} name The name of the logger.
 * @returns {pino.Logger} The logger instance.
 */
export function newLogger(name) {
    let streams = [
        {
            level: "error",
            stream: pino.destination({ dest: 1, sync: true }),
        },
    ];
    if (logFilepath) {
        // Ensure the log file's given directories exist.
        mkdirSync(dirname(logFilepath), { recursive: true });
        streams.push({
            level: logLevel,
            stream: pino.destination({ dest: logFilepath, sync: true }),
        });
    }
    const loggerObject = pino(
        {
            name: name,
            level: logLevel,
            nestedKey: "data",
        },
        pino.multistream(streams)
    );
    // This version of logging an error will automatically append a stacktrace to the given message.
    // It makes sure to remove the first frame (which will always be: Error\n    at <this err function>).
    loggerObject.err = msg => {
        const stacktrace = new Error().stack;
        return loggerObject.error(`${msg}${stacktrace.substring(stacktrace.indexOf("\n", 8))}`);
    };
    return loggerObject;
}

/**
 * Updates the log level.
 * Make sure to set this first before you create your loggers!
 * @param {String} level The new log level to set, either the name of the log level or a corresponding number level in
 *                       string form.
 */
export function setLogLevel(level) {
    level = level.trim().toLowerCase();
    const logLevelNumber = Number(level);
    const invalidLogLevel =
        (isNaN(logLevelNumber) && !logLevels.includes(level)) ||
        (!isNaN(logLevelNumber) && (logLevelNumber < 0 || logLevelNumber >= logLevels.length));
    if (invalidLogLevel) {
        console.warn(`Invalid log level "${level}": leaving to "${logLevel}"`);
        return;
    } else if (!isNaN(logLevelNumber)) {
        level = logLevels[logLevelNumber];
    }
    if (level == "silent") {
        console.warn(`Updated log level to "silent", logs will no longer be produced`);
    }
    logLevel = level;
    if (level != "silent") {
        console.log(`Updated log level to "${level}"`);
    }
}

/**
 * Sets the file used by all loggers.
 * Make sure to set this first before you create your loggers!
 */
export function setLogFilepath(filepath) {
    logFilepath = filepath;
}
