const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const oldCode = "    window.confirmPrintOptions = function(showPrices) {\r\n       closePrintOptionsModal();\r\n       if (currentPrintAction === 'normal') {";

const newCode = "    window.confirmPrintOptions = function(showPrices) {\r\n       const action = currentPrintAction;\r\n       closePrintOptionsModal();\r\n       if (action === 'normal') {";

if (code.includes(oldCode)) {
    code = code.replace(oldCode, newCode);
    // Also fix the second if
    code = code.replace("} else if (currentPrintAction === 'alphabetical') {", "} else if (action === 'alphabetical') {");
    fs.writeFileSync('main.js', code);
    console.log('Fixed confirmPrintOptions!');
} else {
    console.log('Could not find old code!');
    console.log('Searching...');
    const idx = code.indexOf('confirmPrintOptions');
    console.log('Found at index:', idx);
}