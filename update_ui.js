const fs = require('fs');
let mainJS = fs.readFileSync('main.js', 'utf8');

// 1. Remove the index columns (#) from the table
const oldHTML = `<div class="level-table-container">
            <table class="level-books-table">
              <thead>
                <tr>
                  <th style="width: 22px; text-align: center;">#</th>
                  <th style="text-align: right;">اسم الكتاب / المقرر</th>
                  <th style="width: 44px; text-align: center;">العدد</th>
                  <th style="width: 28px; text-align: center;">✔</th>
                  \${lvl.isTwoColumn ? \`
                  <th style="width: 22px; text-align: center; border-right: 2px solid var(--border-color);">#</th>
                  <th style="text-align: right;">اسم الكتاب / المقرر</th>
                  <th style="width: 44px; text-align: center;">العدد</th>
                  <th style="width: 28px; text-align: center;">✔</th>
                  \` : ''}
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
                      rowsHTML += \`
                        <tr>
                          <td class="col-index">\${i + 1}</td>
                          <td class="col-title">\${escapeHTML(b1.title)}</td>
                          <td class="col-count"><span class="count-pill">\${b1.count}</span></td>
                          <td class="col-check"><span class="check-box"></span></td>
                          \${b2 ? \`
                          <td class="col-index" style="border-right: 2px solid var(--border-color);">\${i + half + 1}</td>
                          <td class="col-title">\${escapeHTML(b2.title)}</td>
                          <td class="col-count"><span class="count-pill">\${b2.count}</span></td>
                          <td class="col-check"><span class="check-box"></span></td>
                          \` : \`
                          <td class="col-index" style="border-right: 2px solid var(--border-color);"></td>
                          <td class="col-title"></td>
                          <td class="col-count"></td>
                          <td class="col-check"></td>
                          \`}
                        </tr>
                      \`;
                    }
                    return rowsHTML;
                  } else {
                    return lvl.books.map((b, idx) => \`
                      <tr>
                        <td class="col-index">\${idx + 1}</td>
                        <td class="col-title">\${escapeHTML(b.title)}</td>
                        <td class="col-count"><span class="count-pill">\${b.count}</span></td>
                        <td class="col-check"><span class="check-box"></span></td>
                      </tr>
                    \`).join('');
                  }
                })()}
              </tbody>
            </table>
          </div>`;

const newHTML = `<div class="level-table-container">
            <table class="level-books-table">
              <thead>
                <tr>
                  <th style="text-align: right;">اسم الكتاب / المقرر</th>
                  <th style="width: 44px; text-align: center;">العدد</th>
                  <th style="width: 28px; text-align: center;">✔</th>
                  \${lvl.isTwoColumn ? \`
                  <th style="text-align: right; border-right: 2px solid var(--border-color);">اسم الكتاب / المقرر</th>
                  <th style="width: 44px; text-align: center;">العدد</th>
                  <th style="width: 28px; text-align: center;">✔</th>
                  \` : ''}
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
                      rowsHTML += \`
                        <tr>
                          <td class="col-title">\${escapeHTML(b1.title)}</td>
                          <td class="col-count"><span class="count-pill">\${b1.count}</span></td>
                          <td class="col-check"><span class="check-box"></span></td>
                          \${b2 ? \`
                          <td class="col-title" style="border-right: 2px solid var(--border-color);">\${escapeHTML(b2.title)}</td>
                          <td class="col-count"><span class="count-pill">\${b2.count}</span></td>
                          <td class="col-check"><span class="check-box"></span></td>
                          \` : \`
                          <td class="col-title" style="border-right: 2px solid var(--border-color);"></td>
                          <td class="col-count"></td>
                          <td class="col-check"></td>
                          \`}
                        </tr>
                      \`;
                    }
                    return rowsHTML;
                  } else {
                    return lvl.books.map((b, idx) => \`
                      <tr>
                        <td class="col-title">\${escapeHTML(b.title)}</td>
                        <td class="col-count"><span class="count-pill">\${b.count}</span></td>
                        <td class="col-check"><span class="check-box"></span></td>
                      </tr>
                    \`).join('');
                  }
                })()}
              </tbody>
            </table>
          </div>`;

if (mainJS.includes(oldHTML)) {
    mainJS = mainJS.replace(oldHTML, newHTML);
    console.log("Replaced HTML successfully.");
} else {
    console.log("Could not find oldHTML.");
}

// 2. Update CSS borders
const oldCSS1 = `    .level-books-table th {
      color: #475569;
      font-weight: 700;
      padding: 3px 5px;
      border-bottom: 1.5px solid #cbd5e1;
      font-size: 10px;
    }
    .level-books-table td {
      padding: 3px 5px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }`;

const newCSS1 = `    .level-books-table th {
      color: #475569;
      font-weight: 700;
      padding: 3px 5px;
      border: 1px solid var(--border-color);
      border-bottom: 1.5px solid #cbd5e1;
      font-size: 10px;
    }
    .level-books-table td {
      padding: 3px 5px;
      border: 1px solid var(--border-color);
      vertical-align: middle;
    }`;

if (mainJS.includes(oldCSS1)) {
    mainJS = mainJS.replace(oldCSS1, newCSS1);
    console.log("Replaced CSS1 successfully.");
} else {
    console.log("Could not find CSS1.");
}

const oldCSS2 = `      .level-books-table th {
        padding: 2px 4px !important;
        font-size: 9.5px !important;
      }
      .level-books-table td {
        padding: 2.5px 4px !important;
      }`;

const newCSS2 = `      .level-books-table th {
        padding: 2px 4px !important;
        font-size: 9.5px !important;
        border: 1px solid #94a3b8 !important;
      }
      .level-books-table td {
        padding: 2.5px 4px !important;
        border: 1px solid #94a3b8 !important;
      }`;

if (mainJS.includes(oldCSS2)) {
    mainJS = mainJS.replace(oldCSS2, newCSS2);
    console.log("Replaced CSS2 successfully.");
} else {
    console.log("Could not find CSS2.");
}

fs.writeFileSync('main.js', mainJS);
console.log('Done');
