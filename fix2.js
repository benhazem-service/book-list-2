const fs = require('fs');
let content = fs.readFileSync('main.js', 'utf8');

const target1 = "        .replace(/\\\"/g, '&quot;')\\r\\n      });";
const target2 = "        .replace(/\\\"/g, '&quot;')\\n      });";

const fix = `        .replace(/'/g, '&#039;');
    }

    // دالة موحدة لتوليد وعرض نافذة طباعة لائحة الكتب بتنسيق PDF احترافي ومنظم ومضغوط
    function renderChosenBooksPDFWindow(chosenBooksData, options = {}) {
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
              allBooksMap[title] = (allBooksMap[title] || 0) + (Number(booksObj[title]) || 1);
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
            name: 'جميع الكتب (مرتبة أبجدياً)',
            books: sortedBooks,
            titlesCount: sortedBooks.length,
            totalCopies: totalCopies
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
`;

if (content.indexOf("        .replace(/\\\"/g, '&quot;')\r\n      });") !== -1) {
    content = content.replace("        .replace(/\\\"/g, '&quot;')\r\n      });", "        .replace(/\\\"/g, '&quot;')\r\n" + fix);
    fs.writeFileSync('main.js', content);
    console.log('Fixed CRLF!');
} else if (content.indexOf("        .replace(/\\\"/g, '&quot;')\n      });") !== -1) {
    content = content.replace("        .replace(/\\\"/g, '&quot;')\n      });", "        .replace(/\\\"/g, '&quot;')\n" + fix);
    fs.writeFileSync('main.js', content);
    console.log('Fixed LF!');
} else {
    console.log('Not found!');
}
