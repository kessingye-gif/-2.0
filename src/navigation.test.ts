import assert from 'node:assert/strict';
import test from 'node:test';
import { canAccessRoute, getDefaultRouteForRole, getNavGroupsForRole, navGroups } from './navigation';

test('平台总部导航围绕服务内容和用户使用组织', () => {
  const groups = getNavGroupsForRole('super_admin');
  const items = groups.flatMap((group) => group.items);
  assert.deepEqual(groups.map((group) => group.title ?? null), [null, '核心运营', '支撑设置']);
  assert.deepEqual(items.map((item) => item.label), ['运营首页', '服务产品', '内容资产', '用户与使用', '机构管理', '系统管理']);
  assert.equal(items.some((item) => ['教师管理', '班级管理'].includes(item.label)), false);
  items.forEach((item) => assert.match(item.path, /^\/platform\//));
});

test('旧教师和班级路由继续可访问但不占据总部一级导航', () => {
  const items = getNavGroupsForRole('super_admin').flatMap((group) => group.items);
  assert.equal(canAccessRoute('super_admin', 'teachers'), true);
  assert.equal(canAccessRoute('super_admin', 'classes'), true);
  assert.equal(items.some((item) => item.id === 'teachers' || item.id === 'classes'), false);
});

test('不同身份只看到被授权模块', () => {
  assert.deepEqual(getNavGroupsForRole('institution_admin').flatMap((group) => group.items).map((item) => item.id), ['dashboard', 'content', 'teachers', 'classes', 'students']);
  assert.deepEqual(getNavGroupsForRole('teacher').flatMap((group) => group.items).map((item) => item.id), ['dashboard', 'content', 'classes', 'students']);
  assert.equal(canAccessRoute('teacher', 'content'), true);
  assert.equal(getDefaultRouteForRole('institution_admin'), '/platform/dashboard');
  assert.equal(getDefaultRouteForRole('teacher'), '/platform/dashboard');
});
