/* global BF2042Portal, _Blockly */
(function () {
    const plugin = BF2042Portal.Plugins.getPlugin("disable-readonly");

    if(_Blockly.getMainWorkspace().options.readOnly) {
        plugin.initializeWorkspace = function () {
            _Blockly.getMainWorkspace().options.readOnly = false;
        };
    
        //NOTE: We have to apply this to the existing workspace
        _Blockly.getMainWorkspace().clear();
        setTimeout(function() {
            _Blockly.getMainWorkspace().undo();
        }, 0);
    }
})();
