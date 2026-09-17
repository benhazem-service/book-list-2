const fs = require('fs');
const content = fs.readFileSync('main.js', 'utf8');
const lines = content.split('\n');

// Target 1: Repair the damage at lines 2939-2957
let startIdx = -1;
let endIdx = -1;
for (let i = 2930; i < 2950; i++) {
    if (lines[i] && lines[i].includes('showTemporaryAlert("تم تحريك المستوى للأعلى و')) {
        startIdx = i;
        break;
    }
}
for (let i = startIdx; i < startIdx + 30; i++) {
    if (lines[i] && lines[i].includes('JSON.stringify({ levels }));')) {
        endIdx = i;
        break;
    }
}

if (startIdx !== -1 && endIdx !== -1) {
    console.log(`Found damage between lines ${startIdx + 1} and ${endIdx + 1}`);
    const repairLines = [
        '         showTemporaryAlert("تم تحريك المستوى للأعلى وسيظهر التغيير لجميع المستخدمين", "success");',
        '         ',
        '         // حفظ في التخزين المحلي',
        '         localStorage.setItem(\'bookAppData_levels\', JSON.stringify({ levels }));'
    ];
    lines.splice(startIdx, endIdx - startIdx + 1, ...repairLines);
    console.log('Damage repaired in memory.');
} else {
    console.log('Damage not found, might have been fixed or different location.');
}

// Target 2: Insert the missing logic in setupRealtimeListener
let listenerIdx = -1;
for (let i = 3200; i < 3300; i++) {
    if (lines[i] && lines[i].includes('// Load levels if they exist')) {
        listenerIdx = i;
        break;
    }
}

if (listenerIdx !== -1) {
    let closingBraceIdx = -1;
    for (let i = listenerIdx; i < listenerIdx + 10; i++) {
        if (lines[i] && lines[i].trim() === '}') {
            closingBraceIdx = i;
            break;
        }
    }
    
    if (closingBraceIdx !== -1) {
        console.log(`Found listener doc.exists block end at line ${closingBraceIdx + 1}`);
        const insertLines = [
            '          // Load requested books if they exist',
            '          if (data.requestedBooks) {',
            '            requestedBooks = data.requestedBooks;',
            '            if (typeof updateRequestedBooksBadge === \'function\') {',
            '                updateRequestedBooksBadge();',
            '            }',
            '          }'
        ];
        lines.splice(closingBraceIdx, 0, ...insertLines);
        console.log('Inserted logic in memory.');
    } else {
        console.log('Could not find closing brace for listener doc.exists block');
    }
} else {
    console.log('Could not find listener doc.exists block');
}

fs.writeFileSync('main.js', lines.join('\n'), 'utf8');
console.log('Changes written to main.js');
