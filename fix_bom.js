const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');
// Remove BOM characters
const before = code.length;
code = code.replace(/\uFEFF/g, '');
const after = code.length;
fs.writeFileSync('main.js', code);
console.log('Removed ' + (before - after) + ' BOM characters');