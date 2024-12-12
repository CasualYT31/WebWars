/**
 * @file main.mjs
 * The client's entry point for this map pack.
 * It will load the main menu component, if they don't already have a menu open.
 */

import controller from "/controller.mjs";

controller.updateComponentWhen("Connected", () =>
    controller.command("OpenMenu", "/pack/components/mainMenu/root.mjs", false)
);
