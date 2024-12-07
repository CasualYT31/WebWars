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
