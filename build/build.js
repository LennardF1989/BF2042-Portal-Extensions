const execSync = require("child_process").execSync;

const args = process.argv.slice(2);

const stdio = {
    stdio: [0, 1, 2]
};

execSync(`node build/chromium.js ${args}`, stdio);
execSync(`node build/firefox.js ${args}`, stdio);