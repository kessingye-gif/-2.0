import assert from 'node:assert/strict';
import test from 'node:test';
import { getKnowledgeHierarchyLabels } from './dataSplitter';

test('三级内容使用统一层级术语', () => {
  assert.deepEqual(getKnowledgeHierarchyLabels(), ['一级', '二级', '知识点']);
});
