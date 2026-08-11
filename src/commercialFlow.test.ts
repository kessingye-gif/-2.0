import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialAuditLogs } from './mockData';
import type { FulfillmentWorkItem } from './types';
import { SystemView } from './components/views/SystemView';
import { Toast } from './components/ui/Toast';
import { AuditLogView } from './components/views/AuditLogView';

const workItem: FulfillmentWorkItem = {
  id: 'low-credit-demo',
  type: 'low_credit',
  title: '机构额度不足',
  description: '剩余 3,200 点，需跟进续费',
  institutionName: '华中师范大学第一附属中学',
  severity: 'high',
  targetTab: 'afterSales',
};

test('after-sales workspace renders unresolved commercial work items', () => {
  const markup = renderToStaticMarkup(createElement(SystemView, {
    mode: 'exceptions',
    auditLogs: initialAuditLogs,
    workItems: [workItem],
    onResolveWorkItem: () => undefined,
    onNotify: () => undefined,
  }));

  assert.match(markup, /售后与异常/);
  assert.match(markup, /履约待办/);
  assert.match(markup, /华中师范大学第一附属中学/);
  assert.match(markup, /标记已处理/);
});

test('toast communicates success without a blocking browser dialog', () => {
  const markup = renderToStaticMarkup(createElement(Toast, { message: '已完成额度补发', tone: 'success', onClose: () => undefined }));
  assert.match(markup, /role="status"/);
  assert.match(markup, /已完成额度补发/);
});

test('audit workspace identifies itself as the final fulfillment trace', () => {
  const markup = renderToStaticMarkup(createElement(AuditLogView, { logs: initialAuditLogs }));
  assert.match(markup, /数据与审计/);
  assert.match(markup, /全链路留痕/);
});
