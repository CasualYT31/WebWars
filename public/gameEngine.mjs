/**
 * @file gameEngine.mjs
 * A thin layer between the client code and the Phaser game engine.
 * It was mainly written to keep most Phaser-specific logic out of the Controller, and not as a way to make changing
 * game engines particularly easy in the future.
 */

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
            parent: "root",
            dom: {
                createContainer: true,
                pointerEvents: "all",
            },
        });
        // GameEngine.center() may be used very frequently, so let's pre-calculate the center coordinate.
        this.#centerCoordinate = [this.config.width * 0.5, this.config.height * 0.5];
    }

    /**
     * Calculates the center coordinate of the canvas.
     * @param {Number} x The offset to apply in the X direction.
     * @param {Number} y The offset to apply in the Y direction.
     * @returns {Array<Number>} A two element array containing the calculated X and Y coordinates that can be spread
     *          across function calls that expect separate X and Y arguments.
     */
    center(x = 0.0, y = 0.0) {
        return [this.#centerCoordinate[0] + x, this.#centerCoordinate[1] + y];
    }

    /**
     * Stores the X and Y of the coordinate that's at the center of the game's canvas.
     */
    #centerCoordinate = [0, 0];
}
