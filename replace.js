const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regex = /function renderChosenBooksPDFWindow[\s\S]*?(?=async function exportArchivedChosenBooksPDF)/;
const match = code.match(regex);
if (match) {
    const newFunc = fs.readFileSync('new_render.js', 'utf8');
    code = code.replace(regex, newFunc + "\n\n    ");
    fs.writeFileSync('main.js', code);
    console.log('Successfully replaced renderChosenBooksPDFWindow.');
} else {
    console.log('Could not find regex match.');
}