const EVENT_EXTENSIONS_INIT = "bf2042-portal-extensions-init";
const EVENT_EXTENSIONS_PASTE = "bf2042-portal-extensions-paste";

let manifest;
let config;

function injectScript(relativeUrl) {
    const scriptElement = document.createElement("script");
    scriptElement.setAttribute("type", "text/javascript");
    scriptElement.setAttribute("src", chrome.runtime.getURL(relativeUrl));
    document.body.appendChild(scriptElement);
}

function dispatchWebEvent(eventType, payload) {
    //NOTE: If we are running on Firefox, we have to use cloneInto for the payload.
    const event = new CustomEvent(eventType, {
        detail:
            typeof cloneInto !== "undefined"
                ? cloneInto(payload, window)
                : payload,
    });

    window.dispatchEvent(event);
}

function initEvents() {
    document.addEventListener(EVENT_EXTENSIONS_INIT, async function () {
        dispatchWebEvent(EVENT_EXTENSIONS_INIT, {
            version: manifest.version,
            manifest: getSelectedVersion(),
        });
    });

    //NOTE: Provide an alternative if the Paste API is not available on the webpage
    if (navigator.clipboard.readText !== undefined) {
        document.addEventListener(EVENT_EXTENSIONS_PASTE, async function () {
            const temp = document.createElement("input");
            document.body.appendChild(temp);

            temp.focus();

            const result = document.execCommand("paste");

            dispatchWebEvent(
                EVENT_EXTENSIONS_PASTE,
                result ? temp.value : undefined,
            );

            document.body.removeChild(temp);
        });
    }
}

async function getConfig() {
    let config = await new Promise((resolve) => {
        chrome.storage.local.get(["config"], function (result) {
            resolve(result.config);
        });
    });

    if (!config) {
        config = config || {};
    }

    config.manifestUrl = config.manifestUrl || "";
    config.versions = config.versions || {};
    config.selectedVersion = config.selectedVersion || "";

    return config || {};
}

function getSelectedVersion() {
    const version = config.versions[config.selectedVersion];

    return version ? version : undefined;
}

async function init() {
    manifest = chrome.runtime.getManifest();
    config = await getConfig();

    initEvents();

    injectScript("/web/app.js");
}

init();
