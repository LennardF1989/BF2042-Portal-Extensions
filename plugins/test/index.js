/* global BF2042Portal, _Blockly */
(function () {
    const plugin = BF2042Portal.Plugins.getPlugin("test");

    plugin.initializeWorkspace = function () {
        console.log("initializeWorkspace");
    };

    const testExtensionVersion = {
        id: "testExtensionVersion",
        displayText: "Extension Version",
        scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
        weight: 100,
        preconditionFn: () => "enabled",
        callback: function () {
            console.log(plugin.getExtensionVersion());
        },
    };

    const testUrl = {
        id: "testUrl",
        displayText: "URL",
        scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
        weight: 100,
        preconditionFn: () => "enabled",
        callback: function () {
            console.log(plugin.getUrl("manifest.json"));
        },
    };

    const testErrorLog = {
        id: "testErrorLog",
        displayText: "Error Log",
        scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
        weight: 100,
        preconditionFn: () => "enabled",
        callback: function () {
            BF2042Portal.Shared.logError("Error Test", "Error Test");
        },
    };

    const testClipboard = {
        id: "testClipboard",
        displayText: "Clipboard",
        scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
        weight: 100,
        preconditionFn: () => "enabled",
        callback: async function () {
            await BF2042Portal.Shared.copyTextToClipboard(
                "This text has been copied to and pasted from the clipboard!",
            );
            const pasteResult =
                await BF2042Portal.Shared.pasteTextFromClipboard();

            console.log(pasteResult);
        },
    };

    const testSelectedBlocks = function (id, scope) {
        function precondition() {
            return "enabled";
        }

        async function callback(scope) {
            const blocks = plugin.getSelectedBlocks(scope) || [];

            console.log(blocks);
        }

        return {
            id: id,
            displayText: "Selected Blocks",
            scopeType: scope,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    };

    const testMouseCoords = function (id, scope) {
        function precondition() {
            return "enabled";
        }

        async function callback() {
            console.log(plugin.getMouseCoords());
        }

        return {
            id: id,
            displayText: "Mouse Coords",
            scopeType: scope,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    };

    const testCustomContextMenu = function (id, scope) {
        function precondition() {
            return "enabled";
        }

        function callback(scope) {
            const menuItems = [
                {
                    text: "Option 1",
                    enabled: true,
                    callback: () =>
                        console.log("Option 1 has been chosen!", scope),
                },
                {
                    text: "Option 2",
                    enabled: true,
                    callback: () =>
                        console.log("Option 2 has been chosen!", scope),
                },
            ];

            plugin.showContextMenuWithBack(menuItems);
        }

        return {
            id: id,
            displayText: "Custom Context Menu >",
            scopeType: scope,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    };

    const testSelectedBlocksWorkspace = testSelectedBlocks(
        "testSelectedBlocksWorkspace",
        _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    );
    const testSelectedBlocksBlock = testSelectedBlocks(
        "testSelectedBlocksBlock",
        _Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    );
    const testMouseCoordsWorkspace = testMouseCoords(
        "testMouseCoordsWorkspace",
        _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    );
    const testMouseCoordsBlock = testMouseCoords(
        "testMouseCoordsBlock",
        _Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    );
    const testCustomContextMenuWorkspace = testCustomContextMenu(
        "testCustomContextMenuWorkspace",
        _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    );
    const testCustomContextMenuBlock = testCustomContextMenu(
        "testCustomContextMenuBlock",
        _Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    );

    const testWorkspaceMenu = plugin.createMenu(
        "testWorkspace",
        "Test",
        _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    );
    testWorkspaceMenu.options = [
        "items.testExtensionVersion",
        "items.testUrl",
        "items.testErrorLog",
        "items.testClipboard",
        "items.testSelectedBlocksWorkspace",
        "items.testMouseCoordsWorkspace",
        "items.separatorWorkspace",
        "menus.testSubMenuWorkspace",
        "items.testCustomContextMenuWorkspace",
    ];

    const testSubMenuWorkspace = plugin.createMenu(
        "testSubMenuWorkspace",
        "Sub Menu",
        _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    );
    testSubMenuWorkspace.options = [
        "items.testExtensionVersion",
        "items.separatorWorkspace",
        "menus.testWorkspace",
    ];

    const testBlockMenu = plugin.createMenu(
        "testBlock",
        "Test",
        _Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    );
    testBlockMenu.options = [
        "items.testSelectedBlocksBlock",
        "items.testMouseCoordsBlock",
        "items.separatorBlock",
        "items.testCustomContextMenuBlock",
    ];

    plugin.registerMenu(testWorkspaceMenu);
    plugin.registerMenu(testSubMenuWorkspace);
    plugin.registerMenu(testBlockMenu);

    plugin.registerItem(testExtensionVersion);
    plugin.registerItem(testUrl);
    plugin.registerItem(testErrorLog);
    plugin.registerItem(testClipboard);
    plugin.registerItem(testSelectedBlocksWorkspace);
    plugin.registerItem(testSelectedBlocksBlock);
    plugin.registerItem(testMouseCoordsWorkspace);
    plugin.registerItem(testMouseCoordsBlock);
    plugin.registerItem(testCustomContextMenuWorkspace);
    plugin.registerItem(testCustomContextMenuBlock);

    _Blockly.ContextMenuRegistry.registry.register(testWorkspaceMenu);
    _Blockly.ContextMenuRegistry.registry.register(testBlockMenu);
})();
