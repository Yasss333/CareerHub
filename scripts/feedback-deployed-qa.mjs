// Live deployment, one QA-owned account/report only. Never queries other users' reports.
// The admin inbox GET is explicitly restricted to scope=mine before it leaves Chrome.
import '../apps/api/src/load-env.js';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {PrismaClient} from '@prisma/client';
const origin = 'https://careerhub-navy.vercel.app', db = new PrismaClient(), checks = [];
const prefix = 'feedback-deployed-qa-' + Date.now(), email = prefix + '@example.com', password = crypto.randomBytes(24).toString('base64url');
let account, browser, page, reportId; const errors = [];
async function api(route, body, method = body ? 'POST' : 'GET') {
  const response = await fetch(origin + '/api' + route, {method, headers: {'Content-Type': 'application/json', ...(account ? {Authorization: 'Bearer ' + account.token} : {})}, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(90000)});
  const data = await response.json(); assert.ok(response.ok, `${response.status}: ${data.error || 'request failed'}`); return data;
}
const check = name => {checks.push({name, status: 'PASS'}); console.log('PASS:', name)};
const waitText = text => page.waitForFunction(text => document.body.textContent.includes(text), {timeout: 90000}, text);
const click = async text => {const button = await page.waitForFunction(text => [...document.querySelectorAll('button')].find(b => b.textContent.trim().includes(text)), {}, text); await button.asElement().click()};
async function login(role) {
  await page.goto(origin + '/login', {waitUntil: 'networkidle0'});
  await page.click(`label:has(input[value="${role}"])`); await page.type('input[type="email"]', email); await page.type('input[type="password"]', password); await page.click('button[type="submit"]');
  await page.waitForFunction(() => location.pathname !== '/login', {timeout: 90000});
}
try {
  const registered = await api('/auth/register', {email, password, name: 'Deployed feedback QA', role: 'USER', specialization: 'CS_SOFTWARE'});
  account = {...registered.user, token: registered.token};
  browser = await puppeteer.launch({headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'}); page = await browser.newPage(); await page.setViewport({width: 1440, height: 1000});
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin === origin && url.pathname === '/api/feedback' && request.method() === 'GET' && url.searchParams.get('scope') === 'all') {url.searchParams.set('scope', 'mine'); return request.continue({url: url.href});}
    return request.continue();
  });
  await login('USER'); await page.goto(origin + '/interview?private=qa-do-not-save#draft', {waitUntil: 'networkidle0'});
  await page.click('button[aria-label="Report a bug"]'); await page.waitForSelector('[role="dialog"]');
  const title = prefix + ' camera feedback';
  await page.type('[role="dialog"] input', title); await page.type('[role="dialog"] textarea', 'Synthetic functional test: confirm reporting, admin updates and JSON export on the deployed site.');
  await click('Send feedback'); await waitText('Your feedback was saved.');
  const own = (await api('/feedback?scope=mine')).reports; assert.equal(own.length, 1); reportId = own[0].id;
  assert.equal(own[0].payload.title, title); assert.equal(own[0].payload.context.path, '/interview'); check('Deployed dialog submits a durable report and strips URL query/hash');
  await page.goto(origin + '/feedback', {waitUntil: 'networkidle0'}); await waitText(title);
  await page.reload({waitUntil: 'networkidle0'}); await waitText(title); check('Reporter history persists across reload');
  // Only this newly registered fixture is promoted; no existing account is modified.
  assert.ok(await db.user.findFirst({where: {id: account.id, email}})); await db.user.update({where: {id: account.id, email}, data: {role: 'ADMIN'}});
  await login('ADMIN'); await page.goto(origin + '/admin/feedback', {waitUntil: 'networkidle0'}); await waitText(title);
  assert.equal(await page.$$eval('article', rows => rows.length), 1);
  await page.select('article select', 'IN_PROGRESS'); await page.type('article textarea', 'QA: reproduced and reviewed. Synthetic report only.'); await page.click('article button'); await waitText('Update saved');
  assert.equal((await api('/feedback?scope=mine')).reports[0].status, 'IN_PROGRESS'); check('Deployed admin inbox renders QA-owned report and persists a status/update');
  const downloadPath = path.resolve('../work/feedback-deployed-download'); fs.mkdirSync(downloadPath, {recursive: true});
  const cdp = await page.createCDPSession(); await cdp.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath});
  await click('Download loaded JSON'); const file = path.join(downloadPath, `careerhub-feedback-${new Date().toISOString().slice(0, 10)}.json`);
  const deadline = Date.now() + 15000; while (!fs.existsSync(file) && Date.now() < deadline) await new Promise(r => setTimeout(r, 100));
  const exported = JSON.parse(fs.readFileSync(file, 'utf8')); assert.equal(exported.schemaVersion, 1); assert.equal(exported.reports.length, 1); assert.equal(exported.reports[0].id, reportId); assert.equal(exported.reports[0].status, 'IN_PROGRESS');
  // Deliver only synthetic report JSON; tokens/passwords are never included.
  fs.mkdirSync('../outputs', {recursive: true}); fs.writeFileSync('../outputs/feedback-deployed-export.json', JSON.stringify(exported, null, 2));
  await page.screenshot({path: '../outputs/feedback-deployed-admin.png', fullPage: true}); check('Deployed JSON download parses and contains only the QA report with the saved update');
  await db.user.update({where: {id: account.id, email}, data: {role: 'USER'}}); await login('USER'); await page.goto(origin + '/feedback', {waitUntil: 'networkidle0'}); await waitText('QA: reproduced and reviewed.');
  await page.select('main select', 'IN_PROGRESS'); await waitText(title); await page.select('main select', 'RESOLVED'); await waitText('No reports with this status'); check('Reporter receives admin update; deployed status filters work');
  assert.deepEqual(errors, []); check('No browser runtime exceptions in the deployed feedback journey');
} catch (error) {checks.push({name: 'Deployed feedback journey', status: 'FAIL', error: error.message}); console.error(error.message); process.exitCode = 1;}
finally {
  if (browser) await browser.close();
  if (account) {
    const fixture = await db.user.findFirst({where: {id: account.id, email}}); assert.ok(fixture);
    await db.user.delete({where: {id: account.id, email}}); assert.equal(await db.feedbackReport.count({where: {userId: account.id}}), 0); check('QA account/report removed; unrelated reports were never queried or exported');
  }
  fs.mkdirSync('../outputs', {recursive: true}); fs.writeFileSync('../outputs/feedback-deployed-qa.json', JSON.stringify({origin, checks, scope: 'Admin inbox intentionally restricted to this QA account using scope=mine; cross-user listing was not accessed.', errors}, null, 2));
  await db.$disconnect();
}
