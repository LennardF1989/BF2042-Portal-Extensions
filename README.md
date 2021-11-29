# BF2042 Portal Extensions
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
You can download and load the extension yourself into Chrome*:

1. Download this repository and extract it to somewhere on your filesystem.
2. Open up Chrome, go into Extensions and enable Developer Mode.
3. Click "Load extracted extension" and browse to the "src"-folder at the location from step 1.

Done! The extension is now active, simply refresh the BF2042 Portal to see the effects in the Rules Editor.

* Edge should also work, as well as Mozilla. The procedures might be slightly different there.

## Plugins
It's possible to load plugins with this extension. If you would like to develop your own plugins, please read [this](/plugins/README.md).

## Donations
If you appreciate what I'm doing, consider buying me a cup of coffee!

https://paypal.me/lennardf1989
