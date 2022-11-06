const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

const args = process.argv.slice(2);

const baseExtensionFiles = [
    "icon-128.png",
    "extension/app.js",
    "options/img/logo.svg",
    "options/css/default.css",
    "options/js/app.js",
    "options/index.html",
    "web/app.js"
];

function prepareWebFiles(files, outputPath) {
    const finalOutputPath = "dist/" + outputPath;

    const finalFiles = [
        ...files
    ];

    fs.mkdirSync(finalOutputPath, {
        recursive: true
    });

    finalFiles.forEach(file => {
        const filePath = path.parse(file);

        if (filePath.dir !== "") {
            fs.mkdirSync(`${finalOutputPath}/${filePath.dir}`, {
                recursive: true
            });
        }

        fs.copyFileSync(`src/web/${file}`, `${finalOutputPath}/${file}`);
    });
}

function prepareBrowserFiles(files, outputPath, manifestTransformFileName) {
    const finalOutputPath = "temp/" + outputPath;

    const finalFiles = [
        ...baseExtensionFiles,
        ...files
    ];

    fs.mkdirSync(finalOutputPath, {
        recursive: true
    });

    finalFiles.forEach(file => {
        const filePath = path.parse(file);

        if (filePath.dir !== "") {
            fs.mkdirSync(`${finalOutputPath}/${filePath.dir}`, {
                recursive: true
            });
        }

        fs.copyFileSync(`src/browser/${file}`, `${finalOutputPath}/${file}`);
    });

    const manifest = require("../src/browser/manifest.base.json");
    const manifestTransform = require(`../src/browser/${manifestTransformFileName}`);
    const combinedManifest = { ...manifest, ...manifestTransform };

    fs.writeFileSync(`${finalOutputPath}/manifest.json`, JSON.stringify(combinedManifest, null, "    "));
}

function packExtension(outputPath, outputFileName) {
    if(hasFlag("--nopack")) {
        return;
    }

    const output = fs.createWriteStream(`temp/${outputFileName}`, {
        flags: "w"
    });

    const archive = archiver("zip");

    output.on("close", function () {
        console.log(`${outputFileName} has been created with ${archive.pointer()} bytes.`);
    });
    
    archive.pipe(output);
    archive.directory(`temp/${outputPath}`, false);
    archive.finalize();
}

function hasFlag(flag) {
    return args.indexOf(flag) >= 0;
}

module.exports = {
    prepareWebFiles: prepareWebFiles,
    prepareBrowserFiles: prepareBrowserFiles,
    packExtension: packExtension
};