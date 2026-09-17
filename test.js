const books = [
    { title: 'A', count: 1 },
    { title: 'B', count: 1 },
    { title: 'C', count: 1 },
    { title: 'D', count: 1 },
    { title: 'E', count: 1 }
];

let tbodyHTML = '';
const half = Math.ceil(books.length / 2);
for (let i = 0; i < half; i++) {
    const b1 = books[i];
    const b2 = books[i + half];
    
    tbodyHTML += `Row ${i + 1}: [${b1.title}] | [${b2 ? b2.title : ' '}]\n`;
}

console.log(tbodyHTML);
