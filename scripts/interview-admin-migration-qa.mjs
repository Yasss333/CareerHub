import '../apps/api/src/load-env.js';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {PrismaClient} from '@prisma/client';
const schema = 'interview_admin_qa_' + crypto.randomBytes(6).toString('hex');
assert.match(schema, /^interview_admin_qa_[a-f0-9]{12}$/);
const root = new PrismaClient(); let created = false;
try {
  await root.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`); created = true;
  await root.$executeRawUnsafe(`CREATE TABLE "${schema}"."User" ("id" TEXT PRIMARY KEY)`);
  await root.$executeRawUnsafe(`CREATE TABLE "${schema}"."InterviewSession" ("id" TEXT PRIMARY KEY)`);
  await root.$executeRawUnsafe(`INSERT INTO "${schema}"."InterviewSession" ("id") VALUES ('existing-session')`);
  const sql = fs.readFileSync('apps/api/prisma/migrations/20261030110000_interview_preflight_admin/migration.sql', 'utf8').replaceAll('"InterviewSession"', `"${schema}"."InterviewSession"`).replaceAll('"AdminAudit"', `"${schema}"."AdminAudit"`).replaceAll('"User"', `"${schema}"."User"`);
  for (const statement of sql.split(';').filter(s => s.trim())) await root.$executeRawUnsafe(statement);
  const [row] = await root.$queryRawUnsafe(`SELECT * FROM "${schema}"."InterviewSession" WHERE "id"='existing-session'`);
  assert.equal(row.monitoringMode, 'practice'); assert.equal(row.introductionRequired, false); assert.equal(row.candidateIntroduction, null);
  await root.$executeRawUnsafe(`INSERT INTO "${schema}"."User" VALUES ('fixture-admin')`);
  await root.$executeRawUnsafe(`INSERT INTO "${schema}"."AdminAudit" ("id","actorId","action","targetId") VALUES ('audit','fixture-admin','mentor.removed','fixture-mentor')`);
  await root.$executeRawUnsafe(`DELETE FROM "${schema}"."User" WHERE "id"='fixture-admin'`);
  const [audit] = await root.$queryRawUnsafe(`SELECT * FROM "${schema}"."AdminAudit"`); assert.equal(audit.actorId, null);
  console.log('PASS: additive migration preserves existing sessions; audit survives actor deletion.');
} finally {
  if (created) {
    assert.match(schema, /^interview_admin_qa_[a-f0-9]{12}$/);
    const tables = await root.$queryRawUnsafe('SELECT table_name FROM information_schema.tables WHERE table_schema=$1', schema);
    assert.ok(tables.every(t => ['User', 'InterviewSession', 'AdminAudit'].includes(t.table_name)));
    await root.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
  }
  await root.$disconnect();
}
