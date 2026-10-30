import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import {PrismaClient} from '@prisma/client';
dotenv.config({path:'apps/api/.env',quiet:true});
const db=new PrismaClient(),results=[],responses=[];let account,session,browser,page;
const runId=`voice-qa-${Date.now()}`;
const output='../work/interview-voice-live-results.json';
const save=()=>fs.writeFileSync(output,JSON.stringify({runId,results,modelResponses:responses},null,2));
async function check(name,fn){try{const evidence=await fn();results.push({name,status:'PASSED',evidence});}catch(e){results.push({name,status:'FAILED',message:e.message});}save();console.log(JSON.stringify(results.at(-1)));}
async function api(route,body,method=body===undefined?'GET':'POST'){
 const response=await fetch('http://127.0.0.1:5000/api'+route,{method,headers:{'Content-Type':'application/json',...(account?{Authorization:'Bearer '+account.token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(240000)});const data=await response.json();if(!response.ok)throw new Error(`${response.status}: ${data.error}`);return data;
}
async function click(text){for(const b of await page.$$('button'))if((await b.evaluate(n=>n.textContent)).trim().includes(text)){await b.click();return;}throw new Error('Missing button '+text);}
try{
 const registered=await api('/auth/register',{email:`${runId}@example.com`,password:crypto.randomBytes(24).toString('base64url'),name:'Temporary voice test',specialization:'CS_SOFTWARE'});account={...registered.user,token:registered.token};
 session=(await api('/interview/sessions',{type:'technical',topics:['Database indexing'],plannedDuration:10,consent:{camera:true,microphone:true}})).session;
 session=(await api(`/interview/sessions/${session.id}/questions`,{})).session;
 browser=await puppeteer.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream',`--use-file-for-fake-audio-capture=${path.resolve('../work/interview-test-speech.wav')}`]});
 page=await browser.newPage();
 await page.evaluateOnNewDocument(account=>{
  localStorage.setItem('token',account.token);localStorage.setItem('user',JSON.stringify({id:account.id,name:account.name,role:'USER'}));window.qaStreams=[];
  const capture=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async c=>{const stream=await capture(c);window.qaStreams.push(stream);return stream;};
  Object.defineProperty(window,'SpeechRecognition',{value:undefined});Object.defineProperty(window,'webkitSpeechRecognition',{value:undefined});Object.defineProperty(window,'speechSynthesis',{value:undefined});
 },account);
 page.on('response',async response=>{const m=new URL(response.url()).pathname.match(/\/analysis\/(face|voice|transcribe)$/);if(m){const data=await response.json().catch(()=>({}));responses.push({modality:m[1],status:response.status(),result:data.result,error:data.error});save();console.log('MODEL_RESPONSE',m[1],response.status());}});
 await page.goto(`http://127.0.0.1:5173/interview/session/${session.id}`,{waitUntil:'networkidle0'});
 await check('Synthetic camera and speech capture start in the real interview UI',async()=>{
  await page.waitForFunction(()=>document.querySelector('video')?.videoWidth>0&&window.qaStreams.some(s=>s.getAudioTracks().some(t=>t.readyState==='live')),{timeout:30000});
  return {camera:true,microphone:true,realApiSession:true};
 });
 await new Promise(r=>setTimeout(r,11000));
 await page.click('button[title="Turn off camera"]');await page.click('button[title="Mute microphone"]');
 await check('Recorded synthetic speech reaches deployed transcription and fills the answer editor',async()=>{
  await page.waitForFunction(()=>/index|database/i.test(document.querySelector('textarea')?.value||''),{timeout:240000});
  const transcript=await page.$eval('textarea',n=>n.value);const words=['index','database','reads','storage','writes','query'];const matched=words.filter(w=>transcript.toLowerCase().includes(w));assert.ok(matched.length>=4,`Insufficient phrase agreement: ${transcript}`);return {transcript,matchedKeywords:matched};
 });
 await check('Recorded speech receives a real voice model response',async()=>{
  const deadline=Date.now()+150000;while(!responses.some(r=>r.modality==='voice')&&Date.now()<deadline)await new Promise(r=>setTimeout(r,500));
  const voice=responses.find(r=>r.modality==='voice');assert.ok(voice,'Voice request did not finish');assert.equal(voice.status,200,voice.error);assert.equal(voice.result.source,'ml');assert.equal(voice.result.success,true);return {emotion:voice.result.emotion,confidence:voice.result.confidence};
 });
 await check('Valid camera frame reaches deployed face analysis without a fake identity match',async()=>{
  const deadline=Date.now()+150000;while(!responses.some(r=>r.modality==='face')&&Date.now()<deadline)await new Promise(r=>setTimeout(r,500));
  const face=responses.find(r=>r.modality==='face');assert.ok(face,'Face request did not finish');assert.equal(face.status,200,face.error);const capabilities=await api('/interview/capabilities');assert.equal(capabilities.proctoring,false);return {result:face.result,identityVerificationAvailable:false};
 });
 await check('Transcribed answer saves to the real database on Next',async()=>{
  await click('Next Question');await page.waitForFunction(()=>document.body.textContent.includes('Question 2 of'),{timeout:300000});
  const saved=(await api(`/interview/sessions/${session.id}`)).session;assert.match(saved.questions[0].answerText,/index|database/i);return {savedAnswer:saved.questions[0].answerText};
 });
 await check('Early finish evaluates the spoken answer and releases all media',async()=>{
  await click('Leave');await click('End interview');await page.waitForFunction(()=>document.body.textContent.includes('Interview performance report'),{timeout:300000});
  const saved=(await api(`/interview/sessions/${session.id}`)).session;assert.equal(saved.status,'completed');assert.equal(typeof saved.feedback.overallScore,'number');assert.equal(await page.evaluate(()=>window.qaStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))),true);return {status:saved.status,answerScore:saved.feedback.overallScore,allTracksEnded:true};
 });
}catch(e){results.push({name:'Live voice runner',status:'FAILED',message:e.message});}
finally{
 if(browser)await browser.close();
 await check('Delete only the temporary interview test account and owned records',async()=>{if(account){assert.ok(await db.user.findFirst({where:{id:account.id,email:account.email}}));await db.user.delete({where:{id:account.id,email:account.email}});assert.equal(await db.user.count({where:{id:account.id}}),0);}return {removed:true};});
 save();await db.$disconnect();const failed=results.filter(r=>r.status==='FAILED').length;console.log(JSON.stringify({total:results.length,failed}));process.exitCode=failed?1:0;
}
