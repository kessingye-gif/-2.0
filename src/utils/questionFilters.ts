import type { QuestionItem } from '../types';

export interface QuestionFilterInput {
  searchTerm?: string;
  knowledgePointId?: string;
}

export function filterQuestions(questions: QuestionItem[], filters: QuestionFilterInput) {
  const searchTerm = filters.searchTerm?.trim().toLowerCase() || '';
  return questions.filter((question) => {
    const matchesKnowledgePoint = !filters.knowledgePointId || question.knowledgePointLevel3Id === filters.knowledgePointId;
    const matchesSearch = !searchTerm
      || question.title.toLowerCase().includes(searchTerm)
      || question.content.toLowerCase().includes(searchTerm)
      || question.id.toLowerCase().includes(searchTerm);
    return matchesKnowledgePoint && matchesSearch;
  });
}
