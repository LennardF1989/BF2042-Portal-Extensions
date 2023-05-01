import { BlockSvg } from "blockly";
import {
    MenuOption,
    MouseCoords,
    PluginApi,
    RegistryMenuItem,
} from "./Extensions";
import {
    RegistryItem,
    Scope,
    ScopeType,
} from "blockly/core/contextmenu_registry";

interface BaseManifest {
    loadAsModule?: boolean;
    main: string;
}

export interface PluginManagerManifest extends BaseManifest {
    baseUrl: string;
}

interface PluginManifest extends BaseManifest {
    id: string;
    name?: string;
    version?: string;
    description?: string;
    author?: string;
}

interface PluginData {
    baseUrl: string;
    manifest: PluginManifest;
}

interface InitData {
    version: string;
    api: PluginApi;
    pluginManager?: PluginManagerManifest;
}

class BasePlugin {
    readonly initData: InitData;
    readonly baseUrl: string;
    readonly manifest: PluginManifest;

    constructor(initData: InitData, baseUrl: string, manifest: PluginManifest) {
        this.initData = initData;
        this.baseUrl = baseUrl;
        this.manifest = manifest;
    }

    public initializeWorkspace(): void {
        //Do nothing
    }

    public getUrl(relativeUrl: string): string {
        return `${this.baseUrl}/${relativeUrl}`;
    }

    public getMouseCoords(): MouseCoords {
        return this.initData.api.getMouseCoords();
    }

    public getSelectedBlocks(scope: Scope): Array<BlockSvg> {
        return this.initData.api.getSelectedBlocks(scope);
    }

    public showContextMenuWithBack(options: Array<MenuOption>): void {
        return this.initData.api.showContextMenuWithBack(options);
    }

    public registerMenu(menu: RegistryMenuItem): void {
        return this.initData.api.registerMenu(menu);
    }

    public registerItem(item: RegistryItem): void {
        return this.initData.api.registerItem(item);
    }

    public createMenu(
        id: string,
        name: string,
        scopeType: ScopeType,
    ): RegistryMenuItem {
        return this.initData.api.createMenu(id, name, scopeType);
    }

    public getExtensionVersion(): string {
        return this.initData.version;
    }
}

const plugins: Map<string, BasePlugin> = new Map<string, BasePlugin>();

let initData: InitData;

export function init(data: InitData): void {
    initData = data;

    if (data.pluginManager) {
        loadPluginManager(data.pluginManager);
    }
}

function loadPluginManager(pluginManager: PluginManagerManifest): void {
    loadPlugin({
        baseUrl: pluginManager.baseUrl,
        manifest: {
            id: "plugin-manager",
            loadAsModule: pluginManager.loadAsModule || false,
            main: pluginManager.main,
        },
    });
}

function loadPlugin(pluginData: PluginData): void {
    try {
        const plugin: BasePlugin = new BasePlugin(
            initData,
            pluginData.baseUrl,
            pluginData.manifest,
        );
        plugins.set(pluginData.manifest.id, plugin);

        const scriptElement: HTMLScriptElement =
            document.createElement("script");
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
            `Failed to load plugin '${
                pluginData.manifest?.name || pluginData.manifest.id
            }''`,
            e,
        );
    }
}

function initializeWorkspace(): void {
    for (const plugin of plugins.values()) {
        plugin.initializeWorkspace();
    }
}

function getPlugin(id: string): BasePlugin {
    const plugin: BasePlugin = plugins.get(id);

    if (!plugin) {
        throw `Plugin with id ${id} not found!`;
    }

    return plugin;
}

export default {
    initializeWorkspace: initializeWorkspace,
    getPlugin: getPlugin,
    loadPlugin: loadPlugin,
};
