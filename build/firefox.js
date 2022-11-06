const base = require("./base");

const outputPath = "firefox";
const files = [];

base.prepareBrowserFiles(files, outputPath, "manifest.v2.json");
base.packExtension(outputPath, "firefox.xpi");