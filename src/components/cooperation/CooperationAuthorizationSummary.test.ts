import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialContentPackages, initialCooperationPlans, initialServicePackages } from '../../mockData';
import { CooperationAuthorizationSummary } from './CooperationAuthorizationSummary';

test('公共授权摘要展示来源方案、教学内容和服务权益', () => {
  const markup = renderToStaticMarkup(createElement(CooperationAuthorizationSummary, {
    plan: initialCooperationPlans[0],
    contentPackages: initialContentPackages,
    servicePackages: initialServicePackages,
    overrideNote: '增加英语专项内容包',
  }));

  assert.match(markup, /来源方案/);
  assert.match(markup, /初中理科标准方案/);
  assert.match(markup, /教学内容/);
  assert.match(markup, /服务权益/);
  assert.match(markup, /特殊调整/);
  assert.doesNotMatch(markup, /配置范围/);
});
