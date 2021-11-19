const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const outputPath = "temp/firefox";

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
]

files.forEach(file => {
    const filePath = path.parse(file);

    fs.copyFileSync(file, `${outputPath}/${filePath.base}`);
});

const manifest = require("../src/manifest.json");
const manifestTransform = require("../src/manifest.v2.json");
const combinedManifest = {...manifest, ...manifestTransform };

fs.writeFileSync(`${outputPath}/manifest.json`, JSON.stringify(combinedManifest, null, "    "));

exec(`cd  ${outputPath} && tar.exe --format zip -cf ../firefox.xpi *`);