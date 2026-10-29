interface AnalysisHistory {
  emotionResults?: Array<{ modality: string; result: Record<string, unknown> }>
  proctoringEvents?: Array<{ eventType: string; details?: Record<string, unknown> }>
}

export function summarizeInterviewAnalysis(session: AnalysisHistory) {
  const latest = (modality: string) => (session.emotionResults || [])
    .filter((item) => item.modality === modality && item.result.source === 'ml' && item.result.success === true)
    .at(-1)?.result || null
  const verificationLabels: Record<string, string> = {
    face_registered: 'Baseline registered', face_verified: 'Last check matched', face_no_face: 'No face detected',
    face_multiple_faces: 'Multiple faces detected', face_unauthorized_face: 'Candidate mismatch',
  }
  const lastCheck = (session.proctoringEvents || []).filter((event) => event.details?.source === 'ml' && verificationLabels[event.eventType]).at(-1)
  return {
    face: latest('face'), voice: latest('voice'), text: latest('text'), fusion: latest('fusion'),
    verification: lastCheck ? verificationLabels[lastCheck.eventType] : 'Not verified',
  }
}
