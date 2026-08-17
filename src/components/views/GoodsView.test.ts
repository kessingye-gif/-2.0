import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialAuthCodes, initialInstitutions, initialServicePackages } from '../../mockData';
import { GoodsView } from './GoodsView';

const handlers = {
  onAddPackage: () => undefined,
  onUpdatePackage: () => undefined,
  onRevokeAuthCode: () => undefined,
  onGenerateAuthCode: () => undefined,
  onAdjustQuota: () => undefined,
  onNotify: () => undefined,
};

const renderMode = (mode: 'catalog' | 'fulfillment' | 'finance', initialCatalogTab?: 'packages') => renderToStaticMarkup(createElement(GoodsView, {
  mode,
  initialCatalogTab,
  packages: initialServicePackages,
  authCodes: initialAuthCodes,
  institutions: initialInstitutions,
  ...handlers,
}));

test('catalog mode opens on service products without an authorization-template tab', () => {
  const markup = renderMode('catalog');
  assert.doesNotMatch(markup, /商品与权益管理|商品、额度与权益/);
  assert.match(markup, /新增服务包/);
  assert.doesNotMatch(markup, /授权模板/);
  assert.doesNotMatch(markup, /学生权益开通/);
  assert.doesNotMatch(markup, /学生加油包订单.*申请退款/);
});

test('服务包只表达点数和 AI 权益，不绑定内容包', () => {
  const markup = renderMode('catalog');
  assert.doesNotMatch(markup, /激活时任选|激活后包含|覆盖 \d+ 个内容包|内容包包含模式/);
  assert.match(markup, /消耗采购点数/);
  assert.match(markup, /包含 AI 用量/);
  assert.match(markup, /20万 AI 用量/);
  assert.doesNotMatch(markup, /每日 AI 上限|次\/天/);
});

test('服务包有明确的启停操作和历史保留说明', () => {
  const markup = renderMode('catalog', 'packages');
  assert.match(markup, />停用</);
  assert.match(markup, /不影响已生效的学生权益和历史记录/);
});

test('目录不再提供 AI 加油包商品标签', () => {
  const markup = renderMode('catalog');
  assert.doesNotMatch(markup, /加油包/);
  assert.doesNotMatch(markup, /下架后不再对新购买开放/);
});

test('授权码生命周期只查询和作废，不能脱离学生直接生成', () => {
  const markup = renderMode('fulfillment');
  assert.doesNotMatch(markup, /开通与履约|商业履约 · 学生开通/);
  assert.doesNotMatch(markup, />生成授权码</);
  assert.match(markup, /KQ-8829-9102-1823/);
  assert.match(markup, /2026-07-20 10:30/);
  assert.match(markup, /2026-07-21 14:20/);
  assert.match(markup, /2026-08-19 10:30/);
});

test('机构额度入账意图自动打开入账页并选中目标机构', () => {
  const institution = initialInstitutions[1];
  const markup = renderToStaticMarkup(createElement(GoodsView, {
    mode: 'catalog',
    packages: initialServicePackages,
    authCodes: initialAuthCodes,
    institutions: initialInstitutions,
    creditInstitutionId: institution.id,
    ...handlers,
  }));
  assert.match(markup, /交易流水/);
  assert.match(markup, /录入机构线下点数入账/);
  assert.match(markup, new RegExp(`<option value="${institution.id}" selected="">${institution.name}</option>`));
});

test('finance mode opens on the unified order ledger', () => {
  const markup = renderMode('finance');
  assert.doesNotMatch(markup, /订单与资金|商业履约 · 资金结算/);
  assert.match(markup, /交易流水/);
  assert.doesNotMatch(markup, />资产流水</);
  assert.doesNotMatch(markup, /PAY-20260808-0192/);
  assert.doesNotMatch(markup, /申请退款/);
});

test('机构入账统一到一个交易流水入口', () => {
  const markup = renderToStaticMarkup(createElement(GoodsView, {
    mode: 'catalog', packages: initialServicePackages, authCodes: initialAuthCodes, institutions: initialInstitutions,
    creditInstitutionId: initialInstitutions[0].id, ...handlers,
  }));
  assert.match(markup, />交易流水</);
  assert.doesNotMatch(markup, />机构额度入账</);
  assert.doesNotMatch(markup, />权益流水</);
  assert.match(markup, /全部流水类型/);
  assert.match(markup, />录入线下入账</);
  assert.doesNotMatch(markup, /PAY-20260808-0192/);
  assert.doesNotMatch(markup, /张伟强/);
  assert.doesNotMatch(markup, /申请退款/);
  assert.doesNotMatch(markup, /学生加油包交易/);
});

test('商品页不承载学生办理标签', () => {
  const markup = renderMode('catalog');
  assert.doesNotMatch(markup, /办理学生服务/);
});
