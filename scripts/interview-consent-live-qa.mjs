import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client';
dotenv.config({path:'apps/api/.env',quiet:true});
const db=new PrismaClient(),results=[];let account;
async function request(route,body,method=body===undefined?'GET':'POST'){
 const response=await fetch('http://127.0.0.1:5000/api'+route,{method,headers:{'Content-Type':'application/json',...(account?{Authorization:'Bearer '+account.token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
 return {status:response.status,data:await response.json()};
}
try{
 const registered=await request('/auth/register',{email:`consent-qa-${Date.now()}@example.com`,password:crypto.randomBytes(24).toString('base64url'),specialization:'CS_SOFTWARE',name:'Temporary consent QA'});assert.equal(registered.status,201);account={...registered.data.user,token:registered.data.token};
 const created=await request('/interview/sessions',{topics:['Testing'],consent:{camera:false,microphone:false}});assert.equal(created.status,201);const id=created.data.session.id;
 for(const device of ['camera','microphone']){
  const granted=await request(`/interview/sessions/${id}/consent`,{[device]:true},'PATCH');assert.equal(granted.status,200,granted.data.error);assert.equal(granted.data.session[device+'Enabled'],true);assert.ok(granted.data.session[device+'ConsentAt']);
  const loaded=await request(`/interview/sessions/${id}`);assert.equal(loaded.data.session[device+'Enabled'],true);assert.ok(loaded.data.session[device+'ConsentAt']);results.push({name:`${device} consent persists through API reload`,status:'PASSED'});
 }
 assert.equal((await request(`/interview/sessions/${id}`,{status:'abandoned'},'PATCH')).status,200);
 assert.equal((await request(`/interview/sessions/${id}/consent`,{camera:true},'PATCH')).status,409);results.push({name:'Closed session rejects new consent',status:'PASSED'});
}catch(e){results.push({name:'Live consent flow',status:'FAILED',message:e.message});}
finally{
 try{if(account){assert.ok(await db.user.findFirst({where:{id:account.id,email:account.email}}));await db.user.delete({where:{id:account.id,email:account.email}});assert.equal(await db.user.count({where:{id:account.id}}),0);}results.push({name:'Temporary account and interview cleanup',status:'PASSED'});}catch(e){results.push({name:'Cleanup',status:'FAILED',message:e.message});}
 await db.$disconnect();fs.writeFileSync('../work/interview-consent-live-results.json',JSON.stringify({results},null,2));console.log(JSON.stringify(results));process.exitCode=results.some(r=>r.status==='FAILED')?1:0;
}
