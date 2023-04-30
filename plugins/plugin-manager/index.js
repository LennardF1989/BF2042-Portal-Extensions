(async function () {       
    const plugin = BF2042Portal.Plugins.getPlugin("plugin-manager");

    window.addEventListener("message", (e) => {
        if(!e.data || e.data.type !== "plugin-manager") {
            return;
        }

        const eventData = e.data;

        if(eventData.action === "initialize") {
            e.source.postMessage({
                type: "plugin-manager",
                action: "load",
                payload: getConfig()
            }, "*");
        }
        else if(eventData.action === "save") {
            saveConfig(eventData.payload);
        }
        else if(eventData.action === "close") {
            const pluginManagerDiv = document.getElementById("plugin-manager");
            
            if(pluginManagerDiv) {
                document.body.removeChild(pluginManagerDiv);
            }
        }
    });

    initializePlugins();
    initializeBlockly();

    function getConfig() {
        let config = {};

        let tempConfig = localStorage.getItem("plugin-manager-config");

        if(tempConfig) {
            try {
                config = JSON.parse(tempConfig);
            }
            catch(e) {
                //Do nothing
            }
        }

        return config;
    }
    
    function saveConfig(config) {
        if(!config) {
            return;
        }

        localStorage.setItem("plugin-manager-config", JSON.stringify(config));
    }

    function initializePlugins() {
        const config = getConfig();

        if(!config.plugins) {
            return;
        }

        for (let i = 0; i < config.plugins.length; i++) {
            const pluginData = config.plugins[i];

            if(!pluginData.enabled) {
                continue;
            }

            BF2042Portal.Plugins.loadPlugin(pluginData);
        }
    }

    function initializeBlockly() {
        const pluginManager = (function () {
            function precondition() {
                return "enabled";
            }
        
            async function callback() {
                let pluginManagerDiv = document.getElementById("plugin-manager");

                if(pluginManagerDiv) {
                    return;
                }

                pluginManagerDiv = document.createElement("div");
                pluginManagerDiv.style = `
                    background-color: rgba(0, 0, 0, 0.8); 
                    position: absolute; 
                    z-index: 9999; 
                    width: 100vw; height: 
                    100vh; 
                    top: 0;
                    left: 0; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                `;
                pluginManagerDiv.id = "plugin-manager";

                const iframe = document.createElement("iframe");
                iframe.src = plugin.getUrl("index.html");
                iframe.style = "width: 90vw; height: 90vh; border: 0; border-radius: 10px";
                iframe.id = "plugin-manager-iframe";

                pluginManagerDiv.appendChild(iframe);

                document.body.appendChild(pluginManagerDiv);
            }
        
            return {
                id: "pluginManager",
                displayText: "Plugin Manager",
                scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
                weight: 100,
                preconditionFn: precondition,
                callback: callback
            };
        })();
    
        plugin.registerItem(pluginManager);

        const optionsWorkspaceMenu = _Blockly.ContextMenuRegistry.registry.getItem("optionsWorkspace");
        optionsWorkspaceMenu.options.unshift("items.separatorWorkspace");
        optionsWorkspaceMenu.options.unshift("items.pluginManager");
    }
})();