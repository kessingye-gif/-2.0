export type KnowledgePointLevel = {
  chapter: string;
  section: string;
  knowledgePoint: string;
};

export type KnowledgePointLevelStatus = 'knowledge_point' | 'section_terminal' | 'invalid';

export const knowledgePointBaseFields = [
  { key: 'stage', label: '学段' },
  { key: 'subject', label: '所属学科' },
  { key: 'grade', label: '适用年级' },
  { key: 'textbook', label: '教材版本' },
  { key: 'chapter', label: '章' },
  { key: 'section', label: '节' },
  { key: 'knowledgePoint', label: '知识点' },
] as const;

export const knowledgePointAiFields = [
  { key: 'prerequisiteKnowledgePoints', label: '前置知识点' },
  { key: 'coreContent', label: '核心学习内容' },
  { key: 'learningObjective', label: '教学目标' },
  { key: 'teachingSuggestion', label: '教学建议' },
] as const;

export const knowledgePointImportFields = [...knowledgePointBaseFields, ...knowledgePointAiFields];

export const validateKnowledgePointLevel = ({ chapter, section, knowledgePoint }: KnowledgePointLevel): KnowledgePointLevelStatus => {
  if (!chapter.trim() || !section.trim() || !knowledgePoint.trim()) return 'invalid';
  return knowledgePoint.trim() === '-' ? 'section_terminal' : 'knowledge_point';
};
