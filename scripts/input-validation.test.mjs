import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRegistration, parseLogin, validateResumeInput } from '../apps/api/src/services/input-validation.service.js';

const registration = { email: 'qa@example.com', password: 'ValidPass123', specialization: 'CS_SOFTWARE' };
for (const [label, changes] of [
  ['malformed email', { email: 'not-an-email' }], ['missing email', { email: undefined }],
  ['empty password', { password: '' }], ['short password', { password: '123' }], ['non-string password', { password: {} }],
  ['bcrypt-truncated password', { password: 'é'.repeat(40) }], ['non-string name', { name: {} }], ['privileged signup role', { role: 'ADMIN' }],
]) test(`registration rejects ${label}`, () => assert.throws(() => parseRegistration({ ...registration, ...changes }), { status: 400 }));
test('registration normalizes a valid email without changing the password', () => {
  const result = parseRegistration({ ...registration, email: '  QA@Example.com ', name: ' QA ' });
  assert.equal(result.email, 'qa@example.com'); assert.equal(result.password, registration.password); assert.equal(result.name, 'QA');
});
for (const input of [null, [], { email: {}, password: 'x' }, { email: 'qa@example.com', password: {} }]) test(`login rejects malformed input ${JSON.stringify(input)}`, () => assert.throws(() => parseLogin(input), { status: 400 }));
test('login still permits existing accounts with a short but correctly typed password', () => assert.equal(parseLogin({ email: 'QA@example.com', password: '123' }).password, '123'));
for (const [field, value] of [['title', {}], ['skills', 'not-an-array'], ['skills', [{}]], ['personalInfo', []], ['experience', {}], ['public', 'yes']]) test(`resume rejects malformed ${field}`, () => assert.throws(() => validateResumeInput({ [field]: value }), { status: 400 }));
test('multipart resume JSON fields are decoded and validated', () => {
  const input = validateResumeInput({ skills: '["JavaScript"]', personalInfo: '{"name":"QA"}', experience: '[]', public: 'false' });
  assert.deepEqual(input.skills, ['JavaScript']); assert.deepEqual(input.personalInfo, { name: 'QA' }); assert.equal(input.public, false);
});
