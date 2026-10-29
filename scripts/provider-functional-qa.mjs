import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import { getLiveKitRoomService } from '../apps/api/src/services/livekit.service.js';
dotenv.config({path:'apps/api/.env',quiet:true});
const db=new PrismaClient(), results=[], accounts=[];
const runId=`provider-qa-${Date.now()}`, password=crypto.randomBytes(24).toString('base64url');
let booking, browser, roomName;
async function api(route,account,body,method=body===undefined?'GET':'POST'){
  const response=await fetch('http://127.0.0.1:5000/api'+route,{method,headers:{'Content-Type':'application/json',...(account?{Authorization:'Bearer '+account.token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
  return {status:response.status,data:await response.json()};
}
function expect(result,code=200){assert.equal(result.status,code,result.data.error);return result.data;}
async function check(name,fn){try{await fn();results.push({module:'Provider integration',name,status:'PASSED'});}catch(e){results.push({module:'Provider integration',name,status:'FAILED',message:e.message});}console.log(results.at(-1).status+' | '+name);}
async function register(label,role='USER'){
  const data=expect(await api('/auth/register',null,{email:`${runId}-${label}@example.com`,password,name:`Provider QA ${label}`,role,...(role==='USER'?{specialization:'CS_SOFTWARE'}:{})}),201);
  const account={...data.user,token:data.token};accounts.push(account);return account;
}
try{
  const student=await register('student'), mentor=await register('mentor','MENTOR'), admin=await register('admin');
  assert.ok(await db.user.findFirst({where:{id:admin.id,email:admin.email}}));
  await db.user.update({where:{id:admin.id},data:{role:'ADMIN'}});
  admin.token=expect(await api('/auth/login',null,{email:admin.email,password,accountType:'ADMIN'})).token;
  expect(await api(`/connect/admin/mentor-applications/${mentor.id}`,admin,{decision:'approve'},'PATCH'));
  mentor.token=expect(await api('/auth/login',null,{email:mentor.email,password,accountType:'MENTOR'})).token;
  await check('ImageKit upload authorization returns a signature without private credentials',async()=>{
    const data=expect(await api('/resume/imagekit-auth',student));assert.equal(typeof data.signature,'string');assert.ok(data.expire>Date.now()/1000);assert.equal(data.privateKey,undefined);
  });
  booking=expect(await api('/connect/sessions',student,{seniorId:mentor.id,scheduledTime:new Date(Date.now()+6*86400000).toISOString(),duration:45,topic:'Temporary provider QA'}),201);
  expect(await api(`/connect/sessions/${booking.id}/status`,mentor,{status:'accepted'},'PUT'));
  let tokens;
  await check('Both participants obtain real LiveKit room tokens',async()=>{
    tokens=await Promise.all([student,mentor].map(async account=>expect(await api(`/connect/sessions/${booking.id}/livekit-token`,account))));
    for(const token of tokens){assert.equal(token.available,true);assert.equal(token.provider,'livekit');assert.ok(token.token&&token.serverUrl);}
    roomName=tokens[0].roomName;assert.equal(roomName,`careerhub-session-${booking.id}`);
  });
  if(tokens?.every(t=>t.available)){
    await check('Forged joined event cannot start a meeting without a verified connection',async()=>{
      expect(await api(`/connect/sessions/${booking.id}/livekit-presence`,student,{event:'joined'}),409);
      assert.equal((await db.sessionBooking.findUnique({where:{id:booking.id}})).status,'accepted');
    });
    await check('Two isolated browser participants connect and receive each other’s synthetic audio/video tracks',async()=>{
      browser=await puppeteer.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
      const pages=[];
      for(const token of tokens){
        const context=await browser.createBrowserContext();const page=await context.newPage();pages.push(page);
        await page.setRequestInterception(true);page.on('request',r=>r.respond({status:200,contentType:'text/html',body:'<!doctype html><title>Temporary meeting test</title>'}));
        await page.goto('http://127.0.0.1:5173/qa-meeting-fixture');
        await page.addScriptTag({path:path.resolve('node_modules/livekit-client/dist/livekit-client.umd.js')});
        await page.evaluate(async token=>{
          window.qaRoom=new window.LivekitClient.Room();window.qaTracks=[];
          window.qaRoom.on(window.LivekitClient.RoomEvent.TrackSubscribed,track=>window.qaTracks.push(track.kind));
          await window.qaRoom.connect(token.serverUrl,token.token,{peerConnectionTimeout:20000,websocketTimeout:20000});
          await window.qaRoom.localParticipant.enableCameraAndMicrophone();
        },token);
      }
      for(const page of pages)await page.waitForFunction(()=>window.qaRoom.remoteParticipants.size===1&&window.qaTracks.includes('audio')&&window.qaTracks.includes('video'),{timeout:45000});
      expect(await api(`/connect/sessions/${booking.id}/livekit-presence`,student,{event:'joined'}));
      expect(await api(`/connect/sessions/${booking.id}/livekit-presence`,mentor,{event:'joined'}));
      assert.equal((await db.sessionBooking.findUnique({where:{id:booking.id}})).status,'started');
      for(const page of pages)await page.evaluate(()=>window.qaRoom.disconnect());
    });
  }
}catch(e){results.push({module:'Provider integration',name:'fixture setup',status:'FAILED',message:e.message});}
finally{
  if(browser)await browser.close();
  await check('Remove only the temporary room, booking and accounts',async()=>{
    if(roomName)await getLiveKitRoomService().deleteRoom(roomName);
    if(booking){assert.ok(accounts.some(a=>a.id===booking.juniorId)&&accounts.some(a=>a.id===booking.seniorId));await db.sessionBooking.deleteMany({where:{id:booking.id,juniorId:booking.juniorId,seniorId:booking.seniorId}});}
    for(const account of accounts){assert.ok(await db.user.findFirst({where:{id:account.id,email:account.email}}));await db.seniorProfile.deleteMany({where:{userId:account.id}});await db.user.delete({where:{id:account.id,email:account.email}});}
    assert.equal(await db.user.count({where:{email:{in:accounts.map(a=>a.email)}}}),0);
  });
  fs.writeFileSync('../work/provider-functional-results.json',JSON.stringify({runId,results},null,2));await db.$disconnect();console.log(JSON.stringify(results));
}
