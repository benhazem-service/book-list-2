const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', request =>
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText)
  );
  
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle0' });
  
  // click print button
  await page.evaluate(() => {
    if (typeof exportPDF === 'function') {
      console.log('exportPDF exists');
    } else {
      console.log('exportPDF DOES NOT EXIST');
    }
    
    if (typeof showRequestedBooksModal === 'function') {
      console.log('showRequestedBooksModal exists');
    } else {
      console.log('showRequestedBooksModal DOES NOT EXIST');
    }
  });

  await browser.close();
})();