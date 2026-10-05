// Prints the built CV page (its @media print styles) to dist/elliot-fesquet-cv-<lang>.pdf.
// Runs after `astro build`; uses the installed Google Chrome (also present on GitHub runners).
import { preview } from 'astro';
import { chromium } from 'playwright-core';

const langs = ['en', 'fr'];
const port = 4329;

const server = await preview({ root: process.cwd(), server: { port }, logLevel: 'warn' });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce', colorScheme: 'light' });
  for (const lang of langs) {
    await page.goto(`http://localhost:${port}/cv/${lang}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const path = `dist/elliot-fesquet-cv-${lang}.pdf`;
    await page.pdf({ path, preferCSSPageSize: true, printBackground: true });
    console.log(`cv-pdf: wrote ${path}`);
  }
} finally {
  await browser.close();
  await server.stop();
}
