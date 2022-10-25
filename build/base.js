const path = require("path");
const fs = require("fs");
const archiver = require('archiver');

const files = [
    "icon-128.png",
    "extension/app.js",
    "options/css/default.css",
    "options/js/app.js",
    "options/vendors/angular-route.min.js",
    "options/vendors/angular.min.js",
    "options/vendors/bootstrap.min.js",
    "options/vendors/jquery-3.2.1.slim.min.js",
    "options/views/plugins.html",
    "options/views/snippets.html",
    "options/index.html",
    "web/app.js"
];


function prepFiles(file, outputPath, manifestTransformFileName) {
    const finalFiles = [...files, ...file]
    outputPath = 'temp/' + outputPath

    fs.mkdirSync(outputPath, {
        recursive: true
    });
    finalFiles.forEach(file => {
        const filePath = path.parse(file);

        if(filePath.dir !== "") {
            fs.mkdirSync(`${outputPath}/${filePath.dir}`, {
                recursive: true
            });
        }

        fs.copyFileSync(`src/${file}`, `${outputPath}/${file}`);
    });
    const manifest = require("../src/manifest.base.json");
    const manifestTransform = require(`../src/${manifestTransformFileName}`);
    const combinedManifest = {...manifest, ...manifestTransform };
    fs.writeFileSync(`${outputPath}/manifest.json`, JSON.stringify(combinedManifest, null, "    "));
}
function packExtension(outputPath){
    if(!process.argv.slice(2).find(argv => argv === "--pack")){
        return;
    }
    const output = fs.createWriteStream(`temp/${outputPath}_extension.zip`),
        archive = archiver('zip')
    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
    });
    archive.pipe(output);
    archive.directory(`temp/${outputPath}`, false);
    archive.finalize();
}


module.exports = {
    prepFiles: prepFiles,
    packExtension: packExtension
};