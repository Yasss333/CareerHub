// Runs against a uniquely named, isolated schema. Never alters production user/report rows.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client';
import {createFeedbackRouter} from '../apps/api/src/routes/feedback.routes.js';
dotenv.config({path:'apps/api/.env',quiet:true});
const schema='feedback_qa_'+crypto.randomBytes(6).toString('hex');
assert.match(schema,/^feedback_qa_[a-f0-9]{12}$/);
const root=new PrismaClient();const connection=new URL(process.env.DATABASE_URL);connection.searchParams.set('schema',schema);
const db=new PrismaClient({datasources:{db:{url:connection.href}}});let server,created=false;
try{
 await root.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);created=true;
 await root.$executeRawUnsafe(`CREATE TABLE "${schema}"."User" ("id" TEXT PRIMARY KEY, "role" TEXT NOT NULL, "name" TEXT, "email" TEXT NOT NULL)`);
 const sql=fs.readFileSync('apps/api/prisma/migrations/20261030090000_add_feedback_reports/migration.sql','utf8').replaceAll('"FeedbackReport"',`"${schema}"."FeedbackReport"`).replaceAll('"User"',`"${schema}"."User"`);
 for(const statement of sql.split(';').filter(s=>s.trim()))await root.$executeRawUnsafe(statement);
 for(const [id,role] of [['qa-user','USER'],['qa-admin','ADMIN'],['qa-other','USER']])await root.$executeRawUnsafe(`INSERT INTO "${schema}"."User" ("id","role","name","email") VALUES ($1,$2,$3,$4)`,id,role,id,id+'@example.com');
 const app=express();app.use(express.json());app.use('/api/feedback',createFeedbackRouter({database:db}));server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const send=async(user,body,method=body?'POST':'GET',suffix='')=>{const r=await fetch(`http://127.0.0.1:${server.address().port}/api/feedback${suffix}`,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt.sign({id:user},process.env.JWT_SECRET||'careerhub-super-secret-jwt-key-2024')},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
 const body={requestId:crypto.randomUUID(),kind:'bug',title:'Isolated database report',description:'Verify that JSON reports survive persistence and retry.',context:{path:'/interview/results/qa?secret=excluded',browser:'Database QA',viewport:{width:390,height:844}}};
 const first=await send('qa-user',body);assert.equal(first.status,201);const second=await send('qa-user',body);assert.equal(second.status,200);assert.equal(await db.feedbackReport.count(),1);
 assert.equal((await send('qa-other')).data.reports.length,0);assert.equal((await send('qa-admin',undefined,'GET','?scope=all')).data.reports.length,1);
 const updated=await send('qa-admin',{status:'RESOLVED',resolutionNote:'Verified with isolated real PostgreSQL persistence.'},'PATCH','/'+first.data.report.id);assert.equal(updated.status,200);
 assert.equal((await send('qa-user')).data.reports[0].status,'RESOLVED');assert.equal((await db.feedbackReport.findUnique({where:{id:first.data.report.id}})).payload.context.path,'/interview/results/qa');
 // Verify pagination against >1 page of real JSON rows, with status filtering.
 await db.feedbackReport.createMany({data:Array.from({length:31},(_,i)=>({userId:'qa-user',requestId:crypto.randomUUID(),payload:{...first.data.report.payload,title:'Pagination report '+i}}))});
 const page1=await send('qa-user');assert.equal(page1.data.reports.length,30);assert.ok(page1.data.nextCursor);
 const page2=await send('qa-user',undefined,'GET','?cursor='+page1.data.nextCursor);assert.equal(page2.data.reports.length,2);assert.equal(page2.data.nextCursor,null);assert.equal(new Set([...page1.data.reports,...page2.data.reports].map(r=>r.id)).size,32);
 assert.equal((await send('qa-user',undefined,'GET','?status=RESOLVED')).data.reports.length,1);
 console.log('PASS: additive migration, JSON persistence, retry deduplication, ownership, admin update, status filtering and pagination in an isolated schema.');
}finally{
 if(server)await new Promise(r=>server.close(r));await db.$disconnect();
 if(created){assert.match(schema,/^feedback_qa_[a-f0-9]{12}$/);const tables=await root.$queryRawUnsafe('SELECT table_name FROM information_schema.tables WHERE table_schema = $1',schema);assert.ok(tables.every(t=>['User','FeedbackReport'].includes(t.table_name)));await root.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);console.log('Isolated QA schema removed; production rows were not used.');}
 await root.$disconnect();
}
