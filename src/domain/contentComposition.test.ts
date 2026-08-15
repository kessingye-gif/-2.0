import assert from 'node:assert/strict';
import test from 'node:test';
import type { ContentPackageItem, KnowledgePointNode, QuestionItem } from '../types';
import { resolveContentPackageComposition } from './contentComposition';

const pkg: ContentPackageItem = {
  id: 'CP-1', code: 'CP-1', name: '数学基础包', subjectId: 'SUB-1', subject: '数学', stage: '初中',
  kpCount: 0, questionCount: 0, status: 'active', description: '', knowledgePointIds: ['KP-1'], questionIds: [],
};

const point = (id: string, status: 'active' | 'inactive' = 'active'): KnowledgePointNode => ({
  id, code: id, name: id, level: 3, subject: '数学', grade: '初一', textbook: '人教版', questionCount: 0, status,
});

const question = (id: string, knowledgePointLevel3Id: string, status: 'active' | 'inactive' = 'active'): QuestionItem => ({
  id, title: id, content: id, answer: 'A', analysis: '', subject: '数学', stage: '初中', grade: '初一', textbook: '人教版', difficulty: '基础', type: '单选题',
  knowledgePointLevel1Id: 'L1', knowledgePointLevel2Id: 'L2', knowledgePointLevel3Id, knowledgePointPathName: '', status, createdAt: '2026-08-15',
});

test('内容包只交付已选三级知识点下的启用题目', () => {
  const result = resolveContentPackageComposition(pkg, [point('KP-1'), point('KP-2')], [question('Q-1', 'KP-1'), question('Q-2', 'KP-2')]);
  assert.deepEqual(result.questions.map((item) => item.id), ['Q-1']);
  assert.equal(result.knowledgePointCount, 1);
  assert.equal(result.questionCount, 1);
});

test('题目白名单不会跨越内容包已选知识点', () => {
  const result = resolveContentPackageComposition({ ...pkg, questionIds: ['Q-1', 'Q-2'] }, [point('KP-1'), point('KP-2')], [question('Q-1', 'KP-1'), question('Q-2', 'KP-2')]);
  assert.deepEqual(result.questions.map((item) => item.id), ['Q-1']);
});

test('停用题目和停用知识点不计入内容包统计', () => {
  const result = resolveContentPackageComposition({ ...pkg, knowledgePointIds: ['KP-1', 'KP-2'] }, [point('KP-1'), point('KP-2', 'inactive')], [question('Q-1', 'KP-1', 'inactive'), question('Q-2', 'KP-2')]);
  assert.equal(result.knowledgePointCount, 1);
  assert.equal(result.questionCount, 0);
});
