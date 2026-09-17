const fs = require('fs');

// 1. Update main.js
let mainJs = fs.readFileSync('main.js', 'utf8');

// Replace openSubjectBooks innerHTML
const targetUI = `            \${hasEditPermission ? \`
              <button class="add-book-btn" onclick="addBookToSubject(currentLevelIndex, currentSubjectIndex)" style="margin: 0; padding: 6px 12px; font-size: 14px;">
                ➕ إضافة كتاب
              </button>
            \` : ''}`;

const newUI = `            \${hasEditPermission ? \`
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

mainJs = mainJs.replace(targetUI, newUI);

// Inject editSubject
const targetDelete = `      window.deleteSubject = async function(levelIndex, subjectIndex) {`;
const newEdit = `      window.editSubject = async function(levelIndex, subjectIndex) {
        const hasEditPermission = isAdmin || (currentUser && currentUser.canEditContent);
        if (!hasEditPermission) return;
        
        const currentName = levels[levelIndex].subjects[subjectIndex].name;
        
        if (deletePassword) {
          const entered = prompt("الرجاء إدخال الرقم السري لتعديل المادة:");
          if (entered !== deletePassword) {
            showTemporaryAlert('الرقم السري غير صحيح', 'error');
            return;
          }
        }
        
        const newName = prompt("أدخل الاسم الجديد للمادة:", currentName);
        if (newName && newName.trim() !== "" && newName.trim() !== currentName) {
            levels[levelIndex].subjects[subjectIndex].name = newName.trim();
            try {
                await appDataDocRef.set({ levels }, { merge: true });
                showTemporaryAlert("تم تعديل اسم المادة بنجاح", "success");
                renderLevelModal(levelIndex);
                openSubjectBooks(subjectIndex);
            } catch (error) {
                console.error("Error updating subject name:", error);
                showTemporaryAlert("حدث خطأ أثناء الحفظ", "error");
            }
        }
      };

      window.deleteSubject = async function(levelIndex, subjectIndex) {`;

mainJs = mainJs.replace(targetDelete, newEdit);

// Update index.html setting label
let indexHtml = fs.readFileSync('index.html', 'utf8');
const targetLabel = `<label for="deletePasswordSetting" style="display: block; margin-bottom: 10px; font-weight: bold; color: #4a5568;">الرقم السري لحذف الكتب والمواد:</label>`;
const newLabel = `<label for="deletePasswordSetting" style="display: block; margin-bottom: 10px; font-weight: bold; color: #4a5568;">الرقم السري لحذف وتعديل الكتب والمواد:</label>`;
indexHtml = indexHtml.replace(targetLabel, newLabel);

fs.writeFileSync('main.js', mainJs, 'utf8');
fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log('Update completed!');
