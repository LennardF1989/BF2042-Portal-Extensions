const BF2042Portal = {};

BF2042Portal.Extensions = (function() {
    const mouseCoords = {
        x: 0,
        y: 0
    };

    const contextMenuStack = [];
    let lastContextMenu = undefined;

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

    let selectedBlocks = [];

    const copyToClipboard = (function () {
        const errorMessage = "Failed to copy to clipboard!";

        function precondition() {
            return "enabled";
        }

        async function callback(scope) {
            try {
                let xmlText = "";

                if (selectedBlocks.length > 0) {
                    for (let i = 0; i < selectedBlocks.length; i++) {
                        xmlText += blockToXml(selectedBlocks[i]);
                    }
                }
                else {
                    xmlText += blockToXml(scope.block);
                }

                await navigator.clipboard.writeText(xmlText);
            }
            catch (e) {
                BF2042Portal.Shared.logError(errorMessage, e);

                alert(errorMessage);
            }
        }

        function blockToXml(block) {
            const xmlDom = _Blockly.Xml.blockToDomWithXY(block, true);
            _Blockly.Xml.deleteNext(xmlDom);

            const xmlText = _Blockly.Xml.domToText(xmlDom).replace("xmlns=\"https://developers.google.com/blockly/xml\"", "");

            return xmlText;
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

                //NOTE: Determine a bounding box
                let minX;
                let minY;

                for (let i = 0; i < xmlDom.childNodes.length; i++) {
                    const block = xmlDom.childNodes[i];

                    const x = block.getAttribute("x");
                    const y = block.getAttribute("y");

                    if (!minX || x < minX) {
                        minX = x;
                    }

                    if (!minY || y < minY) {
                        minY = y;
                    }
                }

                //NOTE: Transform blocks to the minimum coords, then move them to their target position.
                for (let i = 0; i < xmlDom.childNodes.length; i++) {
                    const block = xmlDom.childNodes[i];

                    const x = block.getAttribute("x");
                    const y = block.getAttribute("y");

                    if (x == minX) {
                        block.setAttribute("x", mouseCoords.x);
                    }
                    else {
                        block.setAttribute("x", (x - minX) + mouseCoords.x);
                    }

                    if (y == minY) {
                        block.setAttribute("y", mouseCoords.y);
                    }
                    else {
                        block.setAttribute("y", (y - minY) + mouseCoords.y);
                    }
                }

                _Blockly.Xml.domToWorkspace(xmlDom, _Blockly.getMainWorkspace())[0];
            }
            catch (e) {
                BF2042Portal.Shared.logError(errorMessage, e);

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

                const event = new Event("bf2042-portal-extensions-paste");
                document.dispatchEvent(event);
            });
        }

        let pasteFromClipboardFirefoxCallback;

        function init() {
            //NOTE: If readText is not available, we are going to assume this is Firefox.
            if (navigator.clipboard.readText !== undefined) {
                return;
            }

            pasteFromClipboardFn = pasteFromClipboardFirefox;

            window.addEventListener("bf2042-portal-extensions-paste", async function (message) {
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
            if (scope.block.type === "subroutineInstanceBlock") {
                return "enabled";
            }

            return "hidden";
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

            _Blockly.getMainWorkspace().resize();
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

    const toggleToolbox = (function () {
        function precondition() {
            return "enabled";
        }

        async function callback() {
            document.querySelector("app-root").classList.toggle("hide-toolbox");

            _Blockly.getMainWorkspace().resize();
        }

        return {
            id: "toggleToolbox",
            displayText: "Toggle Toolbox",
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback
        };
    })();

    const exportBlocks = (function () {
        function precondition() {
            return "enabled";
        }

        async function callback() {
            showContextMenuWithBack([{
                text: "JSON",
                enabled: true,
                callback: exportToJson
            },
            {
                text: "SVG",
                enabled: true,
                callback: exportToSvg
            },
            {
                text: "PNG (Download)",
                enabled: true,
                callback: exportToPngAsFile
            },
            {
                text: "PNG (Clipboard)",
                enabled: true,
                callback: exportToPngOnClipboard
            }]);
        }

        async function exportToJson() {
            const saveData = save();

            if (!saveData) {
                alert("Failed to export JSON!");

                return;
            }

            const result = JSON.stringify(saveData, null, 4);
            const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(result)}`;

            downloadFile(dataUri, "workspace.json");
        }

        async function exportToSvg() {
            const svgData = blocksToSvg(selectedBlocks);

            downloadFile(svgData.svg, "screenshot.svg");
        }

        async function exportToPngAsFile() {
            try {
                const svgData = blocksToSvg(selectedBlocks);
                const pngData = await svgToData(svgData, 1, "png");

                downloadFile(pngData, "screenshot.png");
            }
            catch (e) {
                BF2042Portal.Shared.logError("Failed to export PNG (Download)", e);

                alert("Failed to export PNG (Download)!");
            }
        }

        async function exportToPngOnClipboard() {
            try {
                const svgData = blocksToSvg(selectedBlocks);
                const blobData = await svgToData(svgData, 1, "blob");

                await navigator.clipboard.write([new ClipboardItem({ [blobData.type]: blobData })]);

                alert("Done!");
            }
            catch (e) {
                BF2042Portal.Shared.logError("Failed to export PNG (Clipboard)", e);

                alert("Failed to export PNG (Clipboard)!");
            }
        }

        //Based on: https://github.com/google/blockly/blob/master/tests/playgrounds/screenshot.js
        function blocksToSvg(blocks) {
            const workspace = _Blockly.getMainWorkspace();
            let x, y, width, height;

            if (blocks.length > 0) {
                //Determine bounding box of the selection
                let minX, minY, maxX, maxY;

                for (let i = 0; i < blocks.length; i++) {
                    const block = blocks[i];
                    const xy = block.getRelativeToSurfaceXY();

                    if (!minX || xy.x < minX) {
                        minX = xy.x;
                    }

                    if (!minY || xy.y < minY) {
                        minY = xy.y;
                    }

                    if (!maxX || xy.x + block.width > maxX) {
                        maxX = xy.x + block.width;
                    }

                    if (!maxY || xy.y + block.height > maxY) {
                        maxY = xy.y + block.height;
                    }
                }

                x = minX;
                y = minY;
                width = maxX - minX;
                height = maxY - minY;
            }
            else {
                const boundingBox = workspace.getBlocksBoundingBox();
                x = boundingBox.x || boundingBox.left;
                y = boundingBox.y || boundingBox.top;
                width = boundingBox.width || boundingBox.right - x;
                height = boundingBox.height || boundingBox.bottom - y;
            }

            const blockCanvas = workspace.getCanvas();
            const clone = blockCanvas.cloneNode(true);
            clone.removeAttribute("transform");

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            svg.appendChild(clone);
            svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
            svg.setAttribute("class", `blocklySvg ${workspace.options.renderer || "geras"}-renderer ${workspace.getTheme ? workspace.getTheme().name + "-theme" : ""}`);
            svg.setAttribute("width", width);
            svg.setAttribute("height", height);
            svg.setAttribute("style", "background-color: transparent");

            const css = [].slice.call(document.head.querySelectorAll("style"))
                .filter(function (el) {
                    return /\.blocklySvg/.test(el.innerText) || (el.id.indexOf("blockly-") === 0);
                })
                .map(function (el) {
                    return el.innerText;
                })
                .join("");

            const style = document.createElement("style");
            style.innerHTML = css;
            svg.insertBefore(style, svg.firstChild);

            const svgAsXML = (new XMLSerializer).serializeToString(svg).replace(/&nbsp/g, "&#160");

            const data = `data:image/svg+xml,${encodeURIComponent(svgAsXML)}`;

            return {
                width: width,
                height: height,
                svg: data
            }
        }

        async function svgToData(svgData, scale, dataType) {
            const promise = new Promise(function (resolve, reject) {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                const img = new Image();

                canvas.width = svgData.width * scale;
                canvas.height = svgData.height * scale;

                if (canvas.width > 16384 || canvas.height > 16384) {
                    reject("The resulting image would be too large to handle for your browser. Please select less blocks or reduce the scale.");
                }

                img.onload = function () {
                    context.drawImage(img, 0, 0, svgData.width, svgData.height, 0, 0, canvas.width, canvas.height);

                    try {
                        if (dataType === "png") {
                            const dataUri = canvas.toDataURL("image/png");

                            resolve(dataUri);
                        }
                        else if (dataType === "blob") {
                            canvas.toBlob((function (blob) {
                                resolve(blob);
                            }));
                        }
                        else {
                            throw "Unknown type";
                        }
                    } catch (e) {
                        reject(`Failed to convert SVG: ${e}`);
                    }
                };

                img.src = svgData.svg;
            });

            return promise;
        }

        function downloadFile(fileData, fileName) {
            const linkElement = document.createElement("a");
            linkElement.setAttribute("href", fileData);
            linkElement.setAttribute("download", fileName);
            linkElement.style.display = "none";

            document.body.appendChild(linkElement);
            linkElement.click();
            document.body.removeChild(linkElement);
        }

        return {
            id: "exportBlocks",
            displayText: "Export Blocks >",
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
                        contents: [].concat(entry.contents)
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
                            if(!name){
                                console.error(`Name not available for ${entry2.type}`)
                                // get name from block object on demand
                                const workspace = _Blockly.getMainWorkspace(),
                                    tempBlock = workspace.newBlock(entry2.type, undefined)
                                tempBlock.init();
                                try {
                                    name = tempBlock.inputList[0].fieldRow[0].value_
                                } catch  {
                                    name = entry2.type
                                }

                                tempBlock.dispose();
                                workspace.clearUndo();

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
    function updateMouseCoords(event) {
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
    }

    function save() {
        const workspace = _Blockly.getMainWorkspace();

        try {
            return {
                mainWorkspace: _Blockly.Xml.domToText(_Blockly.Xml.workspaceToDom(workspace, true)),
                variables: _Blockly.Xml.domToText(_Blockly.Xml.variablesToDom(workspace.getAllVariables()))
            };
        } catch (e) {
            BF2042Portal.Shared.logError("Failed to save workspace!", e);
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
            BF2042Portal.Shared.logError("Failed to load workspace!", e);
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

            .distraction-free .editor-container {
                grid-template-columns: 0 !important;
            }

            .hide-toolbox .blocklyToolboxDiv {
                display: none !important;
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

            updateMouseCoords(lastContextMenu.e);

            return originalShow(e, options, rtl);
        }
    }

    function hookWorkspaceSvg() {
        const originalWorkspaceSvg = _Blockly.Workspace.prototype.constructor;

        _Blockly.Workspace.prototype.constructor = function () {
            originalWorkspaceSvg.apply(this, arguments);

            if (!workspaceInitialized && Object.keys(_Blockly.Blocks).length > 0) {
                initializeEvents();
                initializePlugins();
            }
        }
    }


    function initializeEvents() {
        let shiftKey;

        let deltaX;
        let deltaY;
        let activeBlock;

        document.addEventListener("keydown", function (e) {
            shiftKey = e.shiftKey;
        });

        document.addEventListener("keyup", function (e) {
            shiftKey = e.shiftKey;
        });

        _Blockly.getMainWorkspace().addChangeListener(function (e) {
            if (e.type === _Blockly.Events.CLICK) {
                const workspace = _Blockly.getMainWorkspace();

                if (shiftKey) {
                    if (!e.blockId) {
                        return;
                    }

                    const block = workspace.blockDB_[e.blockId];

                    const selectedIndex = selectedBlocks.indexOf(block);

                    if (selectedIndex < 0) {
                        selectedBlocks.push(block);

                        block.setHighlighted(true);
                    }
                    else {
                        selectedBlocks.splice(selectedIndex, 1);

                        block.setHighlighted(false);
                    }
                }
                else {
                    selectedBlocks = [];

                    for (const blockID in workspace.blockDB_) {
                        workspace.blockDB_[blockID].setHighlighted(false);
                    }
                }
            }
            else if (e.type === _Blockly.Events.BLOCK_DRAG && !e.isStart) {
                activeBlock = e.blockId;
            }
            else if (e.type === _Blockly.Events.MOVE && e.newCoordinate && e.oldCoordinate && activeBlock) {
                const ignoreBlock = activeBlock;

                activeBlock = undefined;

                deltaX = e.newCoordinate.x - e.oldCoordinate.x;
                deltaY = e.newCoordinate.y - e.oldCoordinate.y;

                for (let i = 0; i < selectedBlocks.length; i++) {
                    const block = selectedBlocks[i];

                    if (block.id === ignoreBlock) {
                        continue;
                    }

                    block.moveBy(deltaX, deltaY);
                }
            }
        });
    }

    function initializePlugins() {
        BF2042Portal.Plugins.init();
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
        _Blockly.ContextMenuRegistry.registry.register(toggleToolbox);
        _Blockly.ContextMenuRegistry.registry.register(exportBlocks);
        _Blockly.ContextMenuRegistry.registry.register(importBlocksFromJSON);
        _Blockly.ContextMenuRegistry.registry.register(copyToClipboard);
        _Blockly.ContextMenuRegistry.registry.register(pasteFromClipboard);
    }

    return {
        init: init
    }
})();

BF2042Portal.Plugins = (function() {
    //NOTE: Represents a Plugin-class
    function Plugin(baseUrl, manifest) {
        this.baseUrl = baseUrl;
        this.manifest = manifest;

        this.getUrl = function(relativeUrl) {
            return `${baseUrl}/${relativeUrl}`;
        }
    }

    const plugins = {};

    function init() {
        window.addEventListener("bf2042-portal-plugins-init", async function (message) {
            const initData = message.detail;

            loadPlugins(initData);
        });

        const event = new Event("bf2042-portal-plugins-init");
        document.dispatchEvent(event);
    }

    async function loadPlugins(initData) {
        for(let i = 0; i < initData.plugins.length; i++) {
            const pluginData = initData.plugins[i];

            loadPlugin(pluginData);
        }
    }

    async function loadPlugin(pluginData) {
        try {
            const plugin = new Plugin(pluginData.baseUrl, pluginData.manifest);
            plugins[pluginData.manifest.id] = plugin;

            if(pluginData.liveReload) {
                const scriptElement = document.createElement("script");
                scriptElement.setAttribute("type", "text/javascript");
                scriptElement.setAttribute("src", plugin.getUrl(pluginData.manifest.main));
    
                document.body.appendChild(scriptElement);
            }
            else if(pluginData.mainContent) {
                const scriptElement = document.createElement("script");
                scriptElement.setAttribute("type", "text/javascript");
                scriptElement.innerHTML = `${pluginData.mainContent}\n//# sourceURL=${pluginData.manifest.id}.js`;
    
                document.body.appendChild(scriptElement);
            }
        }
        catch(e) {
            BF2042Portal.Shared.logError(`Failed to load plugin '${pluginData.manifest.name}''`, e);
        }
    }

    function getPlugin(id) {
        const plugin = plugins[id];

        if(!plugin) {
            throw `Plugin with id ${id} not found!`;
        }

        return plugin;
    }
    
    return {
        init: init,
        getPlugin: getPlugin
    };
})();

BF2042Portal.Shared = (function() {
    function logError(message, error) {
        console.log(`[ERROR] ${message}`, error);
    }

    return {
        logError: logError
    }
})();

BF2042Portal.Extensions.init();