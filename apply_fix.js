const fs = require('fs');

const fullCorrectBlock = `function renderChosenBooksPDFWindow(chosenBooksData, options = {}) {
      if (!chosenBooksData || typeof chosenBooksData !== 'object' || Object.keys(chosenBooksData).length === 0) {
        showTemporaryAlert('لا توجد كتب مختارة لتصديرها', 'warning');
        return;
      }

      const pageTitle = options.title || 'لائحة الكتب المدرسية المختارة';
      const isArchive = !!options.isArchive;
      const ownerName = (currentUser && (currentUser.name || currentUser.displayName || currentUser.email)) || options.ownerName || '';

      // 1. استخراج المستويات بالترتيب المعتمد وحساب الإحصائيات
      const structuredLevels = [];
      let totalLevelsCount = 0;
      let totalBookTitlesCount = 0;
      let totalCopiesCount = 0;

      if (options.flatAlphabetical) {
        let allBooksMap = {};
        for (const levelName in chosenBooksData) {
          const booksObj = chosenBooksData[levelName];
          if (booksObj && typeof booksObj === 'object') {
            for (const title in booksObj) {
              const formattedTitle = \`\${title} - \${levelName}\`;
              allBooksMap[formattedTitle] = (allBooksMap[formattedTitle] || 0) + (Number(booksObj[title]) || 1);
            }
          }
        }
        
        const bookTitles = Object.keys(allBooksMap);
        if (bookTitles.length > 0) {
          const sortedBooks = bookTitles
            .sort((a, b) => a.localeCompare(b, 'ar'))
            .map(title => ({
              title: title,
              count: allBooksMap[title]
            }));
            
          const totalCopies = sortedBooks.reduce((sum, b) => sum + b.count, 0);
          
          structuredLevels.push({
            name: "جميع الكتب (مرتبة أبجدياً)",
            books: sortedBooks,
            titlesCount: sortedBooks.length,
            totalCopies: totalCopies,
            isTwoColumn: true
          });
          
          totalBookTitlesCount += sortedBooks.length;
          totalCopiesCount += totalCopies;
        }
      } else {
        // أولاً: المستويات الحالية بالترتيب
        if (Array.isArray(levels)) {
          levels.forEach(level => {
            const levelName = level.name;
            if (chosenBooksData[levelName]) {
              const booksObj = chosenBooksData[levelName];
              const bookTitles = Object.keys(booksObj);
              if (bookTitles.length > 0) {
                const sortedBooks = bookTitles
                  .sort((a, b) => a.localeCompare(b, 'ar'))
                  .map(title => ({
                    title: title,
                    count: Number(booksObj[title]) || 1
                  }));
                
                const levelTotalCopies = sortedBooks.reduce((sum, b) => sum + b.count, 0);
                
                structuredLevels.push({
                  name: levelName,
                  books: sortedBooks,
                  titlesCount: sortedBooks.length,
                  totalCopies: levelTotalCopies
                });

                totalBookTitlesCount += sortedBooks.length;
                totalCopiesCount += levelTotalCopies;
              }
            }
          });
        }

        // ثانياً: أي مستويات أخرى موجودة في البيانات وغير موجودة في levels
        const existingLevelNames = new Set(structuredLevels.map(l => l.name));
        const remainingLevelNames = Object.keys(chosenBooksData)
          .filter(name => !existingLevelNames.has(name))
          .sort((a, b) => a.localeCompare(b, 'ar'));

        remainingLevelNames.forEach(levelName => {
          const booksObj = chosenBooksData[levelName];
          if (booksObj && typeof booksObj === 'object') {
            const bookTitles = Object.keys(booksObj);
            if (bookTitles.length > 0) {
              const sortedBooks = bookTitles
                .sort((a, b) => a.localeCompare(b, 'ar'))
                .map(title => ({
                  title: title,
                  count: Number(booksObj[title]) || 1
                }));
              
              const levelTotalCopies = sortedBooks.reduce((sum, b) => sum + b.count, 0);

              structuredLevels.push({
                name: levelName,
                books: sortedBooks,
                titlesCount: sortedBooks.length,
                totalCopies: levelTotalCopies
              });

              totalBookTitlesCount += sortedBooks.length;
              totalCopiesCount += levelTotalCopies;
            }
          }
        });
      }

      totalLevelsCount = structuredLevels.length;

      if (totalLevelsCount === 0 || totalBookTitlesCount === 0) {
        showTemporaryAlert('لا توجد كتب مختارة لتصديرها', 'warning');
        return;
      }

      // التاريخ والوقت بأرقام واضحة
      const now = new Date();
      const formattedDate = \`\${now.getFullYear()}/\${String(now.getMonth() + 1).padStart(2, '0')}/\${String(now.getDate()).padStart(2, '0')}\`;
      const formattedTime = \`\${String(now.getHours()).padStart(2, '0')}:\${String(now.getMinutes()).padStart(2, '0')}\`;

      // بناء بطاقات المستويات بتصميم مضغوط مع خانة check
      const levelsCardsHTML = structuredLevels.map(lvl => \`
        <div class="level-card" \${lvl.isTwoColumn ? 'style="grid-column: 1 / -1;"' : ''}>
          <div class="level-header">
            <div class="level-title-group">
              <span class="level-bullet">📚</span>
              <h3 class="level-name">\${escapeHTML(lvl.name)}</h3>
            </div>
            <div class="level-stats-badges">
              <span class="badge badge-titles">\${lvl.titlesCount} كتاب</span>
              <span class="badge badge-copies">\${lvl.totalCopies} نسخة</span>
            </div>
          </div>
          <div class="level-table-container">
            <table class="level-books-table">
              <thead>
                <tr>
                  <th style="width: 22px; text-align: center;">#</th>
                  <th style="text-align: right;">اسم الكتاب / المقرر</th>
                  <th style="width: 44px; text-align: center;">العدد</th>
                  <th style="width: 28px; text-align: center;">✔</th>
                  \${lvl.isTwoColumn ? \\\`
                  <th style="width: 22px; text-align: center; border-right: 2px solid var(--border-color);">#</th>
                  <th style="text-align: right;">اسم الكتاب / المقرر</th>
                  <th style="width: 44px; text-align: center;">العدد</th>
                  <th style="width: 28px; text-align: center;">✔</th>
                  \\\` : ''}
                </tr>
              </thead>
              <tbody>
                \${(function() {
                  if (lvl.isTwoColumn) {
                    let rowsHTML = '';
                    const half = Math.ceil(lvl.books.length / 2);
                    for (let i = 0; i < half; i++) {
                      const b1 = lvl.books[i];
                      const b2 = lvl.books[i + half];
                      rowsHTML += \\\`
                        <tr>
                          <td class="col-index">\${i + 1}</td>
                          <td class="col-title">\${escapeHTML(b1.title)}</td>
                          <td class="col-count"><span class="count-pill">\${b1.count}</span></td>
                          <td class="col-check"><span class="check-box"></span></td>
                          \${b2 ? \\\`
                          <td class="col-index" style="border-right: 2px solid var(--border-color);">\${i + half + 1}</td>
                          <td class="col-title">\${escapeHTML(b2.title)}</td>
                          <td class="col-count"><span class="count-pill">\${b2.count}</span></td>
                          <td class="col-check"><span class="check-box"></span></td>
                          \\\` : \\\`
                          <td class="col-index" style="border-right: 2px solid var(--border-color);"></td>
                          <td class="col-title"></td>
                          <td class="col-count"></td>
                          <td class="col-check"></td>
                          \\\`}
                        </tr>
                      \\\`;
                    }
                    return rowsHTML;
                  } else {
                    return lvl.books.map((b, idx) => \\\`
                      <tr>
                        <td class="col-index">\${idx + 1}</td>
                        <td class="col-title">\${escapeHTML(b.title)}</td>
                        <td class="col-count"><span class="count-pill">\${b.count}</span></td>
                        <td class="col-check"><span class="check-box"></span></td>
                      </tr>
                    \\\`).join('');
                  }
                })()}
              </tbody>
            </table>
          </div>
        </div>
      \`).join('');

      `;

let mainJS = fs.readFileSync('main.js', 'utf8');
let corruptedBlock = fs.readFileSync('tmp_extract.txt', 'utf8');

if (mainJS.includes(corruptedBlock)) {
    mainJS = mainJS.replace(corruptedBlock, fullCorrectBlock);
    fs.writeFileSync('main.js', mainJS);
    console.log('Successfully replaced corrupted block!');
} else {
    console.log('Corrupted block not found in main.js!');
}
