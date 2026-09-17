const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regex = /const win = window\.open\('', '_blank'\);\s*win\.document\.write\(.*?\);\s*requestedBooks\.forEach\([\s\S]*?\);\s*win\.document\.write\(.*?\);\s*win\.document\.close\(\);\s*win\.onload = function\(\) \{\s*win\.print\(\);\s*\};/m;

const replacement = `
    const htmlContent = '<html dir="rtl" lang="ar"><head><title>لائحة الكتب المطلوبة</title><style>body { font-family: Cairo, sans-serif; padding: 20px; } h2 { text-align: center; color: #2d3748; margin-bottom: 20px; } table { width: 100%; border-collapse: collapse; margin-top: 15px; } th, td { border: 1px solid #cbd5e0; padding: 10px; text-align: right; } th { background-color: #edf2f7; font-weight: bold; }</style></head><body><h2>لائحة الكتب المطلوبة من الزبناء</h2><table><thead><tr><th>الزبون</th><th>المستوى</th><th>الكتاب</th><th>التاريخ</th></tr></thead><tbody>' + 
    requestedBooks.map(req => '<tr><td>' + req.name + '</td><td>' + req.level + '</td><td>' + req.book + '</td><td>' + req.date + '</td></tr>').join('') + 
    '</tbody></table><div style="margin-top:30px; text-align:center; font-size:0.9em; color:#718096;">تم استخراج هذه اللائحة بتاريخ: ' + new Date().toLocaleDateString('ar-MA') + '</div><script>window.onload = function() { setTimeout(() => window.print(), 500); }</script></body></html>';

    let printFrame = document.getElementById('print-iframe');
    if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'print-iframe';
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-9999px';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);
    }
    
    try {
        const doc = printFrame.contentWindow.document;
        doc.open();
        doc.write(htmlContent);
        doc.close();
    } catch (e) {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }
`;

if (code.match(regex)) {
    code = code.replace(regex, replacement.trim());
    fs.writeFileSync('main.js', code);
    console.log("Successfully replaced printRequestedBooks window.open with iframe");
} else {
    console.log("Could not find regex match in printRequestedBooks!");
}