import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialAuthCodes, initialContentPackages, initialInstitutions, initialOrderLedger, initialServicePackages } from '../../mockData';
import { InstitutionView } from './InstitutionView';

test('机构列表区分查看详情和开通配置入口', () => {
  const markup = renderToStaticMarkup(createElement(InstitutionView, {
    institutions: initialInstitutions,
    servicePackages: initialServicePackages,
    authCodes: initialAuthCodes,
    orders: initialOrderLedger,
    onAddInstitution: () => undefined,
    onUpdateInstitution: () => undefined,
    onAdjustQuota: () => undefined,
    onBatchImport: () => undefined,
    onCreditEntry: () => undefined,
  }));

  assert.match(markup, />开通\/配置</);
  assert.match(markup, />查看详情</);
  assert.match(markup, /运行中机构数/);
  assert.match(markup, /平台剩余额度/);
  assert.match(markup, /服务学生总数/);
  assert.match(markup, /低额度预警机构/);
  assert.doesNotMatch(markup, />入账</);
  assert.doesNotMatch(markup, />划拨</);
  assert.doesNotMatch(markup, /组织与权限|机构管理|维护机构账号/);
  assert.doesNotMatch(markup, /全部区域|按区域筛选|华东地区|所属区域/);
});

test('机构列表展示机构自身的内容包和服务包范围，不伪装成统一合作方案', () => {
  const institution = initialInstitutions[0];
  const markup = renderToStaticMarkup(createElement(InstitutionView, {
    institutions: [institution],
    servicePackages: initialServicePackages,
    contentPackages: initialContentPackages,
    authCodes: initialAuthCodes,
    orders: initialOrderLedger,
    onAddInstitution: () => undefined,
    onUpdateInstitution: () => undefined,
    onAdjustQuota: () => undefined,
    onBatchImport: () => undefined,
    onCreditEntry: () => undefined,
  }));

  assert.match(markup, /4 内容包 · 4 服务包/);
  assert.doesNotMatch(markup, /权限来自统一合作方案/);
});

test('机构列表使用清爽信息层级和轻量操作', () => {
  const markup = renderToStaticMarkup(createElement(InstitutionView, {
    institutions: initialInstitutions,
    servicePackages: initialServicePackages,
    contentPackages: initialContentPackages,
    authCodes: initialAuthCodes,
    orders: initialOrderLedger,
    onAddInstitution: () => undefined,
    onUpdateInstitution: () => undefined,
    onAdjustQuota: () => undefined,
    onBatchImport: () => undefined,
    onCreditEntry: () => undefined,
  }));

  const visibleText = markup.replace(/<[^>]+>/g, '');
  assert.match(visibleText, /剩余 75,402 点/);
  assert.match(visibleText, /4 内容包 · 4 服务包/);
  assert.match(markup, />开通\/配置</);
  assert.match(markup, />查看详情</);
  assert.doesNotMatch(markup, /138-8888-0001/);
  assert.doesNotMatch(markup, /内容与服务包范围独立配置/);
  assert.doesNotMatch(markup, /line-through/);
});
