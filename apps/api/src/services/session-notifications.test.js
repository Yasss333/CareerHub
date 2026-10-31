import test from 'node:test';
import assert from 'node:assert/strict';
import {notifyBookingCreated,notifySessionCancelled} from './session-notifications.js';
const session = {id:'booking-a',juniorId:'student',seniorId:'mentor',topic:'API design',scheduledTime:'2026-11-01T12:30:00Z'};
test('booking notifies both participants with an actionable booking id', async () => {
  let notices; await notifyBookingCreated({notification:{createMany:async ({data}) => {notices=data;}}},session);
  assert.deepEqual(notices.map(n=>n.userId),['mentor','student']); assert.ok(notices.every(n=>n.data.bookingId === session.id)); assert.equal(notices[1].type,'session_requested');assert.match(notices[1].message,/01\/11\/2026, 12:30:00 UTC/);
});
test('cancellation notifies the other participant for either actor', async () => {
  for (const actor of ['mentor','student']) {let notice;await notifySessionCancelled({notification:{create:async ({data})=>{notice=data;}}},session,actor);assert.notEqual(notice.userId,actor);assert.equal(notice.type,'session_cancelled');assert.equal(notice.data.bookingId,session.id);}
});
