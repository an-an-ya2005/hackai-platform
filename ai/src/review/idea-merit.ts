const GENERIC_STUDY_PROBLEM_PATTERNS = [
  /\bstudents?\s+(?:have|face|experience)\s+(?:study|studying|learning)\s+(?:problems?|issues?|difficulties)\b/i,
  /\bstudents?\s+(?:struggle|have difficulty)\s+(?:with\s+)?(?:study|studying|learning)\b/i,
  /\bstudents?\s+need\s+(?:help|support|motivation)\s+(?:to\s+)?(?:study|learn)\b/i,
];

const GENERIC_STUDY_FEATURES = [
  /\b(?:study\s+)?planner\b/i,
  /\b(?:study\s+)?timetable\b/i,
  /\b(?:study\s+)?schedule\b/i,
  /\bpomodoro\b/i,
  /\btimers?\b/i,
  /\breminders?\b/i,
  /\bmotivational\s+quotes?\b/i,
  /\bdaily\s+goals?\b/i,
];

export function detectClearlyShallowStudyIdea(problemStatement: string, solution: string) {
  const hasGenericProblem = GENERIC_STUDY_PROBLEM_PATTERNS.some((pattern) => pattern.test(problemStatement));
  const genericFeatureCount = GENERIC_STUDY_FEATURES
    .filter((pattern) => pattern.test(solution))
    .length;
  const isClearlyShallow = hasGenericProblem && genericFeatureCount >= 2;

  return {
    isClearlyShallow,
    confidence: isClearlyShallow ? 0.95 : 0,
    genericFeatureCount,
    reason: isClearlyShallow
      ? 'The problem statement does not identify a specific study challenge or its impact, and the solution lists generic planning features without a concrete outcome.'
      : undefined,
  };
}
