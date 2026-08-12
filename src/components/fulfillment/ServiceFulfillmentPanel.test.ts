import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialServicePackages, initialStudents } from '../../mockData';
import { ServiceFulfillmentPanel } from './ServiceFulfillmentPanel';

test('办理服务明确展示教师余额并在余额不足时禁用提交', () => {
  const servicePackage = initialServicePackages.find((item) => item.quotaCost === 120)!;
  const markup = renderToStaticMarkup(createElement(ServiceFulfillmentPanel, {
    student: initialStudents[0],
    packages: [servicePackage],
    teacherRemainingQuota: 80,
    onFulfill: () => undefined,
    compact: true,
  }));

  assert.match(markup, /教师可用点数/);
  assert.match(markup, /80 点/);
  assert.match(markup, /还差 40 点/);
  assert.match(markup, /disabled=""/);
});
