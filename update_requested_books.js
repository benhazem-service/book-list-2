const fs = require('fs');

// 1. Update index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');

const targetHtml = `<label class="exchange-form-label" style="font-size: 0.85em;" for="requestBook">الكتاب</label>
              <select class="exchange-form-input" id="requestBook" style="padding: 6px; font-size: 0.85em;" required>
                <option value="">-- اختر الكتاب --</option>
              </select>`;

const newHtml = `<label class="exchange-form-label" style="font-size: 0.85em;">الكتب المطلوبة (تحديد متعدد)</label>
              <div class="exchange-form-input" id="requestBooksContainer" style="padding: 6px; font-size: 0.85em; height: 120px; overflow-y: auto; border: 1px solid #cbd5e0; border-radius: 5px; background: #fff; text-align: right;">
                <div style="color: #a0aec0; text-align: center; margin-top: 20px;">-- المرجو اختيار المستوى أولاً --</div>
              </div>`;

if (indexHtml.includes(targetHtml)) {
    indexHtml = indexHtml.replace(targetHtml, newHtml);
    // Remove the 'required' check from form if it relies on standard HTML5 validation since div is not an input
    // The required attribute is on the select. Since we removed the select, HTML5 validation won't block it.
    // We will validate in JS.
} else {
    console.log("Could not find HTML target");
}

fs.writeFileSync('index.html', indexHtml, 'utf8');


// 2. Update main.js
let mainJs = fs.readFileSync('main.js', 'utf8');

const targetPopulate = `    allBooks.sort((a, b) => a.localeCompare(b, 'ar')).forEach(book => {
        const opt = document.createElement('option');
        opt.value = book;
        opt.textContent = book;
        bookSelect.appendChild(opt);
    });`;

const newPopulate = `    allBooks.sort((a, b) => a.localeCompare(b, 'ar')).forEach(book => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.padding = '6px';
        label.style.borderBottom = '1px solid #f7fafc';
        label.style.cursor = 'pointer';
        label.style.color = '#2d3748';
        label.innerHTML = \`<input type="checkbox" name="requested_book_item" value="\${escapeHTML(book)}" style="margin-left: 8px;"> \${escapeHTML(book)}\`;
        bookSelect.appendChild(label);
    });`;

mainJs = mainJs.replace(`const bookSelect = document.getElementById('requestBook');`, `const bookSelect = document.getElementById('requestBooksContainer');`);
mainJs = mainJs.replace(`bookSelect.innerHTML = '<option value="">-- اختر الكتاب --</option>';`, `bookSelect.innerHTML = '';`);

if (mainJs.includes(targetPopulate)) {
    mainJs = mainJs.replace(targetPopulate, newPopulate);
} else {
    console.log("Could not find populate logic");
}


const targetAdd = `window.addRequestedBook = async function(event) {
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
    
    requestedBooks.push(newRequest);`;

const newAdd = `window.addRequestedBook = async function(event) {
    event.preventDefault();
    const nameEl = document.getElementById('requestName');
    const levelEl = document.getElementById('requestLevel');
    
    const checkedBoxes = document.querySelectorAll('input[name="requested_book_item"]:checked');
    
    if (!nameEl.value || !levelEl.value || checkedBoxes.length === 0) {
        showTemporaryAlert('المرجوا ملء الاسم والمستوى واختيار كتاب واحد على الأقل', 'warning');
        return;
    }
    
    const nowTimestamp = Date.now();
    let addedCount = 0;
    
    checkedBoxes.forEach((box, index) => {
        const newRequest = {
            id: 'req_' + nowTimestamp + '_' + index,
            name: nameEl.value.trim(),
            level: levelEl.value,
            book: box.value,
            date: new Date().toLocaleDateString('ar-MA')
        };
        requestedBooks.push(newRequest);
        addedCount++;
    });`;

if (mainJs.includes(targetAdd)) {
    mainJs = mainJs.replace(targetAdd, newAdd);
} else {
    console.log("Could not find add logic");
}

mainJs = mainJs.replace(`bookEl.innerHTML = '<option value="">-- اختر الكتاب --</option>';`, `const bookContainer = document.getElementById('requestBooksContainer');\n        if (bookContainer) bookContainer.innerHTML = '<div style="color: #a0aec0; text-align: center; margin-top: 20px;">-- المرجو اختيار المستوى أولاً --</div>';`);

fs.writeFileSync('main.js', mainJs, 'utf8');

// Update version string again
let indexHtml2 = fs.readFileSync('index.html', 'utf8');
indexHtml2 = indexHtml2.replace(/main\.js\?v=\d+/, `main.js?v=${Date.now()}`);
fs.writeFileSync('index.html', indexHtml2, 'utf8');

console.log("Update completed!");
