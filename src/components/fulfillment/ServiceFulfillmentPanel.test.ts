import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialServicePackages, initialStudents } from '../../mockData';
import { ServiceFulfillmentPanel } from './ServiceFulfillmentPanel';

test('办理服务明确展示所属机构统一账户的扣点结果', () => {
  const markup = renderToStaticMarkup(createElement(ServiceFulfillmentPanel, {
    student: initialStudents[0],
    packages: initialServicePackages,
    institutionRemainingQuota: 75402,
    onFulfill: () => undefined,
    compact: true,
  }));

  assert.match(markup, /机构统一账户/);
  assert.match(markup, /本次扣除/);
  assert.doesNotMatch(markup, /教师可用点数/);
});
