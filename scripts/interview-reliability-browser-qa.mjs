// Isolated Chrome; every API request and screen capture is a fixture. No production data/media.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {generateInterviewReportPdf} from '../apps/api/src/services/interview-report.js';
const out = '../outputs'; fs.mkdirSync(out, {recursive: true});
const reportFile=path.resolve(out,'careerhub-interview-qa-session.pdf');if(fs.existsSync(reportFile))fs.rmSync(reportFile);
process.env.PUPPETEER_EXECUTABLE_PATH='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']});
const page = await browser.newPage(); await page.setViewport({width: 1440, height: 1000});
const errors = [], checks = [], events = [], speeches = [];
page.on('pageerror', e => errors.push(e.message));
let session, introductionSaves = 0, answerSaves = 0;
let emotionCalls=0, emotionActive=0, maxEmotionActive=0, registerCalls=0, identity='NO_FACE', failDownload=false;
const noticeRows=[{id:'notice-1',type:'session_requested',title:'Session request sent',message:'Awaiting mentor response',data:{bookingId:'booking-1'},isRead:false,createdAt:new Date().toISOString()}];
let failRead=false;
const booking={id:'booking-1',topic:'QA mentoring',status:'accepted',scheduledTime:new Date(Date.now()+86400000).toISOString(),duration:45,junior:{id:'qa-user',name:'QA candidate'},senior:{id:'qa-mentor',name:'QA mentor'},feedback:null};
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
    let stream;
    if(opts.video){const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const ctx=canvas.getContext('2d');ctx.fillStyle='#102442';ctx.fillRect(0,0,640,480);stream=canvas.captureStream(5);const timer=setInterval(()=>{ctx.fillStyle=Date.now()%2?'#102442':'#102443';ctx.fillRect(0,0,640,480)},200);stream.getTracks()[0].addEventListener('ended',()=>clearInterval(timer));}
    else stream=await getMedia(opts);
    window.__streams.push(stream); return stream;
  }});
  Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {value: async () => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 360;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#102442'; ctx.fillRect(0, 0, 640, 360);
    const stream = canvas.captureStream(5); const track = stream.getVideoTracks()[0];
    Object.defineProperty(track, 'getSettings', {value: () => ({displaySurface: window.__surface})});
    window.__screen = stream; window.__streams.push(stream); return stream;
  }});
  Object.defineProperty(window, 'SpeechRecognition', {value: undefined}); Object.defineProperty(window, 'webkitSpeechRecognition', {value: undefined});
  Object.defineProperty(window, 'speechSynthesis', {value: {getVoices: () => [], cancel: () => {}, speaking: false, speak: utterance => {window.__spoken = utterance.text;window.recordSpeech(utterance.text); utterance.onstart?.(); setTimeout(() => utterance.onend?.(), 100)}, pause: () => {}, resume: () => {}}});
});
await page.setRequestInterception(true);
page.on('request', async req => {
  const url = new URL(req.url());
  if (!url.pathname.startsWith('/api/')) return ['127.0.0.1', 'localhost'].includes(url.hostname) ? req.continue() : req.abort();
  let data = {}, status = 200; const body = () => JSON.parse(req.postData() || '{}');
  if(url.pathname.endsWith('/report.pdf')) {
    if(failDownload) return req.respond({status:503,contentType:'application/json',body:JSON.stringify({error:'Report download is unavailable. Please retry.'})});
    const pdf=await generateInterviewReportPdf(session); return req.respond({status:200,contentType:'application/pdf',body:pdf});
  }
  if (url.pathname === '/api/interview/capabilities') data = {available:true,face:true,voice:false,text:false,transcription:false,proctoring:true};
  else if(url.pathname.endsWith('/analysis/face')) {emotionCalls++;emotionActive++;maxEmotionActive=Math.max(maxEmotionActive,emotionActive);await new Promise(r=>setTimeout(r,emotionCalls===1?18000:100));emotionActive--;data={result:{success:true,source:'ml',emotion:'neutral',confidence:.8}};}
  else if(/analysis\/face-(register|verify)$/.test(url.pathname)) {if(url.pathname.endsWith('face-register')) registerCalls++; const kind=url.pathname.endsWith('face-register') && identity==='VERIFIED'?'face_registered':'face_'+identity.toLowerCase();let event=null;if(session.proctoringEvents.at(-1)?.eventType!==kind){event={id:'face-'+session.proctoringEvents.length,sessionId:session.id,eventType:kind,severity:identity==='MULTIPLE_FACES'?'warning':'info',details:{source:'ml'},createdAt:now()};session.proctoringEvents.push(event);}data={result:{status:identity,success:identity==='VERIFIED',source:'ml'},event};}
  else if(url.pathname==='/api/connect/notifications/count') data={unreadCount:noticeRows.filter(n=>!n.isRead).length};
  else if(url.pathname==='/api/connect/notifications') data=noticeRows;
  else if(url.pathname.endsWith('/read') && url.pathname.includes('/notifications/')) {if(failRead){status=503;data={error:'Fixture read failed'};}else{const n=noticeRows.find(n=>url.pathname.includes(n.id));if(n)n.isRead=true;data={success:true};}}
  else if(url.pathname.startsWith('/api/connect/sessions')) data=url.pathname.endsWith('/messages')?[]:[booking];
  else if (url.pathname === '/api/interview/sessions' && req.method() === 'POST') {session = {...makeSession(), ...body(), cameraEnabled: body().consent.camera, microphoneEnabled: body().consent.microphone}; data = {session}; status = 201;}
  else if(url.pathname.endsWith('/proctor-events') && req.method()==='GET')data={events:session.proctoringEvents};
  else if (url.pathname.endsWith('/proctor-events')) {const type=body().eventType;events.push(type);const event={id:'browser-'+events.length,sessionId:session.id,eventType:type,severity:['screen_started','screen_heartbeat'].includes(type)?'info':'warning',details:{source:'client'},createdAt:now()};session.proctoringEvents.push(event);data={event};status=201;}
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
const fill = async text => {if(!await page.$('textarea'))await page.click('[title="Toggle Text Editor"]');const input = await page.waitForSelector('textarea[placeholder]'); await input.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'})); await input.focus(); await page.keyboard.down('Control');await page.keyboard.press('a');await page.keyboard.up('Control');await input.type(text,{delay:5});};
async function check(name, fn) {await fn(); checks.push({name, status: 'PASS'}); console.log('PASS:', name);}
try {
  const client=await page.createCDPSession();const downloadDir=path.resolve('../outputs');await client.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloadDir,eventsEnabled:true});
  await page.goto('http://127.0.0.1:5173/interview/setup', {waitUntil: 'domcontentloaded'});
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
  await check('Screen capture survives setup→session; Maya starts with a brief introduction', async () => {await page.waitForFunction(() => document.querySelector('[aria-label="Screen monitoring"]')?.textContent.includes('Monitoring connected')); await page.click('[title="Toggle Text Editor"]'); await page.waitForFunction(() => document.querySelector('textarea')); await waitText('Hi, I’m Maya'); assert.ok(events.includes('screen_started')); await page.waitForFunction(()=>window.__spoken?.includes('I’m Maya'));assert.ok(speeches.some(s => s.includes('I’m Maya'))); assert.equal(await page.evaluate(() => window.__deviceRequests), deviceRequestsAtJoin, 'Preflight device streams should hand off without reopening hardware');});
  await check('Start enters native fullscreen and registration does not wait for slow emotion inference',async()=>{
    assert.equal(await page.evaluate(()=>!!document.fullscreenElement),true);
    await waitText('No face detected · Face the camera in good light');assert.equal(registerCalls,1);assert.equal(emotionActive,1);
    await new Promise(r=>setTimeout(r,16000));assert.equal(emotionCalls,1);assert.equal(registerCalls,1);assert.equal(maxEmotionActive,1);
    identity='VERIFIED';await waitText('Face baseline registered');
  });
  await check('A model warning appears live and repeats count once',async()=>{
    await new Promise(r=>setTimeout(r,300));identity='MULTIPLE_FACES';await click('Retry check');await waitText('Multiple faces detected');await page.waitForFunction(()=>document.querySelector('[aria-label="Live proctoring incidents"]').textContent.includes('1 incident'));
    await new Promise(r=>setTimeout(r,300));await click('Retry check');await new Promise(r=>setTimeout(r,400));assert.ok(await page.$eval('[aria-label="Live proctoring incidents"]',el=>el.textContent.includes('1 incident')));
    identity='VERIFIED';
  });
  await check('Leaving fullscreen shows a live incident and the fullscreen recovery button',async()=>{
    await page.evaluate(()=>document.exitFullscreen());await waitText('Enter fullscreen');await new Promise(r=>setTimeout(r,2300));assert.equal(events.filter(e=>e==='fullscreen_exited').length,1);await click('Enter fullscreen');assert.equal(await page.evaluate(()=>!!document.fullscreenElement),true);
  });
  await page.screenshot({path:out+'/interview-live-monitoring.png',fullPage:true});
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
  await check('Report download errors allow retry and a real PDF downloads',async()=>{
    failDownload=true;await click('Download report');await waitText('Report download is unavailable');failDownload=false;await click('Download report');
    const file=out+'/careerhub-interview-qa-session.pdf';for(let i=0;i<300&&!fs.existsSync(file);i++)await new Promise(r=>setTimeout(r,100));assert.ok(fs.existsSync(file));assert.equal(fs.readFileSync(file).subarray(0,4).toString(),'%PDF');
    assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false);
  });
  await page.screenshot({path: out + '/interview-analytics.png', fullPage: true});
  for (const width of [320, 390, 768]) {await page.setViewport({width, height: 900}); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Report overflow at ' + width);}
  await check('Report fits 320, 390 and 768 pixel screens', async () => {});
  await page.setViewport({width:1440,height:1000});await page.goto('http://127.0.0.1:5173/connect/sessions',{waitUntil:'domcontentloaded'});
  await check('Unread badge and session link open the matching booking',async()=>{
    await page.waitForSelector('[aria-label="Notifications, 1 unread"]');await page.click('[title="Notifications"]');await waitText('Session request sent');await click('View session');await waitText('QA mentoring');await page.waitForFunction(()=>!new URL(location.href).searchParams.has('session'));
  });
  await check('Inbox refresh picks up new chat and opens its conversation',async()=>{
    noticeRows.push({id:'notice-chat',type:'session_message',title:'New Message',message:'QA mentor sent a message',data:{bookingId:booking.id},isRead:false,createdAt:now()});
    await page.click('[title="Notifications"]');await waitText('New Message');await click('Open conversation');await page.waitForSelector('input[placeholder],textarea[placeholder]');await waitText('QA mentor');await page.waitForFunction(()=>!new URL(location.href).searchParams.has('chat'));
  });
  await page.screenshot({path:out+'/notification-conversation.png',fullPage:true});
  await page.evaluate(() => localStorage.setItem('user', JSON.stringify({id: 'qa-admin', role: 'ADMIN', name: 'QA admin'})));
  await page.setViewport({width: 1440, height: 1000}); await page.goto('http://127.0.0.1:5173/admin', {waitUntil: 'domcontentloaded'}); await waitText('Admin overview');
  await page.screenshot({path: out + '/admin-overview.png', fullPage: true});
  await page.goto('http://127.0.0.1:5173/admin/progress', {waitUntil: 'domcontentloaded'}); await waitText('50%'); await page.click('summary'); await waitText('SQL foundations');
  await check('Separate admin workspace displays actual milestone completion', async () => {assert.ok(await page.$('a[href="/admin/audit"]')); assert.ok(await page.$('[aria-valuenow="50"]'));});
  await page.goto('http://127.0.0.1:5173/admin/mentors', {waitUntil: 'domcontentloaded'}); await click('Remove mentor'); await waitText('Confirm removal');
  await check('Mentor removal needs a reason and explicit confirmation', async () => {assert.ok(await page.$('[role="dialog"]')); await page.type('[role="dialog"] textarea', 'Synthetic mentor removal test'); await click('Confirm removal'); await waitText('Mentor removed. 1 upcoming');});
  await page.evaluate(() => localStorage.setItem('user', JSON.stringify({id: 'qa-user', role: 'USER'}))); await page.goto('http://127.0.0.1:5173/admin?deny=true', {waitUntil: 'domcontentloaded'}); await page.waitForFunction(()=>location.pathname!=='/admin'); assert.notEqual(new URL(page.url()).pathname, '/admin');
  checks.push({name: 'Ordinary users are routed out of the admin panel', status: 'PASS'});
  assert.deepEqual(errors, []); fs.writeFileSync(out + '/interview-reliability-browser-qa.json', JSON.stringify({checks, browserErrors: errors, boundary: 'Fixture API and synthetic devices; real chooser/hardware quality not established.'}, null, 2));
} catch (error) {console.error(error); console.error({errors, speeches, events}); await page.screenshot({path: '../work/interview-admin-failure.png', fullPage: true}); console.error((await page.$eval('body', el => el.textContent)).slice(-2500)); process.exitCode = 1;}
finally {await browser.close();}
