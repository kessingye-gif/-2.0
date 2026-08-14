import type { KnowledgePointNode, QuestionItem } from '../types';

export interface KnowledgePointImportRow {
  knowledgePointName: string;
  subject: string;
  stage: string;
  applicableGrades: string;
  applicableRegion: string;
  outlinePath: string;
  knowledgeType: string;
  coreContent: string;
  learningObjective: string;
  teachingSuggestion: string;
  minimumValidationQuestionIds: string;
  relatedQuestionIds: string;
  validationCriteria: string;
  prerequisitePaths: string;
}

export interface KnowledgePointImportPreviewRow {
  id: string;
  rowNumber: number;
  prerequisiteKnowledgePointIds: string[];
}

export interface KnowledgePointImportPreview {
  rows: KnowledgePointImportPreviewRow[];
  errors: string[];
}

const splitValues = (value: string, separator: string) => value.split(separator).map((item) => item.trim()).filter(Boolean);
const normalizedPath = (path: string) => splitValues(path, '—').join('—');

export const validatePrerequisites = (nodes: KnowledgePointNode[], targetId: string, prerequisiteIds: string[]) => {
  const errors: string[] = [];
  if (prerequisiteIds.includes(targetId)) errors.push('前置知识点不能包含当前知识点');
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const reachesTarget = (id: string, visited = new Set<string>()): boolean => {
    if (id === targetId) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    return (byId.get(id)?.prerequisiteKnowledgePointIds ?? []).some((nextId) => reachesTarget(nextId, visited));
  };
  if (!errors.length && prerequisiteIds.some((id) => reachesTarget(id))) errors.push('前置知识点不能形成循环依赖');
  return errors;
};

export const preflightKnowledgePointImport = (
  rows: KnowledgePointImportRow[],
  existingNodes: KnowledgePointNode[],
  questions: QuestionItem[],
): KnowledgePointImportPreview => {
  const errors: string[] = [];
  const pathToId = new Map<string, string>();
  const previewRows = rows.map((row, index) => {
    const path = normalizedPath(row.outlinePath);
    const segments = path.split('—');
    const id = `generated-row-${index + 1}-id`;
    if (segments.length !== 3 || segments.some((segment) => !segment)) errors.push(`第 ${index + 1} 行：大纲层级路径必须包含三级`);
    if (segments.at(-1) !== row.knowledgePointName.trim()) errors.push(`第 ${index + 1} 行：知识点名称需与路径末级一致`);
    pathToId.set(`${row.subject}|${row.stage}|${path}`, id);
    return { id, rowNumber: index + 1, prerequisiteKnowledgePointIds: [] };
  });
  existingNodes.filter((node) => node.level === 3).forEach((node) => {
    const ancestorNames: string[] = [node.name];
    let current = node;
    while (current.parentId) {
      const parent = existingNodes.find((item) => item.id === current.parentId);
      if (!parent) break;
      ancestorNames.unshift(parent.name);
      current = parent;
    }
    pathToId.set(`${node.subject}|${node.stage ?? ''}|${ancestorNames.join('—')}`, node.id);
  });
  rows.forEach((row, index) => {
    const relatedIds = splitValues(row.relatedQuestionIds, '、');
    const minimumIds = splitValues(row.minimumValidationQuestionIds, '、');
    if (minimumIds.some((id) => !relatedIds.includes(id)) || minimumIds.length === 0) errors.push(`第 ${index + 1} 行：最小应用验证题必须属于关联题目`);
    if (relatedIds.some((id) => !questions.some((question) => question.id === id))) errors.push(`第 ${index + 1} 行：关联题目不存在`);
    previewRows[index].prerequisiteKnowledgePointIds = splitValues(row.prerequisitePaths, '；').flatMap((path) => {
      const matchedId = pathToId.get(`${row.subject}|${row.stage}|${normalizedPath(path)}`);
      if (!matchedId) {
        errors.push(`第 ${index + 1} 行：前置知识点不存在`);
        return [];
      }
      return [matchedId];
    });
  });
  return { rows: previewRows, errors };
};
