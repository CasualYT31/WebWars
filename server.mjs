/**
 * @file server.js
 * The entry point for the WebWars server.
 * Starts the server that runs the game and serves assets.
 */

import { join } from "node:path";

import Controller from "#src/controller/controller.mjs";
import getCommandLineArguments from "#src/commandLineArguments.mjs";

const options = getCommandLineArguments();
const controller = new Controller({
    port: options["port"],
    files: [
        {
            path: "WebWars.html",
            root: import.meta.dirname,
            url: "/",
        },
    ],
    folders: [
        {
            path: join(import.meta.dirname, "public"),
            url: "/",
        },
    ],
});
