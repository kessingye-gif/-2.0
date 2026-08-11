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
  ['机构与额度', '学生与开通', '学习与使用', '待办与异常', '数据更新于', '数据来源'].forEach((text) => assert.match(markup, new RegExp(text)));
  assert.equal(/商业履约驾驶舱|七段履约漏斗|签约|合同|回款/.test(markup), false);
  assert.match(markup, /href="\/platform\/institutions\?quota=low"/);
});
