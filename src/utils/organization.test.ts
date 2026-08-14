import assert from 'node:assert/strict';
import test from 'node:test';
import { getOrganizationChildren } from './organization';

test('组织树按机构和父节点返回直属层级', () => {
  const nodes = [
    { id: 'C-1', institutionId: 'I-1', type: 'campus', name: '主校区' },
    { id: 'G-1', institutionId: 'I-1', parentId: 'C-1', type: 'grade_group', name: '初一年级组' },
    { id: 'B-1', institutionId: 'I-1', parentId: 'G-1', type: 'class', name: '初一（1）班' },
  ] as const;
  assert.deepEqual(getOrganizationChildren(nodes, 'I-1').map((node) => node.id), ['C-1']);
  assert.deepEqual(getOrganizationChildren(nodes, 'I-1', 'G-1').map((node) => node.id), ['B-1']);
});
