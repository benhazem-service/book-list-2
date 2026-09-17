const fs = require('fs');
const content = fs.readFileSync('main.js', 'utf8');
const lines = content.split('\n');

for (let i = 3240; i < 3260; i++) {
    if (lines[i] && lines[i].includes('// Load requested books if they exist')) {
        // Move the brace from line i+7 (which is 3256 in current array maybe) to just before this line
        // Actually, let's just find the closing brace that comes after updateRequestedBooksBadge
        // and if there are two consecutive braces, move one up.
        
        // Let's explicitly rewrite lines 3245 to 3258
        break;
    }
}

// Safer way:
// Find 3245: // Load levels if they exist
// Extract lines until renderLevels();
// Replace them with exact correct structure.

let startIdx = -1;
let endIdx = -1;
for (let i = 3240; i < 3260; i++) {
    if (lines[i] && lines[i].includes('// Load levels if they exist')) {
        startIdx = i;
    }
    if (startIdx !== -1 && lines[i] && lines[i].includes('renderLevels();')) {
        endIdx = i;
        break;
    }
}

if (startIdx !== -1 && endIdx !== -1) {
    const newLines = [
        '          // Load levels if they exist',
        '          if (data.levels && data.levels.length > 0) {',
        '            levels = data.levels;',
        '            localStorage.setItem(\'bookAppData_levels\', JSON.stringify({ levels }));',
        '          }',
        '',
        '          // Load requested books if they exist',
        '          if (data.requestedBooks) {',
        '            requestedBooks = data.requestedBooks;',
        '            if (typeof updateRequestedBooksBadge === \'function\') {',
        '                updateRequestedBooksBadge();',
        '            }',
        '          }',
        '        }',
        ''
    ];
    lines.splice(startIdx, endIdx - startIdx, ...newLines);
    fs.writeFileSync('main.js', lines.join('\n'), 'utf8');
    console.log('Fixed brace structure.');
} else {
    console.log('Could not find boundaries.');
}
