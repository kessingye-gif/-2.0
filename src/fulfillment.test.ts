import assert from 'node:assert/strict';
import test from 'node:test';
import {
  initialAuditLogs,
  initialAuthCodes,
  initialInstitutions,
  initialOrderLedger,
  initialStudents,
} from './mockData';
import { buildGlobalSearchResults, deriveFulfillmentSnapshot } from './fulfillment';

test('derives the seven commercial fulfillment stages from shared records', () => {
  const snapshot = deriveFulfillmentSnapshot({
    institutions: initialInstitutions,
    authCodes: initialAuthCodes,
    students: initialStudents,
    orders: initialOrderLedger,
    auditLogs: initialAuditLogs,
  });

  assert.deepEqual(
    snapshot.funnel.map((step) => step.id),
    ['contracted', 'funded', 'configured', 'issued', 'activated', 'servicing', 'renewal'],
  );
  assert.equal(snapshot.funnel.find((step) => step.id === 'activated')?.value, 1);
  assert.equal(snapshot.metrics.length, 5);
  assert.ok(snapshot.funnel.every((step) => step.conversionRate === undefined || step.conversionRate <= 100));
});

test('global search returns a routable authorization-code result', () => {
  const results = buildGlobalSearchResults('8829', {
    institutions: initialInstitutions,
    authCodes: initialAuthCodes,
    students: initialStudents,
    orders: initialOrderLedger,
  });

  assert.equal(results.length, 1);
  assert.equal(results[0]?.type, 'authCode');
  assert.equal(results[0]?.targetTab, 'fulfillment');
});

test('global search trims empty input and caps broad results at eight', () => {
  assert.deepEqual(buildGlobalSearchResults('   ', {
    institutions: initialInstitutions,
    authCodes: initialAuthCodes,
    students: initialStudents,
    orders: initialOrderLedger,
  }), []);

  assert.ok(buildGlobalSearchResults('浙', {
    institutions: initialInstitutions,
    authCodes: initialAuthCodes,
    students: initialStudents,
    orders: initialOrderLedger,
  }).length <= 8);
});
