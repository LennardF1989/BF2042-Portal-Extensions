import { Block, BlockSvg, Events, WorkspaceSvg } from "blockly";
import {
    ContextMenuOption,
    RegistryItem,
} from "blockly/core/contextmenu_registry";
import { init as pluginInit } from "./Plugins";
import { BlockDefinition } from "blockly/core/blocks";
import { ScopeType } from "blockly/core/contextmenu_registry";
import { Scope } from "blockly/core/contextmenu_registry";
import { BlockMove, Click, Selected } from "blockly/core/events/events";
import { BlockDrag } from "blockly/core/events/events_block_drag";
import { Coordinate } from "blockly/core/utils";
import { createElement } from "blockly/core/utils/xml";
import { mouseToSvg } from "blockly/core/browser_events";
import {
    domToText,
    domToVariables,
    domToWorkspace,
    textToDom,
    workspaceToDom,
} from "blockly/core/xml";

interface BlocklyWrapper {
    Events: typeof Events;

    Blocks: {
        getSelected(): BlockSvg;
        getAllClasses(): Array<{ key: string; value: BlockDefinition }>;
        getAllInstances(): Array<{ key: string; value: BlockSvg }>;
    };

    ContextMenu: {
        ScopeType: typeof ScopeType;

        show(
            event: Event,
            options: Array<ContextMenuOption>,
            rtl: boolean,
        ): void;
        getOptionsForWorkspace(
            workspace: WorkspaceSvg,
        ): Array<ContextMenuOption>;
        getOptionsForBlock(block: BlockSvg): Array<ContextMenuOption>;
        getAllItems(): Array<{ key: string; value: RegistryItem }>;
        unregisterItem(item: string): void;
        registerItem(item: RegistryItem): void;
    };

    Xml: {
        createElement: typeof createElement;
        mouseToSvg: typeof mouseToSvg;

        workspaceToDom: typeof workspaceToDom;
        textToDom: typeof textToDom;

        domToWorkspace: typeof domToWorkspace;
        domToVariables: typeof domToVariables;
        domToText: typeof domToText;

        blockToXml: (block: BlockSvg) => string;
    };

    getMainWorkspace(): WorkspaceSvg;
    getTranslation(key: string): string;
}

function blocklyWrapper(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blockly: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blocklyTranslations: any,
): BlocklyWrapper {
    const self: BlocklyWrapper = {} as BlocklyWrapper;

    self.Events = blockly.Events;

    self.getMainWorkspace = function (): WorkspaceSvg {
        return blockly.getMainWorkspace();
    };

    self.getTranslation = function (key: string): string {
        const splitKeys = key.split(".");

        let firstElement = blocklyTranslations.Msg.Msg[splitKeys[0]];

        for (let index = 1; index < splitKeys.length; index++) {
            firstElement = firstElement[splitKeys[index]];
        }

        return firstElement;
    };

    self.Blocks = {
        getSelected: function (): BlockSvg {
            return blockly.getSelected();
        },

        getAllClasses: function (): Array<{
            key: string;
            value: BlockDefinition;
        }> {
            return Object.keys(blockly.Blocks).map((e: string) => {
                return {
                    key: e,
                    value: blockly.Blocks[e],
                };
            });
        },

        getAllInstances: function (): Array<{ key: string; value: BlockSvg }> {
            return self
                .getMainWorkspace()
                .getAllBlocks(false)
                .map((e: BlockSvg) => {
                    return {
                        key: e.id,
                        value: e,
                    };
                });
        },
    };

    self.ContextMenu = {
        ScopeType: {
            BLOCK: blockly.ContextMenuRegistry.ScopeType.BLOCK,
            WORKSPACE: blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
        },

        show: function (
            event: Event,
            options: Array<ContextMenuOption>,
            rtl: boolean,
        ): void {
            blockly.ContextMenu.show(event, options, rtl);
        },

        getOptionsForWorkspace: function (
            workspace: WorkspaceSvg,
        ): Array<ContextMenuOption> {
            return blockly.ContextMenuRegistry.registry.getContextMenuOptions(
                self.ContextMenu.ScopeType.WORKSPACE,
                {
                    workspace: workspace,
                },
            );
        },

        getOptionsForBlock: function (
            block: BlockSvg,
        ): Array<ContextMenuOption> {
            return blockly.ContextMenuRegistry.registry.getContextMenuOptions(
                self.ContextMenu.ScopeType.BLOCK,
                {
                    block: block,
                },
            );
        },

        getAllItems: function (): Array<{ key: string; value: RegistryItem }> {
            return [...blockly.ContextMenuRegistry.registry.registry_].map(
                (e: { [0]: string; [1]: RegistryItem }) => {
                    return {
                        key: e[0],
                        value: e[1],
                    };
                },
            );
        },

        unregisterItem: function (item: string): void {
            blockly.ContextMenuRegistry.registry.unregister(item);
        },

        registerItem: function (item: RegistryItem): void {
            blockly.ContextMenuRegistry.registry.register(item);
        },
    };

    self.Xml = {
        createElement: blockly.utils.xml.createElement,
        mouseToSvg: blockly.browserEvents.mouseToSvg,

        workspaceToDom: blockly.Xml.workspaceToDom,
        textToDom: blockly.Xml.textToDom,

        domToWorkspace: blockly.Xml.domToWorkspace,
        domToVariables: blockly.Xml.domToVariables,
        domToText: blockly.Xml.domToText,

        blockToXml: function (block: BlockSvg): string {
            const xmlDom = blockly.Xml.blockToDomWithXY(block, true);
            blockly.Xml.deleteNext(xmlDom);

            const xmlText = blockly.Xml.domToText(xmlDom).replace(
                'xmlns="https://developers.google.com/blockly/xml"',
                "",
            );

            return xmlText;
        },
    };

    return self;
}

const BlocklyWrapper = blocklyWrapper(_Blockly, Blockly);

interface BlocklyConfig {
    menus: {
        [key: string]: RegistryMenuItem;
    };
    items: {
        [key: string]: RegistryItem;
    };
}

const blocklyConfig: BlocklyConfig = {
    menus: {},
    items: {},
};

interface BlockLookup {
    type: string;
    category: string;
    internalName: string;
    displayName: string;
}

interface BlockCategory {
    internalName: string;
    displayName: string;
    contents: Array<BlockLookup>;
}

export interface MouseCoords {
    x: number;
    y: number;
}

interface LastContextMenu {
    e: Event;
    options: Array<MenuOption>;
    rtl: boolean;
}

//NOTE: This is a subset of ContextMenuOption
export interface MenuOption {
    text: string;
    enabled: boolean;
    callback: () => void;
}

export type RegistryMenuItem = RegistryItem & {
    options: Array<string>;
};

const mouseCoords: MouseCoords = {
    x: 0,
    y: 0,
};

interface JsonWorkspaceFile {
    variables: string;
    mainWorkspace: string;
}

const contextMenuStack: Array<Array<MenuOption>> = [];
let lastContextMenu: LastContextMenu = undefined;

const blockLookup: Array<BlockLookup> = [];
const blockCategories: Array<BlockCategory> = [];

const selectedBlocks: Array<BlockSvg> = [];

let shiftKey = false;

const imageDataUrlCache = new Map<string, string>();

//Blockly functions - Items
function copyToClipboard(): RegistryItem {
    const errorMessage = "Failed to copy to clipboard!";

    function precondition(): string {
        return "enabled";
    }

    async function callback(scope: Scope): Promise<void> {
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

function pasteFromClipboard(): RegistryItem {
    const errorMessage = "Failed to paste from clipboard!";

    //NOTE: Unfortunately precondition cannot be async, so we cannot check if the clipboard contains valid XML beforehand.
    function precondition(): string {
        return "enabled";
    }

    async function callback(): Promise<void> {
        try {
            const xmlText = await BF2042Portal.Shared.pasteTextFromClipboard();

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

function toggleComments(): RegistryItem {
    function displayText(scope: Scope): string {
        const toggleType = scope.block.getCommentIcon() ? "Remove" : "Add";

        const blocks = getSelectedBlocks(scope);

        if (blocks.length === 1) {
            return `${toggleType} Comment`;
        }

        return `${toggleType} Comment (${blocks.length} Blocks)`;
    }

    function precondition(): string {
        return "enabled";
    }

    function callback(scope: Scope): void {
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

function toggleInputs(): RegistryItem {
    function displayText(scope: Scope): string {
        const toggleType = scope.block.getInputsInline()
            ? "Vertically"
            : "Horizontally";

        const blocks = getSelectedBlocks(scope);

        if (blocks.length === 1) {
            return `Show Inputs ${toggleType}`;
        }

        return `Show Inputs ${toggleType} (${blocks.length} Blocks)`;
    }

    function precondition(): string {
        return "enabled";
    }

    function callback(scope: Scope): void {
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

function toggleCollapse(): RegistryItem {
    function displayText(scope: Scope): string {
        const toggleType = scope.block.isCollapsed() ? "Expand" : "Collapse";

        const blocks = getSelectedBlocks(scope);

        if (blocks.length === 1) {
            return `${toggleType} Block`;
        }

        return `${toggleType} ${blocks.length} Blocks`;
    }

    function precondition(): string {
        return "enabled";
    }

    function callback(scope: Scope): void {
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

function collapseAllBlocks(): RegistryItem {
    function displayText(scope: Scope): string {
        const blocks = getSelectedBlocks(scope);

        if (blocks) {
            if (blocks.length === 1) {
                return "Collapse Block";
            }

            return `Collapse ${blocks.length} Blocks`;
        }

        return "Collapse All Blocks";
    }

    function precondition(): string {
        return "enabled";
    }

    function callback(scope: Scope): void {
        const blocks = getSelectedBlocks(scope);

        if (blocks) {
            for (let i = 0; i < blocks.length; i++) {
                blocks[i].setCollapsed(true);
            }
        } else {
            const workspace = BlocklyWrapper.getMainWorkspace();

            for (const block of workspace.getAllBlocks(false)) {
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

function expandAllBlocks(): RegistryItem {
    function displayText(scope: Scope): string {
        const blocks = getSelectedBlocks(scope);

        if (blocks) {
            if (blocks.length === 1) {
                return "Expand Block";
            }

            return `Expand ${blocks.length} Blocks`;
        }

        return "Expand All Blocks";
    }

    function precondition(): string {
        return "enabled";
    }

    function callback(scope: Scope): void {
        const blocks = getSelectedBlocks(scope);

        if (blocks) {
            for (let i = 0; i < blocks.length; i++) {
                blocks[i].setCollapsed(false);
            }
        } else {
            const workspace = BlocklyWrapper.getMainWorkspace();

            for (const block of workspace.getAllBlocks(false)) {
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

function deleteModBlock(): RegistryItem {
    function precondition(scope: Scope): string {
        if (
            scope.block.type === "modBlock" &&
            BlocklyWrapper.getMainWorkspace().getBlocksByType("modBlock", false)
                .length > 1
        ) {
            return "enabled";
        }

        return "hidden";
    }

    function callback(scope: Scope): void {
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

function openDocumentation(): RegistryItem {
    const documentationUrl = "https://docs.bfportal.gg/blocks";

    function precondition(): string {
        return "enabled";
    }

    function callback(): void {
        window.open(documentationUrl, "bf2042_documentation");
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

function jumpToSubRoutine(): RegistryItem {
    function precondition(scope: Scope): string {
        if (scope.block.type === "subroutineInstanceBlock") {
            return "enabled";
        }

        return "hidden";
    }

    function callback(scope: Scope): void {
        const subroutineName = scope.block.getFieldValue("SUBROUTINE_NAME");

        const foundBlocks = BlocklyWrapper.getMainWorkspace()
            .getBlocksByType("subroutineBlock", false)
            .filter(
                (e: Block) =>
                    e.getFieldValue("SUBROUTINE_NAME") === subroutineName,
            );

        if (foundBlocks.length > 0) {
            BlocklyWrapper.getMainWorkspace().centerOnBlock(foundBlocks[0].id);
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

function toggleDistractionFreeMode(): RegistryItem {
    function precondition(): string {
        return "enabled";
    }

    function callback(): void {
        document.querySelector("app-root").classList.toggle("distraction-free");

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

function toggleToolbox(): RegistryItem {
    function precondition(): string {
        return "enabled";
    }

    function callback(): void {
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

function exportBlocksWorkspace(): RegistryItem {
    return exportBlocks(
        "exportBlocksWorkspace",
        BlocklyWrapper.ContextMenu.ScopeType.WORKSPACE,
    );
}

function exportBlocksBlock(): RegistryItem {
    return exportBlocks(
        "exportBlocksBlock",
        BlocklyWrapper.ContextMenu.ScopeType.BLOCK,
    );
}

function exportBlocks(id: string, scopeType: ScopeType): RegistryItem {
    interface SvgData {
        width: number;
        height: number;
        svgDataURL: string;
    }

    function precondition(): string {
        return "enabled";
    }

    function callback(scope: Scope): void {
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

    async function exportToXml(scope: Scope): Promise<void> {
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

    async function exportToSvg(scope: Scope): Promise<void> {
        const blocks = getSelectedBlocks(scope);
        const svgData = await blocksToSvg(blocks, false);

        downloadFile(svgData.svgDataURL, "screenshot.svg");
    }

    async function exportToPngAsFile(scope: Scope): Promise<void> {
        try {
            const blocks = getSelectedBlocks(scope);
            const svgData = await blocksToSvg(blocks, true);
            const pngData = (await svgToData(svgData, 1, "png")) as string;

            downloadFile(pngData, "screenshot.png");
        } catch (e) {
            BF2042Portal.Shared.logError("Failed to export PNG (Download)", e);

            alert("Failed to export PNG (Download)!");
        }
    }

    async function exportToPngOnClipboard(scope: Scope): Promise<void> {
        try {
            const blocks = getSelectedBlocks(scope);
            const svgData = await blocksToSvg(blocks, true);
            const blobData = (await svgToData(svgData, 1, "blob")) as Blob;

            await BF2042Portal.Shared.copyBlobToClipboard(blobData);

            alert("Done!");
        } catch (e) {
            BF2042Portal.Shared.logError("Failed to export PNG (Clipboard)", e);

            alert("Failed to export PNG (Clipboard)!");
        }
    }

    //Based on: https://github.com/google/blockly/blob/master/tests/playgrounds/screenshot.js
    async function blocksToSvg(
        blocks: Array<BlockSvg>,
        convertImagesToDataURI: boolean,
    ): Promise<SvgData> {
        const workspace = BlocklyWrapper.getMainWorkspace();
        let x: number, y: number, width: number, height: number;

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
            x = boundingBox.left;
            y = boundingBox.top;
            width = boundingBox.right - x;
            height = boundingBox.bottom - y;
        }

        const blockCanvas = workspace.getCanvas();
        const clone = blockCanvas.cloneNode(true) as SVGGElement;
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
                workspace.getTheme ? workspace.getTheme().name + "-theme" : ""
            }`,
        );
        svg.setAttribute("width", width.toString());
        svg.setAttribute("height", height.toString());
        svg.setAttribute("style", "background-color: transparent");

        const css = [].slice
            .call(document.head.querySelectorAll("style"))
            .filter(function (el: HTMLStyleElement) {
                return (
                    /\.blocklySvg/.test(el.innerText) ||
                    el.id.indexOf("blockly-") === 0
                );
            })
            .map(function (el: HTMLStyleElement) {
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
            const matches = [...svgAsXML.matchAll(/xlink:href="(.*?)"/g)];

            for (const match of matches) {
                const url = match[1];

                if (url.startsWith("data:") || imageDataUrlCache.has(url)) {
                    continue;
                }

                try {
                    const dataUrl = await new Promise<string>(
                        // eslint-disable-next-line no-async-promise-executor, @typescript-eslint/typedef
                        async (resolve, reject) => {
                            try {
                                //TODO: Implement a time-out mechanism
                                const response = await fetch(
                                    "https://portal.battlefield.com" + url,
                                );

                                const blob = await response.blob();

                                const reader = new FileReader();
                                reader.onload = (
                                    f: ProgressEvent<FileReader>,
                                ): void => {
                                    resolve(f.target.result as string);
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
            /xlink:href="(.*?)"/g,
            function (_: string, url: string) {
                const newUrl = imageDataUrlCache.has(url)
                    ? imageDataUrlCache.get(url)
                    : url;

                return `xlink:href="${newUrl}"`;
            },
        );

        const data = `data:image/svg+xml,${encodeURIComponent(svgAsXML)}`;

        return {
            width: width,
            height: height,
            svgDataURL: data,
        };
    }

    async function svgToData(
        svgData: SvgData,
        scale: number,
        dataType: string,
    ): Promise<string | Blob> {
        // eslint-disable-next-line @typescript-eslint/typedef
        const promise = new Promise<string | Blob>((resolve, reject) => {
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

            img.onload = function (): void {
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
                        canvas.toBlob(function (blob: Blob): void {
                            resolve(blob);
                        });
                    } else {
                        throw "Unknown type";
                    }
                } catch (e) {
                    reject(`Failed to convert SVG: ${e}`);
                }
            };

            img.src = svgData.svgDataURL;
        });

        return promise;
    }

    function downloadFile(fileData: string, fileName: string): void {
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

function importBlocksFromFile(): RegistryItem {
    function precondition(): string {
        return "enabled";
    }

    function callback(): void {
        const inputElement = document.createElement("input");
        inputElement.setAttribute("type", "file");
        inputElement.setAttribute("accept", ".xml,.json");
        inputElement.style.display = "none";

        inputElement.addEventListener("change", function () {
            if (!inputElement.files || inputElement.files.length === 0) {
                return;
            }

            const fileReader = new FileReader();
            fileReader.onload = function (e: ProgressEvent<FileReader>): void {
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
                        const loadData = JSON.parse(e.target.result as string);

                        if (!loadJson(loadData)) {
                            alert("Failed to import workspace from JSON!");
                        }
                    } else if (extension === "xml") {
                        if (!loadXml(e.target.result as string)) {
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

function addBlock(): RegistryItem {
    function precondition(): string {
        return "enabled";
    }

    //TODO: Variables/Subroutines
    function callback(): void {
        const options: Array<MenuOption> = [];

        for (let i = 0; i < blockCategories.length; i++) {
            const entry = blockCategories[i];

            options.push({
                text: entry.displayName,
                enabled: true,
                callback: function () {
                    const subOptions: Array<MenuOption> = [];

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

                                //NOTE: Deliberately cast to Coordinate
                                block.moveTo(mouseCoords as Coordinate);
                            },
                        });
                    }

                    showContextMenuWithBack(subOptions.sort(sortByText));
                },
            });
        }

        showContextMenuWithBack(options.sort(sortByText));
    }

    function sortByText(a: MenuOption, b: MenuOption): number {
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

function separatorWorkspace(): RegistryItem {
    return separator(
        "separatorWorkspace",
        BlocklyWrapper.ContextMenu.ScopeType.WORKSPACE,
    );
}

function separatorBlock(): RegistryItem {
    return separator(
        "separatorBlock",
        BlocklyWrapper.ContextMenu.ScopeType.BLOCK,
    );
}

function separator(id: string, scope: ScopeType): RegistryItem {
    return {
        id: id,
        displayText: "---",
        scopeType: scope,
        weight: 100,
        preconditionFn: () => "disabled",
        callback: (): void => {
            //Do nothing
        },
    };
}

//Blockly functions - Menus
function optionsWorkspace(): RegistryMenuItem {
    return createMenu(
        "optionsWorkspace",
        "Options",
        BlocklyWrapper.ContextMenu.ScopeType.WORKSPACE,
    );
}

function optionsBlock(): RegistryMenuItem {
    return createMenu(
        "optionsBlock",
        "Options",
        BlocklyWrapper.ContextMenu.ScopeType.BLOCK,
    );
}

function createMenu(
    id: string,
    name: string,
    scopeType: ScopeType,
): RegistryMenuItem {
    function precondition(): string {
        return "enabled";
    }

    function callback(scope: Scope): void {
        const menu = blocklyConfig.menus[id];
        const subMenuOptions: Array<MenuOption> = [];

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

function createSubMenuItem(
    id: string,
    scopeType: ScopeType,
    scope: Scope,
): MenuOption {
    let data: RegistryItem | RegistryMenuItem;

    if (id.startsWith("items.")) {
        data = blocklyConfig.items[id.substring("items.".length)];
    } else if (id.startsWith("menus.")) {
        data = blocklyConfig.menus[id.substring("menus.".length)];
    }

    if (!data || data.scopeType !== scopeType) {
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
function registerMenu(menu: RegistryMenuItem): void {
    blocklyConfig.menus[menu.id] = menu;
}

function registerItem(item: RegistryItem): void {
    blocklyConfig.items[item.id] = item;
}

//Private functions
function saveXml(blocks: Array<BlockSvg>): string {
    const workspace = BlocklyWrapper.getMainWorkspace();

    try {
        let xmlText = "";

        if (blocks && blocks.length > 0) {
            for (let i = 0; i < blocks.length; i++) {
                xmlText += BlocklyWrapper.Xml.blockToXml(blocks[i]);
            }

            return xmlText;
        } else {
            const xmlDom = BlocklyWrapper.Xml.workspaceToDom(workspace, true);

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

function loadJson(data: JsonWorkspaceFile): boolean {
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
        BF2042Portal.Shared.logError("Failed to load workspace from JSON!", e);
    }

    return false;
}

function loadXml(xmlText: string): boolean {
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

        interface Variable {
            objectType: string;
            variableName: string;
        }

        const variables: Array<Variable> = [];

        variableBlocks.forEach((e: Element) => {
            const objectType = e.querySelector(
                "field[name='OBJECTTYPE']",
            ).textContent;
            const variableName =
                e.querySelector("field[name='VAR']").textContent;

            if (
                objectType &&
                variableName &&
                !variables.find(
                    (v: Variable) =>
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

        variables.forEach((e: Variable) => {
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
        let minX: number;
        let minY: number;

        for (let i = 0; i < xmlDom.childNodes.length; i++) {
            const block = xmlDom.childNodes[i] as Element;

            const x = parseInt(block.getAttribute("x"));
            const y = parseInt(block.getAttribute("y"));

            if (!minX || x < minX) {
                minX = x;
            }

            if (!minY || y < minY) {
                minY = y;
            }
        }

        //NOTE: Transform blocks to the minimum coords, then move them to their target position.
        for (let i = 0; i < xmlDom.childNodes.length; i++) {
            const block = xmlDom.childNodes[i] as Element;

            const x = parseInt(block.getAttribute("x"));
            const y = parseInt(block.getAttribute("y"));

            if (x === minX) {
                block.setAttribute("x", mouseCoords.x.toString());
            } else {
                block.setAttribute("x", (x - minX + mouseCoords.x).toString());
            }

            if (y === minY) {
                block.setAttribute("y", mouseCoords.y.toString());
            } else {
                block.setAttribute("y", (y - minY + mouseCoords.y).toString());
            }
        }

        BlocklyWrapper.Xml.domToWorkspace(
            xmlDom,
            BlocklyWrapper.getMainWorkspace(),
        );

        return true;
    } catch (e) {
        BF2042Portal.Shared.logError("Failed to load workspace from XML!", e);
    }

    return false;
}

//Based on: https://stackoverflow.com/questions/32589197/how-can-i-capitalize-the-first-letter-of-each-word-in-a-string-using-javascript
function titleCase(value: string): string {
    return value
        .split(" ")
        .map(
            (s: string) =>
                s.charAt(0).toUpperCase() + s.substring(1).toLowerCase(),
        )
        .join(" ");
}

//API functions
function getSelectedBlocks(scope: Scope): Array<BlockSvg> {
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

function getMouseCoords(): MouseCoords {
    return {
        x: mouseCoords.x,
        y: mouseCoords.y,
    };
}

function showContextMenuWithBack(options: Array<MenuOption>): void {
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

                        //NOTE: Deliberately cast to ContextMenuOption
                        BlocklyWrapper.ContextMenu.show(
                            lastContextMenu.e,
                            menu[0] as unknown as Array<ContextMenuOption>,
                            lastContextMenu.rtl,
                        );
                    },
                },
                {
                    text: "---",
                    enabled: false,
                    callback: () => {
                        //Do nothing
                    },
                },
            )
            .concat(options),
        lastContextMenu.rtl,
    );
}

export interface PluginApi {
    getSelectedBlocks: typeof getSelectedBlocks;
    getMouseCoords: typeof getMouseCoords;
    showContextMenuWithBack: typeof showContextMenuWithBack;
    registerMenu: typeof registerMenu;
    registerItem: typeof registerItem;
    createMenu: typeof createMenu;
}

//Initialize functions
export function init(): void {
    cssFixes();

    hookContextMenu();
    hookBlockly();

    initializeBlocks(BF2042Portal.Startup.getBlockDefinitions());
    initializeDocumentEvents();
    initializeBlockly();

    pluginInit({
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

function cssFixes(): void {
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

function hookContextMenu(): void {
    const workspace = BlocklyWrapper.getMainWorkspace();

    const workspacePrototype: WorkspaceSvg = Object.getPrototypeOf(workspace);
    const originalWorkspaceShowContextMenu = workspacePrototype.showContextMenu;

    workspacePrototype.showContextMenu = function (e: MouseEvent): void {
        //NOTE: Clear the stack every time the content menu is opened at the root
        contextMenuStack.length = 0;

        //NOTE: Deliberately cast to MenuOption, since only a subset of properties is required.
        lastContextMenu = {
            e: e,
            options: BlocklyWrapper.ContextMenu.getOptionsForWorkspace(
                this,
            ) as unknown as Array<MenuOption>,
            rtl: this.RTL,
        };

        updateMouseCoords(e);

        // eslint-disable-next-line prefer-rest-params
        originalWorkspaceShowContextMenu.apply(this, arguments);
    };

    const blockPrototype: BlockSvg = Object.getPrototypeOf(
        workspace.getTopBlocks(false)[0],
    );
    const originalBlockShowContextMenu = blockPrototype.showContextMenu;

    blockPrototype.showContextMenu = function (e: MouseEvent): void {
        //NOTE: Clear the stack every time the content menu is opened at the root
        contextMenuStack.length = 0;

        //NOTE: Deliberately cast to MenuOption, since only a subset of properties is required.
        lastContextMenu = {
            e: e,
            options: BlocklyWrapper.ContextMenu.getOptionsForBlock(
                this,
            ) as unknown as Array<MenuOption>,
            rtl: this.RTL,
        };

        updateMouseCoords(e);

        // eslint-disable-next-line prefer-rest-params
        return originalBlockShowContextMenu.apply(this, arguments);
    };
}

function hookBlockly(): void {
    function initializeWorkspace(workspace: WorkspaceSvg): void {
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

    _Blockly.inject = function (): WorkspaceSvg {
        // eslint-disable-next-line prefer-rest-params
        const workspace = blockly.apply(this, arguments);

        initializeWorkspace(workspace);

        return workspace;
    };

    initializeWorkspace(BlocklyWrapper.getMainWorkspace());
}

function initializeDocumentEvents(): void {
    document.addEventListener("keydown", function (e: KeyboardEvent) {
        shiftKey = e.shiftKey;
    });

    document.addEventListener("keyup", function (e: KeyboardEvent) {
        shiftKey = e.shiftKey;
    });
}

function initializeBlockly(): void {
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
        "items.cleanWorkspace",
        "items.jumpToSubRoutine",
        "items.copyToClipboard",
        "items.pasteFromClipboard",
    ];

    //TODO: Give plugins a chance to modify this

    contextMenuStructure.forEach(function (item: string) {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function initializeBlocks(blockDefinitions: any): void {
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
        displayName: titleCase(BlocklyWrapper.getTranslation("PYRITE_RULE")),
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            blockDefinitions.selectionLists.map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (e: any) => e.listType + "Item",
            ),
        ),
    ];

    //Blocks - Values (Yellow)
    for (let index = 0; index < blockDefinitions.values.length; index++) {
        const element = blockDefinitions.values[index];

        //NOTE: Some values have no category...
        if (!element.category) {
            if (element.name === "GetVariable") {
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
            if (element.name === "SetVariable") {
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
    blockLookup.forEach((entry: BlockLookup) => {
        const existingCategory = blockCategories.find(
            (e: BlockCategory) =>
                e.internalName === (entry.category || "Other"),
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

    function getCategory(key: string): string {
        if (!key) {
            return undefined;
        }

        return BlocklyWrapper.getTranslation(
            "PYRITE_TOOLBOX_" + key.replace(" ", "_").toUpperCase(),
        );
    }
}

function initializeWorkspaceEvents(workspace: WorkspaceSvg): void {
    let deltaX;
    let deltaY;
    let activeBlock: string;

    //NOTE: Yes, this is cheating.
    type SuperEvent = Click & Selected & BlockDrag & BlockMove;

    workspace.addChangeListener(function (e: SuperEvent) {
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
                selectedBlocks.forEach((block: BlockSvg) => {
                    block.setHighlighted(false);
                });

                selectedBlocks.length = 0;
            }
        } else if (e.type === BlocklyWrapper.Events.BLOCK_DRAG && !e.isStart) {
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
function updateMouseCoords(event: MouseEvent): void {
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

function hotfixDomMutations(): void {
    function hotfixBlock(block: BlockSvg): void {
        //NOTE: Don't fix blocks that don't have state information or implement mutations properly
        if (
            !block.saveExtraState ||
            !block.loadExtraState ||
            (block.mutationToDom && block.domToMutation)
        ) {
            return;
        }

        //NOTE: Always replace this implementation, since it's not needed for backwards compatibility.
        block.mutationToDom = function (): Element {
            const mutation = BlocklyWrapper.Xml.createElement("mutation");
            mutation.setAttribute(
                "portal-extensions-state",
                JSON.stringify(this.saveExtraState()),
            );

            return mutation;
        };

        const originalDomToMutation = block.domToMutation;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        block.domToMutation = function (mutation: Element): any {
            const stateAttribute = mutation.getAttribute(
                "portal-extensions-state",
            );

            if (stateAttribute) {
                this.loadExtraState(JSON.parse(stateAttribute));
            } else if (originalDomToMutation) {
                // eslint-disable-next-line prefer-rest-params
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

export default {};
