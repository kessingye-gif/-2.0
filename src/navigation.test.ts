import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { navGroups, resolveLegacyView } from './navigation';

test('总部导航只展示任务式一级入口', () => {
  assert.deepEqual(
    navGroups.flatMap((group) => group.items.map((item) => item.label)),
    ['运营工作台', '机构运营', '内容中心', '开通监管', '异常处理', '平台设置', '操作审计'],
  );
});

test('任务入口映射到现有业务视图', () => {
  assert.equal(resolveLegacyView('supervision'), 'goods');
  assert.equal(resolveLegacyView('exceptions'), 'exceptions');
  assert.equal(resolveLegacyView('settings'), 'settings');
  assert.notEqual(resolveLegacyView('exceptions'), resolveLegacyView('settings'));
});

test('工作台突出三个高频任务并移除冗余说明', () => {
  const source = readFileSync(new URL('./components/views/DashboardView.tsx', import.meta.url), 'utf8');
  assert.match(source, /新增机构并分配额度/);
  assert.match(source, /导入知识点和题目/);
  assert.match(source, /处理异常/);
  assert.doesNotMatch(source, /点击直达业务模块进行快速处理/);
});
