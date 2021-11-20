const BF2042PortalExtensions = (function () {
    const mouseCoords = {
        x: 0,
        y: 0
    };

    const contextMenuStack = [];
    let lastContextMenu = undefined;

    const blockLookup = [];
    const blockLookupOverride = [{
        type: "ruleBlock",
        name: "Rule"
    },
    {
        type: "conditionBlock",
        name: "Condition"
    },
    {
        type: "Boolean",
        name: "Boolean"
    },
    {
        type: "Text",
        name: "Text"
    },
    {
        type: "Number",
        name: "Number"
    }];

    let workspaceInitialized = false;

    const copyToClipboard = (function () {
        const errorMessage = "Failed to copy to clipboard!";

        function precondition() {
            return "enabled";
        }

        async function callback(scope) {
            try {
                const xmlDom = _Blockly.Xml.blockToDom(scope.block);
                _Blockly.Xml.deleteNext(xmlDom);

                const xmlText = _Blockly.Xml.domToPrettyText(xmlDom);

                await navigator.clipboard.writeText(xmlText);
            }
            catch (e) {
                logError(errorMessage, e);

                alert(errorMessage);
            }
        }

        return {
            id: "copyToClipboard",
            displayText: "Copy to Clipboard",
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.BLOCK,
            weight: 100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    const pasteFromClipboard = (function () {
        const errorMessage = "Failed to paste from clipboard!";
        let pasteFromClipboardFn = pasteFromClipboard;

        //NOTE: Unfortunately precondition cannot be async, so we cannot check if the clipboard contains valid XML beforehand.
        function precondition() {
            return "enabled";
        }

        async function callback() {
            try {
                const xmlText = await pasteFromClipboardFn();

                if (!xmlText || !xmlText.startsWith("<block")) {
                    return;
                }

                const domText = `<xml xmlns="https://developers.google.com/blockly/xml">${xmlText}</xml>`;

                const xmlDom = _Blockly.Xml.textToDom(domText);
                const blockId = _Blockly.Xml.domToWorkspace(xmlDom, _Blockly.getMainWorkspace())[0];

                const block = _Blockly.getMainWorkspace().getBlockById(blockId);
                block.moveTo(mouseCoords);
            }
            catch (e) {
                logError(errorMessage, e);

                alert(errorMessage);
            }
        }

        async function pasteFromClipboard() {
            return await navigator.clipboard.readText();
        }

        async function pasteFromClipboardFirefox() {
            return new Promise((resolve, reject) => {
                pasteFromClipboardFirefoxCallback = (clipboard) => {
                    if (clipboard) {
                        resolve(clipboard);
                    }
                    else {
                        reject();
                    }
                };

                const event = new Event("bf2042-portal-extension-paste");
                document.dispatchEvent(event);
            });
        }

        let pasteFromClipboardFirefoxCallback;

        function init() {
            //NOTE: If readText is not available, we are going to assume this is Firefox.
            if (!navigator.clipboard.readText !== undefined) {
                return;
            }

            pasteFromClipboardFn = pasteFromClipboardFirefox;

            window.addEventListener("bf2042-portal-extension-paste", async function (message) {
                pasteFromClipboardFirefoxCallback(message.detail);
            });
        }

        init();

        return {
            id: "pasteFromClipboard",
            displayText: "Paste from Clipboard",
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    const toggleComments = (function () {
        function displayText(scope) {
            return scope.block.getCommentIcon()
                ? "Remove Comment"
                : "Add Comment";
        }

        function precondition() {
            return "enabled";
        }

        async function callback(scope) {
            scope.block.getCommentIcon() ? scope.block.setCommentText(null) : scope.block.setCommentText("");
        }

        return {
            id: "toggleComments",
            displayText: displayText,
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.BLOCK,
            weight: 100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    const toggleInputs = (function () {
        function displayText(scope) {
            return scope.block.getInputsInline()
                ? "Show Inputs Vertically"
                : "Show Inputs Horizontally";
        }

        function precondition() {
            return "enabled";
        }

        async function callback(scope) {
            scope.block.setInputsInline(!scope.block.getInputsInline());
        }

        return {
            id: "toggleInputs",
            displayText: displayText,
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.BLOCK,
            weight: 100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    const toggleCollapse = (function () {
        function displayText(scope) {
            return scope.block.isCollapsed()
                ? "Expand Block"
                : "Collapse Block";
        }

        function precondition() {
            return "enabled";
        }

        async function callback(scope) {
            scope.block.setCollapsed(!scope.block.isCollapsed());
        }

        return {
            id: "toggleCollapse",
            displayText: displayText,
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.BLOCK,
            weight: 100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    const collapseAllBlocks = (function () {
        function precondition() {
            return "enabled";
        }

        async function callback() {
            const workspace = _Blockly.getMainWorkspace();

            for (const blockID in workspace.blockDB_) {
                workspace.blockDB_[blockID].setCollapsed(true);
            }
        }

        return {
            id: "collapseAllBlocks",
            displayText: "Collapse All Blocks",
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    const expandAllBlocks = (function () {
        function precondition() {
            return "enabled";
        }

        async function callback() {
            const workspace = _Blockly.getMainWorkspace();

            for (const blockID in workspace.blockDB_) {
                workspace.blockDB_[blockID].setCollapsed(false);
            }
        }

        return {
            id: "expandAllBlocks",
            displayText: "Expand All Blocks",
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    const deleteModBlock = (function () {
        function precondition(scope) {
            if (scope.block.type === "modBlock" && getBlocksByType("modBlock").length > 1) {
                return "enabled";
            }

            return "hidden";
        }

        async function callback(scope) {
            scope.block.dispose(false, false);
        }

        //Based on: https://groups.google.com/g/blockly/c/4mfShJDY6-k
        function getBlocksByType(type) {
            const blocks = [];
            const workspace = _Blockly.getMainWorkspace();

            for (const blockID in workspace.blockDB_) {
                if (workspace.blockDB_[blockID].type == type) {
                    blocks.push(workspace.blockDB_[blockID]);
                }
            }

            return blocks;
        }

        return {
            id: "deleteModBlock",
            displayText: "Delete Mod Block",
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.BLOCK,
            weight: 100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    const openDocumentation = (function () {
        const documentationUrl = "https://docs.bfportal.gg/docs/generated";

        function precondition() {
            return "enabled";
        }

        async function callback() {
            window.open(documentationUrl, "bf2142_documentation");
        }

        return {
            id: "openDocumentation",
            displayText: "Open Documentation",
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    const jumpToSubRoutine = (function () {
        function precondition(scope) {
            if (scope.type === "subroutineInstanceBlock") {
                return "hidden";
            }

            return "enabled";
        }

        async function callback(scope) {
            const subroutineName = scope.block.getFieldValue("SUBROUTINE_NAME");

            const foundBlocks = _Blockly
                .getMainWorkspace()
                .getBlocksByType("subroutineBlock", false)
                .filter(e => e.getFieldValue("SUBROUTINE_NAME") === subroutineName);

            if (foundBlocks.length > 0) {
                _Blockly.getMainWorkspace().centerOnBlock(foundBlocks[0].id);
            }
        }

        return {
            id: "jumpToSubRoutine",
            displayText: "Jump to Subroutine",
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.BLOCK,
            weight: 100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    const toggleDistractionFreeMode = (function () {
        function precondition() {
            return "enabled";
        }

        async function callback() {
            document.querySelector("app-root").classList.toggle("distraction-free");
        }

        return {
            id: "toggleDistractionFreeMode",
            displayText: "Toggle Distraction-Free Mode",
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    const exportBlocksToJSON = (function () {
        function precondition() {
            return "enabled";
        }

        async function callback() {
            const saveData = save();

            if (!saveData) {
                alert("Failed to export workspace!");

                return;
            }

            const result = JSON.stringify(saveData, null, 4);

            const linkElement = document.createElement("a");
            linkElement.setAttribute("href", `data:application/json;charset=utf-8,${encodeURIComponent(result)}`);
            linkElement.setAttribute("download", "workspace.json");
            linkElement.style.display = "none";

            document.body.appendChild(linkElement);
            linkElement.click();
            document.body.removeChild(linkElement);
        }

        return {
            id: "exportBlocksToJSON",
            displayText: "Export Blocks to JSON",
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    const importBlocksFromJSON = (function () {
        function precondition() {
            return "enabled";
        }

        async function callback() {
            const inputElement = document.createElement("input");
            inputElement.setAttribute("type", "file");
            inputElement.setAttribute("accept", ".json");
            inputElement.style.display = "none";

            inputElement.addEventListener("change", function () {
                if (!inputElement.files || inputElement.files.length === 0) {
                    return;
                }

                const fileReader = new FileReader;
                fileReader.onload = function (e) {
                    if (confirm("Do you want to remove all existing blocks before importing?")) {
                        _Blockly.getMainWorkspace().clear();
                    }

                    try {
                        const loadData = JSON.parse(e.target.result);

                        if (!load(loadData)) {
                            alert("Failed to import workspace!");
                        }
                    }
                    catch (e) {
                        alert("Failed to import workspace!");
                    }
                }

                fileReader.readAsText(inputElement.files[0]);
            });

            document.body.appendChild(inputElement);
            inputElement.click();
            document.body.removeChild(inputElement);
        }

        return {
            id: "importBlocksFromJSON",
            displayText: "Import Blocks from JSON",
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    const addBlock = (function () {
        function precondition() {
            return "enabled";
        }

        //TODO: Variables/Subroutines
        async function callback() {
            const toolbox = _Blockly.getMainWorkspace().getToolbox().toolboxDef_;

            const categories = [];

            for (let i = 0; i < toolbox.contents.length; i++) {
                const entry = toolbox.contents[i];

                if (entry.kind !== "CATEGORY" || !entry.name || !entry.contents) {
                    continue;
                }

                const existingCategory = categories.find(e => e.name === entry.name);

                if (existingCategory) {
                    entry.contents.forEach(e => existingCategory.contents.push(e));
                }
                else {
                    categories.push({
                        name: entry.name,
                        contents: entry.contents
                    });
                }
            }

            const options = [];

            for (let i = 0; i < categories.length; i++) {
                const entry = categories[i];

                options.push({
                    text: titleCase(entry.name),
                    enabled: true,
                    callback: function () {
                        const subOptions = [];

                        for (let i2 = 0; i2 < entry.contents.length; i2++) {
                            const entry2 = entry.contents[i2];

                            if (entry2.kind !== "BLOCK") {
                                continue;
                            }

                            let name = entry2.displayName;

                            if (!name) {
                                const blockName = blockLookupOverride.find(e => e.type == entry2.type);
                                name = blockName ? blockName.name : undefined;
                            }

                            if (!name) {
                                const blockName = blockLookup.find(e => e.type == entry2.type);
                                name = blockName ? blockName.name : entry2.type;
                            }

                            subOptions.push({
                                text: name,
                                enabled: true,
                                callback: function () {
                                    const block = _Blockly.getMainWorkspace().newBlock(entry2.type);
                                    block.initSvg();
                                    block.render();
                                    block.moveTo(mouseCoords);
                                }
                            });
                        }

                        showContextMenuWithBack(subOptions.sort(sortByText));
                    }
                });
            }

            showContextMenuWithBack(options.sort(sortByText));
        }

        //Based on: https://stackoverflow.com/questions/32589197/how-can-i-capitalize-the-first-letter-of-each-word-in-a-string-using-javascript
        function titleCase(str) {
            return str.split(" ").map(s => s.charAt(0).toUpperCase() + s.substr(1).toLowerCase()).join(" ")
        }

        function sortByText(a, b) {
            return a.text > b.text ? 1 : -1;
        }

        return {
            id: "addBlock",
            displayText: "Add Block >",
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
            weight: -100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    //Based on: https://groups.google.com/g/blockly/c/LXnMujtEzJY/m/FKQjI4OwAwAJ
    document.addEventListener("mousedown", function (event) {
        const mainWorkspace = _Blockly.getMainWorkspace();

        if (!mainWorkspace) {
            return;
        }

        // Gets the x and y position of the cursor relative to the workspace's parent svg element.
        const mouseXY = _Blockly.utils.mouseToSvg(
            event,
            mainWorkspace.getParentSvg(),
            mainWorkspace.getInverseScreenCTM()
        );

        // Gets where the visible workspace starts in relation to the workspace's parent svg element.
        const absoluteMetrics = mainWorkspace.getMetricsManager().getAbsoluteMetrics();

        // In workspace coordinates 0,0 is where the visible workspace starts.
        mouseXY.x -= absoluteMetrics.left;
        mouseXY.y -= absoluteMetrics.top;

        // Takes into account if the workspace is scrolled.
        mouseXY.x -= mainWorkspace.scrollX;
        mouseXY.y -= mainWorkspace.scrollY;

        // Takes into account if the workspace is zoomed in or not.
        mouseXY.x /= mainWorkspace.scale;
        mouseXY.y /= mainWorkspace.scale;

        mouseCoords.x = mouseXY.x;
        mouseCoords.y = mouseXY.y;
    });

    function save() {
        const workspace = _Blockly.getMainWorkspace();

        try {
            return {
                mainWorkspace: _Blockly.Xml.domToText(_Blockly.Xml.workspaceToDom(workspace, false)),
                variables: _Blockly.Xml.domToText(_Blockly.Xml.variablesToDom(workspace.getAllVariables()))
            };
        } catch (e) {
            logError("Failed to save workspace!", e);
        }

        return undefined;
    }

    function load(data) {
        const workspace = _Blockly.getMainWorkspace();

        try {
            const variables = _Blockly.Xml.textToDom(data.variables ? data.variables : "<xml />");

            _Blockly.Xml.domToVariables(variables, workspace);
            _Blockly.Xml.domToWorkspace(_Blockly.Xml.textToDom(data.mainWorkspace), workspace);

            return true;
        } catch (e) {
            logError("Failed to load workspace!", e);
        }

        return false;
    }

    function showContextMenuWithBack(options) {
        contextMenuStack.push(lastContextMenu.options);

        _Blockly.ContextMenu.show(lastContextMenu.e, [].concat({
            text: "< Back",
            enabled: true,
            callback: () => {
                const menu = contextMenuStack.splice(contextMenuStack.length - 1, 1);

                _Blockly.ContextMenu.show(lastContextMenu.e, menu[0], lastContextMenu.rtl);
            }
        }).concat(options), lastContextMenu.rtl);
    }

    function logError(message, error) {
        console.log(`[ERROR] ${message}`, error);
    }

    function cssFixes() {
        const styleElement = document.createElement("style");
        styleElement.setAttribute("type", "text/css");

        styleElement.innerHTML = `
            .blocklyMenu {
                overflow-y: hidden !important;
            }

            .distraction-free ea-network-nav, .distraction-free ea-local-nav-advanced {
                display: none;
            }

            .distraction-free > div.app {
                padding-top: 0;
            }
        `;

        document.head.appendChild(styleElement);
    }

    function hookContextMenu() {
        const originalShow = _Blockly.ContextMenu.show;

        _Blockly.ContextMenu.show = (e, options, rtl) => {
            lastContextMenu = {
                e,
                options,
                rtl
            };

            return originalShow(e, options, rtl);
        }
    }

    function hookWorkspaceSvg() {
        const originalWorkspaceSvg = _Blockly.Workspace.prototype.constructor;

        _Blockly.Workspace.prototype.constructor = function () {
            originalWorkspaceSvg.apply(this, arguments);

            if (!workspaceInitialized && Object.keys(_Blockly.Blocks).length > 0) {
                initializeBlocks();
            }
        }
    }

    function initializeBlocks() {
        workspaceInitialized = true;

        const workspace = _Blockly.getMainWorkspace();

        for (const block in _Blockly.Blocks) {
            const tempBlock = workspace.newBlock(block, undefined);
            tempBlock.init();

            try {
                blockLookup.push({
                    type: block,
                    name: tempBlock.inputList[0].fieldRow[0].value_
                });
            }
            catch {
                //Do nothing
            }

            tempBlock.dispose();
        }
    }

    function init() {
        cssFixes();
        hookContextMenu();
        hookWorkspaceSvg();

        _Blockly.ContextMenuRegistry.registry.register(addBlock);
        _Blockly.ContextMenuRegistry.registry.register(deleteModBlock);
        _Blockly.ContextMenuRegistry.registry.register(jumpToSubRoutine);
        _Blockly.ContextMenuRegistry.registry.register(toggleComments);
        _Blockly.ContextMenuRegistry.registry.register(toggleInputs);
        _Blockly.ContextMenuRegistry.registry.register(toggleCollapse);
        _Blockly.ContextMenuRegistry.registry.register(collapseAllBlocks);
        _Blockly.ContextMenuRegistry.registry.register(expandAllBlocks);
        _Blockly.ContextMenuRegistry.registry.register(openDocumentation);
        _Blockly.ContextMenuRegistry.registry.register(toggleDistractionFreeMode);
        _Blockly.ContextMenuRegistry.registry.register(exportBlocksToJSON);
        _Blockly.ContextMenuRegistry.registry.register(importBlocksFromJSON);
        _Blockly.ContextMenuRegistry.registry.register(copyToClipboard);
        _Blockly.ContextMenuRegistry.registry.register(pasteFromClipboard);
    }

    init();

    return {};
})();