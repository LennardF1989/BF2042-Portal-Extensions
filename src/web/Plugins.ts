/// <reference path="App.ts"/>

BF2042Portal.Plugins = (function () {
    //NOTE: Represents a Plugin-class
    function Plugin(baseUrl, manifest) {
        this.baseUrl = baseUrl;
        this.manifest = manifest;

        this.initializeWorkspace = function () {
            //Do nothing
        };

        this.getUrl = function (relativeUrl) {
            return `${baseUrl}/${relativeUrl}`;
        };

        this.getMouseCoords = function () {
            return initData.api.getMouseCoords();
        };

        this.getSelectedBlocks = function () {
            return initData.api.getSelectedBlocks();
        };

        this.showContextMenuWithBack = function (options) {
            return initData.api.showContextMenuWithBack(options);
        };

        this.registerMenu = function (menu) {
            return initData.api.registerMenu(menu);
        };

        this.registerItem = function (item) {
            return initData.api.registerItem(item);
        };

        this.createMenu = function (id, scopeType, scope) {
            return initData.api.createMenu(id, scopeType, scope);
        };

        this.getExtensionVersion = function () {
            return initData.version;
        };
    }

    const plugins = {};

    let initData;

    function init(data) {
        initData = data;

        if (data.pluginManager) {
            loadPluginManager(data.pluginManager);
        }
    }

    function loadPluginManager(pluginManager) {
        loadPlugin({
            baseUrl: pluginManager.baseUrl,
            manifest: {
                id: "plugin-manager",
                loadAsModule: pluginManager.loadAsModule || false,
                main: pluginManager.main,
            },
        });
    }

    function loadPlugin(pluginData) {
        try {
            const plugin = new Plugin(pluginData.baseUrl, pluginData.manifest);
            plugins[pluginData.manifest.id] = plugin;

            const scriptElement = document.createElement("script");
            scriptElement.setAttribute(
                "type",
                pluginData.manifest.loadAsModule ? "module" : "text/javascript",
            );
            scriptElement.setAttribute(
                "src",
                plugin.getUrl(pluginData.manifest.main),
            );
            scriptElement.addEventListener("load", function () {
                plugin.initializeWorkspace();
            });

            document.body.appendChild(scriptElement);
        } catch (e) {
            BF2042Portal.Shared.logError(
                `Failed to load plugin '${pluginData.manifest.name}''`,
                e,
            );
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
        getPlugin: getPlugin,
        loadPlugin: loadPlugin,
    };
})();
