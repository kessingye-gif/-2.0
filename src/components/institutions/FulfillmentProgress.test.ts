import assert from 'node:assert/strict';
import test from 'node:test';
import { initialAuthCodes, initialInstitutions, initialOrderLedger } from '../../mockData';
import { getInstitutionFulfillmentProgress } from './FulfillmentProgress';

test('derives institution progress from its contract, credits, codes, and orders', () => {
  const institution = initialInstitutions[0];
  const progress = getInstitutionFulfillmentProgress(institution, initialAuthCodes, initialOrderLedger);

  assert.equal(progress.length, 7);
  assert.equal(progress[0]?.id, 'contracted');
  assert.equal(progress[0]?.status, 'complete');
  assert.equal(progress.find((step) => step.id === 'activated')?.count, 1);
  assert.equal(progress.find((step) => step.id === 'renewal')?.status, 'pending');
});

test('marks missing contract and funding stages as pending', () => {
  const institution = { ...initialInstitutions[0], contractStatus: 'draft' as const, totalQuota: 0 };
  const progress = getInstitutionFulfillmentProgress(institution, [], []);

  assert.equal(progress[0]?.status, 'pending');
  assert.equal(progress[1]?.status, 'pending');
});
