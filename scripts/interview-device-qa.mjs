import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const simulated=process.argv.includes('--simulated');
const recognitionFixture=process.argv.includes('--recognition-fixture');
const mode=simulated?'simulated':'physical';
const results=[];let browser,page;
const report=path.resolve(`../work/interview-${mode}-devices.json`);
async function check(name,fn){try{const evidence=await fn();results.push({name,status:'PASSED',evidence});}catch(e){results.push({name,status:'FAILED',message:e.message});}fs.writeFileSync(report,JSON.stringify({mode,results},null,2));console.log(JSON.stringify(results.at(-1)));}
const session={id:'device-fixture',type:'technical',role:'Engineer',topics:['Databases'],difficulty:'medium',plannedDuration:10,status:'in_progress',startedAt:new Date().toISOString(),cameraEnabled:true,microphoneEnabled:true,questions:[{id:'device-question',questionText:'Explain the benefits and costs of a database index.',questionIndex:0,answerText:null}],emotionResults:[],proctoringEvents:[]};
try{
 if(!simulated&&fs.existsSync('../work/interview-physical-go.json'))fs.unlinkSync('../work/interview-physical-go.json');
 browser=await puppeteer.launch({headless:true,ignoreDefaultArgs:['--mute-audio'],executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',args:['--use-fake-ui-for-media-stream',...(simulated?['--use-fake-device-for-media-stream',`--use-file-for-fake-audio-capture=${path.resolve('../work/interview-test-speech.wav')}`]:[])]});
 page=await browser.newPage();await page.setViewport({width:1440,height:1000});
 await browser.defaultBrowserContext().overridePermissions('http://127.0.0.1:5173',['camera','microphone']);
 await page.evaluateOnNewDocument(recognitionFixture=>{
   localStorage.setItem('token','device-test-fixture');localStorage.setItem('user',JSON.stringify({id:'device-fixture-user',name:'Device test',role:'USER'}));
   window.qaStreams=[];window.qaRecorders=[];window.qaErrors=[];
   const capture=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
   navigator.mediaDevices.getUserMedia=async constraints=>{try{const stream=await capture(constraints);window.qaStreams.push(stream);return stream;}catch(e){window.qaErrors.push({name:e.name,kind:constraints.video?'video':'audio'});throw e;}};
   const Recorder=window.MediaRecorder;
   window.MediaRecorder=class extends Recorder{constructor(...args){super(...args);window.qaRecorders.push(this);}};
   window.qaSpeech=window.speechSynthesis;Object.defineProperty(window,'speechSynthesis',{configurable:true,value:undefined});
   Object.defineProperty(window,'SpeechRecognition',{configurable:true,value:undefined});Object.defineProperty(window,'webkitSpeechRecognition',{configurable:true,value:undefined});
   if(recognitionFixture)window.SpeechRecognition=class {constructor(){window.qaRecognition=this;}start(){}stop(){}abort(){this.onend?.();}};
 },recognitionFixture);
 await page.setRequestInterception(true);let transcriptions=0;
 page.on('request',async request=>{
   const url=new URL(request.url());if(!url.pathname.startsWith('/api/'))return request.continue();
   let data={};let status=200;
   if(url.pathname.endsWith('/capabilities'))data={available:false,face:false,voice:false,text:false,transcription:false,proctoring:false};
   else if(url.pathname.endsWith('/analysis/transcribe')){transcriptions++;data={result:{success:true,text:'Fixture transcription only'}};}
   else if(url.pathname.endsWith('/answer')){session.questions[0].answerText=JSON.parse(request.postData()).answerText;data={question:session.questions[0]};}
   else if(url.pathname.endsWith('/evaluate')){session.status='completed';session.feedback={overallScore:50,overallFeedback:'Fixture evaluation'};data={session};}
   else if(url.pathname.startsWith('/api/interview/sessions/'))data={session};
   else if(url.pathname==='/api/interview/sessions')data={sessions:[session]};
   else if(url.pathname.endsWith('/notifications/count'))data={unreadCount:0};
   else if(url.pathname.includes('/connect/'))data=[];
   await request.respond({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:5173/interview/session/device-fixture',{waitUntil:'networkidle0'});
 await check('Camera preview renders frames from the selected device',async()=>{
   await page.waitForFunction(()=>[...document.querySelectorAll('video')].some(v=>v.videoWidth>0&&v.readyState>=2),{timeout:30000});
   return page.evaluate(()=>{const v=[...document.querySelectorAll('video')].find(v=>v.videoWidth>0);return {width:v.videoWidth,height:v.videoHeight,live:v.srcObject.getVideoTracks()[0].readyState==='live'};});
 });
 await check('Microphone creates a live recording stream',async()=>{
   await page.waitForFunction(()=>window.qaRecorders.some(r=>r.state==='recording'),{timeout:20000});
   return page.evaluate(()=>({recorders:window.qaRecorders.length,audioTracks:window.qaStreams.flatMap(s=>s.getAudioTracks()).filter(t=>t.readyState==='live').length}));
 });
 if(!simulated&&await page.evaluate(()=>window.qaStreams.some(s=>s.getAudioTracks().some(t=>t.readyState==='live')))){
   fs.writeFileSync('../work/interview-physical-ready.json',JSON.stringify({ready:true}));console.log('READY_FOR_MICROPHONE_CHECK');
   const deadline=Date.now()+90000;while(!fs.existsSync('../work/interview-physical-go.json')&&Date.now()<deadline)await new Promise(r=>setTimeout(r,250));
 }
 await check('Microphone receives non-silent sound over eight seconds',async()=>{
   const evidence=await page.evaluate(async()=>{
     const stream=window.qaStreams.find(s=>s.getAudioTracks().some(t=>t.readyState==='live'));if(!stream)throw new Error('No live microphone');
     const context=new AudioContext();await context.resume();const source=context.createMediaStreamSource(stream),analyser=context.createAnalyser();analyser.fftSize=2048;source.connect(analyser);let maxRms=0,activeFrames=0;
     for(let i=0;i<80;i++){const values=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(values);const rms=Math.sqrt(values.reduce((n,v)=>n+v*v,0)/values.length);maxRms=Math.max(maxRms,rms);if(rms>0.005)activeFrames++;await new Promise(r=>setTimeout(r,100));}
     source.disconnect();await context.close();return {maxRms,activeFrames,samples:80};
   });assert.ok(evidence.maxRms>0.005,'No audible microphone signal detected');return evidence;
 });
 await check('Camera off releases its tracks; camera on restores preview',async()=>{
   await page.click('button[title="Turn off camera"]');await page.waitForFunction(()=>window.qaStreams.flatMap(s=>s.getVideoTracks()).every(t=>t.readyState==='ended'));
   console.log('CAMERA_OFF_CONFIRMED');
   await page.click('button[title="Turn on camera"]');await page.waitForFunction(()=>[...document.querySelectorAll('video')].some(v=>v.videoWidth>0&&v.srcObject?.getVideoTracks().some(t=>t.readyState==='live')));return {offReleased:true,onRestored:true};
 });
 await check('Mute releases microphone tracks; unmute starts a new recorder',async()=>{
   await page.click('button[title="Mute microphone"]');await page.waitForFunction(()=>window.qaStreams.flatMap(s=>s.getAudioTracks()).every(t=>t.readyState==='ended'));
   await page.click('button[title="Unmute microphone"]');await page.waitForFunction(()=>window.qaRecorders.some(r=>r.state==='recording'));return {mutedReleased:true,unmutedRecording:true,fixtureTranscriptions:transcriptions};
 });
 await check('Replay uses the actual browser speech engine and completes or reports its engine error',async()=>{
   await page.evaluate(()=>{Object.defineProperty(window,'speechSynthesis',{configurable:true,value:window.qaSpeech});window.qaSpeechEvents=[];const original=window.qaSpeech.speak.bind(window.qaSpeech);window.qaSpeech.speak=utterance=>{for(const event of ['start','end','error'])utterance.addEventListener(event,e=>window.qaSpeechEvents.push({event,error:e.error,recorders:window.qaRecorders.map(r=>r.state)}));original(utterance);};});
   await page.click('button[title="Repeat Question Aloud"]');await page.waitForFunction(()=>window.qaSpeechEvents.some(e=>e.event==='end'||e.event==='error'),{timeout:30000});
   const events=await page.evaluate(()=>({voices:window.qaSpeech.getVoices().length,events:window.qaSpeechEvents}));assert.ok(events.events.some(e=>e.event==='start')&&events.events.some(e=>e.event==='end'),JSON.stringify(events));assert.ok(events.events.find(e=>e.event==='start').recorders.every(s=>s!=='recording'),'question playback must pause answer recording');await page.waitForFunction(()=>window.qaRecorders.some(r=>r.state==='recording'));return events;
 });
 if(recognitionFixture){
  await check('Browser-recognition interim/final events update editable transcript (controlled events)',async()=>{
    if(!await page.$('textarea'))await page.click('button[title="Toggle Text Editor"]');
    await page.evaluate(()=>{window.qaRecognition.onresult({resultIndex:0,results:[Object.assign([{transcript:'A partial spoken answer'}],{isFinal:false})]});});
    await page.waitForFunction(()=>document.querySelector('textarea')?.value==='A partial spoken answer');
    await page.evaluate(()=>{window.qaRecognition.onresult({resultIndex:0,results:[Object.assign([{transcript:'A complete spoken answer'}],{isFinal:true})]});});
    await page.waitForFunction(()=>document.querySelector('textarea')?.value==='A complete spoken answer');return {controlledRecognitionEvents:true};
  });
  await check('Browser-recognition error switches to recording/transcription fallback',async()=>{
    await page.evaluate(()=>window.qaRecognition.onerror({error:'network'}));await page.waitForFunction(()=>document.body.textContent.includes('Live browser transcription is unavailable'));
    await page.click('button[title="Mute microphone"]');await page.waitForFunction(()=>document.querySelector('textarea')?.value.includes('Fixture transcription only'));return {fallback:true};
  });
 }
 await check('Leaving the session releases every camera/microphone stream',async()=>{
   await page.click('a[href="/interview"]');await page.waitForFunction(()=>location.pathname==='/interview'&&window.qaStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended')));
   return page.evaluate(()=>({allTracksEnded:window.qaStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended')),tracks:window.qaStreams.flatMap(s=>s.getTracks()).length}));
 });
 console.log('DEVICE_ERRORS',JSON.stringify(await page.evaluate(()=>window.qaErrors)));
}catch(e){results.push({name:'Device runner',status:'FAILED',message:e.message});}
finally{if(browser)await browser.close();fs.writeFileSync(report,JSON.stringify({mode,results},null,2));const failed=results.filter(r=>r.status==='FAILED').length;console.log(JSON.stringify({mode,total:results.length,failed}));process.exitCode=failed?1:0;}
