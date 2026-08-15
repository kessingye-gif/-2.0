import assert from 'node:assert/strict';
import test from 'node:test';
import { importTemplates } from './importTemplates';

test('知识点导入模板与知识点页面的固定层级字段一致', () => {
  assert.deepEqual(importTemplates.knowledgePoints.headers, [
    '所属学科',
    '一级编码及名称',
    '二级编码及名称',
    '知识点编码及名称',
    '适用年级',
    '教材版本',
  ]);
});

test('精选题库导入模板复用统一知识点层级字段', () => {
  assert.deepEqual(importTemplates.questions.headers.slice(0, 7), [
    '学段',
    '所属学科',
    '适用年级',
    '教材版本',
    '一级编码及名称',
    '二级编码及名称',
    '知识点编码及名称',
  ]);
});
