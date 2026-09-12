const fs = require('fs');

const oldCSS = `    .badge {
      font-size: 10px;
      font-weight: 700;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }`;

const newCSS = `    .badge {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 12px;
      display: inline-block;
    }
    .badge-titles {
      background: rgba(255, 255, 255, 0.18);
      color: #f8fafc;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }
    .badge-copies {
      background: #0284c7;
      color: #ffffff;
    }

    /* جدول الكتب */
    .level-table-container {
      flex: 1;
      background: #ffffff;
    }
    .level-books-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .level-books-table thead tr {
      background: #f1f5f9;
    }
    .level-books-table th {
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
    }
    .level-books-table tbody tr:nth-child(even) td {
      background-color: var(--row-alt);
    }
    .level-books-table tbody tr:last-child td {
      border-bottom: none;
    }

    .col-title {
      color: #1e293b;
      font-weight: 600;
      word-break: break-word;
    }
    .col-count {
      text-align: center;
    }
    .count-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #eef2ff;
      color: #4338ca;
      font-weight: 800;
      font-size: 11px;
      min-width: 22px;
      height: 18px;
      padding: 0 4px;
      border-radius: 4px;
      border: 1px solid #c7d2fe;
    }
    .col-check {
      text-align: center;
    }
    .check-box {
      display: inline-block;
      width: 13px;
      height: 13px;
      border: 1.5px solid #64748b;
      border-radius: 3px;
      background: #ffffff;
      vertical-align: middle;
    }

    /* تذييل التقرير */
    .doc-footer {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      page-break-inside: avoid;
      break-inside: avoid;
      margin-top: 4px;
    }
    .footer-summary {
      font-weight: 700;
      color: #334155;
      font-size: 11.5px;
      display: flex;
      gap: 16px;
    }
    .footer-summary span {
      color: var(--primary-dark);
      font-weight: 800;
    }
    .footer-watermark {
      font-size: 10px;
      color: #94a3b8;
    }

    /* تنسيقات الطباعة A4 الموفرة للورق والمضغوطة */
    @media print {
      @page {
        size: A4 portrait;
        margin: 5mm 5mm 6mm 5mm;
      }
      body {
        background: #ffffff !important;
        padding: 0 !important;
        font-size: 10.5px !important;
      }
      .preview-toolbar {
        display: none !important;
      }
      .document-wrapper {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      .levels-grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 6px !important;
        margin-bottom: 6px !important;
      }
      .level-card {
        border: 1px solid #94a3b8 !important;
        box-shadow: none !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .level-books-table th {
        padding: 2px 4px !important;
        font-size: 9.5px !important;
        border: 1px solid #94a3b8 !important;
      }
      .level-books-table td {
        padding: 2.5px 4px !important;
        border: 1px solid #94a3b8 !important;
      }`;

let content = fs.readFileSync('main.js', 'utf8');

if (content.includes(oldCSS)) {
    content = content.replace(oldCSS, newCSS);
    fs.writeFileSync('main.js', content);
    console.log("Replaced CSS successfully.");
} else {
    // try with \r\n
    const oldCSSCRLF = oldCSS.replace(/\n/g, '\r\n');
    if (content.includes(oldCSSCRLF)) {
        content = content.replace(oldCSSCRLF, newCSS.replace(/\n/g, '\r\n'));
        fs.writeFileSync('main.js', content);
        console.log("Replaced CSS successfully with CRLF.");
    } else {
        console.log("Could not find corrupted block.");
    }
}
