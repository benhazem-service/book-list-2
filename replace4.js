const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regex = /const win = window\.open\('', '', 'width=980,height=750'\);\s*if \(!win\) \{\s*showTemporaryAlert\([^)]+\);\s*return;\s*\}\s*win\.document\.open\(\);\s*win\.document\.write\(htmlContent\);\s*win\.document\.close\(\);/m;

const replacement = `
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
    console.log("Successfully replaced exportArchivedChosenBooksPDF window.open with iframe");
} else {
    console.log("Could not find regex match in exportArchivedChosenBooksPDF!");
}