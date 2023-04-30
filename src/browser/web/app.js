const BF2042Portal = {};

BF2042Portal.Startup = (function () {
    let version;
    let manifest;
    let blockDefinitions;

    function getVersion() {
        return version;
    }

    function getManifest() {
        return manifest;
    }

    function getBlockDefinitions() {
        return blockDefinitions;
    }

    function initExtension() {
        return new Promise(function(resolve, _reject) { 
            window.addEventListener("bf2042-portal-extensions-init", async function (message) {
                version = message.detail.version;
    
                if(!message.detail.manifest || !message.detail.manifest.url) {
                    alert("Failed to load BF2042 Portal Extensions, please check the options!");
    
                    return;
                }
    
                manifest = message.detail.manifest;
    
                resolve(message.detail);
            });
    
            const event = new Event("bf2042-portal-extensions-init");
            document.dispatchEvent(event);
        });
    }

    function hookBlockDefinitions() {
        return new Promise(function(resolve, _reject) {
            const originalFunction = console.debug;

            console.debug = function () {
                if (arguments.length === 2 && arguments[0] === "Frostbite Block Definitions") {
                    blockDefinitions = arguments[1];
    
                    console.debug = originalFunction;

                    resolve();
                }
            }
        });
    }

    function init() {
        const promise1 = initExtension();
        const promise2 = hookBlockDefinitions();

        Promise.all([promise1, promise2]).then(function() {
            const scriptElement = document.createElement("script");
            scriptElement.setAttribute("type", "text/javascript");
            scriptElement.setAttribute("src", manifest.url);
    
            document.body.appendChild(scriptElement);

            console.log(`BF2042 Portal Extension v${version} loaded successfully!`);
        });
    }

    return {
        init: init,
        getVersion: getVersion,
        getManifest: getManifest,
        getBlockDefinitions: getBlockDefinitions
    }
})();

BF2042Portal.Startup.init();