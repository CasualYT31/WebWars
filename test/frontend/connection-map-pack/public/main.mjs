import controller from "/controller.mjs";

export function onInitialConnection() {
    controller.command("OpenMenu", "/pack/component.mjs", false);
    /// Your map pack's onInitialConnection() handler MUST set this global to true.
    /// The E2E tests rely on it to identify when the client has fully connected to the server.
    window.WebWars.onInitialConnection = true;
}

export function onReconnection() {
    /// Your map pack's onReconnection() handler MUST set this global to true.
    /// The E2E tests rely on it to identify when the client has fully reconnected to the server.
    window.WebWars.onReconnection = true;
}
