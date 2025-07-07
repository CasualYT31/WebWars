/**
 * @file server.mjs
 * The entry point for the WebWars server.
 * Starts the server that runs the game and serves assets.
 */

import { rmSync } from "node:fs";
import { join } from "node:path";

import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import esMain from "es-main";

import { logLevels, defaultLogLevel, setLogLevel, setLogFilepath } from "#src/logging/logger.mjs";
import Controller from "#src/mvc/controller.mjs";

import FrontEndData from "#src/models/frontEndData.mjs";
import MapManager from "#src/models/mapManager.mjs";

export const optionDefinitions = [
    // MARK: Generic
    {
        name: "help",
        alias: "h",
        type: Boolean,
        description: "Prints this usage guide then exits",
        typeLabel: "",
    },
    // MARK: Server
    {
        name: "port",
        alias: "p",
        type: Number,
        defaultValue: 80,
        description: "The port to run the game server on (default: 80)",
        typeLabel: "{underline number}",
    },
    // MARK: Logging
    {
        name: "log-level",
        alias: "l",
        type: String,
        defaultValue: defaultLogLevel,
        description: `The level to log at, out of: ${logLevels
            .map((level, i) => `${level} or ${i}`)
            .join(", ")} (default: ${defaultLogLevel})`,
        typeLabel: "{underline level string or number}",
    },
    {
        name: "log-file",
        alias: "f",
        type: String,
        defaultValue: "logs/WebWars.log",
        description: "The log file to write to (default: logs/WebWars.log)",
        typeLabel: "{underline file path}",
    },
    {
        name: "no-log-file",
        alias: "n",
        type: Boolean,
        description: "Prevents logs from being output to a file",
        typeLabel: "",
    },
    {
        name: "keep-log-file",
        alias: "k",
        type: Boolean,
        description:
            "The game will delete any existing log file on start-up. Specify this option to append to the log file " +
            "instead. No log file will ever be deleted if --no-log-file is specified.",
        typeLabel: "",
    },
    // MARK: Game
    {
        name: "client-sessions",
        alias: "s",
        type: String,
        defaultValue: "client-sessions.json",
        description:
            "The path to the script that contains the server's persisted client session data. You can provide this " +
            "option with no value to disable the persistence of client session data (default: client-sessions.json)",
        typeLabel: "{underline [file path]}",
    },
    {
        name: "do-not-persist-client-sessions",
        type: Boolean,
        description: "If you wish to load client sessions from disk, but not persist updates, then provide this flag",
        typeLabel: "",
    },
    {
        name: "max-client-sessions",
        alias: "c",
        type: clientCount => (Number(clientCount) >= 0 ? Number(clientCount) : undefined),
        description: "Set the maximum number of clients that can connect to this server (default: 16)",
        typeLabel: "{underline client count}",
    },
    {
        name: "map-pack",
        alias: "m",
        type: String,
        defaultValue: "./default-map-pack",
        description: "The path to the map pack to load on start-up (default: ./default-map-pack)",
        typeLabel: "{underline folder path}",
    },
];

export const usageSections = [
    {
        header: "WebWars",
        content: "Web-based implementation of a moddable Advance Wars engine",
    },
    {
        header: "Options",
        optionList: optionDefinitions,
    },
];

/**
 * Parses the command-line arguments given by the user and returns them.
 * If the help argument is given, the usage documentation will be printed, and the game will close.
 * @returns {Object} The options provided by the user.
 */
export function getCommandLineArguments() {
    const options = commandLineArgs(optionDefinitions);
    if (options.help) {
        console.log(commandLineUsage(usageSections));
        process.exit();
    }
    setLogLevel(options["log-level"]);
    if (!options["no-log-file"]) {
        if (!options["keep-log-file"]) {
            rmSync(options["log-file"], { force: true });
        }
        setLogFilepath(options["log-file"]);
    }
    return options;
}

// Don't run the actual game if we're importing this module.
if (esMain(import.meta)) {
    const options = getCommandLineArguments();
    new Controller({
        port: options["port"],
        files: [
            {
                path: "WebWars.html",
                root: join(import.meta.dirname, "public"),
                url: "/",
            },
        ],
        folders: [
            {
                path: join(import.meta.dirname, "shared"),
                url: "/",
            },
            {
                path: join(import.meta.dirname, "public"),
                url: "/",
            },
        ],
        onServerUp: port => console.log(`Open http://localhost:${port} in your browser to open the game!`),
        models: [
            {
                model: FrontEndData,
                arguments: [options["client-sessions"], !options["do-not-persist-client-sessions"]],
            },
            { model: MapManager },
        ],
        maxClientSessions: options["max-client-sessions"],
        mapPackPath: options["map-pack"],
    });
}
