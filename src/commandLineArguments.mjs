/**
 * @file commandLineArgs.mjs
 * Defines the command-line arguments that the server provides.
 */

import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

const optionDefinitions = [
    {
        name: "help",
        alias: "h",
        type: Boolean,
        description: "Prints this usage guide then exits",
        typeLabel: "",
    },
    {
        name: "port",
        alias: "p",
        type: Number,
        defaultValue: 80,
        description: "The port to run the game server on (default: 80)",
        typeLabel: "{underline number}",
    },
];

const usageSections = [
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
export default function getCommandLineArguments() {
    const options = commandLineArgs(optionDefinitions);
    if (options.help) {
        console.log(commandLineUsage(usageSections));
        process.exit();
    }
    return options;
}
