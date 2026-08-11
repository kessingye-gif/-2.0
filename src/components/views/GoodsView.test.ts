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
  onGenerateCodeForTest: () => undefined,
  onAdjustQuota: () => undefined,
  onAudit: () => undefined,
  onNotify: () => undefined,
};

const renderMode = (mode: 'catalog' | 'fulfillment' | 'finance') => renderToStaticMarkup(createElement(GoodsView, {
  mode,
  packages: initialServicePackages,
  authCodes: initialAuthCodes,
  institutions: initialInstitutions,
  ...handlers,
}));

test('catalog mode opens on service products instead of orders', () => {
  const markup = renderMode('catalog');
  assert.match(markup, /商品与权益管理/);
  assert.match(markup, /新增服务包/);
  assert.doesNotMatch(markup, /学生加油包订单.*申请退款/);
});

test('fulfillment mode opens on the authorization-code lifecycle', () => {
  const markup = renderMode('fulfillment');
  assert.match(markup, /开通与履约/);
  assert.match(markup, /生成学生开通码/);
  assert.match(markup, /KQ-8829-9102-1823/);
  assert.match(markup, /2026-07-20 10:30/);
  assert.match(markup, /2026-07-21 14:20/);
  assert.match(markup, /2026-08-19 10:30/);
});

test('finance mode opens on the unified order ledger', () => {
  const markup = renderMode('finance');
  assert.match(markup, /订单与资金/);
  assert.match(markup, /机构额度入账/);
});
