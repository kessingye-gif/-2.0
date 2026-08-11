import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import {
  initialAuditLogs,
  initialAuthCodes,
  initialInstitutions,
  initialOrderLedger,
  initialStudents,
} from '../../mockData';
import { deriveFulfillmentSnapshot } from '../../fulfillment';
import { DashboardView } from './DashboardView';

test('renders the commercial cockpit with all seven clickable stages', () => {
  const snapshot = deriveFulfillmentSnapshot({
    institutions: initialInstitutions,
    authCodes: initialAuthCodes,
    students: initialStudents,
    orders: initialOrderLedger,
    auditLogs: initialAuditLogs,
  });

  const markup = renderToStaticMarkup(createElement(DashboardView, { snapshot, onNavigateToTab: () => undefined }));

  assert.match(markup, /商业履约驾驶舱/);
  assert.match(markup, /今日待办/);
  snapshot.funnel.forEach((step) => assert.match(markup, new RegExp(`<button[^>]*>[\\s\\S]*?${step.label}`)));
});

test('renders zero-valued funnel stages instead of hiding them', () => {
  const snapshot = deriveFulfillmentSnapshot({ institutions: [], authCodes: [], students: [], orders: [], auditLogs: [] });
  const markup = renderToStaticMarkup(createElement(DashboardView, { snapshot, onNavigateToTab: () => undefined }));

  assert.match(markup, /机构签约/);
  assert.match(markup, /0 家/);
  assert.match(markup, /续费 \/ 退款/);
});
