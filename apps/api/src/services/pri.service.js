const excludedAlgoRankSpecializations = new Set([
  'ELECTRONICS_ELECTRICAL',
  'OTHER_ENGINEERING',
]);

export const isAlgoRankIncluded = (specialization) => !excludedAlgoRankSpecializations.has(specialization);

export const calculatePriScore = ({ interviewScore, algoRankScore, resumeScore, specialization }) => {
  const algoRankIncluded = isAlgoRankIncluded(specialization);
  const score = algoRankIncluded
    ? 0.45 * interviewScore + 0.40 * algoRankScore + 0.15 * resumeScore
    : 0.75 * interviewScore + 0.25 * resumeScore;

  return Number(score.toFixed(2));
};