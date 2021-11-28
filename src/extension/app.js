const EVENT_EXTENSIONS_PASTE = "bf2042-portal-extensions-paste";
const EVENT_PLUGINS_INIT = "bf2042-portal-plugins-init";

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
        detail: cloneInto !== undefined 
            ? cloneInto(payload, window) 
            : payload
    });

    window.dispatchEvent(event);
}

function initEvents() {
    //NOTE: Provide an alternative if the Paste API is not available on the webpage
    if (navigator.clipboard.readText !== undefined) {
        document.addEventListener(EVENT_EXTENSIONS_PASTE, async function () {
            const temp = document.createElement("input");
            document.body.appendChild(temp);

            temp.focus();

            const result = document.execCommand("paste");

            dispatchWebEvent(EVENT_EXTENSIONS_PASTE, result ? temp.value : undefined);

            document.body.removeChild(temp);
        });
    }

    document.addEventListener(EVENT_PLUGINS_INIT, async function () {
        dispatchWebEvent(EVENT_PLUGINS_INIT, {
            plugins: config.plugins.filter(e => e.enabled)
        });
    });
}

async function getConfig() {
    let config = await new Promise((resolve) => {
        chrome.storage.local.get(["config"], function(result) {
            resolve(result.config);
        });
    });

    if(!config) {
        config = config || {};
    }

    config.plugins = config.plugins || [];

    return config || {};
}

async function init() {
    initEvents();

    config = await getConfig();

    injectScript("/web/app.js");
}

init();