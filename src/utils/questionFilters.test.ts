import assert from 'node:assert/strict';
import test from 'node:test';
import { initialQuestions } from '../mockData';
import { filterQuestions } from './questionFilters';

test('从知识点查看题目时按知识点 ID 精确返回绑定题目', () => {
  const result = filterQuestions(initialQuestions, { knowledgePointId: 'KP-L3-01' });

  assert.deepEqual(result.map((item) => item.id), ['Q-2026001']);
});

test('知识点筛选与题库关键词筛选可以共同清除和切换', () => {
  const byKnowledgePoint = filterQuestions(initialQuestions, { knowledgePointId: 'KP-L3-02' });
  const byKeyword = filterQuestions(initialQuestions, { searchTerm: '去括号计算题' });

  assert.deepEqual(byKnowledgePoint.map((item) => item.id), ['Q-2026002']);
  assert.deepEqual(byKeyword.map((item) => item.id), ['Q-2026001']);
});
