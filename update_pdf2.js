const fs = require('fs');

let content = fs.readFileSync('main.js', 'utf8');
const lines = content.split('\n');

let start = -1;
let end = -1;

for (let i = 100; i < 200; i++) {
    if (lines[i].includes('function renderChosenBooksPDFWindow(chosenBooksData, options = {}) {')) {
        start = i;
        break;
    }
}

for (let i = start; i < start + 400; i++) {
    if (lines[i] && lines[i].includes('async function exportArchivedChosenBooksPDF')) {
        end = i - 1;
        break;
    }
}

if (start === -1 || end === -1) {
    console.error("Could not find boundaries");
    process.exit(1);
}

const replacement = `    function renderChosenBooksPDFWindow(chosenBooksData, options = {}) {
      if (!chosenBooksData || typeof chosenBooksData !== 'object' || Object.keys(chosenBooksData).length === 0) {
        showTemporaryAlert('لا توجد كتب مختارة لتصديرها', 'warning');
        return;
      }

      const pageTitle = options.title || 'لائحة الكتب المدرسية المختارة';
      const ownerName = (currentUser && (currentUser.name || currentUser.displayName || currentUser.email)) || options.ownerName || '';
      const showPrices = !!options.showPrices;

      let grandTotalPrice = 0;
      let totalCopiesCount = 0;
      let totalBookTitlesCount = 0;

      function getBookPrice(title, levelName) {
         const lvl = levels.find(l => l.name === levelName);
         if (lvl && lvl.booksPrices && lvl.booksPrices[title]) {
             return parseFloat(lvl.booksPrices[title]);
         }
         return 0;
      }

      const isTwoColumn = !showPrices;
      
      let theadHTML = \`
        <tr>
          <th style="text-align: right;">اسم الكتاب (المستوى)</th>
          <th style="width: 40px; text-align: center;">العدد</th>
          \${showPrices ? '<th style="width: 60px; text-align: center;">الثمن</th>' : ''}
          <th style="width: 25px; text-align: center;">✔</th>
          \${isTwoColumn ? \`
          <th style="text-align: right; border-right: 2px solid #000;">اسم الكتاب (المستوى)</th>
          <th style="width: 40px; text-align: center;">العدد</th>
          <th style="width: 25px; text-align: center;">✔</th>
          \` : ''}
        </tr>
      \`;

      let tbodyHTML = '';
      
      // Iterate over global levels array to maintain user's order (smallest to largest)
      let isFirstLevel = true;
      levels.forEach(levelObj => {
         const levelName = levelObj.name;
         if (chosenBooksData[levelName]) {
             const booksObj = chosenBooksData[levelName];
             const bookTitles = Object.keys(booksObj);
             if (bookTitles.length > 0) {
                 if (!isFirstLevel) {
                     // Add a small gap between levels
                     tbodyHTML += \`<tr class="level-spacer"><td colspan="\${isTwoColumn ? 7 : 4}"></td></tr>\`;
                 }
                 isFirstLevel = false;

                 // Sort books in this level alphabetically
                 const levelSortedBooks = bookTitles
                     .sort((a, b) => a.localeCompare(b, 'ar'))
                     .map(title => {
                         const count = Number(booksObj[title]) || 1;
                         const price = getBookPrice(title, levelName);
                         const formattedTitle = title + ' (' + levelName + ')';
                         
                         grandTotalPrice += (price * count);
                         totalCopiesCount += count;
                         totalBookTitlesCount++;
                         
                         return { formattedTitle, count, price };
                     });

                 if (isTwoColumn) {
                     // Group by pairs: Left and Right
                     for (let i = 0; i < levelSortedBooks.length; i += 2) {
                         const b1 = levelSortedBooks[i];
                         const b2 = levelSortedBooks[i + 1];
                         
                         tbodyHTML += \`
                            <tr>
                              <td class="col-title">\${escapeHTML(b1.formattedTitle)}</td>
                              <td class="col-count"><span class="count-pill">\${b1.count > 1 ? b1.count : ''}</span></td>
                              <td class="col-check"><span class="check-box"></span></td>
                              \${b2 ? \`
                              <td class="col-title" style="border-right: 2px solid #000;">\${escapeHTML(b2.formattedTitle)}</td>
                              <td class="col-count"><span class="count-pill">\${b2.count > 1 ? b2.count : ''}</span></td>
                              <td class="col-check"><span class="check-box"></span></td>
                              \` : \`
                              <td class="col-title" style="border-right: 2px solid #000;"></td>
                              <td class="col-count"></td>
                              <td class="col-check"></td>
                              \`}
                            </tr>
                         \`;
                     }
                 } else {
                     // Single column with prices
                     levelSortedBooks.forEach(b => {
                         tbodyHTML += \`
                           <tr>
                             <td class="col-title">\${escapeHTML(b.formattedTitle)}</td>
                             <td class="col-count"><span class="count-pill">\${b.count > 1 ? b.count : ''}</span></td>
                             <td style="text-align: center;">\${b.price > 0 ? b.price + ' درهم' : '-'}</td>
                             <td class="col-check"><span class="check-box"></span></td>
                           </tr>
                         \`;
                     });
                 }
             }
         }
      });

      if (totalBookTitlesCount === 0) {
        showTemporaryAlert('لا توجد كتب مختارة لتصديرها', 'warning');
        return;
      }

      const now = new Date();
      const formattedDate = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0');
      const formattedTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

      const htmlContent = \`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>\${escapeHTML(pageTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --text-main: #0f172a;
      --border-color: #000;
      --bg-page: #fff;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; background-color: var(--bg-page); color: var(--text-main); font-size: 11px; }
    .print-header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 5px; margin-bottom: 5px; border-bottom: 2px solid #000; }
    .print-title { font-size: 16px; font-weight: 700; margin: 0; }
    .print-meta { font-size: 10px; display: flex; gap: 10px; }
    .compact-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .compact-table th, .compact-table td { border: 1px solid #000; padding: 3px 4px; vertical-align: middle; }
    .compact-table th { background-color: #f1f5f9; font-weight: 700; font-size: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .col-title { font-weight: 600; font-size: 11px; }
    .col-count { text-align: center; }
    .col-check { text-align: center; }
    .count-pill { font-weight: 700; font-size: 11px; }
    .check-box { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; }
    .level-spacer td { border-left: none; border-right: none; height: 6px; background-color: #e2e8f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    
    @media print {
      @page { margin: 5mm; }
      body { font-size: 10px; }
      .print-header { margin-bottom: 4px; padding-bottom: 2px; }
      .print-title { font-size: 14px; }
      .compact-table th { padding: 2px 3px; font-size: 9px; line-height: 1; }
      .compact-table td { padding: 1px 3px; font-size: 10px; line-height: 1; }
      .col-title { font-size: 10px; }
      .count-pill { font-size: 10px; }
      .check-box { width: 10px; height: 10px; }
      .level-spacer td { height: 4px; }
    }
  </style>
</head>
<body>
  <div class="print-header">
    <h1 class="print-title">\${escapeHTML(pageTitle)}</h1>
    <div class="print-meta">
      <span>📚 \${totalBookTitlesCount} كتاب</span>
      <span>📦 \${totalCopiesCount} نسخة</span>
      \${ownerName ? \`<span>👤 \${escapeHTML(ownerName)}</span>\` : ''}
      <span>📅 \${formattedDate}</span>
    </div>
  </div>

  <table class="compact-table">
    <thead>\${theadHTML}</thead>
    <tbody>\${tbodyHTML}</tbody>
  </table>

  <script>
    window.onload = function() {
      setTimeout(() => { window.print(); }, 500);
    };
  </script>
</body>
</html>\`;

      const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const printWin = window.open(url, '_blank');
      if (printWin) {
        printWin.onload = function() {
          setTimeout(function() { printWin.print(); }, 600);
          setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
        };
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
      }
    }
`;

lines.splice(start, end - start, replacement);
fs.writeFileSync('main.js', lines.join('\n'), 'utf8');
console.log('PDF function updated for grouped levels with spacer');
