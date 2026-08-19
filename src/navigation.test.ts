import assert from 'node:assert/strict';
import test from 'node:test';
import { canAccessRoute, getDefaultRouteForRole, getNavGroupsForRole, navGroups } from './navigation';

test('平台总部导航围绕服务内容和用户使用组织', () => {
  const groups = getNavGroupsForRole('super_admin');
  const items = groups.flatMap((group) => group.items);
  assert.deepEqual(groups.map((group) => group.title ?? null), [null, '核心运营', '支撑设置']);
  assert.deepEqual(items.map((item) => item.label), ['运营首页', '服务产品', '内容管理', '机构管理', '教师管理', '学生管理', '系统管理']);
  assert.equal(items.some((item) => item.label === '教师管理'), true);
  assert.equal(items.some((item) => item.label === '班级管理'), false);
  items.forEach((item) => assert.match(item.path, /^\/platform\//));
});

test('教师管理恢复为独立入口，班级路由仍不占据一级导航', () => {
  const items = getNavGroupsForRole('super_admin').flatMap((group) => group.items);
  assert.equal(canAccessRoute('super_admin', 'teachers'), true);
  assert.equal(canAccessRoute('super_admin', 'classes'), true);
  assert.equal(items.some((item) => item.id === 'teachers'), true);
  assert.equal(items.some((item) => item.id === 'classes'), false);
});

test('不同身份只看到被授权模块', () => {
  assert.deepEqual(getNavGroupsForRole('institution_admin').flatMap((group) => group.items).map((item) => item.id), ['dashboard', 'learning', 'teachers', 'students', 'content']);
  assert.deepEqual(getNavGroupsForRole('teacher').flatMap((group) => group.items).map((item) => item.id), ['learning', 'students', 'content']);
  assert.deepEqual(getNavGroupsForRole('institution_admin')[0].items.map((item) => item.label), ['机构工作台', '学生学情']);
  assert.equal(canAccessRoute('institution_admin', 'classes'), false);
  assert.equal(canAccessRoute('institution_admin', 'teachers'), true);
  assert.equal(canAccessRoute('teacher', 'classes'), false);
  assert.equal(canAccessRoute('teacher', 'content'), true);
  assert.equal(getDefaultRouteForRole('institution_admin'), '/platform/dashboard');
  assert.equal(getDefaultRouteForRole('teacher'), '/platform/learning');
});
