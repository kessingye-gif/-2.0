import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialAuditLogs } from '../../mockData';
import { SystemView } from './SystemView';

test('系统管理不重复维护商品和正常退款', () => {
  const markup = renderToStaticMarkup(createElement(SystemView, {
    auditLogs: initialAuditLogs,
    mode: 'settings',
    workItems: [],
    onResolveWorkItem: () => undefined,
    onNotify: () => undefined,
  }));
  assert.doesNotMatch(markup, /Token 加油包|学生加油包退款|全额退款/);
  assert.doesNotMatch(markup, /系统与基础配置|平台设置|管理 AI 模型/);
  assert.match(markup, /异常处理/);
  assert.match(markup, /审计/);
});
