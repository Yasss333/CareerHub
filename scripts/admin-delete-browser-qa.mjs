// Isolated browser and synthetic API fixtures; never deletes a real account.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const origin = process.env.QA_ORIGIN || 'http://localhost:5173';
const browser = await puppeteer.launch({headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
const page = await browser.newPage();
const errors = [], deletes = [];
let deleted = false, fail = true;
page.on('pageerror', error => errors.push(error.message));
await page.evaluateOnNewDocument(() => {
  localStorage.setItem('token', 'isolated-fixture');
  localStorage.setItem('user', JSON.stringify({id: 'qa-admin', role: 'ADMIN', name: 'QA admin'}));
});
await page.setRequestInterception(true);
page.on('request', async request => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return request.continue();
  let data = {}, status = 200;
  if (url.pathname === '/api/admin/users') data = {items: [{id: 'qa-admin', email: 'admin@example.com', role: 'ADMIN'}, ...deleted ? [] : [{id: 'qa-student', email: 'student@example.com', name: 'QA student', role: 'USER'}]], hasMore: false};
  else if (request.method() === 'DELETE') {
    assert.equal(url.pathname, '/api/admin/users/qa-student');
    deletes.push(JSON.parse(request.postData()));
    if (fail) {status = 503; data = {error: 'Please retry deletion'};} else {deleted = true; data = {deleted: true};}
  }
  await request.respond({status, contentType: 'application/json', body: JSON.stringify(data)});
});
const click = async text => {
  const handle = await page.waitForFunction(text => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === text), {}, text);
  await handle.asElement().click();
};
try {
  await page.setViewport({width: 1440, height: 1000});
  await page.goto(origin + '/admin/users', {waitUntil: 'networkidle0'});
  assert.equal(await page.$$eval('button', buttons => buttons.filter(button => button.textContent === 'Delete user').length), 1);
  await click('Delete user');
  await page.waitForSelector('[role="dialog"]');
  assert.equal(await page.$eval('button.bg-destructive', button => button.disabled), true);
  await click('Cancel'); await page.waitForSelector('[role="dialog"]', {hidden: true}); assert.equal(deletes.length, 0);
  await click('Delete user');
  await page.waitForSelector('[role="dialog"] input', {visible: true});
  await page.type('[role="dialog"] input', 'student@example.com');
  await page.type('[role="dialog"] textarea', 'QA account deletion requested');
  await click('Permanently delete user');
  await page.waitForFunction(() => document.body.textContent.includes('Please retry deletion'));
  assert.ok(await page.$('[role="dialog"]'));
  fail = false;
  await click('Permanently delete user');
  await page.waitForFunction(() => document.body.textContent.includes('User permanently deleted.'));
  assert.deepEqual(deletes[1], {confirmation: 'qa-student', reason: 'QA account deletion requested'});
  await page.waitForFunction(() => !document.body.textContent.includes('QA student'));
  for (const width of [320, 768, 1440]) {
    await page.setViewport({width, height: 900});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: admin-only button, confirmation, cancel, failed deletion retry, successful refresh, responsive widths and no browser errors');
} finally {await browser.close();}
