import { api } from './api'

export interface InterviewQuestion {
  id: string
  questionText: string
  questionIndex: number
  category: string | null
  questionType?: string | null
  topic?: string | null
  difficulty?: string | null
  answerText: string | null
  answeredAt: string | null
  questionFeedback?: {
    score?: number
    feedback?: string
    strengths?: string[]
    improvements?: string[]
    missedPoints?: string[]
  } | null
}

export interface InterviewSession {
  id: string
  type: string
  topics: string[]
  role: string | null
  experienceLevel: string | null
  difficulty: string
  plannedDuration: number
  status: string
  startedAt: string
  createdAt: string
  endedAt: string | null
  durationSeconds: number | null
  feedback: {
    overallScore?: number
    overallFeedback?: string
    strengths?: string[]
    areasToImprove?: string[]
  } | null
  cameraEnabled: boolean
  microphoneEnabled: boolean
  questions?: InterviewQuestion[]
  emotionResults?: Array<{ id: string; modality: string; result: Record<string, unknown>; createdAt: string }>
  proctoringEvents?: Array<{ id: string; eventType: string; severity: string; createdAt: string }>
}

export const getInterview = (id: string) => api<{ session: InterviewSession }>(`/interview/sessions/${id}`)
export const listInterviews = () => api<{ sessions: InterviewSession[] }>('/interview/sessions')
export const generateInterviewQuestions = (id: string) => api<{ session: InterviewSession }>(`/interview/sessions/${id}/questions`, { method: 'POST', body: {} })
export const saveInterviewAnswer = (id: string, answerText: string) => api<{ question: InterviewQuestion }>(`/interview/questions/${id}/answer`, { method: 'PUT', body: { answerText } })
export const evaluateInterview = (id: string) => api<{ session: InterviewSession }>(`/interview/sessions/${id}/evaluate`, { method: 'POST', body: {} })

export async function analyzeInterviewMedia(id: string, modality: string, media: Blob | Record<string, unknown>, filename = 'capture.bin') {
  if (media instanceof Blob) {
    const form = new FormData()
    form.set('media', media, filename)
    return api<{ result: Record<string, unknown> }>(`/interview/sessions/${id}/analysis/${modality}`, { method: 'POST', body: form })
  }
  return api<{ result: Record<string, unknown> }>(`/interview/sessions/${id}/analysis/${modality}`, { method: 'POST', body: media })
}

export const saveProctorEvent = (id: string, eventType: string, severity = 'info') => api(`/interview/sessions/${id}/proctor-events`, { method: 'POST', body: { eventType, severity } })
