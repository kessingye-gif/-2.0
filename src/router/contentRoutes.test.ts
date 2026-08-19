import assert from 'node:assert/strict';
import test from 'node:test';
import { getContentRoutePath, getContentRouteState } from './contentRoutes';

test('内容管理子路径可恢复页面层级', () => {
  assert.deepEqual(getContentRouteState('/platform/content/resources/knowledge-points'), { section: 'resources', resource: 'knowledge-points' });
  assert.deepEqual(getContentRouteState('/platform/content/packages'), { section: 'packages', resource: null, packageId: null });
  assert.deepEqual(getContentRouteState('/platform/content/packages/CP-01'), { section: 'packages', resource: null, packageId: 'CP-01' });
  assert.equal(getContentRoutePath('resources', 'questions'), '/platform/content/resources/questions');
  assert.equal(getContentRoutePath('packages'), '/platform/content/packages');
  assert.equal(getContentRoutePath('packages', 'CP-01'), '/platform/content/packages/CP-01');
});

test('内容根路径默认进入内容包，旧学科路径回到知识点管理', () => {
  assert.deepEqual(getContentRouteState('/platform/content'), { section: 'packages', resource: null, packageId: null });
  assert.deepEqual(getContentRouteState('/platform/content/resources/subjects'), { section: 'resources', resource: 'knowledge-points' });
  assert.deepEqual(getContentRouteState('/platform/content/unknown'), { section: 'resources', resource: 'knowledge-points' });
});
