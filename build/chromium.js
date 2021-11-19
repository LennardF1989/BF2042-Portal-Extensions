const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const outputPath = "temp/chromium";

/*if (fs.existsSync(outputPath)){
    fs.rmdirSync(outputPath);
}*/

fs.mkdirSync(outputPath, { 
    recursive: true
});

const files = [
    "src/icon-128.png",
    "src/extensions.js",
    "src/startup.js",
    "src/manifest.json",
]

files.forEach(file => {
    const filePath = path.parse(file);

    fs.copyFileSync(file, `${outputPath}/${filePath.base}`);
});

exec(`cd ${outputPath} && tar.exe --format zip -cf ../chromium.zip *`);