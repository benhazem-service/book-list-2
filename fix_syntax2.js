const fs = require('fs');
let content = fs.readFileSync('main.js', 'utf8');
const lines = content.split('\n');

let start = -1;
let end = -1;

for (let i = 2930; i < 2960; i++) {
    if (lines[i] && lines[i].includes('localStorage.setItem(\'bookAppData_levels\', JSON.stringify({ levels }));')) {
        start = i + 1; // Start replacing after this line
    }
    if (start !== -1 && i > start && lines[i] && lines[i].includes('try {') && lines[i+1] && lines[i+1].includes('// حفظ نسخة احتياطية')) {
        end = i; // End before the 'try {' of deleteLevel
        break;
    }
}

if (start !== -1 && end !== -1) {
    const replacement = [
        '        } catch (error) {',
        '          console.error("خطأ في تحريك المستوى:", error);',
        '          showTemporaryAlert("حدث خطأ في تحريك المستوى. يرجى المحاولة مرة أخرى", "error");',
        '        }',
        '      }',
        '',
        '      window.deleteLevel = async function(idx, levelName) {',
        '        if (!confirm(`هل أنت متأكد من رغبتك في حذف المستوى الدراسي "${levelName}"؟\\nسيتم حذف جميع المواد والكتب التابعة له.`)) {',
        '          return;',
        '        }',
        ''
    ];
    lines.splice(start, end - start, ...replacement);
    fs.writeFileSync('main.js', lines.join('\n'), 'utf8');
    console.log('Successfully repaired main.js syntax errors.');
} else {
    console.log('Could not find the target range.');
    console.log('start', start, 'end', end);
}
