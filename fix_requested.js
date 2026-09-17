const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

if (!code.includes('requestedBooks = data.requestedBooks || []')) {
    code = code.replace(
        /let data = doc\.data\(\);/,
        "let data = doc.data();\n          if (data.requestedBooks) { requestedBooks = data.requestedBooks; updateRequestedBooksBadge(); }"
    );
    
    // Also remove the bad badge update from renderChosenBooksTables
    code = code.replace(
        /\/\/ Update requested books badge count[\s\S]*?totalBooksCount > 0 \? 'flex' : 'none';\s*\}/,
        "// (Badge update removed from here, now tracks actual requestedBooks array)"
    );
    
    fs.writeFileSync('main.js', code);
}