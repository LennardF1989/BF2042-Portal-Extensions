const base = require("./base");

const outputPath = "chromium";
const files = [];

base.prepareFiles(files, outputPath, "manifest.json");
base.packExtension(outputPath, "chromium.zip");