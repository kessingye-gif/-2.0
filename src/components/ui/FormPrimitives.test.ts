import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChoiceCard, DialogShell, FieldLabel } from './FormPrimitives';

test('公共对话框与选择卡片遵循后台视觉和可访问性规范', () => {
  const markup = renderToStaticMarkup(createElement(DialogShell, {
    title: '新建机构合作方案', description: '配置教学内容与服务权益', onClose: () => undefined,
    footer: createElement('button', { type: 'button' }, '保存'),
    children: createElement('div', null,
      createElement(FieldLabel, { label: '方案名称', required: true }, createElement('input', { id: 'plan-name' })),
      createElement(ChoiceCard, { checked: true, title: '数学内容包', meta: '初中 · 人教版', onChange: () => undefined }),
    ),
  }));

  assert.match(markup, /role="dialog"/);
  assert.match(markup, /aria-modal="true"/);
  assert.match(markup, /配置教学内容与服务权益/);
  assert.match(markup, /bg-\[#F0FBF4\]/);
  assert.match(markup, /border-\[#16B45B\]/);
});
