import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer';
const email = process.env.CAREERHUB_ADMIN_EMAIL, password = process.env.CAREERHUB_ADMIN_PASSWORD;
if (!email || !password) throw new Error('Provide the admin credentials through the environment.');
const browser = await puppeteer.launch({headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
try {
  const page = await browser.newPage(); await page.setViewport({width: 1440, height: 1000}); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/login', {waitUntil: 'networkidle0'});
  // Keep the default normal sign-in option; routing follows the returned database role.
  await page.type('input[type="email"]', email); await page.type('input[type="password"]', password); await page.click('button[type="submit"]');
  await page.waitForFunction(() => location.pathname === '/admin', {timeout: 60000});
  await page.waitForFunction(() => document.querySelector('main')?.textContent.includes('Active mentors') && !document.querySelector('main [role="status"]'), {timeout: 60000});
  assert.equal(await page.$('main [role="alert"]'), null); assert.ok(await page.$('a[href="/admin/progress"]')); assert.deepEqual(errors, []);
  await page.screenshot({path: '../outputs/admin-live-overview.png', fullPage: true});
  // Inspect responsive layout using the aggregate overview only; never load user/report lists.
  for (const width of [320, 390, 768]) {await page.setViewport({width, height: 900}); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Admin layout overflow at ' + width);}
  fs.writeFileSync('../outputs/admin-login-smoke.json', JSON.stringify({normalLogin: 'PASS', redirect: '/admin', overviewApi: 'PASS', responsiveWidths: [320, 390, 768], browserErrors: errors}, null, 2));
  console.log('PASS: requested admin account signs in normally, loads the real admin overview, and fits mobile/tablet layouts.');
} finally {await browser.close();}
