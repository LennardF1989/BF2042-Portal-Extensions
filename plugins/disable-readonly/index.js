/* global BF2042Portal, _Blockly */
(function () {
    const plugin = BF2042Portal.Plugins.getPlugin("disable-readonly");

    if(_Blockly.getMainWorkspace().options.readOnly) {
        plugin.initializeWorkspace = function () {
            setReadOnly(false);
        };
    
        setReadOnly(false);
    
        //NOTE: We have to apply this to the existing workspace
        _Blockly.getMainWorkspace().clear();
        setTimeout(function() {
            _Blockly.getMainWorkspace().undo();
        }, 0);
    }

    function setReadOnly(toggle) {
        _Blockly.getMainWorkspace().options.readOnly = toggle;
    }
})();
