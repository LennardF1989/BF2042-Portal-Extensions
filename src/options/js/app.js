const app = angular.module("bf2042", ["ngRoute"]);

app.factory("persistence", function () {
    let config = {};

    async function getConfig() {
        const result = await new Promise((resolve) => {
            chrome.storage.local.get(["config"], function(result) {
                resolve(result.config);
            });
        });

        config = result || {};

        return config;
    }

    function saveConfig() {
        chrome.storage.local.set({ "config": config });
    }

    return {
        getConfig: getConfig,
        saveConfig: saveConfig
    }
});

app.config(function ($routeProvider) {
    $routeProvider
        .when("/plugins", {
            templateUrl: "views/plugins.html"
        })
        .when("/snippets", {
            templateUrl: "views/snippets.html"
        })
        .otherwise({
            redirectTo: "/plugins"
        });
});

app.controller("MainController", function () {
    const vm = this;

    vm.version = chrome.runtime.getManifest().version;
});

app.controller("PluginsController", function ($scope, persistence) {
    const vm = this;

    let config;

    vm.$onInit = async function () {
        config = await persistence.getConfig();
        config.plugins = config.plugins || [];
        config.developerMode = config.developerMode || false;

        vm.plugins = config.plugins;
        vm.developerMode = config.developerMode;

        $scope.$apply();
    }

    vm.toggleDeveloperMode = function () {
        config.developerMode = !config.developerMode;

        if (!config.developerMode) {
            config.plugins.forEach(e => {
                e.liveReload = false;
            });
        }

        vm.developerMode = config.developerMode;

        persistence.saveConfig();
    }

    vm.showModal = function () {
        resetModal();
        openModal();
    }

    vm.toggleEnable = function (plugin) {
        plugin.enabled = !plugin.enabled;

        persistence.saveConfig();
    }

    vm.toggleLiveReload = function (plugin) {
        if (!plugin.liveReload && !confirm(`Are you sure you wish to enable live reload for '${plugin.manifest ? plugin.manifest.name : "Unknown"}'? This could affect performance and security!`)) {
            return;
        }

        plugin.liveReload = !plugin.liveReload;

        persistence.saveConfig();
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

        persistence.saveConfig();
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
            liveReload: plugin ? plugin.liveReload : false,
            baseUrl: vm.pluginBaseUrl,
            manifestUrl: vm.pluginManifestUrl.trim(),
            manifest: vm.pluginManifest,
            mainContent: vm.pluginMainContent
        });

        persistence.saveConfig();

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
});