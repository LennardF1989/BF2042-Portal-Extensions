const app = angular.module("bf2042", ["ngRoute"]);

app.factory("api", function () {
    let config = {};

    function initialize() {
        window.parent.postMessage({
            type: "plugin-manager",
            action: "initialize"
        }, "*");
    }

    function handleEvent(e) {
        if(!e.data || e.data.type !== "plugin-manager") {
            return;
        }
    
        const eventData = e.data;
    
        if(eventData.action === "load") {
            if(!eventData.payload) {
                return;
            }
    
            config = eventData.payload;

            $scope.$broadcast("reloadConfig");
        }
    }

    function getConfig() {
        return config;
    }

    function saveConfig() {
        if(!config) {
            return;
        }

        window.parent.postMessage({
            type: "plugin-manager",
            action: "save",
            payload: config
        }, "*");
    }

    function closeIframe() {
        window.parent.postMessage({
            type: "plugin-manager",
            action: "close"
        }, "*");
    }

    return {
        initialize: initialize,
        handleEvent: handleEvent,
        getConfig: getConfig,
        saveConfig: saveConfig,
        closeIframe: closeIframe
    }
});

app.config(function ($routeProvider) {
    $routeProvider
        .when("/plugins", {
            templateUrl: "views/plugins.html"
        })
        .otherwise({
            redirectTo: "/plugins"
        });
});

app.controller("MainController", function (api) {
    const vm = this;

    vm.version = "1.0.0";

    vm.$onInit = function() {
        api.initialize();
    }

    vm.close = function() {
        api.closeIframe();   
    }

    window.addEventListener("message", (e) => {
        api.handleEvent(e);
    });
});

app.controller("PluginsController", function ($scope, api) {
    const vm = this;

    let config;

    vm.$onInit = function () {
        reloadConfig();
    }

    function reloadConfig() {
        config = api.getConfig();
        config.plugins = config.plugins || [];

        vm.plugins = config.plugins;
    }

    vm.showModal = function () {
        resetModal();
        openModal();
    }

    vm.toggleEnable = function (plugin) {
        plugin.enabled = !plugin.enabled;

        api.saveConfig();
    }

    vm.update = async function (plugin) {
        if (!plugin.liveReload && !confirm(`Are you sure you wish to update '${plugin.manifest ? plugin.manifest.name : "Unknown"}'?`)) {
            return;
        }

        resetModal();

        vm.pluginManifestUrl = plugin.manifestUrl;

        vm.pluginUpdate = true;

        await vm.reviewPlugin();

        if (plugin.liveReload) {
            vm.confirmPlugin();
        }
        else {
            openModal();
        }

        $scope.$apply();
    }

    vm.delete = function (plugin) {
        if (!confirm(`Are you sure you wish to remove '${plugin.manifest ? plugin.manifest.name : "Unknown"}'?`)) {
            return;
        }

        const index = config.plugins.findIndex(e => e === plugin);
        config.plugins.splice(index, 1);

        api.saveConfig();
    }

    vm.reviewPlugin = async function () {
        vm.pluginManifestError = undefined;

        try {
            if (!vm.pluginManifestUrl.endsWith("/manifest.json")) {
                throw "Invalid URL: has to end with /manifest.json!";
            }

            const manifestResponse = await fetch(vm.pluginManifestUrl);
            const manifestJson = await manifestResponse.json();

            if (!manifestJson.id || !manifestJson.name || !manifestJson.version || !manifestJson.main) {
                throw "Invalid manifest: id, name, version and main are required!";
            }

            vm.pluginManifest = manifestJson;

            const baseUrl = vm.pluginManifestUrl.replace("/manifest.json", "");
            const mainResponse = await fetch(`${baseUrl}/${manifestJson.main}`);
            const mainText = await mainResponse.text();

            vm.pluginBaseUrl = baseUrl;
            vm.pluginMainContent = mainText;
            vm.pluginConfirm = true;
        }
        catch (e) {
            vm.pluginManifestError = e;
        }

        $scope.$apply();
    }

    vm.confirmPlugin = function () {
        config.plugins = config.plugins || [];

        const index = config.plugins.findIndex(e => e.manifestUrl === vm.pluginManifestUrl);
        const plugin = config.plugins[index];

        if (vm.pluginUpdate && index > -1) {
            config.plugins.splice(index, 1);
        }
        else if (index > -1) {
            resetModal();
            closeModal();

            return;
        }

        config.plugins.push({
            enabled: plugin ? plugin.enabled : true,
            baseUrl: vm.pluginBaseUrl,
            manifestUrl: vm.pluginManifestUrl.trim(),
            manifest: vm.pluginManifest
        });

        api.saveConfig();

        vm.plugins = config.plugins;

        resetModal();
        closeModal();
    }

    function openModal() {
        $("#add-plugin-modal").modal("show");
    }

    function closeModal() {
        $("#add-plugin-modal").modal("hide");
    }

    function resetModal() {
        vm.pluginUpdate = undefined;
        vm.pluginManifestError = undefined;
        vm.pluginManifestUrl = undefined;
        vm.pluginManifest = undefined;
        vm.pluginBaseUrl = undefined;
        vm.pluginMainContent = undefined;
        vm.pluginConfirm = undefined;
    }

    $scope.$on("reloadConfig", function() {
        reloadConfig();

        $scope.$apply();
    });
});