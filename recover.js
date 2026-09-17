const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function readObject(sha) {
    const dir = sha.substring(0, 2);
    const file = sha.substring(2);
    const p = path.join('.git', 'objects', dir, file);
    if (!fs.existsSync(p)) return null;
    const compressed = fs.readFileSync(p);
    return zlib.inflateSync(compressed);
}

// Just search all objects to find which one looks like main.js and has the biggest size
let bestSha = null;
let maxLen = 0;
let bestContent = null;

const dirs = fs.readdirSync(path.join('.git', 'objects'));
for (const dir of dirs) {
    if (dir.length !== 2) continue;
    const files = fs.readdirSync(path.join('.git', 'objects', dir));
    for (const file of files) {
        const sha = dir + file;
        try {
            const inflated = readObject(sha);
            // format: "blob <size>\0<content>"
            const firstSpace = inflated.indexOf(32);
            const nullByte = inflated.indexOf(0);
            if (firstSpace !== -1 && nullByte !== -1) {
                const type = inflated.slice(0, firstSpace).toString();
                if (type === 'blob') {
                    const content = inflated.slice(nullByte + 1);
                    const text = content.toString('utf8');
                    // Check if it's main.js by looking for specific strings like 'let levels = [];'
                    if (text.includes('function renderBooksList') && text.includes('function exportPDF')) {
                        if (content.length > maxLen) {
                            maxLen = content.length;
                            bestSha = sha;
                            bestContent = content;
                        }
                    }
                }
            }
        } catch (e) {}
    }
}

if (bestContent) {
    fs.writeFileSync('main_recovered.js', bestContent);
    console.log('Recovered ' + bestSha + ' with length ' + maxLen);
} else {
    console.log('Not found');
}