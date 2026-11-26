// Renders docs/DSA-Daily-Plan.html to docs/DSA-Daily-Plan.pdf with headless Chromium (Playwright).
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const html = path.resolve(__dirname, '../docs/DSA-Daily-Plan.html');
  const out = path.resolve(__dirname, '../docs/DSA-Daily-Plan.pdf');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + html, { waitUntil: 'load' });
  await page.pdf({
    path: out,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size:8px;color:#888;width:100%;text-align:center;font-family:Arial">DSA Daily Plan · page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    margin: { top: '14mm', bottom: '16mm', left: '14mm', right: '14mm' },
  });
  await browser.close();
  console.log('wrote', out);
})();
