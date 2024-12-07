/**
 * @file index.js
 * The entry point for the WebWars server.
 * Starts the HTTP server that runs the game and serves assets.
 */

import { join } from "path";
import express from "express";
import getCommandLineArguments from "#src/commandLineArguments.mjs";

const options = getCommandLineArguments();
const app = express();

// This will give access to the public folder, and will refuse to serve any file outside of it.
app.use(express.static(join(import.meta.dirname, "public")));

app.get("/", function (req, res) {
    res.sendFile("WebWars.html", { root: import.meta.dirname });
});

app.listen(options.port, function () {
    console.log(`Open http://localhost:${options.port} in your browser to run the game!`);
});
