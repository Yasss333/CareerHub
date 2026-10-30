import test from 'node:test';
import assert from 'node:assert/strict';
import {currentAccount, isSeedKeyAuthorized} from './current-account.js';
test('deleted and malformed accounts do not authenticate', async () => {
  const db = {user: {findUnique: async () => null}};
  for (const token of [null, {}, {id: ''}, {id: 1}, {id: 'deleted', role: 'ADMIN'}]) assert.equal(await currentAccount(db, token), null);
});
test('current database role overrides an old ADMIN JWT claim', async () => {
  const db = {user: {findUnique: async ({where, select}) => {assert.equal(where.id, 'account'); assert.equal(select.passwordHash, undefined); return {id: 'account', role: 'USER'};}}};
  assert.equal((await currentAccount(db, {id: 'account', role: 'ADMIN'})).role, 'USER');
});
test('manual database seed requires a separate explicit strong secret, with no known default', () => {
  assert.equal(isSeedKeyAuthorized('careerhub-seed-now', undefined), false);
  assert.equal(isSeedKeyAuthorized('careerhub-seed-now', 'careerhub-seed-now'), false);
  assert.equal(isSeedKeyAuthorized('x'.repeat(32), 'y'.repeat(32)), false);
  assert.equal(isSeedKeyAuthorized('x'.repeat(32), 'x'.repeat(32)), true);
});
