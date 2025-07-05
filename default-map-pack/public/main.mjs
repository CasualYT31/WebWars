/**
 * @file main.mjs
 * The client's entry point for the default Advance Wars map pack.
 */

import controller from "/controller.mjs";

import MainMenuScene from "/pack/scenes/mainMenu.mjs";

/**
 * Initializes the game engine and client's menus when the client first connects to the server.
 * The game engine will just have been initialized, so all of the scenes will need to be added in this handler.
 * The main menu will also be opened on initial connection, assuming the user already hasn't got a menu opened.
 */
export function onInitialConnection() {
    // TODO: We will need to read which menu is open here to figure out which scene to auto start.
    controller.game.scene.add("MainMenu", MainMenuScene, true);
    controller.command("OpenMenu", "/pack/components/mainMenu/root.mjs", false);
}

/**
 * Synchronizes the client with the game's state according to the server.
 * The controller will only have paused and resumed the game engine, so all of its scenes etc. will still exist as you
 * left them.
 */
export function onReconnection() {
    // Individual scenes will have put themselves to sleep or awakened themselves when their onMenuOpened handlers were
    // invoked (which were invoked before this handler).
}
