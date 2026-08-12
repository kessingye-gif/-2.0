import assert from 'node:assert/strict';
import test from 'node:test';
import { getKnowledgeHierarchyLabels } from './dataSplitter';

test('三级内容使用章节知识点术语', () => {
  assert.deepEqual(getKnowledgeHierarchyLabels(), ['章', '节', '知识点']);
});
