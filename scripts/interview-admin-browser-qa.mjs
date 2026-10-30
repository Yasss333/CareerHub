// Isolated Chrome; every API request and screen capture is a fixture. No production data/media.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer';
const out = '../outputs'; fs.mkdirSync(out, {recursive: true});
const browser = await puppeteer.launch({headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']});
const page = await browser.newPage(); await page.setViewport({width: 1440, height: 1000});
const errors = [], checks = [], events = [], speeches = [];
page.on('pageerror', e => errors.push(e.message));
let session, introductionSaves = 0, answerSaves = 0;
const now = () => new Date().toISOString();
const makeSession = () => ({id: 'qa-session', type: 'technical', topics: ['Databases'], role: 'Backend engineer', difficulty: 'medium', plannedDuration: 10, status: 'in_progress', startedAt: now(), createdAt: now(), monitoringMode: 'proctored', cameraEnabled: true, microphoneEnabled: true, introductionRequired: true, introductionCompletedAt: null, questions: [{id: 'qa-question', questionIndex: 0, questionText: 'Explain the benefits and costs of a database index.', category: 'Technical', topic: 'Databases', answerText: null}], emotionResults: [], proctoringEvents: []});
session = makeSession();
await page.exposeFunction('recordSpeech', text => speeches.push(text));
await page.evaluateOnNewDocument(() => {
  localStorage.setItem('token', 'isolated-fixture'); localStorage.setItem('user', JSON.stringify({id: 'qa-user', role: location.pathname.startsWith('/admin') && !location.search.includes('deny') ? 'ADMIN' : 'USER', name: 'QA candidate'}));
  window.__streams = []; window.__deviceRequests = 0; window.__surface = 'browser'; window.__denyCamera = false;
  const getMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {value: async opts => {
    window.__deviceRequests++;
    if (opts.video && window.__denyCamera) throw new DOMException('Fixture denial', 'NotAllowedError');
    const stream = await getMedia(opts); window.__streams.push(stream); return stream;
  }});
  Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {value: async () => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 360;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#102442'; ctx.fillRect(0, 0, 640, 360);
    const stream = canvas.captureStream(5); const track = stream.getVideoTracks()[0];
    Object.defineProperty(track, 'getSettings', {value: () => ({displaySurface: window.__surface})});
    window.__screen = stream; window.__streams.push(stream); return stream;
  }});
  Object.defineProperty(window, 'SpeechRecognition', {value: undefined}); Object.defineProperty(window, 'webkitSpeechRecognition', {value: undefined});
  Object.defineProperty(window, 'speechSynthesis', {value: {getVoices: () => [], cancel: () => {}, speaking: false, speak: utterance => {window.recordSpeech(utterance.text); utterance.onstart?.(); setTimeout(() => utterance.onend?.(), 100)}, pause: () => {}, resume: () => {}}});
});
await page.setRequestInterception(true);
page.on('request', async req => {
  const url = new URL(req.url());
  if (!url.pathname.startsWith('/api/')) return ['127.0.0.1', 'localhost'].includes(url.hostname) ? req.continue() : req.abort();
  let data = {}, status = 200; const body = () => JSON.parse(req.postData() || '{}');
  if (url.pathname === '/api/interview/capabilities') data = {available: false, face: false, voice: false, text: false, transcription: false, proctoring: false};
  else if (url.pathname === '/api/interview/sessions' && req.method() === 'POST') {session = {...makeSession(), ...body(), cameraEnabled: body().consent.camera, microphoneEnabled: body().consent.microphone}; data = {session}; status = 201;}
  else if (url.pathname.endsWith('/proctor-events')) {events.push(body().eventType); data = {event: body()}; status = 201;}
  else if (url.pathname.endsWith('/introduction')) {introductionSaves++; session.candidateIntroduction = body().text; session.introductionCompletedAt = now(); data = {session};}
  else if (url.pathname.endsWith('/answer')) {answerSaves++; session.questions[0].answerText = body().answerText; data = {question: session.questions[0]};}
  else if (url.pathname.endsWith('/evaluate')) {session.status = 'completed'; session.durationSeconds = 120; session.feedback = {overallScore: 0, overallFeedback: 'Be more specific.', strengths: [], areasToImprove: ['Explain write overhead.']}; session.questions[0].questionFeedback = {score: 0}; session.emotionResults = [{id: 'signal', modality: 'fusion', result: {source: 'ml', success: true, emotions: {neutral: .7, happiness: .3}}, createdAt: now()}]; data = {session};}
  else if (url.pathname.startsWith('/api/interview/sessions/')) data = {session};
  else if (url.pathname === '/api/dashboard/pri/live') data = {score: 0, interviewScore: 0, algoRankScore: 0, resumeScore: 0, interviewCount: 0, hasRealInterview: false};
  else if (url.pathname.startsWith('/api/admin/overview')) data = {users: 100, mentors: 8, pendingMentors: 2, interviews: 70, completedInterviews: 45, roadmaps: 32, openFeedback: 3, bookings: 5};
  else if (url.pathname.startsWith('/api/admin/progress')) data = {items: [{id: 'roadmap', title: 'Backend engineering', status: 'in_progress', user: {email: 'qa@example.com', name: 'QA candidate'}, completionPercent: 50, completedMilestones: 1, milestones: [{id: 'm1', title: 'SQL foundations', isCompleted: true}, {id: 'm2', title: 'Distributed systems', isCompleted: false}]}], hasMore: false};
  else if (url.pathname.startsWith('/api/admin/mentors')) data = req.method() === 'DELETE' ? {cancelledBookings: 1} : {items: [{id: 'qa-mentor', email: 'mentor@example.com', name: 'QA mentor', role: 'MENTOR'}], hasMore: false};
  else if (url.pathname.startsWith('/api/admin/')) data = {items: [], hasMore: false};
  else if (url.pathname.includes('/connect/') || url.pathname.startsWith('/api/resume') || url.pathname.startsWith('/api/roadmaps')) data = [];
  await req.respond({status, contentType: 'application/json', body: JSON.stringify(data)});
});
const click = async text => {const button = await page.waitForFunction(text => [...document.querySelectorAll('button')].find(b => b.textContent.trim().includes(text)), {}, text); await button.asElement().click();};
const waitText = text => page.waitForFunction(text => document.body.textContent.includes(text), {}, text);
const fill = async text => {const input = await page.waitForSelector('textarea[placeholder]'); await input.click({clickCount: 3}); await input.type(text);};
async function check(name, fn) {await fn(); checks.push({name, status: 'PASS'}); console.log('PASS:', name);}
try {
  await page.goto('http://127.0.0.1:5173/interview/setup', {waitUntil: 'networkidle0'});
  await check('Preflight blocks joining without device tests', async () => {await click('Start interview'); await waitText('Enable camera consent and test your camera');});
  await page.click('input[type=checkbox]');
  await page.evaluate(() => {window.__denyCamera = true});
  await check('Denied camera has an actionable retry', async () => {await click('Test camera'); await waitText('NotAllowedError'); await page.evaluate(() => {window.__denyCamera = false}); await click('Test camera'); await waitText('Retest camera');});
  const boxes = await page.$$('input[type=checkbox]'); await boxes[1].click();
  await click('Test microphone'); await waitText('Microphone connected');
  await check('A tab is rejected; an entire monitor is accepted', async () => {await click('Share entire screen'); await waitText('Choose “Entire screen”'); assert.equal(await page.evaluate(() => window.__screen.getTracks()[0].readyState), 'ended'); await page.evaluate(() => {window.__surface = 'monitor'}); await click('Share entire screen'); await waitText('Entire screen ready');});
  await page.screenshot({path: out + '/interview-preflight.png', fullPage: true});
  const deviceRequestsAtJoin = await page.evaluate(() => window.__deviceRequests);
  await click('Start interview'); await waitText('Begin Questions');
  await check('Screen capture survives setup→session; Maya starts with a brief introduction', async () => {await page.waitForFunction(() => document.querySelector('[aria-label="Screen monitoring"]')?.textContent.includes('Monitoring connected')); await page.waitForFunction(() => document.querySelector('textarea')); await waitText('Hi, I’m Maya'); assert.ok(events.includes('screen_started')); assert.ok(speeches.some(s => s.includes('I’m Maya'))); assert.equal(await page.evaluate(() => window.__deviceRequests), deviceRequestsAtJoin, 'Preflight device streams should hand off without reopening hardware');});
  await fill('I am a QA engineer interested in dependable backend systems.');
  await click('Begin Questions'); await waitText('Explain the benefits');
  await check('Introduction saves separately and transitions to technical questions', async () => {assert.equal(introductionSaves, 1); assert.equal(answerSaves, 0); assert.ok(session.candidateIntroduction.includes('QA engineer'));});
  await fill('Indexes speed up reads but add storage and write overhead.');
  await page.evaluate(() => {window.__screen.getTracks()[0].stop(); window.__screen.getTracks()[0].dispatchEvent(new Event('ended'))});
  await waitText('Interview paused');
  await check('Stopping screen sharing blocks continuation and retains the draft', async () => {assert.equal(await page.$eval('textarea', el => el.value), 'Indexes speed up reads but add storage and write overhead.'); assert.ok(await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Finish Interview')).disabled)); assert.ok(events.includes('screen_stopped'));});
  await click('Share entire screen'); await waitText('Monitoring connected'); await click('Replay & resume');
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.includes('Finish Interview') && !b.disabled));
  await click('Finish Interview'); await waitText('Your performance at a glance');
  await check('Visual report retains a real zero and cleans up all device tracks', async () => {assert.ok(await page.$('[aria-label="Answer score 0 out of 100"]')); await page.waitForFunction(() => window.__streams.every(s => s.getTracks().every(t => t.readyState === 'ended')));});
  await page.screenshot({path: out + '/interview-analytics.png', fullPage: true});
  for (const width of [320, 390, 768]) {await page.setViewport({width, height: 900}); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Report overflow at ' + width);}
  await check('Report fits 320, 390 and 768 pixel screens', async () => {});
  await page.evaluate(() => localStorage.setItem('user', JSON.stringify({id: 'qa-admin', role: 'ADMIN', name: 'QA admin'})));
  await page.setViewport({width: 1440, height: 1000}); await page.goto('http://127.0.0.1:5173/admin', {waitUntil: 'networkidle0'}); await waitText('Admin overview');
  await page.screenshot({path: out + '/admin-overview.png', fullPage: true});
  await page.goto('http://127.0.0.1:5173/admin/progress', {waitUntil: 'networkidle0'}); await waitText('50%'); await page.click('summary'); await waitText('SQL foundations');
  await check('Separate admin workspace displays actual milestone completion', async () => {assert.ok(await page.$('a[href="/admin/audit"]')); assert.ok(await page.$('[aria-valuenow="50"]'));});
  await page.goto('http://127.0.0.1:5173/admin/mentors', {waitUntil: 'networkidle0'}); await click('Remove mentor'); await waitText('Confirm removal');
  await check('Mentor removal needs a reason and explicit confirmation', async () => {assert.ok(await page.$('[role="dialog"]')); await page.type('[role="dialog"] textarea', 'Synthetic mentor removal test'); await click('Confirm removal'); await waitText('Mentor removed. 1 upcoming');});
  await page.evaluate(() => localStorage.setItem('user', JSON.stringify({id: 'qa-user', role: 'USER'}))); await page.goto('http://127.0.0.1:5173/admin?deny=true', {waitUntil: 'networkidle0'}); assert.notEqual(new URL(page.url()).pathname, '/admin');
  checks.push({name: 'Ordinary users are routed out of the admin panel', status: 'PASS'});
  assert.deepEqual(errors, []); fs.writeFileSync(out + '/interview-admin-browser-qa.json', JSON.stringify({checks, browserErrors: errors, boundary: 'Fixture API and synthetic devices; real chooser/hardware quality not established.'}, null, 2));
} catch (error) {console.error(error); console.error({errors, speeches, events}); await page.screenshot({path: '../work/interview-admin-failure.png', fullPage: true}); console.error((await page.$eval('body', el => el.textContent)).slice(-2500)); process.exitCode = 1;}
finally {await browser.close();}
