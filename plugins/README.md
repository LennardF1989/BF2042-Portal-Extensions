# Plugins
Plugins are scripts that are loaded by the extension, right after Blockly initializes.

## Creating a plugin
To create a plugin you need 3 things:
- manifest.json
- Main JavaScript-file 
- Place to host these files

### Manifest
The format of a manifest.json file is as follows:
```json
{
    "id": "",
    "name": "",
    "version": "",
    "description": "",
    "author": "",
    "homepage": "",
    "loadAsModule": false,
    "main": ""
}
```

Let me go over each key:
- id: This key is required and should be a unique string to identify the plugin.
- name: This key is required and should be a humand readable string.
- version: This key is required and should be a string in [Semantic Versioning](https://semver.org/) format, without prefixes like `v`.
- description: This key is optional and should be a human readable string to describe the plugin.
- author: This key is optional and should be a human readable string. Multiple authors should be comma-separated.
- homepage: This key is optional and should be a valid URL including the protocol.
- loadAsModule: This key optional and can be set to either true or false to have your plugin loaded as a normal JavaScript file or an ESM module.
- main: This key is required and should be a relative path to the JavaScript-file that should be loaded as part of the plugin, starting from the root-folder of the plugin.

The manifest.json should always be placed in the root-folder of the plugin!

### Main JavaScript-file
The main JavaScript-file is referenced by the manifest.json and can contain any JavaScript you wish. It is not limited in any shape or form, so please be respectful of users their trust.

In theory, it is possible to load more JavaScript files from this file. It is however recommend to bundle all JavaScript into a single file for performance reasons.

### Hosting the files
During development, you can make use of something like `live-server` to serve your files to the extension.

To deploy your files for other users, it is recommended to make a public GitHub repository and then push all required files into a dist-folder, alongside the source code (considering you want to open-source your plugin). You can then use the raw-URL to the manifest.json in the dist-folder to load your plugin.

Keep in mind that the domain hosting the raw files has `X-Frame-Options` set to `deny`, this means you can load the files directly into the BF2042 Portal just fine, but if you are using an iframe, you are going to have a bad time. If you really need to use iframes, use GitHub Pages instead.

## Security concerns
Security is of utmost importance when injecting scripts into the browsers of users. Even though the extension can only modify the BF2042 Portal website and nothing else, we have to play by the rules of the many browser to allow this to be an approved extension.

As such:
- Users have to perform a manual action to add your plugin (eg. provide the Manifest URL).
- Users get the chance to cancel adding your plugin (eg. after reviewing the manifest and associated main JavaScript-file).
- Adding a plugin creates a copy of the main JavaScript-file at that moment in time and stores it locally in the browser of the user. In order to update this copy, users have to manually press the "Update"-button and re-review the plugin.
  > NOTE! As of v2.0.0 this is no longer applicable, because the Plugin Manager is no longer part of the core Browser Extension. All plugins are always loaded straight from the source.

But most importantly, again, be respectful of the trust users put in your plugin.

## Developer Mode
> NOTE! As of v2.0.0 this is no longer applicable, because the Plugin Manager is no longer part of the core Browser Extension.

While above security measures are in place, as a plugin developer you can choose to relax these restrictions a little. Turning on Developer Mode in the extension options will allow you to turn on "Live Reload" for your plugins. When Live Reload is enabled for a plugin, it will always load the main JavaScript-file directly, instead of the locally stored copy.

You will still have to update your plugin to update the manifest!

## Runtime SDK
When your plugin loads, it's possible to request a Runtime SDK from the extension. 

Currently, the feature-set is very limited, but you can do the following:
- `const plugin = BF2042Portal.Plugins.getPlugin("your-plugin-id")` to get reference to your runtime SDK.
- The reference will then contain the contents of your `manifest.json` and the `baseUrl` from where your plugin is loaded.
- A convenience function `getUrl("relativePath")` has been added to get an absolute URL for a file relative to the `baseUrl`.
- You can override the `initializeWorkspace` function on the plugin reference to get a signal whenever the Blockly Workspace is reloaded. Treat this as your "constructor" if you need access to the active workspace.
- `getExtensionVersion` gives you the version of the installed Browser Extension.

A few convenience functions are also available:
- `getMouseCoords` gives you an object with `x` and `y` position of the mouse on the workspace.
- `getSelectedBlocks` gives you all selected blocks on the workspace, either through normal selection or multi-selection.
- `showContextMenuWithBack` allows you to create context menus with sub-menus, which by default is not possible with Blockly.
- `createMenu` lets you create a context menu item that can be shown anywhere in the context menu, even sub-menus and has logic built-in to open sub-menus (using the above `showContextMenuWithBack`).
- `registerMenu` is used to register the object you get back from `createMenu`, to allow it to be used in sub-menus.
- `registerItem` is used to register a sub-menu item.
 
>  NOTE! Only context menu items you want to show immediately into the context menu will have to be registered with Blockly too. For more examples, see the [test-plugin](/plugin/test/index.js).

There is no functionality yet to stream-line saving/loading data for your plugin. In order to be as prepared as possible for future chances:
- Use the `localStorage` in context of the BF2042 Portal website
- Store all your data in a single key as a JSON-string. For example: `localStorage.setItem("your-plugin-id", JSON.stringify(yourPluginData));`

This will allow the extension to easily cleanup data when your plugin gets removed or if the user wishes to reset to default values.

## Licensing
Even though the BF2042 Portal Extensions is license under GPL 3.0, any plugins created are exempted from the requirement to open-source the plugin.