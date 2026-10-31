// Deterministic browser error cases; all API data is synthetic and no messages leave this fixture.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer';
const browser=await puppeteer.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
const page=await browser.newPage();const checks=[],errors=[];let failRead=false;
const noticeRows=[{id:'notice-1',type:'session_requested',title:'Session request sent',message:'Awaiting mentor response',data:{bookingId:'booking-1'},isRead:false,createdAt:new Date().toISOString()}];
const booking={id:'booking-1',topic:'QA mentoring',status:'accepted',scheduledTime:new Date(Date.now()+86400000).toISOString(),duration:45,junior:{id:'qa-user',name:'QA candidate'},senior:{id:'qa-mentor',name:'QA mentor'},feedback:null};
page.on('pageerror',e=>errors.push(e.message));
await page.evaluateOnNewDocument(()=>{localStorage.setItem('token','notification-fixture');localStorage.setItem('user',JSON.stringify({id:'qa-user',name:'QA candidate',role:'USER'}))});
await page.setRequestInterception(true);
page.on('request',async request=>{
 const url=new URL(request.url());if(!url.pathname.startsWith('/api/'))return ['127.0.0.1','localhost'].includes(url.hostname)?request.continue():request.abort();
 let data=[],status=200;
 if(url.pathname==='/api/connect/notifications/count')data={unreadCount:noticeRows.filter(n=>!n.isRead).length};
 else if(url.pathname==='/api/connect/notifications')data=noticeRows;
 else if(url.pathname.includes('/notifications/')&&url.pathname.endsWith('/read')){if(failRead){status=503;data={error:'Fixture read failed'};}else{const row=noticeRows.find(n=>url.pathname.includes(n.id));if(row)row.isRead=true;data={success:true};}}
 else if(url.pathname.startsWith('/api/connect/sessions'))data=url.pathname.endsWith('/messages')?[]:[booking];
 else if(url.pathname==='/api/dashboard/pri/live')data={score:0,interviewScore:0,algoRankScore:0,resumeScore:0,interviewCount:0,hasRealInterview:false};
 await request.respond({status,contentType:'application/json',body:JSON.stringify(data)});
});
const click=async text=>{const button=await page.waitForFunction(text=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text),{},text);await button.asElement().click()};
const waitText=text=>page.waitForFunction(text=>document.body.textContent.includes(text),{},text);
const check=async(name,fn)=>{await fn();checks.push({name,status:'PASS'});console.log('PASS:',name)};
try{
 await page.goto('http://127.0.0.1:5173/connect/sessions',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('[aria-label="Notifications, 1 unread"]');await page.click('[title="Notifications"]');await waitText('Session request sent');
 await check('Failed read preserves the notice/badge and succeeds on retry',async()=>{
  failRead=true;await click('Mark as read');await waitText('Could not mark notification as read');assert.equal(noticeRows[0].isRead,false);assert.ok(await page.$('[aria-label="Notifications, 1 unread"]'));
  failRead=false;await click('Mark as read');await page.waitForFunction(()=>document.querySelector('[title="Notifications"]').getAttribute('aria-label')==='Notifications');assert.equal(noticeRows[0].isRead,true);
 });
 await check('Notification inbox fits 320, 390 and 768 pixel screens',async()=>{
  for(const width of [320,390,768]){await page.setViewport({width,height:900});const rect=await page.$eval('[aria-label="Notifications inbox"]',el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}));assert.ok(rect.left>=0&&rect.right<=width);}
  await page.setViewport({width:320,height:900});await page.screenshot({path:'../outputs/notifications-inbox-mobile.png',fullPage:true});
 });
 noticeRows.push({id:'chat-2',type:'session_message',title:'New Message',message:'Synthetic chat notice',data:{bookingId:booking.id},isRead:false,createdAt:new Date().toISOString()});await waitText('New Message');
 await check('Open inbox polls and opens the correct private chat',async()=>{await click('Open conversation');await page.waitForSelector('input[placeholder^="Message "]');assert.equal(new URL(page.url()).pathname,'/connect/sessions')});
 assert.deepEqual(errors,[]);fs.writeFileSync('../outputs/notification-browser-qa.json',JSON.stringify({checks,browserErrors:errors,boundary:'Fixture API; no external messages or production records.'},null,2));
}finally{await browser.close()}
