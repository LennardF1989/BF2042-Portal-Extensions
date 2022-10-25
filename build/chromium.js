const base = require("./base");

const outputPath = "chromium";

/*if (fs.existsSync(outputPath)){
    fs.rmdirSync(outputPath);
}*/
const files = [
    "manifest.json"
]

base.prepFiles(
    files,
    outputPath,
    "manifest.json"
)
base.packExtension(outputPath)