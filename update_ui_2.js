const fs = require('fs');

let mainJs = fs.readFileSync('main.js', 'utf8');

const targetStr = `            \${hasEditPermission ? \`
              <button class="add-book-btn" onclick="addBookToSubject(currentLevelIndex, currentSubjectIndex)" style="margin: 0; padding: 6px 12px; font-size: 14px;">
                ➕ إضافة كتاب
              </button>
            \` : ''}`;

// We will use regex to find the button regardless of whitespace
const regex = /\$\{\s*hasEditPermission\s*\?\s*`\s*<button class="add-book-btn"[^>]*>\s*➕ إضافة كتاب\s*<\/button>\s*`\s*:\s*''\s*\}/;

const newStr = `\${hasEditPermission ? \`
              <div style="display: flex; gap: 5px;">
                  <button onclick="editSubject(currentLevelIndex, currentSubjectIndex)" style="margin: 0; padding: 6px 10px; font-size: 12px; background: #f6e05e; color: #744210; border: none; border-radius: 5px; cursor: pointer; font-family: 'Cairo', sans-serif;">
                    ✏️ تعديل المادة
                  </button>
                  <button onclick="deleteSubject(currentLevelIndex, currentSubjectIndex)" style="margin: 0; padding: 6px 10px; font-size: 12px; background: #fc8181; color: #742a2a; border: none; border-radius: 5px; cursor: pointer; font-family: 'Cairo', sans-serif;">
                    🗑️ حذف المادة
                  </button>
                  <button class="add-book-btn" onclick="addBookToSubject(currentLevelIndex, currentSubjectIndex)" style="margin: 0; padding: 6px 12px; font-size: 14px;">
                    ➕ إضافة كتاب
                  </button>
              </div>
            \` : ''}`;

if (regex.test(mainJs)) {
    mainJs = mainJs.replace(regex, newStr);
    fs.writeFileSync('main.js', mainJs, 'utf8');
    console.log("Success! Replaced correctly using regex.");
} else {
    console.log("Regex did not match. Trying fallback.");
    if (mainJs.includes(targetStr)) {
        mainJs = mainJs.replace(targetStr, newStr);
        fs.writeFileSync('main.js', mainJs, 'utf8');
        console.log("Success! Replaced exact string.");
    } else {
        console.log("Could not find the target string at all.");
    }
}
