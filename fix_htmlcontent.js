const fs = require('fs');
const newRender = fs.readFileSync('new_render.js', 'utf8');
const main = fs.readFileSync('main.js', 'utf8');

const htmlContentDef = newRender.substring(newRender.indexOf('const htmlContent = `'), newRender.indexOf('win.document.open();'));

const insertionPoint = "      // Open print in a new tab using Blob URL (avoids popup blockers)";

if (main.includes(insertionPoint)) {
    const fixedMain = main.replace(insertionPoint, htmlContentDef + '\n' + insertionPoint);
    fs.writeFileSync('main.js', fixedMain);
    console.log("Successfully injected htmlContent back into main.js");
} else {
    console.log("Could not find insertion point!");
}