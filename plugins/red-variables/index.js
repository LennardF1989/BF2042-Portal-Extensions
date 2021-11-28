const theme = _Blockly.getMainWorkspace().getTheme();

const variableStyle = theme.blockStyles["variable-block-style"];
variableStyle.colourPrimary = "#b53e3e";
variableStyle.colourSecondary = "#782424";
variableStyle.colourTertiary = "#782424";

_Blockly.getMainWorkspace().setTheme(theme);