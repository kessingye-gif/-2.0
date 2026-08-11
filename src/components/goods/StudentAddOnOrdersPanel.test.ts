import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudentAddOnOrdersPanel } from './StudentAddOnOrdersPanel';

test('订单行提供退款入口并解释不可退款原因', () => {
  const markup = renderToStaticMarkup(createElement(StudentAddOnOrdersPanel, {
    onAudit: () => undefined,
    onNotify: () => undefined,
  }));
  assert.match(markup, /学生加油包订单/);
  assert.match(markup, /申请退款/);
  assert.match(markup, /已使用 14,800 AI 用量，不可退款/);
  assert.match(markup, /剩余 AI 用量/);
  assert.doesNotMatch(markup, /Token/i);
});

test('已退款订单展示退款时间和退款流水号', () => {
  const markup = renderToStaticMarkup(createElement(StudentAddOnOrdersPanel, {
    onAudit: () => undefined,
    onNotify: () => undefined,
  }));
  assert.match(markup, /RF-20260807-0163/);
  assert.match(markup, /2026-08-07 16:08/);
});
