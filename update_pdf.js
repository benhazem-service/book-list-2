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

// Find end of renderChosenBooksPDFWindow
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

      let allBooksMap = {};
      let grandTotalPrice = 0;
      let totalLevelsSet = new Set();
      let totalCopiesCount = 0;

      function getBookPrice(title, levelName) {
         const lvl = levels.find(l => l.name === levelName);
         if (lvl && lvl.booksPrices && lvl.booksPrices[title]) {
             return parseFloat(lvl.booksPrices[title]);
         }
         return 0;
      }

      for (const levelName in chosenBooksData) {
        const booksObj = chosenBooksData[levelName];
        if (booksObj && typeof booksObj === 'object') {
          totalLevelsSet.add(levelName);
          for (const title in booksObj) {
            const formattedTitle = title + ' (' + levelName + ')';
            const price = getBookPrice(title, levelName);
            if (!allBooksMap[formattedTitle]) {
                allBooksMap[formattedTitle] = { count: 0, price: price, title: title, level: levelName };
            }
            allBooksMap[formattedTitle].count += (Number(booksObj[title]) || 1);
          }
        }
      }

      const bookTitles = Object.keys(allBooksMap);
      if (bookTitles.length === 0) {
        showTemporaryAlert('لا توجد كتب مختارة لتصديرها', 'warning');
        return;
      }

      const sortedBooks = bookTitles
        .sort((a, b) => a.localeCompare(b, 'ar'))
        .map(titleKey => {
          const b = allBooksMap[titleKey];
          const total = b.price * b.count;
          grandTotalPrice += total;
          totalCopiesCount += b.count;
          return {
            formattedTitle: titleKey,
            count: b.count,
            price: b.price,
            totalPrice: total
          };
        });

      const totalLevelsCount = totalLevelsSet.size;
      const totalBookTitlesCount = sortedBooks.length;
      const isTwoColumn = !showPrices;

      const now = new Date();
      const formattedDate = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0');
      const formattedTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

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
      if (isTwoColumn) {
        const half = Math.ceil(sortedBooks.length / 2);
        for (let i = 0; i < half; i++) {
          const b1 = sortedBooks[i];
          const b2 = sortedBooks[i + half];
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
        tbodyHTML = sortedBooks.map(b => \`
          <tr>
            <td class="col-title">\${escapeHTML(b.formattedTitle)}</td>
            <td class="col-count"><span class="count-pill">\${b.count > 1 ? b.count : ''}</span></td>
            <td style="text-align: center;">\${b.price > 0 ? b.price + ' درهم' : '-'}</td>
            <td class="col-check"><span class="check-box"></span></td>
          </tr>
        \`).join('');
      }

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
console.log('PDF function updated');
