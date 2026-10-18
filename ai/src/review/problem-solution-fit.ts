const DOMAIN_SIGNALS: Record<string, string[]> = {
  housing: [
    'housing', 'rental', 'rent', 'renting', 'apartment', 'accommodation',
    'landlord', 'roommate', 'broker', 'property', 'listing',
  ],
  education: [
    'study', 'studying', 'exam', 'exams', 'course', 'coursework', 'homework',
    'tutor', 'classroom', 'lesson', 'curriculum', 'teaching', 'learning',
  ],
  productivity: [
    'planner', 'planning', 'schedule', 'timetable', 'pomodoro', 'timer',
    'reminder', 'routine', 'focus', 'productivity', 'task management',
  ],
  healthcare: [
    'healthcare', 'medical', 'patient', 'diagnosis', 'treatment', 'clinic',
    'hospital', 'symptom', 'prescription', 'therapy',
  ],
  finance: [
    'finance', 'banking', 'bank', 'loan', 'investment', 'budget', 'payment',
    'transaction', 'credit', 'insurance',
  ],
  commerce: [
    'ecommerce', 'e-commerce', 'shopping', 'marketplace', 'purchase', 'seller',
    'buyer', 'inventory', 'checkout', 'order',
  ],
  food: [
    'food', 'meal', 'restaurant', 'recipe', 'nutrition', 'grocery', 'cooking',
    'delivery',
  ],
  transportation: [
    'transportation', 'commute', 'transit', 'traffic', 'vehicle', 'ride',
    'route', 'parking', 'logistics',
  ],
  employment: [
    'job', 'employment', 'hiring', 'recruitment', 'resume', 'career',
    'interview', 'candidate', 'applicant',
  ],
};

function getDomainScores(text: string): Map<string, number> {
  const normalizedText = text.toLowerCase();
  const scores = new Map<string, number>();

  for (const [domain, signals] of Object.entries(DOMAIN_SIGNALS)) {
    const score = signals.reduce((total, signal) => {
      const escapedSignal = signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = normalizedText.match(new RegExp(`\\b${escapedSignal}\\b`, 'g'));
      return total + (matches?.length ?? 0);
    }, 0);

    if (score > 0) scores.set(domain, score);
  }

  return scores;
}

export function detectClearProblemSolutionMismatch(problem: string, solution: string) {
  const problemScores = getDomainScores(problem);
  const solutionScores = getDomainScores(solution);
  const strongProblemDomains = [...problemScores]
    .filter(([, score]) => score >= 2)
    .map(([domain]) => domain);
  const strongSolutionDomains = [...solutionScores]
    .filter(([, score]) => score >= 2)
    .map(([domain]) => domain);

  const hasMatchingDomain = strongProblemDomains.some((domain) => strongSolutionDomains.includes(domain));
  const isMismatch = strongProblemDomains.length > 0
    && strongSolutionDomains.length > 0
    && !hasMatchingDomain;

  return {
    isMismatch,
    confidence: isMismatch ? 0.95 : 0,
    problemDomains: strongProblemDomains,
    solutionDomains: strongSolutionDomains,
  };
}
