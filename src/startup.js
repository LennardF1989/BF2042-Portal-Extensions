if (navigator.clipboard.readText !== undefined) {
    document.addEventListener("bf2042-portal-extension-paste", async function () {
        const temp = document.createElement("input");
        document.body.appendChild(temp);

        temp.focus();
        
        const result = document.execCommand("paste");

        const event = new CustomEvent("bf2042-portal-extension-paste", {
            detail: result ? temp.value : undefined
        });

        window.dispatchEvent(event);

        document.body.removeChild(temp);
    });
}

const scriptElement = document.createElement("script");
scriptElement.setAttribute("type", "text/javascript");
scriptElement.setAttribute("src", chrome.runtime.getURL("/extensions.js"));
document.body.appendChild(scriptElement);