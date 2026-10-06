import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : chromium.executablePath()),
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const baseUrl = process.env.APP_URL || 'http://127.0.0.1:5173/';
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(baseUrl);
  assert.match(await page.title(), /Rapportmuster.*Endlosmuster/);
  assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute('href'),
    'https://musterersteller.de/',
  );
  assert.ok(await page.locator('.heroExample img').evaluate((image) => image.naturalWidth > 0));
  await page.getByRole('link', { name: 'Muster erstellen', exact: true }).last().click();
  await page.locator('.upper-canvas').waitFor();
  assert.equal(new URL(page.url()).pathname, new URL('muster/', baseUrl).pathname);

  await page.getByRole('link', { name: 'Verpackungen', exact: true }).click();
  await page.locator('.packCanvasHost').waitFor();
  assert.equal(new URL(page.url()).pathname, new URL('verpackung/', baseUrl).pathname);
  assert.match(await page.title(), /Verpackungen und Banderolen/);
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute('href'),
    'https://musterersteller.de/verpackung/',
  );
  await page.goBack();
  assert.equal(new URL(page.url()).pathname, new URL('muster/', baseUrl).pathname);
  await page.locator('.patternWorkspace').waitFor();

  const direct = await browser.newPage();
  await direct.goto(new URL('verpackung/', baseUrl).href);
  await direct.locator('.packCanvasHost').waitFor();
  assert.match(await direct.title(), /Verpackungen und Banderolen/);
  await direct.close();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('Landingpage und Routen: OK');
} finally {
  await browser.close();
}
