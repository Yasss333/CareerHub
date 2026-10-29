const score = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) throw new Error('Invalid evaluation score');
  return Math.round(value);
};
const feedback = (value) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Missing evaluation feedback');
  return value.trim().slice(0, 4000);
};
const list = (value) => Array.isArray(value) ? value.filter((item) => typeof item === 'string').slice(0, 12).map((item) => item.trim().slice(0, 500)).filter(Boolean) : [];

export function getInterviewAnswerScore(feedback) {
  const value = feedback?.overallScore ?? feedback?.overall_score ?? feedback?.score;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

export function validateInterviewEvaluation(value, answered) {
  if (!value || !Array.isArray(value.questionEvaluations)) throw new Error('Invalid evaluation');
  const ids = new Set(answered.map((question) => question.id));
  const seen = new Set();
  const questionEvaluations = value.questionEvaluations.map((item) => {
    if (!item || !ids.has(item.questionId) || seen.has(item.questionId)) throw new Error('Invalid question evaluation');
    seen.add(item.questionId);
    return {
      questionId: item.questionId, score: score(item.score), feedback: feedback(item.feedback),
      strengths: list(item.strengths), improvements: list(item.improvements), missedPoints: list(item.missedPoints),
    };
  });
  if (seen.size !== ids.size) throw new Error('Incomplete interview evaluation');
  return {
    overallScore: score(value.overallScore), overallFeedback: feedback(value.overallFeedback),
    strengths: list(value.strengths), areasToImprove: list(value.areasToImprove), questionEvaluations,
  };
}
