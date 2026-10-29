import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: 'apps/api/.env' });
const db = new PrismaClient();
const origin = 'http://127.0.0.1:5173', apiOrigin = 'http://127.0.0.1:5000';
const runId = `browser-qa-${Date.now()}`;
const password = crypto.randomBytes(20).toString('base64url');
const accounts = [], results = [], errors = [];
let browser, page, student, mentor, admin, roadmap;
const resultPath = path.resolve(process.env.QA_BROWSER_OUTPUT || '../work/browser-functional-results.json');
const futureDate = () => new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);

async function api(route, account, body, method = body === undefined ? 'GET' : 'POST') {
  if (/\/algorank\/(execute|run|submit)(\/|$)/.test(route)) throw new Error('Code execution excluded');
  const response = await fetch(apiOrigin + '/api' + route, { method, headers: { ...(account ? { Authorization: 'Bearer ' + account.token } : {}), 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(300000) });
  const data = await response.json();
  if (!response.ok) throw new Error(`API ${route}: ${response.status} ${data.error || data.message || ''}`);
  return data;
}
async function register(label, role = 'USER') {
  const data = await api('/auth/register', null, { email: `${runId}-${label}@example.com`, name: `Browser QA ${label}`, password, role, ...(role === 'USER' ? { specialization: 'CS_SOFTWARE' } : {}) });
  const account = { ...data.user, token: data.token }; accounts.push(account); return account;
}
async function check(module, name, fn) {
  if(process.env.QA_BROWSER_MODULE&&module!==process.env.QA_BROWSER_MODULE&&module!=='Cleanup')return;
  const start = Date.now(), errorCount = errors.length;
  try { await fn(); assert.deepEqual(errors.slice(errorCount), [], 'no browser runtime exceptions'); results.push({ module, name, status: 'PASSED', durationMs: Date.now() - start }); }
  catch (error) {
    results.push({ module, name, status: 'FAILED', message: error.message, durationMs: Date.now() - start });
    if (page && !page.isClosed()) await page.screenshot({ path: path.resolve(`../work/browser-failure-${results.length}.png`), fullPage: true }).catch(() => undefined);
  }
  const last = results.at(-1); console.log(`${last.status} | ${module} | ${name}${last.message ? ' | '+last.message : ''}`);
  fs.writeFileSync(resultPath, JSON.stringify({ runId, results }, null, 2));
}
async function clickText(text, selector = 'button') {
  for (const element of await page.$$(selector)) if ((await element.evaluate((node) => node.textContent)).trim().includes(text)) { await element.click(); return; }
  throw new Error(`Control not found: ${text}`);
}
async function replaceText(selector, value) { const element = await page.waitForSelector(selector); await element.click({ clickCount: 3 }); await element.press('Backspace'); await page.keyboard.sendCharacter(value); assert.equal(await element.evaluate(node=>node.value),value); }
async function login(account, role = 'USER', pass = password) {
  await page.goto(origin + '/login', { waitUntil: 'networkidle0' });
  await page.click(`label:has(input[value="${role}"])`);
  await page.type('input[type="email"]', account.email); await page.type('input[type="password"]', pass);
  await page.click('button[type="submit"]');
}
async function route(routePath, expected) {
  await page.goto(origin + routePath, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector('main', { timeout: 30000 });
  await page.waitForFunction((phrase) => document.querySelector('main')?.textContent.includes(phrase), { timeout: 30000 }, expected);
  assert.equal(new URL(page.url()).pathname, routePath);
}

async function run() {
  student = await register('student'); mentor = await register('mentor', 'MENTOR'); admin = await register('admin');
  const own = await db.user.findFirst({ where: { id: admin.id, email: admin.email }, select: { id: true } }); assert.ok(own);
  await db.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } });
  admin.token = (await api('/auth/login', null, { email: admin.email, password, accountType: 'ADMIN' })).token;
  await api('/connect/profile', mentor, { title: `${runId} Mentor`, company: 'QA Example', role: 'Test Mentor', domain: 'Software Engineering', bio: 'Temporary browser-test profile', expertise: ['Testing'], achievements: [], experience: 1, location: 'Remote' });
  await api(`/connect/admin/mentor-applications/${mentor.id}`, admin, { decision: 'approve' }, 'PATCH');
  mentor.token = (await api('/auth/login', null, { email: mentor.email, password, accountType: 'MENTOR' })).token;
  const template = (await api('/roadmaps/templates')).templates[0];
  roadmap = (await api('/roadmaps', student, { title: `${runId} Learning Plan`, roleType: template.key, topics: ['JavaScript'] })).roadmap;
  await api(`/roadmaps/${roadmap.id}/milestones`, student, { title: 'QA JavaScript fundamentals', order: 1, topics: ['JavaScript'] });
  await api(`/roadmaps/${roadmap.id}/milestones`, student, { title: 'QA Web APIs', order: 2, topics: ['HTTP'] });

  browser = await puppeteer.launch({ headless: true, executablePath: process.env.INTERVIEW_TEST_BROWSER || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  page = await browser.newPage(); page.setDefaultTimeout(30000); await page.setViewport({ width: 1440, height: 1000 });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', async (dialog) => dialog.accept());
  await page.evaluateOnNewDocument(() => { Object.defineProperty(window, 'speechSynthesis', { value: undefined }); window.__qaXss = false; });
  await page.setRequestInterception(true);
  page.on('request', (request) => /\/api\/algorank\/(execute|run|submit)(\/|$)/.test(new URL(request.url()).pathname) ? request.abort() : request.continue());

  await check('Browser auth', 'logged-out protected navigation returns to login', async () => { await page.goto(origin+'/resume', { waitUntil:'networkidle0' }); assert.equal(new URL(page.url()).pathname,'/login'); });
  await check('Browser auth', 'wrong password stays on login with visible feedback', async () => { await login(student,'USER','wrong-password'); await page.waitForFunction(()=>document.body.textContent.includes('Invalid credentials')); assert.equal(new URL(page.url()).pathname,'/login'); });
  await check('Browser auth', 'valid UI login opens the account dashboard', async () => { await login(student); await page.waitForFunction(()=>location.pathname==='/'&&document.body.textContent.includes('Browser QA student')); });

  const routes = [
    ['/', 'Dashboard'], ['/resume', 'My Resumes'], ['/connect', 'Senior Connect'], ['/connect/sessions', 'Sessions'],
    ['/roadmaps', 'Know what to learn next.'], ['/interview', 'AI Interview'], ['/interview/setup', 'Set up your interview'],
    ['/algorank', 'AlgoRank'], ['/algorank/playlists', 'Playlists'], ['/algorank/leaderboard', 'Leaderboard'], ['/algorank/submissions', 'Submissions'], ['/settings', 'Settings'],
  ];
  for (const [routePath, heading] of routes) await check('Browser navigation', `desktop ${routePath}`, () => route(routePath, heading));
  for (const [routePath, heading] of routes.filter(([url])=>['/resume','/connect','/roadmaps','/interview','/settings'].includes(url))) await check('Browser mobile', `390px ${routePath}`, async () => { await page.setViewport({width:390,height:844}); await route(routePath,heading); assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal document overflow'); });
  await page.setViewport({width:1440,height:1000});

  await check('Resume UI', 'create through the form, edit, save, and reload', async () => {
    await route('/resume','My Resumes'); await clickText('Create Resume','span');
    await page.waitForSelector('input[placeholder="e.g. Fullstack Developer Resume"]');
    await page.type('input[placeholder="e.g. Fullstack Developer Resume"]', runId+' UI Resume'); await page.click('form button[type="submit"]');
    await page.waitForSelector('input[placeholder="Enter your full name"]');
    await replaceText('input[placeholder="Enter your full name"]','QA <img src=x onerror="window.__qaXss=true">');
    await clickText('Save Changes'); await page.waitForFunction(()=>document.body.textContent.includes('Resume saved successfully!'));
    assert.equal(await page.evaluate(()=>window.__qaXss),false);
    await page.reload({waitUntil:'networkidle0'});
    assert.match(await page.$eval('input[placeholder="Enter your full name"]',element=>element.value), /<img/);
    assert.equal(await page.evaluate(()=>window.__qaXss),false);
    assert.equal((await api('/resume',student)).length,1);
  });
  await check('Resume UI', 'duplicate and delete use the actual owned API', async () => {
    await route('/resume','My Resumes'); await page.click('button[title="Duplicate resume"]');
    await page.waitForFunction(()=>document.querySelectorAll('button[title="Delete resume"]').length===2);
    for(let i=0;i<2;i++){await page.click('button[title="Delete resume"]'); await page.waitForFunction((count)=>document.querySelectorAll('button[title="Delete resume"]').length===count,{},1-i);}
    assert.equal((await api('/resume',student)).length,0);
  });
  await check('Roadmap UI', 'stage completion persists across refresh', async () => {
    await route(`/roadmaps/${roadmap.id}`,'QA JavaScript fundamentals');
    await page.click('button[aria-label="Mark QA JavaScript fundamentals complete"]');
    await page.waitForFunction(()=>document.querySelector('button[aria-label="Mark QA JavaScript fundamentals incomplete"]'));
    await page.reload({waitUntil:'networkidle0'}); await page.waitForSelector('button[aria-label="Mark QA JavaScript fundamentals incomplete"]');
    assert.equal((await api(`/roadmaps/${roadmap.id}`,student)).roadmap.progress,50);
  });
  await check('Interview UI', 'real setup, typed answer, completion and report', async () => {
    await route('/interview/setup','Set up your interview');
    await page.click('input[type="range"]'); // Keep the user-visible duration control exercised.
    await clickText('Start interview'); await page.waitForSelector('textarea[placeholder="Type or refine your response here..."]',{timeout:180000});
    await replaceText('textarea[placeholder="Type or refine your response here..."]','An index improves read queries but costs storage and write throughput. I compare query plans and workload selectivity before adding one.');
    await clickText('Next Question'); await page.waitForFunction(()=>document.body.textContent.includes('Question 2 of'),{timeout:300000});
    await clickText('Leave'); await clickText('End interview');
    await page.waitForFunction(()=>document.body.textContent.includes('Interview performance report'),{timeout:300000});
    const text=await page.$eval('main',element=>element.textContent); assert.ok(!text.includes('Not evaluated')); assert.ok(text.includes('An index improves'));
  });
  await check('Browser role guard', 'candidate cannot open administrator review', async () => { await page.goto(origin+'/admin/mentor-applications',{waitUntil:'networkidle0'}); assert.equal(new URL(page.url()).pathname,'/'); });
  await check('Browser logout', 'logout removes access to protected routes', async () => { await page.click('button[title="Logout"]'); await page.goto(origin+'/resume',{waitUntil:'networkidle0'}); assert.equal(new URL(page.url()).pathname,'/login'); });

  await check('Mentor UI', 'approved mentor logs in to the mentor workspace', async () => { await login(mentor,'MENTOR'); await page.waitForFunction(()=>location.pathname==='/mentor'); });
  await check('Mentor UI', 'bulk availability scheduling submits and persists', async () => {
    await route('/mentor/profile','Professional Details'); await clickText('Bulk Schedule');
    const date=await page.waitForSelector('form input[type="date"]');
    // The modal is the last form; its date/time inputs have no generated ids.
    const forms=await page.$$('form');const form=forms.at(-1);
    const setInput=async(element,value)=>element.evaluate((node,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(node,value);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));},value);
    const dates=await form.$$('input[type="date"]'); await setInput(dates[0],futureDate());
    const times=await form.$$('input[type="time"]'); await setInput(times[0],'10:00'); await setInput(times[1],'10:45');
    for(const button of await form.$$('button[type="submit"]')) await button.click();
    await page.waitForFunction(()=>document.body.textContent.includes('10:00')&&!document.body.textContent.includes('onAdd is not a function'),{timeout:15000});
    const slots=await api('/connect/availability',mentor); assert.ok(slots.some(slot=>slot.startTime==='10:00'&&slot.endTime==='10:45'));
  });
  await check('Mentor UI', 'mentor cannot open candidate resume workspace', async () => { await page.goto(origin+'/resume',{waitUntil:'networkidle0'}); assert.equal(new URL(page.url()).pathname,'/mentor'); });
  await check('Admin UI','administrator approves only the temporary application through the review screen',async()=>{
    const applicant=await register('ui-approval','MENTOR');
    await login(admin,'ADMIN');await page.waitForFunction(()=>location.pathname!=='/login');
    await route('/admin/mentor-applications','Mentor applications');
    await page.waitForFunction(email=>[...document.querySelectorAll('article')].some(n=>n.textContent.includes(email)),{},applicant.email);
    let ownCard;for(const card of await page.$$('article'))if((await card.evaluate(n=>n.textContent)).includes(applicant.email)){ownCard=card;break;}
    assert.ok(ownCard);for(const button of await ownCard.$$('button'))if((await button.evaluate(n=>n.textContent)).includes('Approve'))await button.click();
    await page.waitForFunction(()=>document.body.textContent.includes('Browser QA ui-approval was approved.'));
    assert.equal((await api('/auth/me',applicant)).mentorApprovalStatus,'APPROVED');
    await login(applicant,'MENTOR');await page.waitForFunction(()=>location.pathname==='/mentor');
  });
}

try{await run();}catch(error){results.push({module:'Runner',name:'browser setup',status:'FAILED',message:error.message});}
finally{
  if(browser)await browser.close();
  await check('Cleanup','remove temporary browser accounts and their data',async()=>{
    for(const account of accounts){const own=await db.user.findFirst({where:{id:account.id,email:account.email},select:{id:true}});if(own){await db.seniorProfile.deleteMany({where:{userId:own.id}});await db.user.delete({where:{id:own.id,email:account.email}});}}
    assert.equal(await db.user.count({where:{email:{in:accounts.map(account=>account.email)}}}),0);
  });
  fs.writeFileSync(resultPath,JSON.stringify({runId,results},null,2));await db.$disconnect();
  console.log(JSON.stringify({total:results.length,passed:results.filter(r=>r.status==='PASSED').length,failed:results.filter(r=>r.status==='FAILED').length}));
}
