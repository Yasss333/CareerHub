import test from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

// Every /api request is intercepted. These browser checks never reach the production database or ML service.
async function withInterviewBrowser(run, staleLoadDelay = 0, allowDevices = false) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.INTERVIEW_TEST_BROWSER || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluateOnNewDocument((allowDevices) => {
    localStorage.setItem('token', 'isolated-browser-fixture-token');
    localStorage.setItem('user', JSON.stringify({ id: 'fixture-candidate', name: 'Test Candidate', role: 'USER' }));
    window.__mediaRequests = 0;
    const capture=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    window.__deviceStreams=[];
    window.__captureErrors=[];
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async (...args) => {
      window.__mediaRequests += 1;
      if(allowDevices){try{const stream=await capture(...args);window.__deviceStreams.push(stream);return stream;}catch(error){window.__captureErrors.push({name:error.name,message:error.message});throw error;}}
      throw new DOMException('Test device denied', 'NotAllowedError');
    } });
    Object.defineProperty(window, 'speechSynthesis', { value: undefined });
  },allowDevices);
  let session = {
    id: 'fixture-session', type: 'technical', topics: ['Databases'], role: 'Engineer', difficulty: 'medium', plannedDuration: 10,
    status: 'in_progress', startedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
    cameraEnabled: false, microphoneEnabled: false, feedback: null,
    questions: [{ id: 'fixture-question', questionText: 'Explain indexing tradeoffs.', questionIndex: 0, answerText: null }],
    emotionResults: [], proctoringEvents: [],
  };
  let failEvaluation = false;
  let failConsent = false;
  let sessionReads = 0;
  let resumeReads = 0;
  await page.setRequestInterception(true);
  page.on('request', async (request) => {
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/api/')) {
      if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') return request.abort();
      return request.continue();
    }
    let data = {};
    let status = 200;
    if(url.pathname==='/api/resume/fixture-resume'){
      data={id:'fixture-resume',userId:'fixture-candidate',title:'Fixture resume',personalInfo:{fullName:'Saved name'},experience:[],education:[],projects:[],skills:[],public:false,createdAt:new Date().toISOString()};
      if(++resumeReads===1&&staleLoadDelay)await new Promise(resolve=>setTimeout(resolve,staleLoadDelay));
    }
    else if (url.pathname.endsWith('/capabilities')) data = { available: false, face: false, voice: false, text: false, transcription: false, proctoring: false };
    else if (url.pathname === '/api/interview/sessions' && request.method() === 'GET') data = { sessions: [session] };
    else if (url.pathname === '/api/interview/sessions' && request.method() === 'POST') {
      const body = JSON.parse(request.postData());
      session = { ...session, ...body, cameraEnabled: body.consent.camera, microphoneEnabled: body.consent.microphone };
      data = { session }; status = 201;
    } else if(url.pathname.endsWith('/introduction')){
      session.candidateIntroduction=JSON.parse(request.postData()).text;session.introductionCompletedAt=new Date().toISOString();data={session};
    } else if(url.pathname.endsWith('/consent')){
      if(failConsent){status=503;data={error:'Consent save unavailable. Please retry.'};}
      else {const body=JSON.parse(request.postData());session={...session,...(body.camera?{cameraEnabled:true}:{}),...(body.microphone?{microphoneEnabled:true}:{})};data={session};}
    } else if (url.pathname.endsWith('/answer')) {
      session.questions[0].answerText = JSON.parse(request.postData()).answerText;
      data = { question: session.questions[0] };
    } else if (url.pathname.endsWith('/evaluate')) {
      if (failEvaluation) { status = 502; data = { error: 'Evaluation temporarily unavailable. Please retry.' }; }
      else {
        session = { ...session, status: 'completed', durationSeconds: 45, endedAt: new Date().toISOString(), feedback: { overallScore: 0, overallFeedback: 'Explain the actual tradeoffs.', strengths: [], areasToImprove: ['Include write costs.'] } };
        data = { session };
      }
    } else if (url.pathname.startsWith('/api/interview/sessions/')) {
      data = { session: structuredClone(session) };
      if(request.method()==='GET' && ++sessionReads===1 && staleLoadDelay)await new Promise(resolve=>setTimeout(resolve,staleLoadDelay));
    }
    else if (url.pathname.endsWith('/notifications/count')) data = { unreadCount: 0 };
    else if (url.pathname.includes('/connect/')) data = [];
    await request.respond({ status, contentType: 'application/json', body: JSON.stringify(data) });
  });
  const clickText = async (text) => {
    for (const button of await page.$$('button')) {
      if ((await button.evaluate((element) => element.textContent)).includes(text)) { await button.click(); return; }
    }
    throw new Error(`Button not found: ${text}`);
  };
  try {
    await run({ page, session, clickText, setFailEvaluation: (value) => { failEvaluation = value; }, setFailConsent: value=>{failConsent=value;} });
    assert.deepEqual(errors, [], 'interview pages must not throw runtime errors');
  } catch (error) {
    console.error('Device errors:',await page.evaluate(()=>window.__captureErrors));
    console.error('Browser failure at:', page.url(), (await page.$eval('body', (element) => element.textContent)).slice(-1600));
    throw error;
  } finally { await browser.close(); }
}

test('quick mock setup defaults to explicit consent and text-only interviews complete with retry', { timeout: 120000 }, () => withInterviewBrowser(async ({ page, clickText, setFailEvaluation }) => {
  const origin = process.env.INTERVIEW_TEST_ORIGIN || 'http://127.0.0.1:5173';
  await page.goto(`${origin}/interview/setup?preset=databases`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="checkbox"]');
  assert.deepEqual(await page.$$eval('input[type="checkbox"]', (elements) => elements.map((element) => element.checked)), [false, false]);
  assert.match(await page.$eval('textarea', (element) => element.value), /SQL/);
  await clickText('Practice interview');
  await clickText('Start interview');
  await page.waitForFunction(() => location.pathname.includes('/interview/session/'));
  const answerEditor = 'textarea[placeholder="Type or refine your response here..."]';
  await page.waitForSelector(answerEditor);
  await page.type(answerEditor, 'I am a test candidate practicing databases.');
  await clickText('Begin Questions');
  await page.waitForFunction(() => !document.body.textContent.includes('Begin Questions'));
  await page.type(answerEditor, 'An index improves reads but adds storage and write costs.');
  assert.match(await page.$eval(answerEditor, (element) => element.value), /storage and write costs/);
  setFailEvaluation(true);
  await clickText('Finish Interview');
  await page.waitForFunction(() => document.body.textContent.includes('Evaluation temporarily unavailable'));
  assert.match(page.url(), /interview\/session/);
  setFailEvaluation(false);
  await clickText('Finish Interview');
  await page.waitForFunction(() => document.body.textContent.includes('Interview performance report'));
  const text = await page.$eval('body', (element) => element.textContent);
  assert.match(text, /0%/);
  assert.match(text, /Not verified/);
  assert.doesNotMatch(text, /85%|92%|100%|Focused|Confident/);
  assert.equal(await page.evaluate(() => window.__mediaRequests), 0);
  await page.setViewport({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'report must fit a mobile viewport');
  if (process.env.INTERVIEW_TEST_SCREENSHOT) await page.screenshot({ path: process.env.INTERVIEW_TEST_SCREENSHOT, fullPage: true });
}));

test('consent-off session can enable camera and microphone after explicit confirmation', {timeout:120000},()=>withInterviewBrowser(async({page,clickText})=>{
  await page.goto('http://127.0.0.1:5173/interview/session/fixture-session',{waitUntil:'networkidle0'});
  await page.type('textarea','Keep this draft while enabling devices.',{delay:10});
  assert.equal(await page.evaluate(()=>window.__mediaRequests),0);
  await page.click('button[title="Turn on camera"]');await page.waitForSelector('[role="dialog"]');
  assert.equal(await page.evaluate(()=>window.__mediaRequests),0);await clickText('Cancel');assert.equal(await page.evaluate(()=>window.__mediaRequests),0);
  await page.click('button[title="Turn on camera"]');await clickText('Enable camera');
  await page.waitForFunction(()=>document.querySelector('video')?.videoWidth>0);
  await page.click('button[title="Unmute microphone"]');await clickText('Enable microphone');
  await page.waitForFunction(()=>window.__deviceStreams.some(s=>s.getAudioTracks().some(t=>t.readyState==='live')));
  assert.equal(await page.$eval('textarea',n=>n.value),'Keep this draft while enabling devices.');
  await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>document.querySelector('video')?.videoWidth>0);
  assert.equal(await page.$eval('button[title="Mute microphone"]',n=>n.disabled),false);
},0,true));

test('device consent save errors remain retryable and never start capture before saving', {timeout:120000},()=>withInterviewBrowser(async({page,clickText,setFailConsent})=>{
  await page.goto('http://127.0.0.1:5173/interview/session/fixture-session',{waitUntil:'networkidle0'});setFailConsent(true);
  await page.click('button[title="Turn on camera"]');await clickText('Enable camera');
  await page.waitForFunction(()=>document.querySelector('[role="alert"]')?.textContent.includes('Consent save unavailable'));
  assert.equal(await page.evaluate(()=>window.__mediaRequests),0);setFailConsent(false);await clickText('Enable camera');
  await page.waitForFunction(()=>document.body.textContent.includes('Camera permission denied'));
  assert.ok(await page.$('textarea'));assert.equal(await page.$eval('button[title="Turn on camera"]',n=>n.disabled),false);
}));

test('a stale initial request cannot erase text entered after the latest load', {timeout:120000},()=>withInterviewBrowser(async({page})=>{
  await page.goto('http://127.0.0.1:5173/interview/session/fixture-session',{waitUntil:'domcontentloaded'});
  const editor=await page.waitForSelector('textarea');await editor.type('My complete answer must survive a late response.',{delay:15});
  await new Promise(resolve=>setTimeout(resolve,2200));
  assert.equal(await editor.evaluate(node=>node.value),'My complete answer must survive a late response.');
},2000));

test('resume edits survive a late initial response and untouched resumes are not dirty', {timeout:120000},()=>withInterviewBrowser(async({page})=>{
  await page.goto('http://127.0.0.1:5173/resume-builder/fixture-resume',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('input[placeholder="Enter your full name"]')?.value==='Saved name');
  const editor=await page.waitForSelector('input[placeholder="Enter your full name"]');await editor.focus();await editor.evaluate(n=>n.select());await editor.press('Backspace');assert.equal(await editor.evaluate(n=>n.value),'');await editor.type('Complete name survives delayed fetch',{delay:15});
  await new Promise(resolve=>setTimeout(resolve,2200));assert.equal(await editor.evaluate(n=>n.value),'Complete name survives delayed fetch');
  let warned=false;page.on('dialog',async dialog=>{warned=true;await dialog.accept();});
  await page.reload({waitUntil:'networkidle0'}); // Dirty edits correctly trigger one warning.
  assert.equal(warned,true);warned=false;
  await page.click('input[placeholder="Enter your full name"]');await page.reload({waitUntil:'networkidle0'});
  assert.equal(warned,false,'loading a persisted resume must not warn about unsaved edits');
},2000));

test('an answered interview resumes at the final question for evaluation retry', {timeout:120000},()=>withInterviewBrowser(async({page,session})=>{
  session.questions[0].answerText='First saved answer';session.questions.push({...session.questions[0],id:'question-2',questionText:'Second question',questionIndex:1,answerText:'Final saved answer'});
  await page.goto('http://127.0.0.1:5173/interview/session/fixture-session',{waitUntil:'networkidle0'});
  await page.waitForSelector('textarea');assert.equal(await page.$eval('textarea',n=>n.value),'Final saved answer');
  assert.match(await page.$eval('main',n=>n.textContent),/Question 2 of 2/);
}));

test('device denial offers typed answers and never shows false identity verification', { timeout: 120000 }, () => withInterviewBrowser(async ({ page, session }) => {
  session.cameraEnabled = true; session.microphoneEnabled = true; session.monitoringMode = 'practice';
  await page.goto('http://127.0.0.1:5173/interview/session/fixture-session', {waitUntil: 'networkidle0'});
  await page.waitForFunction(() => document.body.textContent.includes('Microphone access is unavailable'));
  assert.ok(await page.$('textarea'));
  assert.ok(await page.evaluate(() => window.__mediaRequests) >= 1);
  assert.doesNotMatch(await page.$eval('body', (element) => element.textContent), /Identity Verified/);
}));

test('the report renders saved model evidence and fusion without replacing the answer score', { timeout: 120000 }, () => withInterviewBrowser(async ({ page, session }) => {
  session.status = 'completed';
  session.feedback = { overallScore: 0, overallFeedback: 'Add more evidence.', strengths: [], areasToImprove: [] };
  session.emotionResults = [
    { id: 'voice-1', modality: 'voice', result: { source: 'ml', success: true, emotion: 'neutral', confidence: 0.63 } },
    { id: 'fusion-1', modality: 'fusion', result: { source: 'ml', success: true, emotions: { neutral: 0.8, happiness: 0.2 }, behavioral_metrics: { confidence: 72.3, stress: 14.2 } } },
  ];
  session.proctoringEvents = [{ id: 'check-1', eventType: 'face_verified', details: { source: 'ml' }, severity: 'info', createdAt: new Date().toISOString() }];
  const origin = process.env.INTERVIEW_TEST_ORIGIN || 'http://127.0.0.1:5173';
  await page.goto(`${origin}/interview/results/fixture-session`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.body.textContent.includes('Combined emotion distribution'));
  const text = await page.$eval('body', (element) => element.textContent);
  assert.match(text, /63%/);
  assert.match(text, /72.3/);
  assert.match(text, /Last check matched/);
  assert.ok(await page.$('[aria-label="Answer score 0 out of 100"]'));
  await page.setViewport({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  if (process.env.INTERVIEW_TEST_SCREENSHOT) await page.screenshot({ path: process.env.INTERVIEW_TEST_SCREENSHOT, fullPage: true });
}));
