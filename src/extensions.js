const BF1942PortalExtensions = (function() {
    const copyToClipboard = (function () {
        const errorMessage = "Failed to copy to clipboard!";
    
        function precondition() {
            return "enabled";
        }
    
        async function callback(scope) {   
            try {
                var xmlDom = _Blockly.Xml.blockToDom(scope.block);
                var xmlText = _Blockly.Xml.domToPrettyText(xmlDom);
        
                xmlText = `<xml xmlns="https://developers.google.com/blockly/xml">${xmlText}</xml>`;

                await navigator.clipboard.writeText(xmlText);
            }
            catch(e) {
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
    
        //NOTE: Unfortunately precondition cannot be async, so we cannot check if the clipboard contains valid XML beforehand.
        function precondition() {
            return "enabled";
        }
    
        async function callback() {
            try {
                const xmlText = await navigator.clipboard.readText();
    
                if (!xmlText.startsWith("<xml")) {
                    return;
                }
    
                const dom = _Blockly.Xml.textToDom(xmlText);
                _Blockly.Xml.domToWorkspace(dom, _Blockly.getMainWorkspace());
            }
            catch (e) {
                logError(errorMessage, e);
    
                alert(errorMessage);
            }
        }
    
        return {
            id: "pasteFromClipboard",
            displayText: "Paste from Clipboard",
            scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
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
    
    function logError(message, error) {
        console.log(`[ERROR] ${message}`, error);
    }

    function init() {
        _Blockly.ContextMenuRegistry.registry.register(copyToClipboard);
        _Blockly.ContextMenuRegistry.registry.register(openDocumentation);
        _Blockly.ContextMenuRegistry.registry.register(pasteFromClipboard);
    }

    init();
})();