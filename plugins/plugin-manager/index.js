(async function () {       
    const plugin = BF2042Portal.Plugins.getPlugin("plugin-manager");
    plugin.initializeWorkspace = initializeWorkspace;

    let initializedWorkspace = false;

    const plugins = {};

    //NOTE: Represents a Plugin-class
    function Plugin(baseUrl, manifest) {
        this.baseUrl = baseUrl;
        this.manifest = manifest;

        this.initializeWorkspace = function() {
            //Do nothing
        }

        this.getUrl = function (relativeUrl) {
            return `${baseUrl}/${relativeUrl}`;
        }

        this.getSelectedBlocks = function () {
            return plugin.getSelectedBlocks();
        }
    }

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
            const iframe = document.getElementById("plugin-manager-iframe");
            
            if(iframe) {
                document.body.removeChild(iframe);
            }
        }
    });

    hijackGetPlugin();
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

            loadPlugin(pluginData);
        }
    }

    async function loadPlugin(pluginData) {
        try {
            const plugin = new Plugin(pluginData.baseUrl, pluginData.manifest);
            plugins[pluginData.manifest.id] = plugin;

            const scriptElement = document.createElement("script");
            scriptElement.setAttribute("type", "text/javascript");
            scriptElement.setAttribute("src", plugin.getUrl(pluginData.manifest.main));

            scriptElement.onload = function() {
                if(!initializedWorkspace) {
                    return;
                }
                
                plugin.initializeWorkspace();
            }

            document.body.appendChild(scriptElement);
        }
        catch (e) {
            BF2042Portal.Shared.logError(`Failed to load plugin '${pluginData.manifest.name}''`, e);
        }
    }

    function initializeWorkspace() {
        initializedWorkspace = true;

        for(const pluginId in plugins) {
            plugins[pluginId].initializeWorkspace();
        }
    }

    function hijackGetPlugin() {
        const originalGetPlugin = BF2042Portal.Plugins.getPlugin;

        BF2042Portal.Plugins.getPlugin = function(id) {
            const plugin = plugins[id];

            if (plugin) {
                return plugin;
            }            

            return originalGetPlugin(id);
        }
    }

    function initializeBlockly() {
        const pluginManager = (function () {
            function precondition() {
                return "enabled";
            }
        
            async function callback() {
                let iframe = document.getElementById("plugin-manager-iframe");

                if(iframe) {
                    return;
                }

                iframe = document.createElement("iframe");
                iframe.src = plugin.getUrl("index.html");
                iframe.style = "position: absolute; z-index: 9999; width: 100vw; height: 100vh; top: 0; left: 0; border: 0;";
                iframe.id = "plugin-manager-iframe";

                document.body.appendChild(iframe);
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
    
        _Blockly.ContextMenuRegistry.registry.register(pluginManager);
    }
})();