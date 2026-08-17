import assert from 'node:assert/strict';
import test from 'node:test';
import { importTemplates } from './importTemplates';
import { knowledgePointBaseFields, knowledgePointImportFields } from '../domain/contentFields';

test('知识点导入模板使用统一字段定义', () => {
  assert.deepEqual(importTemplates.knowledgePoints.headers, knowledgePointImportFields.map((field) => field.label));
});

test('精选题库导入模板先使用统一知识点基础字段', () => {
  assert.deepEqual(importTemplates.questions.headers.slice(0, 7), knowledgePointBaseFields.map((field) => field.label));
});
