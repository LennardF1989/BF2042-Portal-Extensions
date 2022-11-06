const base = require("./base");

const outputPath = "chromium";
const files = [];

base.prepareBrowserFiles(files, outputPath, "manifest.v3.json");
base.packExtension(outputPath, "chromium.zip");