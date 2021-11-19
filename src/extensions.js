const BF2042PortalExtensions = (function () {
    const mouseCoords = {
        x: 0,
        y: 0
    };

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
        const documentationUrl = "https://bf2042.lennardf1989.com";

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
        `;

        document.head.appendChild(styleElement);
    }

    function init() {
        cssFixes();

        _Blockly.ContextMenuRegistry.registry.register(deleteModBlock);
        _Blockly.ContextMenuRegistry.registry.register(toggleComments);
        _Blockly.ContextMenuRegistry.registry.register(toggleInputs);
        _Blockly.ContextMenuRegistry.registry.register(toggleCollapse);
        _Blockly.ContextMenuRegistry.registry.register(copyToClipboard);
        _Blockly.ContextMenuRegistry.registry.register(openDocumentation);
        _Blockly.ContextMenuRegistry.registry.register(pasteFromClipboard);
    }

    init();

    return {};
})();