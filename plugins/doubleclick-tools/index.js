/* global BF2042Portal, _Blockly */
(function () {
    const plugin = BF2042Portal.Plugins.getPlugin(
        "doubleclick-to",
    );

    plugin.initializeWorkspace = function () {
        prepareWorkspace();
    };

    function prepareWorkspace() {
        /** @type import("blockly").WorkspaceSvg */
        let workspace = _Blockly.getMainWorkspace();

        let ctrlKey = false;
        let lastClickTime = undefined;

        document.addEventListener("keydown", function (e) {
            ctrlKey = e.ctrlKey;
        });
    
        document.addEventListener("keyup", function (e) {
            ctrlKey = e.ctrlKey;
        });

        workspace.addChangeListener(function (e) {
            if (e.type === _Blockly.Events.CLICK && e.targetType === "block") {
                if(lastClickTime && Date.now() - lastClickTime < 200) {
                    /** @type import("blockly").BlockSvg */
                    const block = workspace.getBlockById(e.blockId);

                    if(ctrlKey) {
                        block.setInputsInline(!block.getInputsInline());
                    }
                    else {
                        block.setCollapsed(!block.isCollapsed());
                    }
                }

                lastClickTime = Date.now();
            }
        });
    }
})();
