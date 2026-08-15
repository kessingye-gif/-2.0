import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { derivePlatformDashboardSnapshot } from '../../dashboardSnapshot';
import { initialAuditLogs, initialAuthCodes, initialInstitutions, initialOrderLedger, initialStudents } from '../../mockData';
import { DashboardView } from './DashboardView';

test('驾驶舱展示四类有来源且可下钻的数据', () => {
  const snapshot = derivePlatformDashboardSnapshot({ institutions: initialInstitutions, authCodes: initialAuthCodes, students: initialStudents, orders: initialOrderLedger, auditLogs: initialAuditLogs });
  const markup = renderToStaticMarkup(createElement(MemoryRouter, {}, createElement(DashboardView, { snapshot })));
  ['运营总览', '学生与开通', '学习与使用', '待办与异常', '数据来源'].forEach((text) => assert.match(markup, new RegExp(text)));
  assert.doesNotMatch(markup, /学情总览|人员管理|交易管理/);
  assert.match(markup, /role="tablist"/);
  assert.match(markup, /aria-selected="true"/);
  assert.match(markup, /运行中机构数/);
  assert.doesNotMatch(markup, /服务中学生|学生待激活/);
  assert.doesNotMatch(markup, /平台总部 · 全局监管|数据更新于/);
  assert.equal(/商业履约驾驶舱|七段履约漏斗|签约|合同|回款/.test(markup), false);
  assert.match(markup, /href="\/platform\/institutions\?quota=low"/);
});
