import type { ContentPackageItem, KnowledgePointNode, QuestionItem } from '../types';

export interface ContentPackageComposition {
  knowledgePoints: KnowledgePointNode[];
  questions: QuestionItem[];
  knowledgePointCount: number;
  questionCount: number;
}

export function resolveContentPackageComposition(
  pkg: ContentPackageItem,
  knowledgePoints: KnowledgePointNode[],
  questions: QuestionItem[],
): ContentPackageComposition {
  const selectedPointIds = new Set(pkg.knowledgePointIds ?? []);
  const selectedPoints = knowledgePoints.filter((point) => point.level === 3 && point.status === 'active' && selectedPointIds.has(point.id));
  const allowedPointIds = new Set(selectedPoints.map((point) => point.id));
  const eligibleQuestions = questions.filter((question) => question.status === 'active' && allowedPointIds.has(question.knowledgePointLevel3Id));
  const selectedQuestionIds = pkg.questionIds ?? [];
  const selectedQuestions = selectedQuestionIds.length > 0
    ? eligibleQuestions.filter((question) => selectedQuestionIds.includes(question.id))
    : eligibleQuestions;

  return {
    knowledgePoints: selectedPoints,
    questions: selectedQuestions,
    knowledgePointCount: selectedPoints.length,
    questionCount: selectedQuestions.length,
  };
}
