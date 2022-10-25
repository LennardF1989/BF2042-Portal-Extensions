const base = require("./base");

const outputPath = "firefox";

/*if (fs.existsSync(outputPath)){
    fs.rmdirSync(outputPath);
}*/

const files = [
    "extension/background.js",
]

base.prepFiles(files, outputPath, "manifest.v2.json")
base.packExtension(outputPath)
