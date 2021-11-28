const fs = require("fs");
const path = require("path");
const base = require("./base"); 
const { exec } = require("child_process");

const outputPath = "temp/chromium";

/*if (fs.existsSync(outputPath)){
    fs.rmdirSync(outputPath);
}*/

fs.mkdirSync(outputPath, { 
    recursive: true
});

const files = [
    ...base.files,
    "manifest.json",
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

exec(`cd ${outputPath} && tar.exe --format zip -cf ../chromium.zip *`);