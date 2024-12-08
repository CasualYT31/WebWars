/**
 * @file controller.mjs
 * The controller code for the server.
 * Also responsible for spinning up the server.
 */

import express from "express";
import expressWs from "express-ws";

import { newLogger } from "#src/logger.mjs";

// TODO: Refactor.
import RandExp from "randexp";
import { ClientMessageType, ServerMessageType, sendMessage, sessionKeyRegex } from "#shared/protocol.mjs";

/**
 * Manages the server that allows connected clients to submit commands and receive updates.
 */
export default class Controller {
    /**
     * Hooks up all of the given models, sets up the client session pool (the views), and starts the server.
     * ~~ Options ~~
     * port {Number} (Default: 80) The port to open the server on.
     * files {Array<Object>} (Default: []) The files to serve.
     *     path {String} The relative path to the file on disk to serve.
     *     root {String} Where the path is relative to.
     *     url {String} The URL path to the file.
     * folders {Array<Object>} (Default: []) The folders to serve static files from.
     *     path {String} The folder on disk to serve.
     *     url {String} The URL path to map to the folder.
     * @param {Object} options Configures the controller.
     */
    constructor(options) {
        this.#logger.log("trace", "Setting up with options:", options);
        this.#setupServer(options);
    }

    // MARK: Private

    /**
     * Sets up the server.
     * @param {Object} options The options passed to the constructor.
     */
    #setupServer(options) {
        this.#logger.log("trace", "Setting up the server");

        // Set up the static folders.
        if (Array.isArray(options.folders)) {
            options.folders.forEach(folderConfig => {
                this.#logger.log("debug", "Setting up static folder with options:", folderConfig);
                this.#app.use(
                    folderConfig.url,
                    express.static(folderConfig.path, {
                        setHeaders: (res, path) => {
                            this.#logger.log(
                                "trace",
                                "Client made request for file within static folder:",
                                path,
                                folderConfig
                            );
                        },
                    })
                );
            });
        }

        // Set up the static files.
        if (Array.isArray(options.files)) {
            options.files.forEach(fileConfig => {
                this.#logger.log("debug", "Setting up static file with options:", fileConfig);
                this.#app.get(fileConfig.url, (req, res) => {
                    this.#logger.log("trace", "Client made request for file:", fileConfig);
                    res.sendFile(fileConfig.path, { root: fileConfig.root });
                });
            });
        }

        // Hook up the WebSocket handlers.
        this.#app.ws("/", (ws, req) => {
            ws.on("message", msg => {
                this.#logger.log("trace", "The server has received a message from a client:", msg);
                try {
                    const decodedMessage = JSON.parse(msg);
                    this.#logger.log("trace", "The server has decoded the message:", decodedMessage);
                    this.#onClientMessage(ws, decodedMessage);
                } catch (e) {
                    this.#logger.log(
                        "error",
                        "The server encountered an error after receiving a message from the client:",
                        e
                    );
                }
            });
            ws.on("close", () => this.#onClientClose(ws));
        });

        // Log once the server is up and running.
        const port = options.port ?? 80;
        this.#app.listen(port, () => {
            this.#logger.log("debug", "The server has been opened on port:", port);
            console.log(`Open http://localhost:${port} in your browser to open the game!`);
        });
    }

    #onClientMessage(ws, msg) {
        // TODO: refactor.
        const sessionKey = msg.sessionKey;
        this.#logger.log(
            "trace",
            `Client has sent session key ${sessionKey}, current session keys in store:`,
            Array.from(this.#clientSessions)
        );
        // Special handling for the Verify message type.
        if (msg.type === ClientMessageType.Verify) {
            this.#logger.log("trace", `WebSocket server is verifying new client`);
            if (this.#clientSessions.has(sessionKey)) {
                this.#logger.log("info", `Verified new client with session key.`, sessionKey);
                sendMessage(ws, ServerMessageType.Acknowledgement, sessionKey);
            } else {
                this.#logger.log("info", `Could not verify client with session key.`, sessionKey);
                let newSessionKey = new RandExp(sessionKeyRegex).gen();
                while (this.#clientSessions.has(newSessionKey)) {
                    this.#logger.log(
                        "debug",
                        `Generated session key that already exists!`,
                        newSessionKey,
                        Array.from(this.#clientSessions)
                    );
                    newSessionKey = new RandExp(sessionKeyRegex).gen();
                }
                this.#logger.log("info", `Generated new session key for client.`, newSessionKey);
                this.#clientSessions.add(newSessionKey);
                sendMessage(ws, ServerMessageType.Acknowledgement, newSessionKey);
            }
        } else {
            if (!this.#clientSessions.has(sessionKey)) {
                this.#logger.log(
                    "error",
                    `Client sent message with an invalid session key! Closing WebSocket connection with client.`,
                    sessionKey
                );
                ws.close();
            }
        }
    }

    #onClientClose(ws) {}

    #logger = newLogger("Controller");
    #app = express();
    #wss = expressWs(this.#app);

    // WARNING: this implementation does not tie session keys with browsers in any way, meaning any client could "steal" a
    //          session from another if they had the key. Whilst eventually I intend to make this a Web game that you can
    //          play over the Internet, I foresee only close friends spinning up this server and playing together, so I am
    //          not too fussed about that kind of security right now. I might think about mitigating against this at some
    //          point in the far future. See WEB-6.
    #clientSessions = new Set();
}
