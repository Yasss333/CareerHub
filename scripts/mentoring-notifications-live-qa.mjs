// Uses only disposable QA accounts/bookings in the configured database. No email is sent.
import '../apps/api/src/load-env.js';
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer';
const db=new PrismaClient();const prefix=`notify-qa-${Date.now()}`;const accounts=[];const checks=[];let browser;
const base='http://127.0.0.1:5000/api/connect';
const call=async(user,path,method='GET',body)=>{
  const token=jwt.sign({id:user.id,name:user.name,role:user.role},process.env.JWT_SECRET,{expiresIn:'10m'});
  const response=await fetch(base+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const result=await response.json();assert.ok(response.ok,`${method} ${path}: ${response.status} ${result.error || ''}`);return result;
};
const check=(name)=>{checks.push({name,status:'PASS'});console.log('PASS:',name)};
try{
 const passwordHash=await bcrypt.hash('Disposable-notification-QA-'+prefix,10);
 for(const role of ['USER','MENTOR'])accounts.push(await db.user.create({data:{email:`${prefix}-${role.toLowerCase()}@example.invalid`,name:`${prefix} ${role}`,passwordHash,role,isAlumniMentor:role==='MENTOR',mentorApprovalStatus:role==='MENTOR'?'APPROVED':'NONE'}}));
 const [student,mentor]=accounts;
 const booking=await call(student,'/sessions','POST',{seniorId:mentor.id,scheduledTime:new Date(Date.now()+86400000).toISOString(),duration:45,topic:'Notification QA'});
 const own=await call(student,'/notifications');const requested=await call(mentor,'/notifications');assert.equal(own[0].type,'session_requested');assert.equal(requested[0].type,'session_request');check('Real booking creates notices for both participants');
 await call(mentor,`/sessions/${booking.id}/status`,'PUT',{status:'accepted'});assert.ok((await call(student,'/notifications')).some(n=>n.type==='session_accepted'));check('Mentor acceptance notifies candidate');
 browser=await puppeteer.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const token=jwt.sign({id:mentor.id,name:mentor.name,role:mentor.role},process.env.JWT_SECRET,{expiresIn:'10m'});
 await page.evaluateOnNewDocument(({token,user})=>{localStorage.setItem('token',token);localStorage.setItem('user',JSON.stringify(user))},{token,user:{id:mentor.id,name:mentor.name,role:mentor.role}});
 await page.setViewport({width:1440,height:1000});await page.goto('http://127.0.0.1:5173/mentor',{waitUntil:'networkidle0'});
 await page.waitForSelector('[aria-label="Notifications, 1 unread"]');await page.click('[title="Notifications"]');await page.waitForFunction(()=>document.body.innerText.includes('New Session Request'));check('Browser badge and inbox show real scheduling notification');
 await call(student,`/sessions/${booking.id}/messages`,'POST',{message:'Synthetic notification QA message'});
 await page.waitForFunction(()=>document.body.innerText.includes('New Message'),{timeout:20000});check('An open inbox refreshes when a chat message arrives');
 const open=await page.waitForFunction(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Open conversation'));await open.asElement().click();
 await page.waitForSelector('input[placeholder^="Message "]');await page.waitForFunction(()=>document.body.innerText.includes('Synthetic notification QA message'));assert.equal(new URL(page.url()).pathname,'/mentor');check('Mentor notification opens the correct private conversation');
 await page.type('input[placeholder^="Message "]','Synthetic mentor reply');await page.click('[title="Send Message"]');await page.waitForFunction(()=>document.body.innerText.includes('Synthetic mentor reply'));assert.ok((await call(student,'/notifications')).some(n=>n.type==='session_message'));check('Browser chat reply notifies the other participant');
 await page.screenshot({path:'../outputs/mentoring-notifications-live.png',fullPage:true});
 await call(student,`/sessions/${booking.id}`,'DELETE');assert.ok((await call(mentor,'/notifications')).some(n=>n.type==='session_cancelled'));check('Candidate cancellation notifies mentor');
 assert.deepEqual(errors,[]);fs.writeFileSync('../outputs/mentoring-notifications-live-qa.json',JSON.stringify({checks,browserErrors:errors,boundary:'Local UI/API and real configured database; only QA-owned records. No email or video calls.'},null,2));
}finally{
 await browser?.close();
 const ownIds=accounts.filter(u=>u.email.startsWith(prefix+'-')&&u.email.endsWith('@example.invalid')).map(u=>u.id);
 if(ownIds.length){await db.notification.deleteMany({where:{userId:{in:ownIds}}});await db.sessionBooking.deleteMany({where:{juniorId:{in:ownIds},seniorId:{in:ownIds}}});await db.user.deleteMany({where:{id:{in:ownIds},email:{startsWith:prefix+'-'}}});}
 await db.$disconnect();
}
