import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('业务页面不向客户展示技术词 Token', () => {
  const customerFacingSource = [
    read('./components/views/GoodsView.tsx'),
    read('./components/views/SystemView.tsx'),
    read('./components/views/TeacherClassView.tsx'),
    read('./components/modals/HelpModal.tsx'),
  ].join('\n');
  assert.doesNotMatch(customerFacingSource, /Token/i);
});

test('商品与权益页明确区分四个业务对象', () => {
  const source = read('./components/views/GoodsView.tsx');
  assert.match(source, /服务包/);
  assert.match(source, /机构点数/);
  assert.match(source, /授权码记录/);
});

test('商品页不再提供 AI 加油包商品与学生加油包退款入口', () => {
  const source = read('./components/views/GoodsView.tsx');
  assert.doesNotMatch(source, /加油包/);
  assert.doesNotMatch(source, /AiUsagePack|aiUsagePacks|StudentAddOnOrder/);
});

test('服务包视图不维护内容包绑定字段', () => {
  const source = [
    read('./components/views/GoodsView.tsx'),
    read('./components/views/ServicePackageView.tsx'),
  ].join('\n');
  assert.doesNotMatch(source, /contentPackageMode|includedContentPackages|内容包包含模式/);
});
