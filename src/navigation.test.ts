import assert from 'node:assert/strict';
import test from 'node:test';
import { navGroups } from './navigation';

test('平台导航只展示总部管理边界', () => {
  const items = navGroups.flatMap((group) => group.items);

  assert.deepEqual(
    items.map((item) => item.label),
    ['经营驾驶舱', '机构与额度', '开通与使用', '售后与异常', '内容中心', '数据与审计', '平台设置'],
  );
  assert.equal(items.some((item) => /\u5408\u540c|\u7b7e\u7ea6/.test(item.label)), false);
  items.forEach((item) => assert.match(item.path, /^\/platform\//));
});

test('内容中心和系统能力使用独立分组', () => {
  assert.deepEqual(navGroups.map((group) => group.title ?? null), [null, '内容', '系统']);
});
