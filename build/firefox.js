const base = require("./base");

const outputPath = "firefox";
const files = [];

base.prepareFiles(files, outputPath, "manifest.v2.json");
base.packExtension(outputPath, "firefox.xpi");