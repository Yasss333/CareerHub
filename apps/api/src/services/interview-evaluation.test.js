import test from 'node:test';
import assert from 'node:assert/strict';
import { validateInterviewEvaluation, getInterviewAnswerScore } from './interview-evaluation.js';

const valid = { overallScore: 0, overallFeedback: 'No relevant evidence.', questionEvaluations: [{ questionId: 'q1', score: 0, feedback: 'Explain the tradeoffs.' }] };

test('a real zero score is retained', () => assert.equal(validateInterviewEvaluation(valid, [{ id: 'q1' }]).overallScore, 0));
test('every answered question needs real feedback', () => assert.throws(() => validateInterviewEvaluation(valid, [{ id: 'q1' }, { id: 'q2' }])));
test('invalid scores do not silently become zero or get clamped', () => {
  for (const value of [null, '', '90', -1, 101, NaN]) assert.throws(() => validateInterviewEvaluation({ ...valid, overallScore: value }, [{ id: 'q1' }]));
});
test('duplicate question feedback cannot complete evaluation', () => assert.throws(() => validateInterviewEvaluation({ ...valid, questionEvaluations: [valid.questionEvaluations[0], valid.questionEvaluations[0]] }, [{ id: 'q1' }])));

test('dashboard scoring includes an evaluated zero and excludes absent or behavioral scores', () => {
  assert.equal(getInterviewAnswerScore({ overallScore: 0 }), 0);
  assert.equal(getInterviewAnswerScore(null), null);
  assert.equal(getInterviewAnswerScore({ behavioral_metrics: { confidence: 90 } }), null);
  assert.equal(getInterviewAnswerScore({ overallScore: 101 }), null);
});
