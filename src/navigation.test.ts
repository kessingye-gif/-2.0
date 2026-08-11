import assert from 'node:assert/strict';
import test from 'node:test';
import { navGroups, resolveLegacyView } from './navigation';

test('总部导航展示完整的商业履约入口', () => {
  assert.deepEqual(
    navGroups.flatMap((group) => group.items.map((item) => item.label)),
    ['经营驾驶舱', '客户与合同', '内容中心', '商品与定价', '开通与履约', '订单与资金', '售后与异常', '数据与审计', '平台设置'],
  );
});

test('商业入口映射到可复用的业务视图', () => {
  assert.equal(resolveLegacyView('catalog'), 'goods');
  assert.equal(resolveLegacyView('content'), 'questionBank');
  assert.equal(resolveLegacyView('fulfillment'), 'goods');
  assert.equal(resolveLegacyView('finance'), 'goods');
  assert.equal(resolveLegacyView('afterSales'), 'exceptions');
  assert.equal(resolveLegacyView('settings'), 'settings');
  assert.notEqual(resolveLegacyView('afterSales'), resolveLegacyView('settings'));
});
