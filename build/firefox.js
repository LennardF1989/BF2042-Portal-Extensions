const base = require("./base");

const outputPath = "firefox";

const files = [
    "extension/background.js",
];

base.prepareFiles(files, outputPath, "manifest.v2.json");
base.packExtension(outputPath, "firefox.xpi");