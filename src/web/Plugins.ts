/// <reference path="App.ts"/>

BF2042Portal.Plugins = (function () {
    //NOTE: Represents a Plugin-class
    function Plugin(baseUrl, manifest) {
        this.baseUrl = baseUrl;
        this.manifest = manifest;

        this.initializeWorkspace = function () {
            //Do nothing
        }

        this.getUrl = function (relativeUrl) {
            return `${baseUrl}/${relativeUrl}`;
        }

        this.getMouseCoords = function () {
            return initData.api.getMouseCoords();
        }

        this.getSelectedBlocks = function () {
            return initData.api.getSelectedBlocks();
        }

        this.showContextMenuWithBack = function (options) {
            return initData.api.showContextMenuWithBack(options);
        }

        this.registerMenu = function (menu) {
            return initData.api.registerMenu(menu);
        }

        this.registerItem = function (item) {
            return initData.api.registerItem(item);
        }

        this.createMenu = function (id, scopeType, scope) {
            return initData.api.createMenu(id, scopeType, scope);
        }

        this.getExtensionVersion = function () {
            return initData.version;
        }
    }

    const plugins = {};

    let initData;

    function init(data) {
        initData = data;

        loadPlugins(data.plugins);
    }

    async function loadPlugins(plugins) {
        for (let i = 0; i < plugins.length; i++) {
            const pluginData = plugins[i];

            loadPlugin(pluginData);
        }
    }

    async function loadPlugin(pluginData) {
        try {
            const plugin = new Plugin(pluginData.baseUrl, pluginData.manifest);
            plugins[pluginData.manifest.id] = plugin;

            if (pluginData.liveReload) {
                const scriptElement = document.createElement("script");
                scriptElement.setAttribute("type", "text/javascript");
                scriptElement.setAttribute("src", plugin.getUrl(pluginData.manifest.main));

                document.body.appendChild(scriptElement);
            }
            else if (pluginData.mainContent) {
                const scriptElement = document.createElement("script");
                scriptElement.setAttribute("type", "text/javascript");
                scriptElement.innerHTML = `${pluginData.mainContent}\n//# sourceURL=${pluginData.manifest.id}.js`;

                document.body.appendChild(scriptElement);
            }
        }
        catch (e) {
            BF2042Portal.Shared.logError(`Failed to load plugin '${pluginData.manifest.name}''`, e);
        }
    }

    function initializeWorkspace() {
        for (const pluginId in plugins) {
            plugins[pluginId].initializeWorkspace();
        }
    }

    function getPlugin(id) {
        const plugin = plugins[id];

        if (!plugin) {
            throw `Plugin with id ${id} not found!`;
        }

        return plugin;
    }

    return {
        init: init,
        initializeWorkspace: initializeWorkspace,
        getPlugin: getPlugin
    };
})();