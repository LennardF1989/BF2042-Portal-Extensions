# BF2042 Portal Extensions
> NOTE! As of v2.0.0 the extension is purposely split into a Browser Extension with minimal functionality and a Web Extension that does the rest as described below. The Browser Extension will load a Web Extension of your choice, which in turn is also responsible for managing plugins. The recommended Web Extension comes with a default Plugin Manager. In order to load additional plugins, you can open the Plugin Manager by right-clicking a Blockly workspace and going into Options > Plugin Manager.

This extension adds additional functionality to the BF2042 Portal Rules Editor.

Functionality available:
- Open Documentation
- Copy to Clipboard
- Paste from Clipboard
- Add/Remove Comment
- Show Inputs Vertically/Horizontally
- Expand/Collapse Block
- Expand/Collapse All Blocks
- Add Blocks from the Context-menu
- Toggle Distraction-Free Mode
- Toggle Toolbox
- Jump to Subroutine
- Import/Export Blocks from/to JSON
- Export Blocks to SVG[1] and PNG
- Multiple selection by holding down SHIFT[2][3]:
  - Drag selection as one
  - Export selection to SVG[1] and PNG
  - Copy/Paste selection to/from clipboard
- Plugin system

[1] The SVG still contains all other blocks, it is only focused on the selected portion! If you only intended to share a selection, copy/paste it to a clean workspace first.

[2] CTRL is used by Blockly to detach a block when dragging, hence SHIFT was used.

[3] Most actions from the context-menu do not support multiple selections yet and will only be performed on the last selected block.

## Installation

### Chrome Web Store
Get it here: https://chrome.google.com/webstore/detail/bf2042-portal-extensions/ojegdnmadhmgfijhiibianlhbkepdhlj

### Edge Addons
Get it here: https://microsoftedge.microsoft.com/addons/detail/bf2042-portal-extensions/abkgoonnpmbeekieegggnicdheolmnkf

### Mozilla Addons
Get it here: https://addons.mozilla.org/firefox/addon/bf2042-portal-extensions/

### Manually

#### Chrome and Edge
You can download and load the extension yourself into Chrome or Edge:

1. Download the latest `chromium.zip` [release](https://github.com/LennardF1989/BF2042-Portal-Extensions/releases).
2. Extract the ZIP somewhere on your filesystem.
2. Open up Chrome, go into Extensions and enable Developer Mode.
3. Click "Load extracted extension" and browse to the extracted folder from step 2.

Done! The extension is now active, simply refresh the BF2042 Portal to see the effects in the Rules Editor.

### Firefox
You can download and load the extension yourself into Firefox:

1. Download the latest `firefox.xpi` [release](https://github.com/LennardF1989/BF2042-Portal-Extensions/releases).
2. Open up Firefox, and go to [this](about:debugging#/runtime/this-firefox) special page.
3. Click "Load Temporary Add-on" and browse to the downloaded file from step 1.

Done! The extension is now active, simply refresh the BF2042 Portal to see the effects in the Rules Editor.

## Plugins
It's possible to load plugins with this extension. 

For information on how to use plugins, please read [this](https://github.com/LennardF1989/BF2042-Portal-Extensions/wiki/Plugins).

A list of curated plugins and plugin managers can be found [here](/plugins/plugin-index.md).

If you would like to develop your own plugins, please read [this](/plugins/README.md).

## Donations
If you appreciate what I'm doing, consider buying me a cup of coffee!

https://paypal.me/lennardf1989
