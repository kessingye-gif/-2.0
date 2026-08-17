import assert from 'node:assert/strict';
import test from 'node:test';
import { canAccessRoute, getDefaultRouteForRole, getNavGroupsForRole, navGroups } from './navigation';

test('后台导航包含驾驶舱和七个正式业务模块', () => {
  const items = navGroups.flatMap((group) => group.items);

  assert.deepEqual(
    items.map((item) => item.label),
    ['经营驾驶舱', '内容管理', '商品与权益', '机构管理', '教师管理', '班级管理', '学生管理', '系统管理'],
  );
  assert.equal(items.some((item) => /\u5408\u540c|\u7b7e\u7ea6/.test(item.label)), false);
  items.forEach((item) => assert.match(item.path, /^\/platform\//));
});

test('驾驶舱不与七个业务模块混为一组', () => {
  assert.deepEqual(navGroups.map((group) => group.title ?? null), [null, '内容与业务配置', '系统']);
});

test('内容管理是业务模块的首个核心入口', () => {
  assert.deepEqual(navGroups[1].items.slice(0, 2).map((item) => item.label), ['内容管理', '商品与权益']);
});

test('不同身份只看到被授权模块', () => {
  assert.deepEqual(getNavGroupsForRole('institution_admin').flatMap((group) => group.items).map((item) => item.id), ['dashboard', 'content', 'teachers', 'classes', 'students']);
  assert.deepEqual(getNavGroupsForRole('teacher').flatMap((group) => group.items).map((item) => item.id), ['dashboard', 'content', 'classes', 'students']);
  assert.equal(canAccessRoute('teacher', 'content'), true);
  assert.equal(getDefaultRouteForRole('institution_admin'), '/platform/dashboard');
  assert.equal(getDefaultRouteForRole('teacher'), '/platform/dashboard');
});
