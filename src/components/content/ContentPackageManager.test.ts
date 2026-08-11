import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContentPackageManager, validateContentPackageDraft } from './ContentPackageManager';

const subjects = [
  { id: 'SUB-01', name: '初中数学', stage: '初中', textbook: '人教版', kpCount: 156, questionCount: 1280 },
];

test('内容包列表提供可追溯详情和明确新增流程', () => {
  const markup = renderToStaticMarkup(createElement(ContentPackageManager, {
    subjects,
    onOpenResource: () => undefined,
  }));
  assert.match(markup, /内容包/);
  assert.match(markup, /查看详情/);
  assert.match(markup, /新增内容包/);
  assert.doesNotMatch(markup, />删除</);
});

test('内容范围为空时不能发布', () => {
  assert.deepEqual(validateContentPackageDraft({ name: '', subjectId: '', kpCount: 0, questionCount: 0 }), [
    '请填写内容包名称',
    '请选择学科',
    '请选择至少一个知识点或一道题目',
  ]);
  assert.deepEqual(validateContentPackageDraft({ name: '初中数学包', subjectId: 'SUB-01', kpCount: 12, questionCount: 30 }), []);
});
