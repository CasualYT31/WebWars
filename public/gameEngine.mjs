/**
 * @file gameEngine.mjs
 * A thin layer between the client code and the Phaser game engine.
 * It was mainly written to keep most Phaser-specific logic out of the Controller, and not as a way to make changing
 * game engines particularly easy in the future.
 */

import MenuScene from "/menuScene.mjs";

/**
 * Manages a Phaser game engine instance.
 */
export default class GameEngine extends Phaser.Game {
    /**
     * Setup the Phaser.Game instance.
     */
    constructor() {
        super({
            width: 1280,
            height: 720,
            // Credit where it's due: https://stackoverflow.com/a/60216568.
            scale: {
                // Fit to window.
                mode: Phaser.Scale.FIT,
                // Center vertically and horizontally.
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            scene: MenuScene,
            parent: "root",
            dom: {
                createContainer: true,
                pointerEvents: "all",
            },
        });
    }

    /**
     * Perform additional setup steps that require a connection to the server.
     */
    onConnected() {}
}
