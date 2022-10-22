const base = require("./base");
const { exec } = require("child_process");

const outputPath = "temp/firefox";

/*if (fs.existsSync(outputPath)){
    fs.rmdirSync(outputPath);
}*/

const files = [
    "extension/background.js",
]

base.prepFiles(files, outputPath, "manifest.v2.json")
exec(`cd  ${outputPath} && tar.exe --format zip -cf ../firefox.xpi *`);
