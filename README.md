# WebWars

Web-based implementation of a moddable Advance Wars engine

[The Trello board.](https://trello.com/b/oEdX3SEL/web-wars)

## Downloading and Running

1. Install node.js. I used a [prebuilt installer](https://nodejs.org/en/download/prebuilt-installer) because it's a bit more convenient on Windows, but using `nvm` is easier on Linux. I'm using the latest version as of the time of writing, which is `v23.3.0`.
2. Clone the repository, or [download it](https://github.com/CasualYT31/WebWars/archive/refs/heads/main.zip), either by clicking on the link or downloading the repository from the `< > Code` menu to the top right.
3. Open a terminal, navigate to the root of your cloned or downloaded repository, then run `npm install`. This will download the dependencies required for the game's server (the game's client acquires its dependencies via CDNs).
4. Run the game using `npm start`, then open the printed link (by default, it is `http://localhost:80`) in a web browser.

To choose which port to run the game on, you can provide the `--port PORT_NUMBER` command-line argument, e.g. `npm start -- --port 8080`. The `--` in between `start` and `--port` ensures the `--port` command-line argument is passed to the game and not the `npm start` command. **NOTE:** on PowerShell, you'll need to run `npm start --- --port 8080` instead [due to this issue](https://github.com/npm/cli/issues/3136#issuecomment-925352743).

In place of `npm start`, you can also run the game directly using `node server.mjs`, `node server.mjs --port 8080`, etc.

## Testing

You can test the back end using: `npm test`.
You can test the back end + front end using: `npx playwright test`.

## Map Packs

The game's core codebase (`/src`, `/shared`, `/public`) is pretty bare. It is supposed to act as a framework with which you can create Advance Wars-like games. The `default-map-pack` will contain the code and assets that let you play any of the original four games on the GBA and the DS (primarily focusing on Dual Strike for now), but using the framework, you can develop any 2D turn-based strategy game that's played on a tiled map.

Map packs are made up of the following folders and files. Technically only the root-level `exports.mjs` script and the public-level `main.mjs` script are mandatory.

```
map-pack
    maps
    public
        assets
        components
            menuName
                subComponents
                    example.mjs
                root.mjs
            etc.
        locales
            en
                translation.json
            de
                translation.json
            etc.
        scenes
            sceneName.mjs
        main.mjs
    src
    exports.mjs
```

### `maps` Folder

This folder stores all of the binary `.map` files that are loaded by the game when the pack is loaded. This folder can have as many sub-folders as the developer desires, however, all `.map` files must be located within this root-level `maps` folder. `.map` files have a consistent format across all map packs, but the values stored within them will hold different meanings based on the map pack they are within, so you should not expect `.map` files from one pack to be loadable with another.

### `public` Folder

This folder contains all of the front-end code and assets. When a map pack is loaded, the game's web server will map all `GET` requests that begin with `/pack` in their URLs to this `public` folder (as if they were a static folder). It's important to note that front-end assets largely dictate how the game looks and will have no bearing on how the game runs on the server. Additionally, most of the front-end code will consist of React components that dictate how the UI of the game will be structured and how it will function, and Phaser scenes that dictate how the game engine runs and how the user can interact with the game.

### `assets` Folder

It is not mandatory to store all of your assets in this folder; the game lets you organize your front-end files in however which way you please (with a few exceptions) but it is customary to place them all in this folder. Specifically, assets will include sprite sheets, audio files, fonts, etc.

### `components` Folder

It is also customary to organize all of your React components in a `components` folder, with each menu of the game occupying a `root.mjs` component, containing many `subComponents` as necessary. The only restriction is that only one menu can be displayed at a time, otherwise you're free to organize your UI code in any way. For example, if you need to show two menus at once, you'll need to combine them as two components under one root menu component.

### `locales` Folder

The front-end `Controller` mandates that translation files be stored in this root-level `locales` folder, where each language has its own folder containing at least a single `translation.json` script. Your map pack can have any I18Next namespaces you like (this means additional `*.json` scripts), but the language keys (e.g. `en`, `de`, etc.) are shared across all map packs.

### `scenes` Folder

Again, you can store all of your Phaser scenes and other Phaser-based code in a `scenes` folder, but it's not mandatory to store them as such. Unlike the React components, the client is largely given full control over how it sets up Phaser and its scene management once it has connected to the server. The only time the client's controller will interfere with the Phaser game engine is when the client disconnects from and reconnects to the server. Disconnects will cause the game engine to pause, and reconnects will cause the game engine to resume, unless the client detects that the server has been rebooted, in which case the game engine will be torn down and set up again using whatever map pack the server has loaded after its reboot.

### `main.mjs` File

When the client connects to the server, it will dynamically import this script. It must export two functions:

1. `onInitialConnection()`. Invoked when the game is first opened or when the server reboots and the client reconnects to it. The Phaser game engine will be freshly initialized when this handler is invoked, so its primary responsibility is to continue initializing the game engine for your map pack's needs. It should then attempt to show the necessary scene/s and React component that align with the user's assigned menu. You must not assume that the user doesn't have any menu already opened: don't forget that this is tracked by the server and is stored under the `ui` front-end model, which will by this point be populated and can be read from via the controller.
2. `onReconnection()`. Invoked when the client reconnects to the server and the server has not rebooted. In this case, the Phaser game engine has been fully initialized since the initial connection step, so this handler's only purpose is to synchronize the client with the server's state (which, again, can be read from the front-end models). However, previously registered scene handlers should primarily be responsible for this synchronization and they are invoked before this onReconnection handler.

One important point to note is that your `main.mjs` script does not need to manually open and attach React component/s: the controller does this for you before invoking any of the handlers above. But you may wish to change menus via the `OpenMenu` command in some scenarios.

An example script follows:

```js
// /public and /shared are accessible directly from the root of the game's URL (/).
import controller from "/controller.mjs";

// Remember that the map pack's public folder is accessible via /pack.
import MainMenuScene from "/pack/scenes/mainMenu.mjs";

// Set up Phaser and your UI state here.
export function onInitialConnection() {
    // This simple example adds a single Main Menu scene to Phaser and starts it.
    // But a larger map pack with multiple scenes will need to be careful about which scenes it starts immediately,
    // depending on the currently opened menu.
    controller.game.scene.add("MainMenu", MainMenuScene, true);
    // This tells the client to open the "main menu" root component, but only if they don't already have a menu open
    // (which is what the false argument achieves). That last part is important, as it prevents the map pack from moving
    // the player away from another menu when they refresh the browser and cause this handler to be invoked again.
    controller.command("OpenMenu", "/pack/components/mainMenu/root.mjs", false);
}

// Synchronize your Phaser state here.
export function onReconnection() {
    // This example doesn't have any logic here.
    // Ideally scenes will have their own onMenuOpened handlers that put themselves to sleep or awaken themselves
    // according to the current menu.
}
```

### `src` Folder

Your back-end code can be stored anywhere outside of the `public` folder, but it's usually a good idea to bundle it together under a root-level `src` folder. The back-end code is where all of your game logic will sit. Your client-facing commands **must** validate all of the data they receive: your client-side code could be perfect, but you must assume that a client could tamper with any data it sends. The only data that you can rely on to be safe are session keys, as they are internally managed by the server.

### `exports.mjs` File

This root-level script's purpose is to tell the server what back-end components it can load. Its existence is mandatory, but all of its exports are technically optional:

#### `models`

If an array is exported using this identifier, the server will iterate through it and instantiate each given model definition within the system. This is the mechanism via which you can receive events from the system, emit your own events, and register client-facing commands that let clients interact with your game. Each element of the array must be an object that contains a `"model"` attribute storing the class that inherits from `Model` (not an instantiated object: the server is responsible for constructing the models). You can also include an `"arguments"` attribute that stores an array of arguments to pass to the model's constructor. These always come after any mandatory arguments required for all models (check the back-end Model class for details).

#### TODO

These exported objects tell the server what sorts of units, terrains, etc. your map pack supports, and what their string identifiers are. This will directly influence how to load the binary map files given by the map pack (as such files contain aforementioned identifiers).

#### `default`

If the `default` export of the module is a function, it will be invoked once all of the module's exported models have been added to the server. The function will accept a reference to the server's controller instance, which will let you perform commands, emit events, etc. when your map pack is initially loaded (but before the accompanying `MapPackLoaded` event is emitted).
