    function renderChosenBooksPDFWindow(chosenBooksData, options = {}) {
      if (!chosenBooksData || typeof chosenBooksData !== 'object' || Object.keys(chosenBooksData).length === 0) {
        showTemporaryAlert('لا توجد كتب مختارة لتصديرها', 'warning');
        return;
      }

      const pageTitle = options.title || 'لائحة الكتب المدرسية المختارة';
      const isArchive = !!options.isArchive;
      const ownerName = (currentUser && (currentUser.name || currentUser.displayName || currentUser.email)) || options.ownerName || '';
      const showPrices = !!options.showPrices;

      const structuredLevels = [];
      let totalLevelsCount = 0;
      let totalBookTitlesCount = 0;
      let totalCopiesCount = 0;
      let grandTotalPrice = 0;

      function getBookPrice(title, levelName) {
         const lvl = levels.find(l => l.name === levelName);
         if (lvl && lvl.booksPrices && lvl.booksPrices[title]) {
             return parseFloat(lvl.booksPrices[title]);
         }
         return 0;
      }

      if (options.flatAlphabetical) {
        let allBooksMap = {};
        for (const levelName in chosenBooksData) {
          const booksObj = chosenBooksData[levelName];
          if (booksObj && typeof booksObj === 'object') {
            for (const title in booksObj) {
              const formattedTitle = title + ' - ' + levelName;
              const price = getBookPrice(title, levelName);
              if (!allBooksMap[formattedTitle]) {
                  allBooksMap[formattedTitle] = { count: 0, price: price };
              }
              allBooksMap[formattedTitle].count += (Number(booksObj[title]) || 1);
            }
          }
        }
        
        const bookTitles = Object.keys(allBooksMap);
        if (bookTitles.length > 0) {
          const sortedBooks = bookTitles
            .sort((a, b) => a.localeCompare(b, 'ar'))
            .map(title => ({
              title: title,
              count: allBooksMap[title].count,
              price: allBooksMap[title].price,
              totalPrice: allBooksMap[title].price * allBooksMap[title].count
            }));
            
          const totalCopies = sortedBooks.reduce((sum, b) => sum + b.count, 0);
          const levelTotalPrice = sortedBooks.reduce((sum, b) => sum + b.totalPrice, 0);
          grandTotalPrice += levelTotalPrice;
          
          structuredLevels.push({
            name: 'جميع الكتب (مرتبة أبجدياً)',
            books: sortedBooks,
            titlesCount: sortedBooks.length,
            totalCopies: totalCopies,
            isTwoColumn: !showPrices
          });
          
          totalBookTitlesCount += sortedBooks.length;
          totalCopiesCount += totalCopies;
        }
      } else {
        if (Array.isArray(levels)) {
          levels.forEach(level => {
            const levelName = level.name;
            if (chosenBooksData[levelName]) {
              const booksObj = chosenBooksData[levelName];
              const bookTitles = Object.keys(booksObj);
              if (bookTitles.length > 0) {
                const sortedBooks = bookTitles
                  .sort((a, b) => a.localeCompare(b, 'ar'))
                  .map(title => {
                    const price = getBookPrice(title, levelName);
                    const count = Number(booksObj[title]) || 1;
                    return {
                      title: title,
                      count: count,
                      price: price,
                      totalPrice: price * count
                    };
                  });
                
                const levelTotalCopies = sortedBooks.reduce((sum, b) => sum + b.count, 0);
                const levelTotalPrice = sortedBooks.reduce((sum, b) => sum + b.totalPrice, 0);
                grandTotalPrice += levelTotalPrice;
                
                structuredLevels.push({
                  name: levelName,
                  books: sortedBooks,
                  titlesCount: sortedBooks.length,
                  totalCopies: levelTotalCopies,
                  isTwoColumn: !showPrices
                });

                totalBookTitlesCount += sortedBooks.length;
                totalCopiesCount += levelTotalCopies;
              }
            }
          });
        }
      }

      totalLevelsCount = structuredLevels.length;

      if (totalLevelsCount === 0 || totalBookTitlesCount === 0) {
        showTemporaryAlert('لا توجد كتب مختارة لتصديرها', 'warning');
        return;
      }

      const now = new Date();
      const formattedDate = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0');
      const formattedTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

      const levelsCardsHTML = structuredLevels.map(lvl => {
        let theadHTML = `
                <tr>
                  <th style="text-align: right;">اسم الكتاب / المقرر</th>
                  <th style="width: 44px; text-align: center;">العدد</th>
                  ${showPrices ? '<th style="width: 60px; text-align: center;">الثمن</th><th style="width: 80px; text-align: center;">المجموع</th>' : ''}
                  <th style="width: 28px; text-align: center;">✔</th>
                  ${lvl.isTwoColumn ? `
                  <th style="text-align: right; border-right: 2px solid var(--border-color);">اسم الكتاب / المقرر</th>
                  <th style="width: 44px; text-align: center;">العدد</th>
                  <th style="width: 28px; text-align: center;">✔</th>
                  ` : ''}
                </tr>
        `;

        let tbodyHTML = '';
        if (lvl.isTwoColumn) {
          const half = Math.ceil(lvl.books.length / 2);
          for (let i = 0; i < half; i++) {
            const b1 = lvl.books[i];
            const b2 = lvl.books[i + half];
            tbodyHTML += `
              <tr>
                <td class="col-title">${escapeHTML(b1.title)}</td>
                <td class="col-count"><span class="count-pill">${b1.count}</span></td>
                <td class="col-check"><span class="check-box"></span></td>
                ${b2 ? `
                <td class="col-title" style="border-right: 2px solid var(--border-color);">${escapeHTML(b2.title)}</td>
                <td class="col-count"><span class="count-pill">${b2.count}</span></td>
                <td class="col-check"><span class="check-box"></span></td>
                ` : `
                <td class="col-title" style="border-right: 2px solid var(--border-color);"></td>
                <td class="col-count"></td>
                <td class="col-check"></td>
                `}
              </tr>
            `;
          }
        } else {
          tbodyHTML = lvl.books.map((b, idx) => `
            <tr>
              <td class="col-title">${escapeHTML(b.title)}</td>
              <td class="col-count"><span class="count-pill">${b.count}</span></td>
              ${showPrices ? `<td style="text-align: center;">${b.price > 0 ? b.price + ' درهم' : '-'}</td><td style="text-align: center; font-weight:bold; color:#e53e3e;">${b.totalPrice > 0 ? b.totalPrice.toFixed(2) + ' درهم' : '-'}</td>` : ''}
              <td class="col-check"><span class="check-box"></span></td>
            </tr>
          `).join('');
        }

        return `
        <div class="level-card" ${lvl.isTwoColumn ? 'style="grid-column: 1 / -1;"' : 'style="grid-column: 1 / -1;"'}>
          <div class="level-header">
            <div class="level-title-group">
              <span class="level-bullet">📚</span>
              <h3 class="level-name">${escapeHTML(lvl.name)}</h3>
            </div>
            <div class="level-stats-badges">
              <span class="badge badge-titles">${lvl.titlesCount} كتاب</span>
              <span class="badge badge-copies">${lvl.totalCopies} نسخة</span>
            </div>
          </div>
          <div class="level-table-container">
            <table class="level-books-table">
              <thead>${theadHTML}</thead>
              <tbody>${tbodyHTML}</tbody>
            </table>
          </div>
        </div>
        `;
      }).join('');

      const win = window.open('', '_blank', 'width=980,height=750');
      if (!win) {
        showTemporaryAlert('المرجوا السماح بالنوافذ المنبثقة (Popups) لاستخراج ملف PDF', 'error');
        return;
      }

      const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(pageTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #4338ca;
      --primary-light: #eef2ff;
      --primary-dark: #1e1b4b;
      --secondary: #0284c7;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border-color: #cbd5e1;
      --card-border: #cbd5e1;
      --bg-page: #f8fafc;
      --bg-card: #ffffff;
      --row-alt: #f8fafc;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cairo', Tahoma, Arial, sans-serif; direction: rtl; text-align: right; background-color: var(--bg-page); color: var(--text-main); line-height: 1.5; padding: 30px; }
    .print-header { text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid var(--primary); }
    .print-title { font-size: 26px; font-weight: 800; color: var(--primary-dark); margin-bottom: 8px; }
    .print-meta { display: flex; justify-content: center; gap: 20px; color: var(--text-muted); font-size: 14px; font-weight: 600; }
    .print-meta span { background: #e2e8f0; padding: 4px 10px; border-radius: 6px; }
    .summary-section { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 15px 20px; margin-bottom: 25px; display: flex; justify-content: space-around; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .summary-item { text-align: center; }
    .summary-label { font-size: 13px; color: var(--text-muted); font-weight: 700; margin-bottom: 4px; text-transform: uppercase; }
    .summary-value { font-size: 22px; font-weight: 800; color: var(--primary); }
    .levels-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; align-items: start; }
    .level-card { background: var(--bg-card); border: 1px solid var(--card-border); border-radius: 10px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02); page-break-inside: avoid; margin-bottom: 10px; }
    .level-header { background-color: var(--primary-light); padding: 10px 15px; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; }
    .level-title-group { display: flex; align-items: center; gap: 8px; }
    .level-bullet { font-size: 16px; }
    .level-name { font-size: 16px; font-weight: 800; color: var(--primary-dark); margin: 0; }
    .level-stats-badges { display: flex; gap: 6px; }
    .badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 12px; }
    .badge-titles { background-color: #dbeafe; color: #1e40af; }
    .badge-copies { background-color: #fef3c7; color: #92400e; }
    .level-books-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .level-books-table th { background-color: #f1f5f9; color: var(--text-muted); font-weight: 700; padding: 8px 10px; border-bottom: 1px solid var(--border-color); font-size: 12px; }
    .level-books-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .level-books-table tr:nth-child(even) { background-color: var(--row-alt); }
    .level-books-table tr:last-child td { border-bottom: none; }
    .col-title { font-weight: 600; color: #1e293b; }
    .col-count { text-align: center; }
    .count-pill { display: inline-block; background: var(--primary); color: white; font-size: 12px; font-weight: 800; min-width: 24px; padding: 2px 6px; border-radius: 12px; text-align: center; }
    .col-check { text-align: center; }
    .check-box { display: inline-block; width: 16px; height: 16px; border: 2px solid var(--border-color); border-radius: 4px; background: white; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: var(--text-muted); font-weight: 600; border-top: 1px solid var(--border-color); padding-top: 15px; }
    @media print {
      body { padding: 0; background-color: white; }
      .summary-section { box-shadow: none; border: 2px solid var(--text-main); }
      .level-card { box-shadow: none; border: 1px solid #94a3b8; }
      .level-header { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .count-pill { background-color: var(--text-main) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .check-box { border-color: #64748b; }
      ${showPrices ? '.levels-grid { display: block; }' : ''}
    }
  </style>
</head>
<body>
  <div class="print-header">
    <h1 class="print-title">${escapeHTML(pageTitle)}</h1>
    <div class="print-meta">
      ${ownerName ? `<span>👤 ${escapeHTML(ownerName)}</span>` : ''}
      <span>📅 ${formattedDate}</span>
      <span>⏰ ${formattedTime}</span>
    </div>
  </div>

  <div class="summary-section">
    <div class="summary-item">
      <div class="summary-label">مجموع المستويات</div>
      <div class="summary-value">${totalLevelsCount}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">إجمالي الكتب المختلفة</div>
      <div class="summary-value">${totalBookTitlesCount}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">إجمالي النسخ</div>
      <div class="summary-value">${totalCopiesCount}</div>
    </div>
    ${showPrices && grandTotalPrice > 0 ? `
    <div class="summary-item" style="background: #fff5f5; padding: 5px 15px; border-radius: 8px; border: 1px solid #feb2b2;">
      <div class="summary-label" style="color:#c53030;">المجموع الكلي للأثمنة</div>
      <div class="summary-value" style="color:#e53e3e;">${grandTotalPrice.toFixed(2)} درهم</div>
    </div>
    ` : ''}
  </div>

  <div class="levels-grid">
    ${levelsCardsHTML}
  </div>

  <div class="footer">
    تم إنشاء هذه اللائحة تلقائياً عبر تطبيق إدارة الكتب الدراسية • جميع الحقوق محفوظة
  </div>
  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

      win.document.open();
      win.document.write(htmlContent);
      win.document.close();
    }