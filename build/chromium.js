const base = require("./base");
const { exec } = require("child_process");

const outputPath = "temp/chromium";

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

exec(`cd ${outputPath} && tar.exe --format zip -cf ../chromium.zip *`);