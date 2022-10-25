const execSync = require('child_process').execSync;

const arg = process.argv.slice(2) || 'dv'; // Default value `dv` if no args provided via CLI.

execSync('node build/chromium.js ' + arg, {stdio:[0, 1, 2]});
execSync('node build/firefox.js ' + arg, {stdio:[0, 1, 2]});