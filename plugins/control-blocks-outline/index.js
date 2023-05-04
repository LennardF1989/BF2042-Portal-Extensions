/* global BF2042Portal, _Blockly */
(function () {
    const plugin = BF2042Portal.Plugins.getPlugin("control-blocks-outline");

    plugin.initializeWorkspace = function () {
        /** @type import("blockly").Theme */
        const theme = _Blockly.getMainWorkspace().getTheme();
        
        const controlStyle = theme.blockStyles["control-block-style"];
        controlStyle.colourTertiary = "#26166b";

        _Blockly.getMainWorkspace().setTheme(theme);
    };
})();
