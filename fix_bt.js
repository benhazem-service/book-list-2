const fs = require('fs');
let content = fs.readFileSync('main.js', 'utf8');
content = content.replace(/\\\\\\`/g, '\`');
fs.writeFileSync('main.js', content);
console.log('Fixed backticks');
