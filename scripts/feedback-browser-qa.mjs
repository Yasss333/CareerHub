import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import {PrismaClient} from '@prisma/client';
dotenv.config({path:'apps/api/.env',quiet:true});
const db=new PrismaClient(),accounts=[],results=[];
const runId=`feedback-qa-${Date.now()}`,password=crypto.randomBytes(24).toString('base64url');
const origin='http://127.0.0.1:5173',apiOrigin='http://127.0.0.1:5000';
let browser,page,student,admin,mentor,reportId;
const title=`${runId} <img src=x onerror=alert(1)>`;
const description='The camera button needs clearer feedback when device permission is unavailable.';
const output='../work/feedback-browser-results.json';
async function api(route,account,body,method=body===undefined?'GET':'POST'){
 const response=await fetch(apiOrigin+'/api'+route,{method,headers:{'Content-Type':'application/json',...(account?{Authorization:'Bearer '+account.token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});const data=await response.json();if(!response.ok)throw new Error(`${response.status}: ${data.error}`);return data;
}
async function register(label,role='USER'){const result=await api('/auth/register',null,{email:`${runId}-${label}@example.com`,password,name:'Feedback QA '+label,role,...(role==='USER'?{specialization:'CS_SOFTWARE'}:{})});const account={...result.user,token:result.token};accounts.push(account);return account;}
async function check(name,fn){try{await fn();results.push({name,status:'PASSED'});}catch(e){results.push({name,status:'FAILED',message:e.message});if(page&&!page.isClosed())console.log('FAILURE_STATE',await page.$eval('body',n=>n.textContent.slice(-1800)).catch(()=>''));}console.log(JSON.stringify(results.at(-1)));fs.writeFileSync(output,JSON.stringify({runId,results},null,2));}
async function clickText(text,selector='button'){for(const node of await page.$$(selector))if((await node.evaluate(n=>n.textContent)).trim().includes(text)){await node.click();return;}throw new Error('Missing control '+text);}
async function login(account,role='USER'){await page.goto(origin+'/login',{waitUntil:'networkidle0'});await page.click(`label:has(input[value="${role}"])`);await page.type('input[type="email"]',account.email);await page.type('input[type="password"]',password);await page.click('button[type="submit"]');await page.waitForFunction(()=>location.pathname!=='/login');}
try{
 student=await register('student');admin=await register('admin');mentor=await register('mentor','MENTOR');
 assert.ok(await db.user.findFirst({where:{id:admin.id,email:admin.email}}));await db.user.update({where:{id:admin.id},data:{role:'ADMIN'}});admin.token=(await api('/auth/login',null,{email:admin.email,password,accountType:'ADMIN'})).token;
 await api(`/connect/admin/mentor-applications/${mentor.id}`,admin,{decision:'approve'},'PATCH');mentor.token=(await api('/auth/login',null,{email:mentor.email,password,accountType:'MENTOR'})).token;
 browser=await puppeteer.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});page=await browser.newPage();await page.setViewport({width:1440,height:1000});
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));page.on('dialog',dialog=>{pageErrors.push('Unexpected browser dialog');void dialog.dismiss();});
 let failOnce=true;const requests=[];
 await page.setRequestInterception(true);page.on('request',request=>{
  if(new URL(request.url()).pathname==='/api/feedback'&&request.method()==='POST'){
   requests.push(JSON.parse(request.postData()));if(failOnce){failOnce=false;return setTimeout(()=>void request.respond({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporary test outage. Please retry.'})}),1000);}
  }
  return request.continue();
 });
 await login(student);
 await check('Dashboard exposes Report a bug and personal history',async()=>{await page.waitForSelector('button[aria-label="Report a bug"]');assert.ok(await page.$('a[href="/feedback"]'));});
 await page.goto(origin+'/interview?private=do-not-attach#answer',{waitUntil:'networkidle0'});
 await check('Mobile dialog fits, captures only safe page context, and keeps a cancelled draft',async()=>{
  await page.setViewport({width:390,height:844});await page.click('button[aria-label="Report a bug"]');await page.waitForSelector('[role="dialog"]');
  await page.type('label:has(input) input',title,{delay:5});await page.type('label:has(textarea) textarea',description,{delay:5});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'../outputs/feedback-mobile.png',fullPage:true});
  await page.click('[data-slot="dialog-close"]');await page.waitForSelector('[role="dialog"]',{hidden:true});await page.click('button[aria-label="Report a bug"]');await page.waitForSelector('[role="dialog"]',{visible:true});
  assert.equal(await page.$eval('label:has(input) input',n=>n.value),title);
 });
 await check('Failed submission retains the draft; retry uses the same idempotency key and saves once',async()=>{
  await clickText('Send feedback');await page.type('label:has(input) input',' must not edit pending submission');assert.equal(await page.$eval('label:has(input) input',n=>n.value),title);await page.waitForFunction(()=>document.querySelector('[role="alert"]')?.textContent.includes('Temporary test outage'));
  assert.equal(await page.$eval('label:has(input) input',n=>n.value),title);await clickText('Send feedback');
  await page.waitForFunction(()=>document.body.textContent.includes('Your feedback was saved.'));
  assert.equal(requests.length,2);assert.equal(requests[0].requestId,requests[1].requestId);assert.equal(requests[1].context.path,'/interview');assert.equal(JSON.stringify(requests[1]).includes('do-not-attach'),false);
  const rows=await db.feedbackReport.findMany({where:{userId:student.id}});assert.equal(rows.length,1);reportId=rows[0].id;assert.equal(rows[0].payload.title,title);assert.equal(rows[0].payload.context.module,'AI Interview');
 });
 await check('User history survives reload, renders hostile text literally, and blocks administrator view',async()=>{
  await clickText('View feedback','a');await page.waitForFunction(()=>document.querySelector('main')?.textContent.includes('My feedback'));
  await page.waitForFunction(title=>document.querySelector('article')?.textContent.includes(title),{},title);await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('article');
  assert.equal(await page.$('article img'),null);await page.goto(origin+'/admin/feedback',{waitUntil:'networkidle0'});assert.equal(new URL(page.url()).pathname,'/');
 });
 await check('Administrator reviews the temporary report, saves progress, and exports valid JSON',async()=>{
  // Do not access or export feedback belonging to real users in this QA run.
  assert.equal(await db.feedbackReport.count({where:{userId:{notIn:accounts.map(a=>a.id)}}}),0);
  await page.setViewport({width:1440,height:1000});await login(admin,'ADMIN');await page.goto(origin+'/admin/feedback',{waitUntil:'networkidle0'});await page.waitForSelector('article');
  let card;for(const candidate of await page.$$('article'))if((await candidate.evaluate(n=>n.textContent)).includes(title)){card=candidate;break;}assert.ok(card);
  await (await card.$('select')).select('IN_PROGRESS');await (await card.$('textarea')).type('Reproduced. Checking device permission feedback.');await (await card.$('button')).click();await page.waitForFunction(()=>document.body.textContent.includes('Update saved'));
  assert.equal((await db.feedbackReport.findUnique({where:{id:reportId}})).status,'IN_PROGRESS');
  const downloadPath=path.resolve('../work/feedback-downloads');fs.mkdirSync(downloadPath,{recursive:true});const cdp=await page.createCDPSession();await cdp.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath});
  const filename=`careerhub-feedback-${new Date().toISOString().slice(0,10)}.json`,file=path.join(downloadPath,filename);if(fs.existsSync(file))fs.unlinkSync(file);await clickText('Download loaded JSON');const deadline=Date.now()+10000;while(!fs.existsSync(file)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));assert.ok(fs.existsSync(file));const exported=JSON.parse(fs.readFileSync(file,'utf8'));assert.ok(exported.reports.some(r=>r.id===reportId));assert.equal(exported.schemaVersion,1);
  await page.screenshot({path:'../outputs/feedback-admin.png',fullPage:true});
 });
 await check('Reporter sees the team update and status filtering works',async()=>{
  await login(student);await page.goto(origin+'/feedback',{waitUntil:'networkidle0'});await page.waitForSelector('article');assert.ok((await page.$eval('article',n=>n.textContent)).includes('Checking device permission feedback.'));
  await page.select('main select','RESOLVED');await page.waitForFunction(()=>document.body.textContent.includes('No reports with this status'));
  await page.select('main select','IN_PROGRESS');await page.waitForSelector('article');
 });
 await check('Mentor can report feedback and open private feedback history',async()=>{
  await login(mentor,'MENTOR');await page.goto(origin+'/mentor/feedback',{waitUntil:'networkidle0'});await page.waitForFunction(()=>document.querySelector('main')?.textContent.includes('My feedback'));await page.click('button[aria-label="Report a bug"]');await page.waitForSelector('[role="dialog"]');assert.equal(await page.$eval('select[aria-label="Feedback type"]',n=>n.value),'bug');await page.click('[data-slot="dialog-close"]');
 });
 await check('All feedback pages complete without browser runtime exceptions',async()=>assert.deepEqual(pageErrors,[]));
}catch(e){results.push({name:'Feedback browser setup',status:'FAILED',message:e.message});}
finally{
 if(browser)await browser.close();
 await check('Scoped temporary accounts, reports and their data are removed',async()=>{for(const account of accounts){assert.ok(await db.user.findFirst({where:{id:account.id,email:account.email}}));await db.seniorProfile.deleteMany({where:{userId:account.id}});await db.user.delete({where:{id:account.id,email:account.email}});}assert.equal(await db.feedbackReport.count({where:{userId:{in:accounts.map(a=>a.id)}}}),0);});
 fs.writeFileSync(output,JSON.stringify({runId,results},null,2));await db.$disconnect();const failed=results.filter(r=>r.status==='FAILED').length;console.log(JSON.stringify({total:results.length,failed}));process.exitCode=failed?1:0;
}
