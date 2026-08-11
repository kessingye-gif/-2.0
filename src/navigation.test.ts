import assert from 'node:assert/strict';
import test from 'node:test';
import { navGroups } from './navigation';

test('后台导航包含驾驶舱和七个正式业务模块', () => {
  const items = navGroups.flatMap((group) => group.items);

  assert.deepEqual(
    items.map((item) => item.label),
    ['经营驾驶舱', '商品与权益', '内容管理', '机构管理', '教师管理', '班级管理', '学生管理', '系统管理'],
  );
  assert.equal(items.some((item) => /\u5408\u540c|\u7b7e\u7ea6/.test(item.label)), false);
  items.forEach((item) => assert.match(item.path, /^\/platform\//));
});

test('驾驶舱不与七个业务模块混为一组', () => {
  assert.deepEqual(navGroups.map((group) => group.title ?? null), [null, '业务模块', '系统']);
});
