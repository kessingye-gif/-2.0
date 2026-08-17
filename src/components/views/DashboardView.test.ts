import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { derivePlatformDashboardSnapshot } from '../../dashboardSnapshot';
import { initialAuditLogs, initialAuthCodes, initialContentPackages, initialInstitutions, initialKnowledgePoints, initialOrderLedger, initialQuestions, initialServicePackages, initialStudents } from '../../mockData';
import { DashboardView } from './DashboardView';

test('运营首页展示服务内容与用户使用数据', () => {
  const snapshot = derivePlatformDashboardSnapshot({ institutions: initialInstitutions, authCodes: initialAuthCodes, students: initialStudents, orders: initialOrderLedger, auditLogs: initialAuditLogs, servicePackages: initialServicePackages, contentPackages: initialContentPackages, knowledgePoints: initialKnowledgePoints, questions: initialQuestions });
  const markup = renderToStaticMarkup(createElement(MemoryRouter, {}, createElement(DashboardView, { snapshot })));
  ['服务产品', '内容资产', '用户与使用', '待办与异常', '数据来源'].forEach((text) => assert.match(markup, new RegExp(text)));
  assert.doesNotMatch(markup, /学情总览|人员管理|交易管理/);
  assert.match(markup, /role="tablist"/);
  assert.match(markup, /aria-selected="true"/);
  assert.match(markup, /border-b-2 border-\[#16B45B\]/);
  assert.doesNotMatch(markup, /rounded-\[24px\]|shadow-inner/);
  assert.match(markup, /启用服务包/);
  assert.doesNotMatch(markup, /平台剩余额度|运行中机构数|低额度预警机构/);
  assert.doesNotMatch(markup, /平台总部 · 全局监管|平台经营驾驶舱|数据更新于/);
  assert.equal(/商业履约驾驶舱|七段履约漏斗|签约|合同|回款/.test(markup), false);
  assert.match(markup, /href="\/platform\/goods\?tab=packages"/);
});
