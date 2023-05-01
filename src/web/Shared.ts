/// <reference path="App.ts"/>

BF2042Portal.Shared = (function () {
    let pasteTextFromClipboardImplementation = pasteTextFromClipboardDefault;
    let pasteTextFromClipboardFirefoxCallback = (_text: string) => {};

    function init() {
        //NOTE: If readText is not available, we are going to assume this is Firefox.
        if (navigator.clipboard.readText !== undefined) {
            return;
        }

        pasteTextFromClipboardImplementation = pasteTextFromClipboardFirefox;

        window.addEventListener(
            "bf2042-portal-extensions-paste",
            async function (message: any) {
                pasteTextFromClipboardFirefoxCallback(message.detail);
            },
        );
    }

    async function copyTextToClipboard(text) {
        return await navigator.clipboard.writeText(text);
    }

    async function copyBlobToClipboard(blobData) {
        return await navigator.clipboard.write([
            new ClipboardItem({ [blobData.type]: blobData }),
        ]);
    }

    async function pasteTextFromClipboard() {
        return await pasteTextFromClipboardImplementation();
    }

    async function pasteTextFromClipboardDefault() {
        return await navigator.clipboard.readText();
    }

    async function pasteTextFromClipboardFirefox(): Promise<string> {
        return new Promise((resolve, reject) => {
            pasteTextFromClipboardFirefoxCallback = (clipboard) => {
                if (clipboard) {
                    resolve(clipboard);
                } else {
                    reject();
                }
            };

            const event = new Event("bf2042-portal-extensions-paste");
            document.dispatchEvent(event);
        });
    }

    function isCopyBlobToClipboardSupported() {
        return window.ClipboardItem !== undefined;
    }

    function logError(message, error) {
        console.log(`[ERROR] ${message}`, error);
    }

    function loadFromLocalStorage(key) {
        const data = localStorage.getItem(key);

        try {
            if (typeof data === "string") {
                return JSON.parse(data);
            }
        } catch (e) {
            //Do nothing
        }

        return {};
    }

    function saveToLocalStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    return {
        init: init,
        copyTextToClipboard: copyTextToClipboard,
        copyBlobToClipboard: copyBlobToClipboard,
        pasteTextFromClipboard: pasteTextFromClipboard,
        isCopyBlobToClipboardSupported: isCopyBlobToClipboardSupported,
        loadFromLocalStorage: loadFromLocalStorage,
        saveToLocalStorage: saveToLocalStorage,
        logError: logError,
    };
})();
