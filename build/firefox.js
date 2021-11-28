const fs = require("fs");
const path = require("path");
const base = require("./base"); 
const { exec } = require("child_process");

const outputPath = "temp/firefox";

/*if (fs.existsSync(outputPath)){
    fs.rmdirSync(outputPath);
}*/

fs.mkdirSync(outputPath, { 
    recursive: true
});

const files = [
    ...base.files,
    "extension/background.js",
]

files.forEach(file => {
    const filePath = path.parse(file);

    if(filePath.dir != "") {
        fs.mkdirSync(`${outputPath}/${filePath.dir}`, { 
            recursive: true
        });
    }

    fs.copyFileSync(`src/${file}`, `${outputPath}/${file}`);
});

const manifest = require("../src/manifest.json");
const manifestTransform = require("../src/manifest.v2.json");
const combinedManifest = {...manifest, ...manifestTransform };

fs.writeFileSync(`${outputPath}/manifest.json`, JSON.stringify(combinedManifest, null, "    "));

exec(`cd  ${outputPath} && tar.exe --format zip -cf ../firefox.xpi *`);