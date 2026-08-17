import assert from 'node:assert/strict';
import test from 'node:test';
import { knowledgePointImportFields, validateKnowledgePointLevel } from './contentFields';

test('知识点字段按章节知识点和 AI 补充信息统一排列', () => {
  assert.deepEqual(knowledgePointImportFields.map((field) => field.label), [
    '学段', '所属学科', '适用年级', '教材版本', '章', '节', '知识点',
    '前置知识点', '核心学习内容', '教学目标', '教学建议',
  ]);
});

test('知识点填 - 时表示节级终点', () => {
  assert.equal(validateKnowledgePointLevel({ chapter: '数与代数', section: '方程', knowledgePoint: '-' }), 'section_terminal');
  assert.equal(validateKnowledgePointLevel({ chapter: '数与代数', section: '方程', knowledgePoint: '' }), 'invalid');
});
