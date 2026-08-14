import assert from 'node:assert/strict';
import test from 'node:test';
import type { KnowledgePointNode, QuestionItem } from '../types';
import { preflightKnowledgePointImport, validatePrerequisites } from './knowledgePointImport';

const nodes: KnowledgePointNode[] = [
  { id: 'KP-1', code: 'KP-1', name: '等式的性质', level: 3, subject: '数学', grade: '初一', textbook: '人教版', questionCount: 0, status: 'active', prerequisiteKnowledgePointIds: [] },
  { id: 'KP-2', code: 'KP-2', name: '解一元一次方程', level: 3, subject: '数学', grade: '初一', textbook: '人教版', questionCount: 0, status: 'active', prerequisiteKnowledgePointIds: ['KP-1'] },
  { id: 'KP-3', code: 'KP-3', name: '方程实际应用', level: 3, subject: '数学', grade: '初一', textbook: '人教版', questionCount: 0, status: 'active', prerequisiteKnowledgePointIds: ['KP-2'] },
];

test('拒绝自身和环路前置关系', () => {
  assert.deepEqual(validatePrerequisites(nodes, 'KP-1', ['KP-1']), ['前置知识点不能包含当前知识点']);
  assert.deepEqual(validatePrerequisites(nodes, 'KP-1', ['KP-3']), ['前置知识点不能形成循环依赖']);
});

test('预检解析同批次后续行的前置路径', () => {
  const rows = [
    {
      knowledgePointName: '一元一次方程的应用', subject: '数学', stage: '初中', applicableGrades: '初一', applicableRegion: '全国',
      outlinePath: '数与代数—方程与不等式—一元一次方程的应用', knowledgeType: '过程类', coreContent: '从实际问题中列方程',
      learningObjective: '能够解决简单应用题', teachingSuggestion: '', minimumValidationQuestionIds: 'Q-1', relatedQuestionIds: 'Q-1',
      validationCriteria: '答对最小验证题', prerequisitePaths: '数与代数—方程与不等式—一元一次方程',
    },
    {
      knowledgePointName: '一元一次方程', subject: '数学', stage: '初中', applicableGrades: '初一', applicableRegion: '全国',
      outlinePath: '数与代数—方程与不等式—一元一次方程', knowledgeType: '概念类', coreContent: '含一个未知数的一次方程',
      learningObjective: '能够识别一元一次方程', teachingSuggestion: '', minimumValidationQuestionIds: 'Q-1', relatedQuestionIds: 'Q-1',
      validationCriteria: '答对最小验证题', prerequisitePaths: '',
    },
  ];
  const questions = [{ id: 'Q-1' }] as QuestionItem[];
  const result = preflightKnowledgePointImport(rows, [], questions);
  assert.equal(result.errors.length, 0);
  assert.equal(result.rows[0].prerequisiteKnowledgePointIds[0], result.rows[1].id);
});
