import assert from 'node:assert/strict';
import test from 'node:test';
import { importTemplates } from './importTemplates';
import { knowledgePointImportFields } from '../domain/contentFields';

test('知识点导入模板使用统一字段定义', () => {
  assert.deepEqual(importTemplates.knowledgePoints.headers, knowledgePointImportFields.map((field) => field.label));
});

test('精选题库导入模板复用知识点与 AI 补充字段', () => {
  assert.deepEqual(importTemplates.questions.headers.slice(0, knowledgePointImportFields.length), knowledgePointImportFields.map((field) => field.label));
});
