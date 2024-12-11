/**
 * @file menuScene.mjs
 * Defines the menu scene.
 */

import controller from "/controller.mjs";

/**
 * The menu scene consists of a single background image that can change.
 * It will be used whenever the user is in a menu (i.e. not playing a map).
 */
export default class MenuScene extends Phaser.Scene {
    /**
     * Initializes the loader with the correct base URL and an image load complete callback that assigns the loaded
     * image to the background image object.
     */
    preload() {
        this.load.setBaseURL(`http://${location.host}`);
        this.load.on("filecomplete", key => {
            // TODO: I added the "BACKGROUND." prefix to distinguish between images loaded in this scene and images
            //       loaded in other scenes. I'm fairly sure this handler will be called globally, anyway. If this
            //       handler will only be called when images are loaded in this scene, this prefix is redundant and
            //       should be removed. When I come round to adding another scene, test this theory out.
            if (key.startsWith("BACKGROUND.")) {
                this.setImage(key);
            }
        });
    }

    /**
     * Sets the image to use for the background.
     * @param {String} imageUrl The URL to the image to load.
     */
    setImage(imageUrl) {
        let key = imageUrl;
        if (!key.startsWith("BACKGROUND.")) {
            key = `BACKGROUND.${key}`;
        }
        console.debug("Setting image in menu scene", key, imageUrl);
        if (key in this.textures.list) {
            if (this.backgroundImage === undefined) {
                console.debug("Creating image object for menu scene");
                this.backgroundImage = this.add.image(0, 0, key);
            } else {
                this.backgroundImage.setTexture(key);
            }
            this.backgroundImage.setOrigin(0, 0);
            this.backgroundImage.setDisplaySize(controller.canvas.width, controller.canvas.height);
        } else {
            console.debug("Loading background image for menu scene", key, imageUrl);
            this.load.image(key, imageUrl);
            this.load.start();
        }
    }
}
