export interface KnowledgeTypeDefinition {
  id: string;
  name: string;
  applicableSubjects: string;
  status: 'active' | 'inactive';
  usageCount: number;
}

export const defaultKnowledgeTypes: KnowledgeTypeDefinition[] = [
  { id: 'KT-CONCEPT', name: '概念类', applicableSubjects: '全学科', status: 'active', usageCount: 126 },
  { id: 'KT-RULE', name: '规则 / 公式 / 定理类', applicableSubjects: '数学、物理、化学', status: 'active', usageCount: 89 },
  { id: 'KT-PROCESS', name: '过程 / 机制类', applicableSubjects: '物理、化学、生物', status: 'active', usageCount: 54 },
  { id: 'KT-EVENT', name: '事件类', applicableSubjects: '历史、政治、地理', status: 'active', usageCount: 31 },
];

export const canDeleteKnowledgeType = ({ usageCount }: Pick<KnowledgeTypeDefinition, 'usageCount'>) => usageCount === 0;
