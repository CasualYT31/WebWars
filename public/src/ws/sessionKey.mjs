/**
 * @file sessionKey.mjs
 * Manages the client's session key.
 */

let sessionKey = "";

// Grab the session key from the browser's cookies, if one is there.
const decodedCookie = decodeURIComponent(document.cookie);
if (decodedCookie.length > 0) {
    sessionKey = decodedCookie.split("=").at(1);
}

/**
 * Retrieves the client's session key from the browser's cookies.
 * @returns {String} The client's session key, or an empty string if it doesn't have one saved.
 */
export function getSessionKey() {
    return sessionKey;
}

/**
 * Updates the client's session key cache with one given by the server.
 * @param {String} newKey The new session key received from the server.
 */
export function setSessionKey(newKey) {
    const d = new Date();
    d.setTime(d.getTime() + 86400000); // Expires in one day.
    document.cookie = `sessionKey=${newKey}; expires=${d.toUTCString()}; path=/; SameSite=None; Secure=None`;
    sessionKey = newKey;
}
