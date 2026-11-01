import test from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

async function withPage(run,{deny=false}={}){
 const browser=await puppeteer.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 const page=await browser.newPage();const errors=[];let events=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(deny=>{localStorage.setItem('token','fixture');localStorage.setItem('user',JSON.stringify({id:'qa',role:'USER',name:'QA'}));Object.defineProperty(window,'speechSynthesis',{value:undefined});if(deny)Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Fixture denial'));},deny);
 const session={id:'qa',status:'in_progress',type:'technical',role:'QA',topics:['Databases'],startedAt:new Date().toISOString(),monitoringMode:'practice',cameraEnabled:false,microphoneEnabled:false,questions:[{id:'q',questionText:'Explain indexes.',questionIndex:0,answerText:null}],proctoringEvents:[]};
 await page.setRequestInterception(true);
 page.on('request',async req=>{const url=new URL(req.url());if(!url.pathname.startsWith('/api/'))return ['127.0.0.1','localhost'].includes(url.hostname)?req.continue():req.abort();let data={};if(url.pathname.endsWith('/capabilities'))data={available:false};else if(url.pathname.endsWith('/proctor-events'))data={events};else if(url.pathname.includes('/interview/sessions/'))data={session};else if(url.pathname.endsWith('/notifications/count'))data={unreadCount:0};else if(url.pathname.includes('/connect/'))data=[];await req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});});
 try{await page.goto('http://127.0.0.1:5173/interview/session/qa',{waitUntil:'domcontentloaded'});await page.waitForSelector('textarea');await run({page,setEvents:value=>{events=value}});assert.deepEqual(errors,[]);}catch(error){console.error('UI errors:',errors);console.error((await page.$eval('body',e=>e.innerText)).slice(-1600));throw error;}finally{await browser.close();}
}

test('resumed interview requires a real fullscreen start click',{timeout:60000},()=>withPage(async({page})=>{
 await page.waitForSelector('[role="dialog"][aria-label="Start interview fullscreen"]',{timeout:5000});
 assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false);assert.equal(await page.$eval('button[data-interview-next]',e=>e.disabled),true);
 await page.click('[data-enter-interview]');await page.waitForFunction(()=>!!document.fullscreenElement);assert.equal(await page.$('[role="dialog"][aria-label="Start interview fullscreen"]'),null);
}));

test('browser fullscreen refusal is visible and retryable',{timeout:60000},()=>withPage(async({page})=>{
 await page.waitForSelector('[data-enter-interview]');await page.click('[data-enter-interview]');await page.waitForFunction(()=>document.body.textContent.includes('Your browser blocked fullscreen'));assert.ok(await page.$('[data-enter-interview]'));
},{deny:true}));

test('live warnings arriving from the server stay visible while typing',{timeout:60000},()=>withPage(async({page,setEvents})=>{
 await page.waitForSelector('[data-enter-interview]');await page.click('[data-enter-interview]');await page.type('textarea','My unsaved answer survives live monitoring refresh.');
 setEvents([{id:'e1',sessionId:'qa',eventType:'face_multiple_faces',severity:'warning',details:{source:'ml'},createdAt:new Date().toISOString()}]);
 await page.waitForFunction(()=>document.querySelector('[aria-label="Live proctoring incidents"]').textContent.includes('1 incident'),{timeout:20000});
 assert.equal(await page.$eval('textarea',e=>e.value),'My unsaved answer survives live monitoring refresh.');await page.$eval('textarea',e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 const position=await page.$eval('[aria-label="Live proctoring incidents"]',e=>({top:e.getBoundingClientRect().top,position:getComputedStyle(e).position}));assert.equal(position.position,'sticky');assert.ok(position.top>=0);
}));
