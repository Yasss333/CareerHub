import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

// Exercise the actual browser helper without adding Node-only tests to the browser tsconfig.
const source = await readFile(new URL('../src/lib/interview-analysis.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { summarizeInterviewAnalysis } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('an empty report does not invent emotions, confidence, or verification', () => {
  const summary = summarizeInterviewAnalysis({ emotionResults: [], proctoringEvents: [] })
  assert.equal(summary.face, null)
  assert.equal(summary.voice, null)
  assert.equal(summary.verification, 'Not verified')
})

test('old unproven predictions are excluded from model evidence', () => {
  const summary = summarizeInterviewAnalysis({ emotionResults: [{ modality: 'face', result: { emotion: 'focused', confidence: 0.88 } }], proctoringEvents: [] })
  assert.equal(summary.face, null)
})

test('real model output and the last verification state drive the report', () => {
  const summary = summarizeInterviewAnalysis({ emotionResults: [{ modality: 'voice', result: { source: 'ml', success: true, emotion: 'neutral', confidence: 0.63 } }], proctoringEvents: [{ eventType: 'face_registered', details: { source: 'ml' } }, { eventType: 'face_unauthorized_face', details: { source: 'ml' } }] })
  assert.equal(summary.voice?.emotion, 'neutral')
  assert.equal(summary.voice?.confidence, 0.63)
  assert.equal(summary.verification, 'Candidate mismatch')
})
