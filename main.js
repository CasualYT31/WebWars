/**
 * @file index.js
 * Starts the HTTP server that runs the game and serves assets.
 */

import { join } from "path";
import express from "express";
import getCommandLineArguments from "#src/commandLineArguments.mjs";

const options = getCommandLineArguments();
const app = express();
const clientRoot = join(import.meta.dirname, "public");

// This will give access to the public folder, and will refuse to serve any file outside of it.
app.use(express.static(clientRoot));

app.get("/", function (req, res) {
    res.sendFile("WebWars.html", { root: clientRoot });
});

app.listen(options.port, function () {
    console.log(`Open http://localhost:${options.port} in your browser to run the game!`);
});
