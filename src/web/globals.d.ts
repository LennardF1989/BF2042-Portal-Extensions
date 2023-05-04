import Extensions from "./Extensions";
import Plugins, { PluginManagerManifest } from "./Plugins";
import Shared from "./Shared";

declare global {
    const Blockly: unknown;
    const _Blockly: {
        ContextMenu: {
            // eslint-disable-next-line @typescript-eslint/ban-types
            show: Function;
        };
        // eslint-disable-next-line @typescript-eslint/ban-types
        inject: Function;
    };

    interface BF2042Portal {
        Startup: Startup;
        Extensions: typeof Extensions;
        Plugins: typeof Plugins;
        Shared: typeof Shared;
    }

    interface Startup {
        /**
         * Should be considered private, as this is called by Startup itself when the Browser Extension injects the script.
         */
        init: () => void;

        getVersion: () => string;
        getManifest: () => ExtensionManifest;
        getBlockDefinitions: () => unknown;
    }

    interface ExtensionManifest {
        name: string;
        url: string;
        pluginManager: PluginManagerManifest;
    }

    const BF2042Portal: BF2042Portal;
}
