/**
 * @file mainMenu.mjs
 * Defines the main menu scene.
 */

/**
 * The main menu scene consists of a single background image.
 * This is temporary whilst I still flesh out the game.
 */
export default class MainMenuScene extends Phaser.Scene {
    /**
     * Initializes the loader with the correct base URL and the background.jpg image.
     */
    preload() {
        this.load.setBaseURL(`http://${location.host}`);
        this.load.image("background", "pack/assets/background.jpg");
    }

    /**
     * Adds the loaded background.jpg image to the scene.
     */
    create() {
        this.add
            .image(0, 0, "background")
            .setOrigin(0, 0)
            .setDisplaySize(this.game.config.width, this.game.config.height);
    }
}
