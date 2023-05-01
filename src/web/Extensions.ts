/// <reference path="App.ts"/>

BF2042Portal.Extensions = (function () {
    const BlocklyWrapper = (function (blockly, blocklyTranslations) {
        const self = this;

        this.Events = blockly.Events;

        this.getMainWorkspace = function () {
            return blockly.getMainWorkspace();
        };

        this.getTranslation = function (key) {
            const splitKeys = key.split(".");

            let firstElement = blocklyTranslations.Msg.Msg[splitKeys[0]];

            for (let index = 1; index < splitKeys.Length; index++) {
                firstElement = firstElement[splitKeys[index]];
            }

            return firstElement;
        };

        this.Blocks = {
            getSelected: function () {
                return blockly.getSelected();
            },

            getAllClasses: function () {
                return Object.keys(blockly.Blocks).map((e) => {
                    return {
                        key: e,
                        value: blockly.Blocks[e],
                    };
                });
            },

            getAllInstances: function () {
                return [...self.getMainWorkspace().blockDB].map((e) => {
                    return {
                        key: e[0],
                        value: e[1],
                    };
                });
            },
        };

        this.ContextMenu = {
            ScopeType: {
                WORKSPACE: blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
                BLOCK: blockly.ContextMenuRegistry.ScopeType.BLOCK,
            },

            show: function (event, options, rtl) {
                blockly.ContextMenu.show(event, options, rtl);
            },

            getOptionsForWorkspace: function (workspace) {
                return blockly.ContextMenuRegistry.registry.getContextMenuOptions(
                    self.ContextMenu.ScopeType.WORKSPACE,
                    {
                        workspace: workspace,
                    },
                );
            },

            getOptionsForBlock: function (block) {
                return blockly.ContextMenuRegistry.registry.getContextMenuOptions(
                    self.ContextMenu.ScopeType.BLOCK,
                    {
                        block: block,
                    },
                );
            },

            getAllItems: function () {
                return [...blockly.ContextMenuRegistry.registry.registry_].map(
                    (e) => {
                        return {
                            key: e[0],
                            value: e[1],
                        };
                    },
                );
            },

            unregisterItem: function (item) {
                blockly.ContextMenuRegistry.registry.unregister(item);
            },

            registerItem: function (item) {
                blockly.ContextMenuRegistry.registry.register(item);
            },
        };

        this.Xml = {
            createElement: blockly.utils.xml.createElement,
            mouseToSvg: blockly.browserEvents.mouseToSvg,

            workspaceToDom: blockly.Xml.workspaceToDom,
            textToDom: blockly.Xml.textToDom,

            domToWorkspace: blockly.Xml.domToWorkspace,
            domToVariables: blockly.Xml.domToVariables,
            domToText: blockly.Xml.domToText,

            blockToXml: function (block) {
                const xmlDom = blockly.Xml.blockToDomWithXY(block, true);
                blockly.Xml.deleteNext(xmlDom);

                const xmlText = blockly.Xml.domToText(xmlDom).replace(
                    'xmlns="https://developers.google.com/blockly/xml"',
                    "",
                );

                return xmlText;
            },
        };

        return this;
    })(_Blockly, Blockly);

    const blocklyConfig = {
        menus: {},
        items: {},
    };

    const mouseCoords = {
        x: 0,
        y: 0,
    };

    const contextMenuStack = [];
    let lastContextMenu = undefined;

    const blockLookup = [];
    const blockCategories = [];

    const selectedBlocks = [];

    let shiftKey = false;

    const imageDataUrlCache = new Map();

    //Blockly functions - Items
    function copyToClipboard() {
        const errorMessage = "Failed to copy to clipboard!";

        function precondition() {
            return "enabled";
        }

        async function callback(scope) {
            try {
                const blocks = getSelectedBlocks(scope);
                const xmlText = saveXml(blocks);

                if (!xmlText) {
                    alert(errorMessage);

                    return;
                }

                await BF2042Portal.Shared.copyTextToClipboard(xmlText);
            } catch (e) {
                BF2042Portal.Shared.logError(errorMessage, e);

                alert(errorMessage);
            }
        }

        return {
            id: "copyToClipboard",
            displayText: "Copy to Clipboard",
            scopeType: BlocklyWrapper.ContextMenu.ScopeType.BLOCK,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function pasteFromClipboard() {
        const errorMessage = "Failed to paste from clipboard!";

        //NOTE: Unfortunately precondition cannot be async, so we cannot check if the clipboard contains valid XML beforehand.
        function precondition() {
            return "enabled";
        }

        async function callback() {
            try {
                let xmlText =
                    await BF2042Portal.Shared.pasteTextFromClipboard();

                if (!loadXml(xmlText)) {
                    alert(errorMessage);
                }
            } catch (e) {
                BF2042Portal.Shared.logError(errorMessage, e);

                alert(errorMessage);
            }
        }

        return {
            id: "pasteFromClipboard",
            displayText: "Paste from Clipboard",
            scopeType: BlocklyWrapper.ContextMenu.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function toggleComments() {
        function displayText(scope) {
            const toggleType = scope.block.getCommentIcon() ? "Remove" : "Add";

            const blocks = getSelectedBlocks(scope);

            if (blocks.length === 1) {
                return `${toggleType} Comment`;
            }

            return `${toggleType} Comment (${blocks.length} Blocks)`;
        }

        function precondition() {
            return "enabled";
        }

        async function callback(scope) {
            const commentText = scope.block.getCommentIcon() ? null : "";

            const blocks = getSelectedBlocks(scope);

            for (let i = 0; i < blocks.length; i++) {
                blocks[i].setCommentText(commentText);
            }
        }

        return {
            id: "toggleComments",
            displayText: displayText,
            scopeType: BlocklyWrapper.ContextMenu.ScopeType.BLOCK,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function toggleInputs() {
        function displayText(scope) {
            const toggleType = scope.block.getInputsInline()
                ? "Vertically"
                : "Horizontally";

            const blocks = getSelectedBlocks(scope);

            if (blocks.length === 1) {
                return `Show Inputs ${toggleType}`;
            }

            return `Show Inputs ${toggleType} (${blocks.length} Blocks)`;
        }

        function precondition() {
            return "enabled";
        }

        async function callback(scope) {
            const isInputInline = !scope.block.getInputsInline();

            const blocks = getSelectedBlocks(scope);

            for (let i = 0; i < blocks.length; i++) {
                blocks[i].setInputsInline(isInputInline);
            }
        }

        return {
            id: "toggleInputs",
            displayText: displayText,
            scopeType: BlocklyWrapper.ContextMenu.ScopeType.BLOCK,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function toggleCollapse() {
        function displayText(scope) {
            const toggleType = scope.block.isCollapsed()
                ? "Expand"
                : "Collapse";

            const blocks = getSelectedBlocks(scope);

            if (blocks.length === 1) {
                return `${toggleType} Block`;
            }

            return `${toggleType} ${blocks.length} Blocks`;
        }

        function precondition() {
            return "enabled";
        }

        async function callback(scope) {
            const isCollapsed = !scope.block.isCollapsed();

            const blocks = getSelectedBlocks(scope);

            for (let i = 0; i < blocks.length; i++) {
                blocks[i].setCollapsed(isCollapsed);
            }
        }

        return {
            id: "toggleCollapse",
            displayText: displayText,
            scopeType: BlocklyWrapper.ContextMenu.ScopeType.BLOCK,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function collapseAllBlocks() {
        function displayText(scope) {
            const blocks = getSelectedBlocks(scope);

            if (blocks) {
                if (blocks.length === 1) {
                    return `Collapse Block`;
                }

                return `Collapse ${blocks.length} Blocks`;
            }

            return "Collapse All Blocks";
        }

        function precondition() {
            return "enabled";
        }

        function callback(scope) {
            const blocks = getSelectedBlocks(scope);

            if (blocks) {
                for (let i = 0; i < blocks.length; i++) {
                    blocks[i].setCollapsed(true);
                }
            } else {
                const workspace = BlocklyWrapper.getMainWorkspace();

                for (const block of workspace.getAllBlocks()) {
                    block.setCollapsed(true);
                }
            }
        }

        return {
            id: "collapseAllBlocks",
            displayText: displayText,
            scopeType: BlocklyWrapper.ContextMenu.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function expandAllBlocks() {
        function displayText(scope) {
            const blocks = getSelectedBlocks(scope);

            if (blocks) {
                if (blocks.length === 1) {
                    return `Expand Block`;
                }

                return `Expand ${blocks.length} Blocks`;
            }

            return "Expand All Blocks";
        }

        function precondition() {
            return "enabled";
        }

        function callback(scope) {
            const blocks = getSelectedBlocks(scope);

            if (blocks) {
                for (let i = 0; i < blocks.length; i++) {
                    blocks[i].setCollapsed(false);
                }
            } else {
                const workspace = BlocklyWrapper.getMainWorkspace();

                for (const block of workspace.getAllBlocks()) {
                    block.setCollapsed(false);
                }
            }
        }

        return {
            id: "expandAllBlocks",
            displayText: displayText,
            scopeType: BlocklyWrapper.ContextMenu.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function deleteModBlock() {
        function precondition(scope) {
            if (
                scope.block.type === "modBlock" &&
                BlocklyWrapper.getMainWorkspace().getBlocksByType("modBlock")
                    .length > 1
            ) {
                return "enabled";
            }

            return "hidden";
        }

        async function callback(scope) {
            scope.block.dispose(false, false);
        }

        return {
            id: "deleteModBlock",
            displayText: "Delete Mod Block",
            scopeType: BlocklyWrapper.ContextMenu.ScopeType.BLOCK,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function openDocumentation() {
        const documentationUrl = "https://docs.bfportal.gg/blocks";

        function precondition() {
            return "enabled";
        }

        async function callback() {
            window.open(documentationUrl, "bf2142_documentation");
        }

        return {
            id: "openDocumentation",
            displayText: "Open Documentation",
            scopeType: BlocklyWrapper.ContextMenu.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function jumpToSubRoutine() {
        function precondition(scope) {
            if (scope.block.type === "subroutineInstanceBlock") {
                return "enabled";
            }

            return "hidden";
        }

        async function callback(scope) {
            const subroutineName = scope.block.getFieldValue("SUBROUTINE_NAME");

            const foundBlocks = BlocklyWrapper.getMainWorkspace()
                .getBlocksByType("subroutineBlock", false)
                .filter(
                    (e) =>
                        e.getFieldValue("SUBROUTINE_NAME") === subroutineName,
                );

            if (foundBlocks.length > 0) {
                BlocklyWrapper.getMainWorkspace().centerOnBlock(
                    foundBlocks[0].id,
                );
            }
        }

        return {
            id: "jumpToSubRoutine",
            displayText: "Jump to Subroutine",
            scopeType: BlocklyWrapper.ContextMenu.ScopeType.BLOCK,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function toggleDistractionFreeMode() {
        function precondition() {
            return "enabled";
        }

        async function callback() {
            document
                .querySelector("app-root")
                .classList.toggle("distraction-free");

            BlocklyWrapper.getMainWorkspace().resize();
        }

        return {
            id: "toggleDistractionFreeMode",
            displayText: "Toggle Distraction-Free Mode",
            scopeType: BlocklyWrapper.ContextMenu.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function toggleToolbox() {
        function precondition() {
            return "enabled";
        }

        async function callback() {
            document.querySelector("app-root").classList.toggle("hide-toolbox");

            BlocklyWrapper.getMainWorkspace().resize();
        }

        return {
            id: "toggleToolbox",
            displayText: "Toggle Toolbox",
            scopeType: BlocklyWrapper.ContextMenu.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function exportBlocksWorkspace() {
        return exportBlocks(
            "exportBlocksWorkspace",
            BlocklyWrapper.ContextMenu.ScopeType.WORKSPACE,
        );
    }

    function exportBlocksBlock() {
        return exportBlocks(
            "exportBlocksBlock",
            BlocklyWrapper.ContextMenu.ScopeType.BLOCK,
        );
    }

    function exportBlocks(id, scopeType) {
        function precondition() {
            return "enabled";
        }

        async function callback(scope) {
            const menuItems = [
                {
                    text: "XML",
                    enabled: true,
                    callback: () => exportToXml(scope),
                },
                {
                    text: "SVG",
                    enabled: true,
                    callback: () => exportToSvg(scope),
                },
                {
                    text: "PNG",
                    enabled: true,
                    callback: () => exportToPngAsFile(scope),
                },
            ];

            if (BF2042Portal.Shared.isCopyBlobToClipboardSupported()) {
                menuItems.push({
                    text: "PNG (Clipboard)",
                    enabled: true,
                    callback: () => exportToPngOnClipboard(scope),
                });
            }

            showContextMenuWithBack(menuItems);
        }

        async function exportToXml(scope) {
            const blocks = getSelectedBlocks(scope);
            const xmlText = saveXml(blocks);

            if (!xmlText) {
                alert("Failed to export XML!");

                return;
            }

            const dataUri = `data:application/xml;charset=utf-8,${encodeURIComponent(
                xmlText,
            )}`;

            downloadFile(dataUri, "workspace.xml");
        }

        async function exportToSvg(scope) {
            const blocks = getSelectedBlocks(scope);
            const svgData = await blocksToSvg(blocks, false);

            downloadFile(svgData.svg, "screenshot.svg");
        }

        async function exportToPngAsFile(scope) {
            try {
                const blocks = getSelectedBlocks(scope);
                const svgData = await blocksToSvg(blocks, true);
                const pngData = await svgToData(svgData, 1, "png");

                downloadFile(pngData, "screenshot.png");
            } catch (e) {
                BF2042Portal.Shared.logError(
                    "Failed to export PNG (Download)",
                    e,
                );

                alert("Failed to export PNG (Download)!");
            }
        }

        async function exportToPngOnClipboard(scope) {
            try {
                const blocks = getSelectedBlocks(scope);
                const svgData = await blocksToSvg(blocks, true);
                const blobData = await svgToData(svgData, 1, "blob");

                await BF2042Portal.Shared.copyBlobToClipboard(blobData);

                alert("Done!");
            } catch (e) {
                BF2042Portal.Shared.logError(
                    "Failed to export PNG (Clipboard)",
                    e,
                );

                alert("Failed to export PNG (Clipboard)!");
            }
        }

        //Based on: https://github.com/google/blockly/blob/master/tests/playgrounds/screenshot.js
        async function blocksToSvg(blocks, convertImagesToDataURI) {
            const workspace = BlocklyWrapper.getMainWorkspace();
            let x, y, width, height;

            if (blocks && blocks.length > 0) {
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
            } else {
                const boundingBox = workspace.getBlocksBoundingBox();
                x = boundingBox.x || boundingBox.left;
                y = boundingBox.y || boundingBox.top;
                width = boundingBox.width || boundingBox.right - x;
                height = boundingBox.height || boundingBox.bottom - y;
            }

            const blockCanvas = workspace.getCanvas();
            const clone = blockCanvas.cloneNode(true);
            clone.removeAttribute("transform");

            const svg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg",
            );
            svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            svg.appendChild(clone);
            svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
            svg.setAttribute(
                "class",
                `blocklySvg ${workspace.options.renderer || "geras"}-renderer ${
                    workspace.getTheme
                        ? workspace.getTheme().name + "-theme"
                        : ""
                }`,
            );
            svg.setAttribute("width", width);
            svg.setAttribute("height", height);
            svg.setAttribute("style", "background-color: transparent");

            const css = [].slice
                .call(document.head.querySelectorAll("style"))
                .filter(function (el) {
                    return (
                        /\.blocklySvg/.test(el.innerText) ||
                        el.id.indexOf("blockly-") === 0
                    );
                })
                .map(function (el) {
                    return el.innerText;
                })
                .join("");

            const style = document.createElement("style");
            style.innerHTML = css;
            svg.insertBefore(style, svg.firstChild);

            let svgAsXML = new XMLSerializer()
                .serializeToString(svg)
                .replace(/&nbsp/g, "&#160");

            if (convertImagesToDataURI) {
                const matches = [...svgAsXML.matchAll(/xlink:href=\"(.*?)\"/g)];

                for (const match of matches) {
                    const url = match[1];

                    if (url.startsWith("data:") || imageDataUrlCache.has(url)) {
                        continue;
                    }

                    try {
                        let dataUrl = await new Promise(
                            async (resolve, reject) => {
                                try {
                                    //TODO: Implement a time-out mechanism
                                    const response = await fetch(
                                        "https://portal.battlefield.com" + url,
                                    );

                                    const blob = await response.blob();

                                    const reader = new FileReader();
                                    reader.onload = (f) => {
                                        resolve(f.target.result);
                                    };
                                    reader.readAsDataURL(blob);
                                } catch (_) {
                                    reject();
                                }
                            },
                        );

                        imageDataUrlCache.set(url, dataUrl);
                    } catch (_) {
                        imageDataUrlCache.set(url, url);
                    }
                }
            }

            svgAsXML = svgAsXML.replace(
                /xlink:href=\"(.*?)\"/g,
                function (_, url) {
                    let newUrl = imageDataUrlCache.has(url)
                        ? imageDataUrlCache.get(url)
                        : url;

                    return `xlink:href="${newUrl}"`;
                },
            );

            const data = `data:image/svg+xml,${encodeURIComponent(svgAsXML)}`;

            return {
                width: width,
                height: height,
                svg: data,
            };
        }

        async function svgToData(svgData, scale, dataType) {
            const promise = new Promise(function (resolve, reject) {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                const img = new Image();

                canvas.width = svgData.width * scale;
                canvas.height = svgData.height * scale;

                if (canvas.width > 16384 || canvas.height > 16384) {
                    reject(
                        "The resulting image would be too large to handle for your browser. Please select less blocks or reduce the scale.",
                    );
                }

                img.onload = function () {
                    context.drawImage(
                        img,
                        0,
                        0,
                        svgData.width,
                        svgData.height,
                        0,
                        0,
                        canvas.width,
                        canvas.height,
                    );

                    try {
                        if (dataType === "png") {
                            const dataUri = canvas.toDataURL("image/png");

                            resolve(dataUri);
                        } else if (dataType === "blob") {
                            canvas.toBlob(function (blob) {
                                resolve(blob);
                            });
                        } else {
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
            id: id,
            displayText: "Export Blocks >",
            scopeType: scopeType,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function importBlocksFromFile() {
        function precondition() {
            return "enabled";
        }

        async function callback() {
            const inputElement = document.createElement("input");
            inputElement.setAttribute("type", "file");
            inputElement.setAttribute("accept", ".xml,.json");
            inputElement.style.display = "none";

            inputElement.addEventListener("change", function () {
                if (!inputElement.files || inputElement.files.length === 0) {
                    return;
                }

                const fileReader = new FileReader();
                fileReader.onload = function (e) {
                    if (
                        confirm(
                            "Do you want to remove all existing blocks before importing?",
                        )
                    ) {
                        BlocklyWrapper.getMainWorkspace().clear();
                    }

                    try {
                        const extension = inputElement.files[0].name
                            .split(".")
                            .pop()
                            .toLowerCase();

                        if (extension === "json") {
                            const loadData = JSON.parse(
                                <string>e.target.result,
                            );

                            if (!loadJson(loadData)) {
                                alert("Failed to import workspace from JSON!");
                            }
                        } else if (extension === "xml") {
                            if (!loadXml(e.target.result)) {
                                alert("Failed to import workspace from XML!");
                            }
                        }
                    } catch (e) {
                        alert("Failed to import workspace!");
                    }
                };

                fileReader.readAsText(inputElement.files[0]);
            });

            document.body.appendChild(inputElement);
            inputElement.click();
            document.body.removeChild(inputElement);
        }

        return {
            id: "importBlocksFromFile",
            displayText: "Import Blocks from File",
            scopeType: BlocklyWrapper.ContextMenu.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function addBlock() {
        function precondition() {
            return "enabled";
        }

        //TODO: Variables/Subroutines
        async function callback() {
            const options = [];

            for (let i = 0; i < blockCategories.length; i++) {
                const entry = blockCategories[i];

                options.push({
                    text: entry.displayName,
                    enabled: true,
                    callback: function () {
                        const subOptions = [];

                        for (let i2 = 0; i2 < entry.contents.length; i2++) {
                            const entry2 = entry.contents[i2];

                            let role;

                            switch (entry2.type) {
                                case "mod":
                                    role = "⚫";
                                    break;

                                case "rule":
                                case "controlAction":
                                    role = "🟣";
                                    break;

                                case "condition":
                                    role = "🔵";
                                    break;

                                case "value":
                                case "literal":
                                    role = "🟢";
                                    break;

                                case "action":
                                    role = "🟡";
                                    break;

                                default:
                                    role = "⚪";
                                    break;
                            }

                            subOptions.push({
                                text: `${role} ${entry2.displayName}`,
                                enabled: true,
                                callback: function () {
                                    const block =
                                        BlocklyWrapper.getMainWorkspace().newBlock(
                                            entry2.internalName,
                                        );
                                    block.initSvg();
                                    block.render();
                                    block.moveTo(mouseCoords);
                                },
                            });
                        }

                        showContextMenuWithBack(subOptions.sort(sortByText));
                    },
                });
            }

            showContextMenuWithBack(options.sort(sortByText));
        }

        function sortByText(a, b) {
            return a.text > b.text ? 1 : -1;
        }

        return {
            id: "addBlock",
            displayText: "Add Block >",
            scopeType: BlocklyWrapper.ContextMenu.ScopeType.WORKSPACE,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
        };
    }

    function separatorWorkspace() {
        return separator(
            "separatorWorkspace",
            BlocklyWrapper.ContextMenu.ScopeType.WORKSPACE,
        );
    }

    function separatorBlock() {
        return separator(
            "separatorBlock",
            BlocklyWrapper.ContextMenu.ScopeType.BLOCK,
        );
    }

    function separator(id, scope) {
        return {
            id: id,
            displayText: "---",
            scopeType: scope,
            weight: 100,
            preconditionFn: () => "disabled",
            callback: () => {},
        };
    }

    //Blockly functions - Menus
    function optionsWorkspace() {
        return createMenu(
            "optionsWorkspace",
            "Options",
            BlocklyWrapper.ContextMenu.ScopeType.WORKSPACE,
        );
    }

    function optionsBlock() {
        return createMenu(
            "optionsBlock",
            "Options",
            BlocklyWrapper.ContextMenu.ScopeType.BLOCK,
        );
    }

    function createMenu(id, name, scopeType) {
        function precondition() {
            return "enabled";
        }

        async function callback(scope) {
            const menu = blocklyConfig.menus[id];
            const subMenuOptions = [];

            for (let i = 0; i < menu.options.length; i++) {
                const subMenuItem = createSubMenuItem(
                    menu.options[i],
                    scopeType,
                    scope,
                );

                if (!subMenuItem) {
                    continue;
                }

                subMenuOptions.push(subMenuItem);
            }

            showContextMenuWithBack(subMenuOptions);
        }

        return {
            id: id,
            displayText: `${name} >`,
            scopeType: scopeType,
            weight: 100,
            preconditionFn: precondition,
            callback: callback,
            options: [],
        };
    }

    function createSubMenuItem(id, scopeType, scope) {
        let data;

        if (id.startsWith("items.")) {
            data = blocklyConfig.items[id.substring("items.".length)];
        } else if (id.startsWith("menus.")) {
            data = blocklyConfig.menus[id.substring("menus.".length)];
        }

        if (!data || data.scopeType != scopeType) {
            return undefined;
        }

        return {
            text:
                typeof data.displayText === "string"
                    ? data.displayText
                    : data.displayText(scope),
            enabled: data.preconditionFn(scope) === "enabled",
            callback: () => data.callback(scope),
        };
    }

    //Blockly functions - Helpers
    function registerMenu(menu) {
        blocklyConfig.menus[menu.id] = menu;
    }

    function registerItem(item) {
        blocklyConfig.items[item.id] = item;
    }

    //Private functions
    function saveXml(blocks) {
        const workspace = BlocklyWrapper.getMainWorkspace();

        try {
            let xmlText = "";

            if (blocks && blocks.length > 0) {
                for (let i = 0; i < blocks.length; i++) {
                    xmlText += BlocklyWrapper.Xml.blockToXml(blocks[i]);
                }

                return xmlText;
            } else {
                let xmlDom = BlocklyWrapper.Xml.workspaceToDom(workspace, true);

                const variablesXml = xmlDom.querySelector("variables");

                if (variablesXml) {
                    xmlDom.removeChild(variablesXml);
                }

                return BlocklyWrapper.Xml.domToText(xmlDom)
                    .replace(
                        '<xml xmlns="https://developers.google.com/blockly/xml">',
                        "",
                    )
                    .replace("</xml>", "");
            }
        } catch (e) {
            BF2042Portal.Shared.logError("Failed to save workspace!", e);
        }

        return undefined;
    }

    function loadJson(data) {
        const workspace = BlocklyWrapper.getMainWorkspace();

        try {
            const variables = BlocklyWrapper.Xml.textToDom(
                data.variables ? data.variables : "<xml />",
            );

            BlocklyWrapper.Xml.domToVariables(variables, workspace);
            BlocklyWrapper.Xml.domToWorkspace(
                BlocklyWrapper.Xml.textToDom(data.mainWorkspace),
                workspace,
            );

            return true;
        } catch (e) {
            BF2042Portal.Shared.logError(
                "Failed to load workspace from JSON!",
                e,
            );
        }

        return false;
    }

    function loadXml(xmlText) {
        try {
            if (!xmlText) {
                return false;
            }

            xmlText = xmlText.trim();

            if (!xmlText.startsWith("<block")) {
                return false;
            }

            const domText = `<xml xmlns="https://developers.google.com/blockly/xml">${xmlText.trim()}</xml>`;

            const xmlDom = BlocklyWrapper.Xml.textToDom(domText);

            //NOTE: Extract variables
            const variableBlocks = xmlDom.querySelectorAll(
                "block[type='variableReferenceBlock']",
            );
            const variables = [];

            variableBlocks.forEach((e) => {
                const objectType = e.querySelector(
                    "field[name='OBJECTTYPE']",
                ).textContent;
                const variableName =
                    e.querySelector("field[name='VAR']").textContent;

                if (
                    objectType &&
                    variableName &&
                    !variables.find(
                        (v) =>
                            v.objectType === objectType &&
                            v.variableName === variableName,
                    )
                ) {
                    variables.push({
                        objectType,
                        variableName,
                    });
                }
            });

            const variablesXml = document.createElement("variables");

            variables.forEach((e) => {
                const variable = document.createElement("variable");
                variable.setAttribute("type", e.objectType);
                variable.innerText = e.variableName;

                variablesXml.appendChild(variable);
            });

            BlocklyWrapper.Xml.domToVariables(
                variablesXml,
                BlocklyWrapper.getMainWorkspace(),
            );

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
                } else {
                    block.setAttribute("x", x - minX + mouseCoords.x);
                }

                if (y == minY) {
                    block.setAttribute("y", mouseCoords.y);
                } else {
                    block.setAttribute("y", y - minY + mouseCoords.y);
                }
            }

            BlocklyWrapper.Xml.domToWorkspace(
                xmlDom,
                BlocklyWrapper.getMainWorkspace(),
            );

            return true;
        } catch (e) {
            BF2042Portal.Shared.logError(
                "Failed to load workspace from XML!",
                e,
            );
        }

        return false;
    }

    //Based on: https://stackoverflow.com/questions/32589197/how-can-i-capitalize-the-first-letter-of-each-word-in-a-string-using-javascript
    function titleCase(str) {
        return str
            .split(" ")
            .map((s) => s.charAt(0).toUpperCase() + s.substr(1).toLowerCase())
            .join(" ");
    }

    //API functions
    function getSelectedBlocks(scope) {
        let blocks = undefined;

        if (selectedBlocks.length > 0) {
            blocks = selectedBlocks;
        }

        if (
            !blocks &&
            (BlocklyWrapper.Blocks.getSelected() ||
                (scope !== undefined && scope.block))
        ) {
            blocks = [BlocklyWrapper.Blocks.getSelected() || scope.block];
        }

        return blocks;
    }

    function getMouseCoords() {
        return {
            x: mouseCoords.x,
            y: mouseCoords.y,
        };
    }

    function showContextMenuWithBack(options) {
        contextMenuStack.push(lastContextMenu.options);

        BlocklyWrapper.ContextMenu.show(
            lastContextMenu.e,
            []
                .concat(
                    {
                        text: "< Back",
                        enabled: true,
                        callback: () => {
                            const menu = contextMenuStack.splice(
                                contextMenuStack.length - 1,
                                1,
                            );

                            BlocklyWrapper.ContextMenu.show(
                                lastContextMenu.e,
                                menu[0],
                                lastContextMenu.rtl,
                            );
                        },
                    },
                    {
                        text: "---",
                        enabled: false,
                        callback: () => {},
                    },
                )
                .concat(options),
            lastContextMenu.rtl,
        );
    }

    //Initialize functions
    function init() {
        cssFixes();

        hookContextMenu();
        hookBlockly();

        initializeBlocks(BF2042Portal.Startup.getBlockDefinitions());
        initializeDocumentEvents();
        initializeBlockly();

        BF2042Portal.Plugins.init({
            api: {
                getSelectedBlocks: getSelectedBlocks,
                getMouseCoords: getMouseCoords,
                showContextMenuWithBack: showContextMenuWithBack,
                registerMenu: registerMenu,
                registerItem: registerItem,
                createMenu: createMenu,
            },
            version: BF2042Portal.Startup.getVersion(),
            pluginManager: BF2042Portal.Startup.getManifest().pluginManager,
        });
    }

    function cssFixes() {
        const styleElement = document.createElement("style");
        styleElement.setAttribute("type", "text/css");

        styleElement.innerHTML = `
            /*.blocklyMenu {
                overflow-y: hidden !important;
            }*/

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
        const workspace = BlocklyWrapper.getMainWorkspace();

        const workspacePrototype = Object.getPrototypeOf(workspace);
        const originalWorkspaceShowContextMenu =
            workspacePrototype.showContextMenu;

        workspacePrototype.showContextMenu = function (e) {
            //NOTE: Clear the stack every time the content menu is opened at the root
            contextMenuStack.length = 0;

            lastContextMenu = {
                e: e,
                options:
                    BlocklyWrapper.ContextMenu.getOptionsForWorkspace(this),
                rtl: this.RTL,
            };

            updateMouseCoords(e);

            return originalWorkspaceShowContextMenu.apply(this, arguments);
        };

        const blockPrototype = Object.getPrototypeOf(
            workspace.getTopBlocks()[0],
        );
        const originalBlockShowContextMenu = blockPrototype.showContextMenu;

        blockPrototype.showContextMenu = function (e) {
            lastContextMenu = {
                e: e,
                options: BlocklyWrapper.ContextMenu.getOptionsForBlock(this),
                rtl: this.RTL,
            };

            updateMouseCoords(e);

            return originalBlockShowContextMenu.apply(this, arguments);
        };
    }

    function hookBlockly() {
        function initializeWorkspace(workspace) {
            //TODO: Properly migrate to JSON instead of XML
            hotfixDomMutations();

            initializeWorkspaceEvents(workspace);

            //NOTE: Wait for the current JavaScript frame to end, then fire the event for plugins.
            setTimeout(function () {
                BF2042Portal.Plugins.initializeWorkspace();
            }, 0);
        }

        //NOTE: We have to hook the inject method as it's called whenever the user switches to the Rules Editor.
        const blockly = _Blockly.inject;

        _Blockly.inject = function () {
            const workspace = blockly.apply(this, arguments);

            initializeWorkspace(workspace);

            return workspace;
        };

        initializeWorkspace(BlocklyWrapper.getMainWorkspace());
    }

    function initializeDocumentEvents() {
        document.addEventListener("keydown", function (e) {
            shiftKey = e.shiftKey;
        });

        document.addEventListener("keyup", function (e) {
            shiftKey = e.shiftKey;
        });
    }

    function initializeBlockly() {
        //NOTE: Register existing items
        for (const contentMenuItem of BlocklyWrapper.ContextMenu.getAllItems()) {
            registerItem(contentMenuItem.value);
        }

        //NOTE: Delete existing items
        BlocklyWrapper.ContextMenu.unregisterItem("cleanWorkspace");
        BlocklyWrapper.ContextMenu.unregisterItem("workspaceDelete");

        const optionsWorkspaceMenu = optionsWorkspace();
        optionsWorkspaceMenu.weight = -99;
        optionsWorkspaceMenu.options = [
            "items.cleanWorkspace",
            "items.workspaceDelete",
            "items.separatorWorkspace",
            "items.collapseAllBlocks",
            "items.expandAllBlocks",
            "items.openDocumentation",
            "items.toggleDistractionFreeMode",
            "items.toggleToolbox",
            "items.separatorWorkspace",
            "items.exportBlocksWorkspace",
            "items.importBlocksFromFile",
        ];

        const optionsBlockMenu = optionsBlock();
        optionsBlockMenu.weight = -99;
        optionsBlockMenu.options = [
            "items.deleteModBlock",
            "items.separatorBlock",
            "items.toggleComments",
            "items.toggleInputs",
            "items.toggleCollapse",
            "items.separatorBlock",
            "items.exportBlocksBlock",
        ];

        registerMenu(optionsWorkspaceMenu);
        registerMenu(optionsBlockMenu);

        registerItem(copyToClipboard());
        registerItem(pasteFromClipboard());
        registerItem(toggleComments());
        registerItem(toggleInputs());
        registerItem(toggleCollapse());
        registerItem(collapseAllBlocks());
        registerItem(expandAllBlocks());
        registerItem(deleteModBlock());
        registerItem(openDocumentation());
        registerItem(jumpToSubRoutine());
        registerItem(toggleDistractionFreeMode());
        registerItem(toggleToolbox());
        registerItem(exportBlocksWorkspace());
        registerItem(exportBlocksBlock());
        registerItem(importBlocksFromFile());
        registerItem(separatorWorkspace());
        registerItem(separatorBlock());

        const addBlockMenuItem = addBlock();
        addBlockMenuItem.weight = -100;

        registerItem(addBlockMenuItem);

        const contextMenuStructure = [
            "items.addBlock",
            "menus.optionsWorkspace",
            "menus.optionsBlock",
            "items.jumpToSubRoutine",
            "items.copyToClipboard",
            "items.pasteFromClipboard",
        ];

        //TODO: Give plugins a chance to modify this

        contextMenuStructure.forEach(function (item) {
            let menuItem;

            if (item.startsWith("items.")) {
                const itemId = item.substring("items.".length);
                menuItem = blocklyConfig.items[itemId];
            } else if (item.startsWith("menus.")) {
                const menuId = item.substring("menus.".length);
                menuItem = blocklyConfig.menus[menuId];
            }

            if (!menuItem) {
                return;
            }

            BlocklyWrapper.ContextMenu.registerItem(menuItem);
        });
    }

    //Internal functions
    function initializeBlocks(blockDefinitions) {
        //Blocks - Hard-coded
        blockLookup.push({
            type: "mod",
            category: getCategory("RULES"),
            internalName: "modBlock",
            displayName: titleCase(BlocklyWrapper.getTranslation("PYRITE_MOD")),
        });

        blockLookup.push({
            type: "rule",
            category: getCategory("RULES"),
            internalName: "ruleBlock",
            displayName: titleCase(
                BlocklyWrapper.getTranslation("PYRITE_RULE"),
            ),
        });

        blockLookup.push({
            type: "condition",
            category: getCategory("RULES"),
            internalName: "conditionBlock",
            displayName: titleCase(
                BlocklyWrapper.getTranslation("PYRITE_CONDITION"),
            ),
        });

        /*blockLookup.push({
            type: "condition",
            category: getCategory("LOGIC"),
            internalName: "Compare",
            displayName: "Compare"
        });*/

        blockLookup.push({
            type: "literal",
            category: getCategory("LITERALS"),
            internalName: "Boolean",
            displayName: BlocklyWrapper.getTranslation("PYRITE_TYPE_BOOLEAN"),
        });

        blockLookup.push({
            type: "literal",
            category: getCategory("LITERALS"),
            internalName: "Number",
            displayName: BlocklyWrapper.getTranslation("PYRITE_TYPE_NUMBER"),
        });

        blockLookup.push({
            type: "literal",
            category: getCategory("LITERALS"),
            internalName: "Text",
            displayName: BlocklyWrapper.getTranslation("PYRITE_TYPE_STRING"),
        });

        blockLookup.push({
            type: "action",
            category: getCategory("CONVENIENCE"),
            internalName: "ArrayContains",
            displayName: BlocklyWrapper.getTranslation(
                "PYRITE_CONVENIENCE_ARRAYCONTAINS",
            ),
        });

        blockLookup.push({
            type: "action",
            category: getCategory("CONVENIENCE"),
            internalName: "IndexOfArrayValue",
            displayName: BlocklyWrapper.getTranslation(
                "PYRITE_CONVENIENCE_INDEXOFARRAYVALUE",
            ),
        });

        blockLookup.push({
            type: "action",
            category: getCategory("CONVENIENCE"),
            internalName: "RemoveFromArray",
            displayName: BlocklyWrapper.getTranslation(
                "PYRITE_CONVENIENCE_REMOVEFROMARRAY",
            ),
        });

        //Blocks - Selection Lists
        const selectionLists = [
            ...new Set(
                blockDefinitions.selectionLists.map((e) => e.listType + "Item"),
            ),
        ];

        //Blocks - Values (Yellow)
        for (let index = 0; index < blockDefinitions.values.length; index++) {
            const element = blockDefinitions.values[index];

            //NOTE: Some values have no category...
            if (!element.category) {
                if (element.name == "GetVariable") {
                    element.category = "VARIABLES";
                } else if (selectionLists.includes(element.name)) {
                    element.category = "SELECTION_LISTS";
                } else {
                    BF2042Portal.Shared.logError(
                        "No category found for value-block",
                        element,
                    );
                }
            }

            blockLookup.push({
                type: "value",
                category: getCategory(element.category),
                internalName: element.name,
                displayName:
                    BlocklyWrapper.getTranslation(element.displayNameSID) ||
                    element.name,
            });
        }

        //Blocks - Actions (Green)
        for (let index = 0; index < blockDefinitions.actions.length; index++) {
            const element = blockDefinitions.actions[index];

            //NOTE: Some values have no category...
            if (!element.category) {
                if (element.name == "SetVariable") {
                    element.category = "VARIABLES";
                } else {
                    BF2042Portal.Shared.logError(
                        "No category found for action-block",
                        element,
                    );
                }
            }

            blockLookup.push({
                type: "action",
                category: getCategory(element.category),
                internalName: element.name,
                displayName:
                    BlocklyWrapper.getTranslation(element.displayNameSID) ||
                    element.name,
            });
        }

        //Blocks - Controls Actions
        for (
            let index = 0;
            index < blockDefinitions.controlActions.length;
            index++
        ) {
            const element = blockDefinitions.controlActions[index];

            blockLookup.push({
                type: "controlAction",
                category: getCategory("CONTROL_ACTIONS"),
                internalName: element.name,
                displayName:
                    BlocklyWrapper.getTranslation(element.displayNameSID) ||
                    element.name,
            });
        }

        //Categories
        blockLookup.forEach((entry) => {
            const existingCategory = blockCategories.find(
                (e) => e.internalName === (entry.category || "Other"),
            );

            if (existingCategory) {
                existingCategory.contents.push(entry);
            } else {
                blockCategories.push({
                    internalName: entry.category || "Other",
                    displayName: titleCase(entry.category || "Other"),
                    contents: [entry],
                });
            }
        });

        function getCategory(key) {
            if (!key) {
                return undefined;
            }

            return BlocklyWrapper.getTranslation(
                "PYRITE_TOOLBOX_" + key.replace(" ", "_").toUpperCase(),
            );
        }
    }

    function initializeWorkspaceEvents(workspace) {
        let deltaX;
        let deltaY;
        let activeBlock;

        workspace.addChangeListener(function (e) {
            if (
                e.type === BlocklyWrapper.Events.CLICK ||
                e.type === BlocklyWrapper.Events.SELECTED
            ) {
                if (shiftKey) {
                    if (!e.blockId) {
                        return;
                    }

                    const block = workspace.getBlockById(e.blockId);

                    const selectedIndex = selectedBlocks.indexOf(block);

                    if (selectedIndex < 0) {
                        selectedBlocks.push(block);

                        block.setHighlighted(true);
                    } else {
                        selectedBlocks.splice(selectedIndex, 1);

                        block.setHighlighted(false);
                    }
                } else if (selectedBlocks.length > 0) {
                    selectedBlocks.forEach((block) => {
                        block.setHighlighted(false);
                    });

                    selectedBlocks.length = 0;
                }
            } else if (
                e.type === BlocklyWrapper.Events.BLOCK_DRAG &&
                !e.isStart
            ) {
                activeBlock = e.blockId;
            } else if (
                e.type === BlocklyWrapper.Events.MOVE &&
                e.newCoordinate &&
                e.oldCoordinate &&
                activeBlock
            ) {
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

    //Based on: https://groups.google.com/g/blockly/c/LXnMujtEzJY/m/FKQjI4OwAwAJ
    function updateMouseCoords(event) {
        const mainWorkspace = BlocklyWrapper.getMainWorkspace();

        if (!mainWorkspace) {
            return;
        }

        // Gets the x and y position of the cursor relative to the workspace's parent svg element.
        const mouseXY = BlocklyWrapper.Xml.mouseToSvg(
            event,
            mainWorkspace.getParentSvg(),
            mainWorkspace.getInverseScreenCTM(),
        );

        // Gets where the visible workspace starts in relation to the workspace's parent svg element.
        const absoluteMetrics = mainWorkspace
            .getMetricsManager()
            .getAbsoluteMetrics();

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

    function hotfixDomMutations() {
        function hotfixBlock(block) {
            //NOTE: Don't fix blocks that don't have state information or implement mutations properly
            if (
                !block.saveExtraState ||
                !block.loadExtraState ||
                (block.mutationToDom && block.domToMutation)
            ) {
                return;
            }

            //NOTE: Always replace this implementation, since it's not needed for backwards compatibility.
            block.mutationToDom = function () {
                const mutation = BlocklyWrapper.Xml.createElement("mutation");
                mutation.setAttribute(
                    "portal-extensions-state",
                    JSON.stringify(this.saveExtraState()),
                );

                return mutation;
            };

            const originalDomToMutation = block.domToMutation;

            block.domToMutation = function (mutation) {
                const stateAttribute = mutation.getAttribute(
                    "portal-extensions-state",
                );

                if (stateAttribute) {
                    this.loadExtraState(JSON.parse(stateAttribute));
                } else if (originalDomToMutation) {
                    originalDomToMutation.apply(this, arguments);
                }
            };
        }

        //NOTE: Fix the Block-classes
        for (const block of BlocklyWrapper.Blocks.getAllClasses()) {
            hotfixBlock(block.value);
        }

        //NOTE: Fix the Blocks that are already instanced
        for (const block of BlocklyWrapper.Blocks.getAllInstances()) {
            hotfixBlock(block.value);
        }
    }

    return {
        init: init,
    };
})();
