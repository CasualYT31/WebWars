/**
 * @file index.js
 * The entry point for the WebWars server.
 * Starts the HTTP server that runs the game and serves assets.
 */

import { join } from "path";
import express from "express";
import expressWs from "express-ws";
import RandExp from "randexp";
import { ClientMessageType, ServerMessageType, sendMessage, sessionKeyRegex } from "#shared/protocol.mjs";
import { newLogger } from "#src/logger.mjs";
import getCommandLineArguments from "#src/commandLineArguments.mjs";

const options = getCommandLineArguments();
const logger = newLogger("SERVER");
const app = express();
const wss = expressWs(app);

// MARK: HTTP Server

// This will give access to the public folder, and will refuse to serve any file outside of it.
// TODO: WEB-6.
app.use(
    express.static(join(import.meta.dirname, "public"), {
        setHeaders: function (res, path) {
            logger.log("trace", `Client made request for ${path}`);
        },
    })
);

app.get("/", function (req, res) {
    logger.log("debug", `Client connected`);
    res.sendFile("WebWars.html", { root: import.meta.dirname });
});

app.listen(options["port"], function () {
    logger.log("trace", `HTTP server opened on port ${options["port"]}`);
    console.log(`Open http://localhost:${options["port"]} in your browser to run the game!`);
});

// MARK: WebSocket Server

// WARNING: this implementation does not tie session keys with browsers in any way, meaning any client could "steal" a
//          session from another if they had the key. Whilst eventually I intend to make this a Web game that you can
//          play over the Internet, I foresee only close friends spinning up this server and playing together, so I am
//          not too fussed about that kind of security right now. I might think about mitigating against this at some
//          point in the far future. See WEB-6.
const clientSessions = new Set();

app.ws("/", function (ws, req) {
    ws.on("message", function (msg) {
        logger.log("trace", `WebSocket server has received a message from a client`, msg, ws);
        try {
            const decodedMessage = JSON.parse(msg);
            logger.log("trace", `WebSocket server has decoded the message.`, decodedMessage);
            const sessionKey = decodedMessage.sessionKey;
            logger.log(
                "trace",
                `Client has sent session key ${sessionKey}, current session keys in store:`,
                Array.from(clientSessions)
            );
            // Special handling for the Verify message type.
            if (decodedMessage.type === ClientMessageType.Verify) {
                logger.log("trace", `WebSocket server is verifying new client`);
                if (clientSessions.has(sessionKey)) {
                    logger.log("info", `Verified new client with session key.`, sessionKey);
                    sendMessage(ws, ServerMessageType.Acknowledgement, sessionKey);
                } else {
                    logger.log("info", `Could not verify client with session key.`, sessionKey);
                    let newSessionKey = new RandExp(sessionKeyRegex).gen();
                    while (clientSessions.has(newSessionKey)) {
                        logger.log(
                            "debug",
                            `Generated session key that already exists!`,
                            newSessionKey,
                            Array.from(clientSessions)
                        );
                        newSessionKey = new RandExp(sessionKeyRegex).gen();
                    }
                    logger.log("info", `Generated new session key for client.`, newSessionKey);
                    clientSessions.add(newSessionKey);
                    sendMessage(ws, ServerMessageType.Acknowledgement, newSessionKey);
                }
            } else {
                if (!clientSessions.has(sessionKey)) {
                    logger.log(
                        "error",
                        `Client sent message with an invalid session key! Closing WebSocket connection with client.`,
                        sessionKey
                    );
                    ws.close();
                }
            }
        } catch (e) {
            logger.log("error", `Couldn't handle the message from the client!`, e);
        }
    });
});
