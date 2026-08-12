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
  targetTab: 'system',
};

test('after-sales workspace renders unresolved commercial work items', () => {
  const markup = renderToStaticMarkup(createElement(SystemView, {
    mode: 'exceptions',
    auditLogs: initialAuditLogs,
    workItems: [workItem],
    onResolveWorkItem: () => undefined,
    onNotify: () => undefined,
  }));

  assert.doesNotMatch(markup, /售后与异常|商业履约 · 问题闭环/);
  assert.match(markup, /履约待办/);
  assert.match(markup, /华中师范大学第一附属中学/);
  assert.match(markup, /标记已处理/);
});

test('toast communicates success without a blocking browser dialog', () => {
  const markup = renderToStaticMarkup(createElement(Toast, { message: '已完成额度补发', tone: 'success', onClose: () => undefined }));
  assert.match(markup, /role="status"/);
  assert.match(markup, /已完成额度补发/);
});

test('audit workspace starts directly with useful controls instead of a repeated page heading', () => {
  const markup = renderToStaticMarkup(createElement(AuditLogView, { logs: initialAuditLogs }));
  assert.doesNotMatch(markup, /数据与审计|全链路留痕/);
  assert.match(markup, /日志总数/);
  assert.match(markup, /导出日志 JSON/);
});
