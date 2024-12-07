/**
 * @file index.js
 * The entry point for the WebWars server.
 * Starts the HTTP server that runs the game and serves assets.
 */

import { join } from "path";
import express from "express";
import { newLogger } from "#src/logger.mjs";
import getCommandLineArguments from "#src/commandLineArguments.mjs";

const options = getCommandLineArguments();
const logger = newLogger("SERVER");
const app = express();

// This will give access to the public folder, and will refuse to serve any file outside of it.
app.use(
    express.static(join(import.meta.dirname, "public"), {
        setHeaders: function (res, path) {
            logger.trace(`Client made request for ${path}`);
        },
    })
);

app.get("/", function (req, res) {
    logger.debug(`Client connected`);
    res.sendFile("WebWars.html", { root: import.meta.dirname });
});

app.listen(options["port"], function () {
    logger.trace(`HTTP server opened on port ${options["port"]}`);
    console.log(`Open http://localhost:${options["port"]} in your browser to run the game!`);
});
