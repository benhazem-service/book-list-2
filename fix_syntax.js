const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// The code block from // ========================================== to the end needs fixing
const marker = '// REQUESTED BOOKS FEATURE (Re-implemented)';
const idx = code.indexOf(marker);
if (idx !== -1) {
    // let's just replace the whole block properly
    let newBlock = 
let requestedBooks = [];

window.showRequestedBooksModal = function() {
    const modal = document.getElementById('requestedBooksModal');
    if (modal) {
        modal.style.display = 'flex';
        const levelSelect = document.getElementById('requestLevel');
        if (levelSelect) {
            levelSelect.innerHTML = '<option value="">-- اختر المستوى --</option>';
            levels.forEach(level => {
                const opt = document.createElement('option');
                opt.value = level.name;
                opt.textContent = level.name;
                levelSelect.appendChild(opt);
            });
        }
        renderRequestedBooksList();
    }
};

window.closeRequestedBooksModal = function() {
    const modal = document.getElementById('requestedBooksModal');
    if (modal) modal.style.display = 'none';
};

window.populateRequestedBooks = function() {
    const levelSelect = document.getElementById('requestLevel');
    const bookSelect = document.getElementById('requestBook');
    if (!levelSelect || !bookSelect) return;
    
    bookSelect.innerHTML = '<option value="">-- اختر الكتاب --</option>';
    const levelName = levelSelect.value;
    if (!levelName) return;
    
    const levelObj = levels.find(l => l.name === levelName);
    if (!levelObj) return;
    
    const allBooks = [];
    if (levelObj.subjects) {
        levelObj.subjects.forEach(subj => {
            if (subj.books) allBooks.push(...subj.books);
        });
    }
    
    // Fallback if books are stored differently
    if (allBooks.length === 0 && levelObj.books) {
        allBooks.push(...levelObj.books);
    }
    
    allBooks.sort((a, b) => a.localeCompare(b, 'ar')).forEach(book => {
        const opt = document.createElement('option');
        opt.value = book;
        opt.textContent = book;
        bookSelect.appendChild(opt);
    });
};

window.addRequestedBook = async function(event) {
    event.preventDefault();
    const nameEl = document.getElementById('requestName');
    const levelEl = document.getElementById('requestLevel');
    const bookEl = document.getElementById('requestBook');
    
    if (!nameEl.value || !levelEl.value || !bookEl.value) {
        showTemporaryAlert('المرجوا ملء جميع الخانات', 'warning');
        return;
    }
    
    const newRequest = {
        id: 'req_' + Date.now(),
        name: nameEl.value.trim(),
        level: levelEl.value,
        book: bookEl.value,
        date: new Date().toLocaleDateString('ar-MA')
    };
    
    requestedBooks.push(newRequest);
    
    // Save to Firestore
    try {
        await appDataDocRef.set({ requestedBooks }, { merge: true });
        showTemporaryAlert('تمت إضافة الطلب بنجاح', 'success');
        
        nameEl.value = '';
        levelEl.value = '';
        bookEl.innerHTML = '<option value="">-- اختر الكتاب --</option>';
        
        renderRequestedBooksList();
        updateRequestedBooksBadge();
    } catch (error) {
        console.error("Error adding requested book: ", error);
        showTemporaryAlert('حدث خطأ أثناء حفظ الطلب', 'error');
    }
};

window.deleteRequestedBook = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    
    requestedBooks = requestedBooks.filter(r => r.id !== id);
    
    try {
        await appDataDocRef.set({ requestedBooks }, { merge: true });
        renderRequestedBooksList();
        updateRequestedBooksBadge();
        showTemporaryAlert('تم الحذف بنجاح', 'success');
    } catch (error) {
        console.error("Error deleting requested book: ", error);
        showTemporaryAlert('حدث خطأ أثناء الحذف', 'error');
    }
};

window.renderRequestedBooksList = function(filterText = '') {
    const tbody = document.getElementById('requestedBooksTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const lowerFilter = filterText.toLowerCase();
    const filtered = requestedBooks.filter(r => 
        r.name.toLowerCase().includes(lowerFilter) || 
        r.book.toLowerCase().includes(lowerFilter) ||
        r.level.toLowerCase().includes(lowerFilter)
    );
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:15px; color:#a0aec0;">لا توجد طلبات حالياً</td></tr>';
        return;
    }
    
    // Reverse array to show newest first
    filtered.slice().reverse().forEach(req => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e2e8f0';
        tr.innerHTML = \
          <td style="padding: 10px; text-align: right;">\</td>
          <td style="padding: 10px; text-align: right;">\</td>
          <td style="padding: 10px; text-align: right; font-weight:bold; color:#2b6cb0;">\</td>
          <td style="padding: 10px; text-align: center; color:#718096; font-size:0.9em;">\</td>
          <td style="padding: 10px; text-align: center;">
             <button onclick="deleteRequestedBook('\')" style="background:#fc8181; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">حذف</button>
          </td>
        \;
        tbody.appendChild(tr);
    });
};

window.filterRequestedBooks = function() {
    const input = document.getElementById('searchRequestedBooksInput');
    if (input) {
        renderRequestedBooksList(input.value);
    }
};

window.updateRequestedBooksBadge = function() {
    const badge = document.getElementById('requestedBooksBadge');
    if (badge) {
        const count = requestedBooks.length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
};

window.printRequestedBooks = function() {
    if (requestedBooks.length === 0) {
        showTemporaryAlert('لا توجد طلبات لطباعتها', 'warning');
        return;
    }
    
    let printHtml = \
      <html dir="rtl" lang="ar">
      <head>
        <title>لائحة الكتب المطلوبة</title>
        <style>
          body { font-family: 'Cairo', sans-serif; padding: 20px; }
          h2 { text-align: center; color: #2d3748; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e0; padding: 10px; text-align: right; }
          th { background-color: #edf2f7; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>لائحة الكتب المطلوبة من الزبناء</h2>
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>المستوى</th>
              <th>الكتاب</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
    \;
    
    requestedBooks.forEach(req => {
        printHtml += \
            <tr>
              <td>\</td>
              <td>\</td>
              <td>\</td>
              <td>\</td>
            </tr>
        \;
    });
    
    printHtml += \
          </tbody>
        </table>
        <div style="margin-top:30px; text-align:center; font-size:0.9em; color:#718096;">
           تم استخراج هذه اللائحة بتاريخ: \
        </div>
      </body>
      </html>
    \;
    
    const win = window.open('', '_blank');
    win.document.write(printHtml);
    win.document.close();
    win.onload = function() {
        win.print();
    };
};

window.exportPDF = exportPDF;
window.exportPDFAlphabetical = exportPDFAlphabetical;
window.confirmPrintOptions = confirmPrintOptions;
;
    
    code = code.substring(0, idx - 80) + "\n// ==========================================\n// REQUESTED BOOKS FEATURE (Re-implemented)\n// ==========================================\n" + newBlock;
    fs.writeFileSync('main.js', code);
}