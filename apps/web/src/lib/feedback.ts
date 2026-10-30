import {api, type ApiOptions} from './api'

async function feedbackRequest<T>(path: string, options: ApiOptions = {}) {
  try { return await api<T>(path, {...options, signal: AbortSignal.timeout(60000)}) }
  catch (error) {
    if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) throw new Error('The request timed out. Please retry; submitting the same draft will not create a duplicate.')
    if (error instanceof TypeError) throw new Error('Could not connect. Check your connection and retry; your draft is kept.')
    throw error
  }
}

export interface FeedbackPayload {
  schemaVersion?: number
  kind: 'bug' | 'suggestion'
  title: string
  description: string
  steps: string
  expected: string
  actual: string
  context: {path: string; module?: string; browser: string; viewport: {width: number; height: number}}
}
export interface FeedbackReport {
  id: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  payload: FeedbackPayload
  resolutionNote: string
  createdAt: string
  updatedAt: string
  user?: {name: string | null; email: string}
}
export const feedbackLabels = {OPEN: 'Open', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved'}
export const createFeedback = (requestId: string, payload: FeedbackPayload) => feedbackRequest<{report: FeedbackReport}>('/feedback', {method: 'POST', body: {requestId, ...payload}})
export const listFeedback = (scope: 'mine' | 'all', status = '', cursor = '') => feedbackRequest<{reports: FeedbackReport[]; nextCursor: string | null}>(`/feedback?${new URLSearchParams({scope, ...(status ? {status} : {}), ...(cursor ? {cursor} : {})})}`)
export const updateFeedback = (id: string, status: FeedbackReport['status'], resolutionNote: string) => feedbackRequest<{report: FeedbackReport}>(`/feedback/${id}`, {method: 'PATCH', body: {status, resolutionNote}})
