import assert from 'node:assert/strict';
import test from 'node:test';
import { initialAuditLogs, initialAuthCodes, initialInstitutions, initialOrderLedger, initialStudents } from './mockData';
import { derivePlatformDashboardSnapshot } from './dashboardSnapshot';

const snapshot = derivePlatformDashboardSnapshot({
  institutions: initialInstitutions,
  authCodes: initialAuthCodes,
  students: initialStudents,
  orders: initialOrderLedger,
  auditLogs: initialAuditLogs,
});

test('机构额度指标由机构记录求和得到', () => {
  const metrics = snapshot.sections.find((section) => section.id === 'institutions')!.metrics;
  assert.equal(metrics.find((metric) => metric.id === 'allocatedQuota')?.value, initialInstitutions.reduce((sum, item) => sum + item.totalQuota, 0));
  assert.equal(metrics.find((metric) => metric.id === 'remainingQuota')?.value, initialInstitutions.reduce((sum, item) => sum + item.remainingQuota, 0));
});

test('低额度和激活指标从共享记录推导', () => {
  const institutionMetrics = snapshot.sections.find((section) => section.id === 'institutions')!.metrics;
  const studentMetrics = snapshot.sections.find((section) => section.id === 'students')!.metrics;
  const expectedLow = initialInstitutions.filter((item) => item.totalQuota > 0 && item.remainingQuota / item.totalQuota <= 0.2).length;
  assert.equal(institutionMetrics.find((metric) => metric.id === 'lowQuota')?.value, expectedLow);
  assert.equal(studentMetrics.find((metric) => metric.id === 'students')?.value, initialStudents.length);
  assert.equal(studentMetrics.find((metric) => metric.id === 'activated')?.value, initialAuthCodes.filter((item) => item.status === 'used').length);
});

test('每个指标都说明来源、口径和下钻去向', () => {
  const metrics = snapshot.sections.flatMap((section) => section.metrics);
  assert.ok(metrics.every((metric) => metric.sourceLabel && metric.definition && metric.targetPath.startsWith('/platform/')));
  assert.ok(snapshot.workItems.every((item) => item.targetPath.startsWith('/platform/')));
  assert.equal(JSON.stringify(snapshot).match(/合同|签约|回款/), null);
});
