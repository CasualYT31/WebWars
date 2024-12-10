/**
 * @file menuScene.mjs
 * Defines the menu scene.
 */

/**
 * The menu scene consists of a single background image that can change.
 * It will be used whenever the user is in a menu (i.e. not playing a map).
 */
export default class MenuScene extends Phaser.Scene {
    preload() {
        this.load.setBaseURL(`http://${location.host}`);
        this.load.image("background", "assets/images/background.jpg");
    }

    create() {
        this.add.image(1280 * 0.5, 720 * 0.5, "background");
    }
}
