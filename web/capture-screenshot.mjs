import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4173/web/index.html';
const outputPath = process.argv[3] ?? 'artifacts/web-library.png';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outputPath, fullPage: true });
  console.log(`Screenshot saved: ${outputPath}`);
} finally {
  await browser.close();
}
