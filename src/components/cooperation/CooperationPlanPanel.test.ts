import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialContentPackages, initialCooperationPlans, initialServicePackages } from '../../mockData';
import { CooperationPlanPanel } from './CooperationPlanPanel';

test('授权模板卡片同时展示教学内容和服务权益', () => {
  const markup = renderToStaticMarkup(createElement(CooperationPlanPanel, {
    plans: initialCooperationPlans,
    contentPackages: initialContentPackages,
    servicePackages: initialServicePackages,
    onAddPlan: () => undefined,
    onUpdatePlan: () => undefined,
  }));

  assert.match(markup, /机构授权模板/);
  assert.match(markup, /初中理科标准方案/);
  assert.match(markup, /教学内容/);
  assert.match(markup, /服务权益/);
  assert.match(markup, /3 个内容包/);
  assert.match(markup, /2 个服务包/);
});
