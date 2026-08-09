import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultKnowledgeTypes, canDeleteKnowledgeType } from './knowledgeTypeRegistry';

test('默认知识类型按教学含义拆分', () => {
  assert.deepEqual(defaultKnowledgeTypes.map((item) => item.name), [
    '概念类',
    '规则 / 公式 / 定理类',
    '过程 / 机制类',
    '事件类',
  ]);
});

test('已被知识点使用的类型不能删除', () => {
  assert.equal(canDeleteKnowledgeType({ usageCount: 1 }), false);
  assert.equal(canDeleteKnowledgeType({ usageCount: 0 }), true);
});
