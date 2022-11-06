const base = require("./base");

const outputPath = "chromium";
const files = [];

base.prepareFiles(files, outputPath, "manifest.v3.json");
base.packExtension(outputPath, "chromium.zip");