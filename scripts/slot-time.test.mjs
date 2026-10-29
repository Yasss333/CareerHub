import test from 'node:test';
import assert from 'node:assert/strict';
import { slotDateTime } from '../packages/shared/src/utils/slot-time.js';

test('slot time uses its own timezone regardless of the machine timezone',()=>{
  assert.equal(slotDateTime('2026-11-05','10:00','UTC').toISOString(),'2026-11-05T10:00:00.000Z');
  assert.equal(slotDateTime('2026-11-05T00:00:00.000Z','10:00','Asia/Kolkata').toISOString(),'2026-11-05T04:30:00.000Z');
  assert.equal(slotDateTime('2026-07-05','10:00','America/New_York').toISOString(),'2026-07-05T14:00:00.000Z');
  assert.equal(slotDateTime('2026-12-05','10:00','America/New_York').toISOString(),'2026-12-05T15:00:00.000Z');
});
test('invalid calendar values, times, and timezones fail before persistence',()=>{
  for(const args of [['2026-02-30','10:00','UTC'],['invalid','10:00','UTC'],['2026-11-05','27:00','UTC'],['2026-11-05','10:00','Unknown/Place']])assert.throws(()=>slotDateTime(...args));
});
test('daylight-saving gaps and ambiguous clocks are rejected',()=>{
  assert.throws(()=>slotDateTime('2026-03-08','02:30','America/New_York'));
  assert.throws(()=>slotDateTime('2026-11-01','01:30','America/New_York'));
});
