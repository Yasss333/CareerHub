import test from 'node:test';
import assert from 'node:assert/strict';
import { mentorRegistrationState, mentorApplicationState, canManageMentorFeatures } from './mentor-approval.service.js';

test('requesting a mentor account creates a pending user without mentor access', () => {
  assert.deepEqual(mentorRegistrationState(true), { role: 'USER', isAlumniMentor: false, mentorApprovalStatus: 'PENDING' });
});
test('regular signup does not grant privileged roles', () => {
  assert.deepEqual(mentorRegistrationState(false), { role: 'USER', isAlumniMentor: false, mentorApprovalStatus: 'NONE' });
});
for (const status of ['NONE', 'PENDING', 'REJECTED']) {
  test(`profile submission from ${status} remains unapproved`, () => {
    assert.deepEqual(mentorApplicationState({ role: 'USER', isAlumniMentor: false, mentorApprovalStatus: status }), { role: 'USER', isAlumniMentor: false, mentorApprovalStatus: 'PENDING' });
  });
}
test('an approved mentor retains approval while editing their profile', () => {
  assert.deepEqual(mentorApplicationState({ role: 'MENTOR', isAlumniMentor: true, mentorApprovalStatus: 'APPROVED' }), { role: 'MENTOR', isAlumniMentor: true, mentorApprovalStatus: 'APPROVED' });
});
test('a profile update cannot demote an administrator', () => {
  assert.equal(mentorApplicationState({ role: 'ADMIN', isAlumniMentor: false, mentorApprovalStatus: 'NONE' }).role, 'ADMIN');
});
test('stale mentor flags or a mentor role alone cannot bypass approval', () => {
  assert.equal(canManageMentorFeatures({ role: 'MENTOR', isAlumniMentor: true, mentorApprovalStatus: 'PENDING' }), false);
  assert.equal(canManageMentorFeatures({ role: 'MENTOR', isAlumniMentor: false, mentorApprovalStatus: 'APPROVED' }), false);
  assert.equal(canManageMentorFeatures({ role: 'USER', isAlumniMentor: true, mentorApprovalStatus: 'REJECTED' }), false);
  assert.equal(canManageMentorFeatures({ role: 'MENTOR', isAlumniMentor: true, mentorApprovalStatus: 'APPROVED' }), true);
  assert.equal(canManageMentorFeatures({ role: 'ADMIN' }), true);
});
