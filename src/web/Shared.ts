let pasteTextFromClipboardImplementation: () => Promise<string> =
    pasteTextFromClipboardDefault;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let pasteTextFromClipboardFirefoxCallback = (_text: string): void => {
    //Do nothing
};

export function init(): void {
    //NOTE: If readText is not available, we are going to assume this is Firefox.
    if (navigator.clipboard.readText !== undefined) {
        return;
    }

    pasteTextFromClipboardImplementation = pasteTextFromClipboardFirefox;

    window.addEventListener(
        "bf2042-portal-extensions-paste",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async function (message: any) {
            pasteTextFromClipboardFirefoxCallback(message.detail);
        },
    );
}

async function copyTextToClipboard(text: string): Promise<void> {
    return await navigator.clipboard.writeText(text);
}

async function copyBlobToClipboard(blobData: Blob): Promise<void> {
    return await navigator.clipboard.write([
        new ClipboardItem({ [blobData.type]: blobData }),
    ]);
}

async function pasteTextFromClipboard(): Promise<string> {
    return await pasteTextFromClipboardImplementation();
}

async function pasteTextFromClipboardDefault(): Promise<string> {
    return await navigator.clipboard.readText();
}

async function pasteTextFromClipboardFirefox(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/typedef
    return new Promise<string>((resolve, reject) => {
        pasteTextFromClipboardFirefoxCallback = (clipboard: string): void => {
            if (clipboard) {
                resolve(clipboard);
            } else {
                reject();
            }
        };

        const event: Event = new Event("bf2042-portal-extensions-paste");
        document.dispatchEvent(event);
    });
}

function isCopyBlobToClipboardSupported(): boolean {
    return window.ClipboardItem !== undefined;
}

function logError(message: string, error: Error): void {
    console.log(`[ERROR] ${message}`, error);
}

function loadFromLocalStorage<T>(key: string): T {
    const data: string = localStorage.getItem(key);

    try {
        if (typeof data === "string") {
            return JSON.parse(data) as T;
        }
    } catch (e) {
        //Do nothing
    }

    return {} as T;
}

function saveToLocalStorage<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
}

export default {
    copyTextToClipboard: copyTextToClipboard,
    copyBlobToClipboard: copyBlobToClipboard,
    pasteTextFromClipboard: pasteTextFromClipboard,
    isCopyBlobToClipboardSupported: isCopyBlobToClipboardSupported,
    loadFromLocalStorage: loadFromLocalStorage,
    saveToLocalStorage: saveToLocalStorage,
    logError: logError,
};
